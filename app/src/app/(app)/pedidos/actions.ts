"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { lerItens } from "@/lib/itens";
import { sincronizarReceber } from "@/lib/receber-pedido";

type Tx = Parameters<Parameters<typeof sql.begin>[1]>[0];

function lerPedido(form: FormData) {
  const cliente_id = Number(form.get("cliente_id"));
  const data_entrega = String(form.get("data_entrega") ?? "");
  if (!cliente_id) throw new Error("Escolha o cliente.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_entrega)) throw new Error("Informe a data de entrega.");
  const venc = String(form.get("vencimento_pagamento") ?? "");
  return {
    cliente_id,
    data_entrega,
    observacao: String(form.get("observacao") ?? "").trim(),
    forma_pagamento: String(form.get("forma_pagamento") ?? "").trim().slice(0, 60),
    vencimento_pagamento: /^\d{4}-\d{2}-\d{2}$/.test(venc) ? venc : null,
  };
}

async function gravarItens(tx: Tx, pedidoId: number, itens: ReturnType<typeof lerItens>) {
  await tx`DELETE FROM pedido_itens WHERE pedido_id = ${pedidoId}`;
  await tx`INSERT INTO pedido_itens ${tx(itens.map((i) => ({ ...i, pedido_id: pedidoId })))}`;
}

/**
 * Deixa o estoque de acordo com o pedido: enquanto não estiver cancelado, os itens ficam descontados;
 * cancelado (ou excluído), voltam. Registra só a diferença, com o motivo, para o histórico ficar claro.
 */
async function ajustarEstoque(tx: Tx, pedidoId: number, motivo: string, devolverTudo = false) {
  await tx`
    WITH desejado AS (
      SELECT i.produto_id, -SUM(i.quantidade) AS q
      FROM pedido_itens i JOIN pedidos pe ON pe.id = i.pedido_id
      WHERE i.pedido_id = ${pedidoId} AND pe.status <> 'cancelado' AND NOT ${devolverTudo}
      GROUP BY i.produto_id
    ),
    atual AS (
      SELECT produto_id, SUM(CASE WHEN tipo = 'saida' THEN -quantidade ELSE quantidade END) AS q
      FROM estoque_movimentos WHERE pedido_id = ${pedidoId}
      GROUP BY produto_id
    ),
    diferenca AS (
      SELECT COALESCE(d.produto_id, a.produto_id) AS produto_id, COALESCE(d.q, 0) - COALESCE(a.q, 0) AS q
      FROM desejado d FULL JOIN atual a ON a.produto_id = d.produto_id
    )
    INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao, pedido_id)
    SELECT produto_id, CASE WHEN q < 0 THEN 'saida' ELSE 'entrada' END, ABS(q), ${motivo}, ${pedidoId}
    FROM diferenca WHERE q <> 0`;
}

async function nomeCliente(tx: Tx, pedidoId: number) {
  const [c] = await tx<{ nome: string }[]>`
    SELECT c.nome FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id WHERE pe.id = ${pedidoId}`;
  return c?.nome ?? "";
}

function atualizar() {
  revalidatePath("/", "layout");
}

export async function criarPedido(form: FormData) {
  await exigirLogin();
  const dados = lerPedido(form);
  const itens = lerItens(form);
  const id = await sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: number }[]>`INSERT INTO pedidos ${tx(dados)} RETURNING id`;
    await gravarItens(tx, id, itens);
    await ajustarEstoque(tx, id, `Pedido #${id} lançado (${await nomeCliente(tx, id)})`);
    await sincronizarReceber(tx, id);
    return id;
  });
  atualizar();
  redirect(`/pedidos/${id}?novo=1`);
}

export async function atualizarPedido(id: number, form: FormData) {
  await exigirLogin();
  const dados = lerPedido(form);
  const itens = lerItens(form);
  await sql.begin(async (tx) => {
    const [p] = await tx<{ status: string }[]>`SELECT status FROM pedidos WHERE id = ${id} FOR UPDATE`;
    if (p?.status !== "pendente" && p?.status !== "em_rota") throw new Error("Só pedidos a entregar podem ser editados.");
    await tx`UPDATE pedidos SET ${tx(dados)} WHERE id = ${id}`;
    await gravarItens(tx, id, itens);
    await ajustarEstoque(tx, id, `Pedido #${id} editado`);
    await sincronizarReceber(tx, id);
  });
  atualizar();
  redirect(`/pedidos/${id}?salvo=1`);
}

/** Marca como entregue (o estoque já foi descontado quando o pedido foi lançado). */
export async function marcarEntregue(id: number, voltar?: string) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    const [p] = await tx<{ status: string; cliente: string }[]>`
      SELECT pe.status, c.nome AS cliente FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id
      WHERE pe.id = ${id} FOR UPDATE OF pe`;
    if (!p || (p.status !== "pendente" && p.status !== "em_rota")) return;
    await tx`UPDATE pedidos SET status = 'entregue', entregue_em = now() WHERE id = ${id}`;
    // Garante o desconto (pedidos antigos só descontavam na entrega)
    await ajustarEstoque(tx, id, `Pedido #${id} entregue (${p.cliente})`);
  });
  atualizar();
  redirect(voltar === "/pedidos" ? voltar : `/pedidos/${id}`);
}

/** Pedido saiu para entrega. */
export async function marcarEmRota(id: number, voltar?: string) {
  await exigirLogin();
  await sql`UPDATE pedidos SET status = 'em_rota' WHERE id = ${id} AND status = 'pendente'`;
  atualizar();
  redirect(voltar === "/pedidos" ? voltar : `/pedidos/${id}`);
}

/** Volta para pendente. Se estava cancelado, os itens saem do estoque de novo. */
export async function reabrirPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await tx`UPDATE pedidos SET status = 'pendente', entregue_em = NULL WHERE id = ${id}`;
    await ajustarEstoque(tx, id, `Pedido #${id} reaberto`);
    await sincronizarReceber(tx, id);
  });
  atualizar();
  redirect(`/pedidos/${id}`);
}

export async function cancelarPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await tx`UPDATE pedidos SET status = 'cancelado', entregue_em = NULL WHERE id = ${id}`;
    await ajustarEstoque(tx, id, `Pedido #${id} cancelado (itens devolvidos)`);
    await sincronizarReceber(tx, id);
  });
  atualizar();
  redirect(`/pedidos/${id}`);
}

export async function excluirPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    // Devolve os itens ao estoque; o histórico continua (sem o vínculo com o pedido apagado)
    await ajustarEstoque(tx, id, `Pedido #${id} excluído (itens devolvidos)`, true);
    await sincronizarReceber(tx, id, true);
    await tx`DELETE FROM pedidos WHERE id = ${id}`;
  });
  atualizar();
  redirect("/pedidos");
}

/** Para pedidos antigos sem conta: cria a conta do pedido em "A receber". */
export async function lancarNoReceber(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await sincronizarReceber(tx, id);
  });
  atualizar();
  redirect(`/pedidos/${id}?receber=1`);
}
