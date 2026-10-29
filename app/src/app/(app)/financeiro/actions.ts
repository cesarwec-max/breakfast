"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { obterCliente, type DadosBoleto, type DadosNF } from "@/lib/dados";
import { lerItens } from "@/lib/itens";
import { lerParcelas } from "@/lib/parcelas";

function lerBase(form: FormData) {
  const clienteId = Number(form.get("cliente_id"));
  const pedidoId = Number(form.get("pedido_id")) || null;
  if (!clienteId) throw new Error("Escolha o cliente.");
  return { clienteId, pedidoId, observacoes: String(form.get("observacoes") ?? "").trim() };
}

export async function criarSolicitacaoNF(form: FormData) {
  await exigirLogin();
  const { clienteId, pedidoId, observacoes } = lerBase(form);
  const cliente = await obterCliente(clienteId);
  if (!cliente) throw new Error("Cliente não encontrado.");
  const itensForm = lerItens(form);
  const produtos = await sql<{ id: number; nome: string; sabor: string; unidade: string }[]>`
    SELECT id, nome, sabor, unidade FROM produtos WHERE id IN ${sql(itensForm.map((i) => i.produto_id))}`;
  const itens = itensForm.map((i) => {
    const p = produtos.find((x) => x.id === i.produto_id);
    return { descricao: p?.nome ?? "", sabor: p?.sabor ?? "", unidade: p?.unidade ?? "un", quantidade: i.quantidade, preco_unitario: i.preco_unitario };
  });
  const total = Math.round(itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0) * 100) / 100;
  // Guarda uma cópia dos dados do cliente: a solicitação não muda se o cadastro mudar depois.
  const vencimento = String(form.get("vencimento") ?? "");
  const pagamento = String(form.get("pagamento") ?? "").trim();
  const dados: DadosNF = {
    cliente,
    itens,
    total,
    observacoes,
    vencimento: /^\d{4}-\d{2}-\d{2}$/.test(vencimento) ? vencimento : "",
    pagamento,
  };
  const [{ id }] = await sql<{ id: number }[]>`
    INSERT INTO solicitacoes (tipo, cliente_id, pedido_id, dados)
    VALUES ('nf', ${clienteId}, ${pedidoId}, ${sql.json(dados)}) RETURNING id`;
  revalidatePath("/", "layout");
  redirect(`/financeiro/solicitacoes/${id}`);
}

export async function criarSolicitacaoBoleto(form: FormData) {
  await exigirLogin();
  const { clienteId, pedidoId, observacoes } = lerBase(form);
  const cliente = await obterCliente(clienteId);
  if (!cliente) throw new Error("Cliente não encontrado.");
  const parcelas = lerParcelas(form);
  const total = Math.round(parcelas.reduce((s, p) => s + p.valor, 0) * 100) / 100;
  const referencia = String(form.get("referencia") ?? "").trim();
  const lancar = form.get("lancar_receber") === "on";
  const dados: DadosBoleto = { cliente, parcelas, total, referencia, observacoes };

  const id = await sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: number }[]>`
      INSERT INTO solicitacoes (tipo, cliente_id, pedido_id, dados)
      VALUES ('boleto', ${clienteId}, ${pedidoId}, ${tx.json(dados)}) RETURNING id`;
    if (lancar) {
      await tx`INSERT INTO contas_receber ${tx(
        parcelas.map((p, i) => ({
          cliente_id: clienteId,
          solicitacao_id: id,
          descricao: [referencia, parcelas.length > 1 ? `parcela ${i + 1}/${parcelas.length}` : ""].filter(Boolean).join(" · "),
          valor: p.valor,
          vencimento: p.vencimento,
        })),
      )}`;
    }
    return id;
  });
  revalidatePath("/", "layout");
  redirect(`/financeiro/solicitacoes/${id}${lancar ? "?lancado=1" : ""}`);
}

export async function excluirSolicitacao(id: number) {
  await exigirLogin();
  // As contas a receber geradas continuam (só perdem o vínculo).
  await sql`DELETE FROM solicitacoes WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/financeiro");
}
