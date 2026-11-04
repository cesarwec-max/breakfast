"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { mesValido, nomeMes, obterRepresentante, ordenarFaixas, resumoComissao, type Faixa } from "@/lib/comissoes";
import { lerValor } from "@/lib/formato";

function lerFaixas(form: FormData): Faixa[] {
  const de = form.getAll("faixa_de").map((v) => lerValor(v));
  const pct = form.getAll("faixa_pct").map((v) => lerValor(v));
  const faixas = pct
    .map((p, i) => ({ a_partir_de: Math.max(0, de[i] ?? 0), percentual: p }))
    .filter((f, i) => String(form.getAll("faixa_pct")[i] ?? "").trim() !== "");
  if (faixas.length === 0) throw new Error("Informe o percentual.");
  if (faixas.some((f) => f.percentual < 0 || f.percentual > 100)) throw new Error("Percentual deve ficar entre 0 e 100.");
  return ordenarFaixas(faixas);
}

/** Cria (id = null) ou atualiza um representante. */
export async function salvarRepresentante(id: number | null, form: FormData) {
  await exigirLogin();
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) throw new Error("Informe o nome.");
  const dados = {
    nome,
    telefone: String(form.get("telefone") ?? "").trim(),
    faixas: sql.json(lerFaixas(form)),
    ativo: id ? form.get("ativo") === "on" : true,
  };
  if (id) await sql`UPDATE representantes SET ${sql(dados)} WHERE id = ${id}`;
  else [{ id }] = await sql<{ id: number }[]>`INSERT INTO representantes ${sql(dados)} RETURNING id`;
  revalidatePath("/", "layout");
  redirect(`/comissoes/representantes/${id}?salvo=1`);
}

/**
 * Fecha o mês: grava total, percentual e a lista de pedidos como estão agora (nada muda depois)
 * e, se pedido, lança a comissão em Contas a pagar.
 */
export async function fecharMes(representanteId: number, mes: string, form: FormData) {
  await exigirLogin();
  if (!mesValido(mes)) throw new Error("Mês inválido.");
  const r = await obterRepresentante(representanteId);
  if (!r) throw new Error("Representante não encontrado.");
  const resumo = await resumoComissao(r, mes);
  if (resumo.fechado) redirect(`/comissoes/${representanteId}?mes=${mes}`);
  const vencimento = String(form.get("vencimento") ?? "");
  const lancar = form.get("lancar") === "on" && resumo.valor > 0 && /^\d{4}-\d{2}-\d{2}$/.test(vencimento);

  await sql.begin(async (tx) => {
    let contaId: number | null = null;
    if (lancar) {
      const [c] = await tx<{ id: number }[]>`
        INSERT INTO contas_pagar (fornecedor, descricao, valor, vencimento)
        VALUES (${`Comissão ${r.nome}`}, ${`Comissão de ${nomeMes(mes)} · ${resumo.pedidos.length} pedido(s)`}, ${resumo.valor}, ${vencimento})
        RETURNING id`;
      contaId = c.id;
      await tx`UPDATE contas_pagar SET lote = id WHERE id = ${contaId}`;
    }
    await tx`
      INSERT INTO comissoes_fechadas (representante_id, mes, total, percentual, valor, pedidos, conta_pagar_id)
      VALUES (${representanteId}, ${`${mes}-01`}, ${resumo.total}, ${resumo.percentual}, ${resumo.valor},
              ${tx.json(resumo.pedidos.map((p) => ({ ...p, total: Number(p.total) })))}, ${contaId})`;
  });
  revalidatePath("/", "layout");
  redirect(`/comissoes/${representanteId}?mes=${mes}&fechado=1`);
}

/** Reabre o mês (volta a calcular ao vivo). A conta em "A pagar" sai junto, se ainda não foi paga. */
export async function reabrirMes(representanteId: number, mes: string) {
  await exigirLogin();
  const voltar = `/comissoes/${representanteId}?mes=${mes}`;
  const [f] = await sql<{ id: number; conta_pagar_id: number | null; pago_em: string | null }[]>`
    SELECT f.id, f.conta_pagar_id, cp.pago_em FROM comissoes_fechadas f LEFT JOIN contas_pagar cp ON cp.id = f.conta_pagar_id
    WHERE f.representante_id = ${representanteId} AND f.mes = ${`${mes}-01`}`;
  if (!f) redirect(voltar);
  if (f.pago_em) redirect(`${voltar}&erro=pago`);
  await sql.begin(async (tx) => {
    await tx`DELETE FROM comissoes_fechadas WHERE id = ${f.id}`;
    if (f.conta_pagar_id) await tx`DELETE FROM contas_pagar WHERE id = ${f.conta_pagar_id} AND pago_em IS NULL`;
  });
  revalidatePath("/", "layout");
  redirect(`${voltar}&reaberto=1`);
}
