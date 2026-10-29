"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { lerItens } from "@/lib/itens";

type Tx = Parameters<Parameters<typeof sql.begin>[1]>[0];

function lerPedido(form: FormData) {
  const cliente_id = Number(form.get("cliente_id"));
  const data_entrega = String(form.get("data_entrega") ?? "");
  if (!cliente_id) throw new Error("Escolha o cliente.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_entrega)) throw new Error("Informe a data de entrega.");
  return { cliente_id, data_entrega, observacao: String(form.get("observacao") ?? "").trim() };
}

async function gravarItens(tx: Tx, pedidoId: number, itens: ReturnType<typeof lerItens>) {
  await tx`DELETE FROM pedido_itens WHERE pedido_id = ${pedidoId}`;
  await tx`INSERT INTO pedido_itens ${tx(itens.map((i) => ({ ...i, pedido_id: pedidoId })))}`;
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
    if (p?.status !== "pendente") throw new Error("Só pedidos pendentes podem ser editados.");
    await tx`UPDATE pedidos SET ${tx(dados)} WHERE id = ${id}`;
    await gravarItens(tx, id, itens);
  });
  atualizar();
  redirect(`/pedidos/${id}?salvo=1`);
}

/** Marca como entregue e dá baixa no estoque. */
export async function marcarEntregue(id: number, voltar?: string) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    const [p] = await tx<{ status: string; cliente: string }[]>`
      SELECT pe.status, c.nome AS cliente FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id
      WHERE pe.id = ${id} FOR UPDATE OF pe`;
    if (!p || p.status !== "pendente") return;
    await tx`UPDATE pedidos SET status = 'entregue', entregue_em = now() WHERE id = ${id}`;
    await tx`
      INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao, pedido_id)
      SELECT produto_id, 'saida', SUM(quantidade), ${"Entrega para " + p.cliente}, ${id}
      FROM pedido_itens WHERE pedido_id = ${id} GROUP BY produto_id`;
  });
  atualizar();
  redirect(voltar === "/pedidos" ? voltar : `/pedidos/${id}`);
}

/** Volta para pendente (desfaz a baixa no estoque, se houve). */
export async function reabrirPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM estoque_movimentos WHERE pedido_id = ${id}`;
    await tx`UPDATE pedidos SET status = 'pendente', entregue_em = NULL WHERE id = ${id}`;
  });
  atualizar();
  redirect(`/pedidos/${id}`);
}

export async function cancelarPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM estoque_movimentos WHERE pedido_id = ${id}`;
    await tx`UPDATE pedidos SET status = 'cancelado', entregue_em = NULL WHERE id = ${id}`;
  });
  atualizar();
  redirect(`/pedidos/${id}`);
}

export async function excluirPedido(id: number) {
  await exigirLogin();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM estoque_movimentos WHERE pedido_id = ${id}`;
    await tx`DELETE FROM pedidos WHERE id = ${id}`;
  });
  atualizar();
  redirect("/pedidos");
}
