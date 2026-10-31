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

function voltarPara(t: Tabela, voltar?: string, aviso?: Record<string, string>) {
  const base = voltar && voltar.startsWith(caminho(t)) ? voltar : caminho(t);
  const url = new URL(base, "http://x");
  for (const k of ["feito", "desfeito", "lancado"]) url.searchParams.delete(k);
  for (const [k, v] of Object.entries(aviso ?? {})) url.searchParams.set(k, v);
  return url.pathname + url.search;
}

export async function marcarPago(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql`UPDATE ${sql(tabela)} SET pago_em = ${hoje()} WHERE id = ${id} AND pago_em IS NULL`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, voltar, { feito: String(id) }));
}

export async function desfazerPago(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql`UPDATE ${sql(tabela)} SET pago_em = NULL WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(voltarPara(tabela, voltar, { desfeito: String(id) }));
}

export async function excluirConta(tabela: Tabela, id: number, voltar?: string) {
  await exigirLogin();
  validar(tabela);
  await sql.begin(async (tx) => {
    if (tabela === "contas_pagar") {
      // Os anexos passam para outra parcela da mesma compra; se não houver, são apagados junto.
      const [outra] = await tx<{ id: number }[]>`
        SELECT o.id FROM contas_pagar c JOIN contas_pagar o ON COALESCE(o.lote, o.id) = COALESCE(c.lote, c.id) AND o.id <> c.id
        WHERE c.id = ${id} ORDER BY o.id LIMIT 1`;
      if (outra) await tx`UPDATE anexos SET conta_pagar_id = ${outra.id} WHERE conta_pagar_id = ${id}`;
      else await tx`DELETE FROM anexos WHERE conta_pagar_id = ${id}`;
    }
    await tx`DELETE FROM ${tx(tabela)} WHERE id = ${id}`;
  });
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

/**
 * Lança as parcelas de uma compra (mesmo lote) e devolve os ids, na ordem dos boletos.
 * Quem chama (components/compra-fabrica.tsx) anexa depois a nota e o arquivo de cada boleto.
 */
export async function lancarPagar(form: FormData): Promise<{ ids?: number[]; erro?: string }> {
  await exigirLogin();
  const fornecedor = String(form.get("fornecedor") ?? "").trim() || "Fábrica";
  const descricao = String(form.get("descricao") ?? "").trim();
  let parcelas;
  try {
    parcelas = lerParcelas(form);
  } catch (e) {
    return { erro: (e as Error).message };
  }
  const ids = await sql.begin(async (tx) => {
    const ids: number[] = [];
    for (const [i, p] of parcelas.entries()) {
      const [r] = await tx<{ id: number }[]>`
        INSERT INTO contas_pagar (fornecedor, descricao, valor, vencimento)
        VALUES (${fornecedor}, ${[descricao, parcelas.length > 1 ? `parcela ${i + 1}/${parcelas.length}` : ""].filter(Boolean).join(" · ")},
                ${p.valor}, ${p.vencimento})
        RETURNING id`;
      ids.push(r.id);
    }
    // As parcelas desta compra ficam no mesmo lote: a nota vale para todas.
    await tx`UPDATE contas_pagar SET lote = ${ids[0]} WHERE id IN ${tx(ids)}`;
    return ids;
  });
  revalidatePath("/", "layout");
  return { ids };
}
