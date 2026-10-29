"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hoje, lerValor } from "@/lib/formato";
import { lerParcelas } from "@/lib/parcelas";

type Tabela = "contas_receber" | "contas_pagar";
const TABELAS: Tabela[] = ["contas_receber", "contas_pagar"];
function validar(t: Tabela) {
  if (!TABELAS.includes(t)) throw new Error("Tabela inválida.");
}
const caminho = (t: Tabela) => (t === "contas_receber" ? "/receber" : "/pagar");

function voltarPara(t: Tabela, voltar?: string) {
  return voltar && voltar.startsWith(caminho(t)) ? voltar : caminho(t);
}

export async function marcarPago(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql`UPDATE ${sql(tabela)} SET pago_em = ${hoje()} WHERE id = ${id} AND pago_em IS NULL`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, voltar));
}

export async function desfazerPago(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql`UPDATE ${sql(tabela)} SET pago_em = NULL WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, voltar));
}

export async function excluirConta(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql`DELETE FROM ${sql(tabela)} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, voltar));
}

export async function atualizarConta(tabela: Tabela, id: number, form: FormData) {
  await exigirLogin();
  validar(tabela);
  const valor = lerValor(form.get("valor"));
  const vencimento = String(form.get("vencimento") ?? "");
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) throw new Error("Valor e vencimento são obrigatórios.");
  await sql`UPDATE ${sql(tabela)} SET valor = ${valor}, vencimento = ${vencimento}, descricao = ${String(form.get("descricao") ?? "").trim()}
            WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, String(form.get("voltar") ?? "")));
}

export async function lancarReceber(form: FormData) {
  await exigirLogin();
  const cliente_id = Number(form.get("cliente_id"));
  if (!cliente_id) throw new Error("Escolha o cliente.");
  const descricao = String(form.get("descricao") ?? "").trim();
  const parcelas = lerParcelas(form);
  await sql`INSERT INTO contas_receber ${sql(
    parcelas.map((p, i) => ({
      cliente_id,
      descricao: [descricao, parcelas.length > 1 ? `parcela ${i + 1}/${parcelas.length}` : ""].filter(Boolean).join(" · "),
      valor: p.valor,
      vencimento: p.vencimento,
    })),
  )}`;
  revalidatePath("/", "layout");
  redirect("/receber?lancado=" + parcelas.length);
}

export async function lancarPagar(form: FormData) {
  await exigirLogin();
  const fornecedor = String(form.get("fornecedor") ?? "").trim() || "Fábrica";
  const descricao = String(form.get("descricao") ?? "").trim();
  const parcelas = lerParcelas(form);
  await sql`INSERT INTO contas_pagar ${sql(
    parcelas.map((p, i) => ({
      fornecedor,
      descricao: [descricao, parcelas.length > 1 ? `parcela ${i + 1}/${parcelas.length}` : ""].filter(Boolean).join(" · "),
      valor: p.valor,
      vencimento: p.vencimento,
    })),
  )}`;
  revalidatePath("/", "layout");
  redirect("/pagar?lancado=" + parcelas.length);
}
