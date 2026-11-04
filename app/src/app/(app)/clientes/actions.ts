"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CAMPOS_CLIENTE } from "@/lib/dados";

function lerCliente(form: FormData) {
  const dados = Object.fromEntries(CAMPOS_CLIENTE.map((c) => [c, String(form.get(c) ?? "").trim()])) as Record<
    (typeof CAMPOS_CLIENTE)[number],
    string
  >;
  dados.uf = dados.uf.toUpperCase().slice(0, 2);
  if (!dados.nome) dados.nome = dados.razao_social;
  if (!dados.nome) throw new Error("Informe o nome do cliente.");
  // Só mexe no representante se o formulário tiver o campo
  const rep = form.has("representante_id") ? { representante_id: Number(form.get("representante_id")) || null } : {};
  return { ...dados, ...rep };
}

/** Para onde voltar depois de salvar (ex.: de volta ao novo pedido). */
function destino(form: FormData, id: number) {
  const voltar = String(form.get("voltar") ?? "");
  if (/^\/(pedidos|financeiro|receber)[/?]?/.test(voltar)) {
    return voltar + (voltar.includes("?") ? "&" : "?") + "cliente=" + id;
  }
  return `/clientes/${id}`;
}

export async function criarCliente(form: FormData) {
  await exigirLogin();
  const dados = lerCliente(form);
  const [{ id }] = await sql<{ id: number }[]>`INSERT INTO clientes ${sql(dados)} RETURNING id`;
  revalidatePath("/", "layout");
  redirect(destino(form, id));
}

export async function atualizarCliente(id: number, form: FormData) {
  await exigirLogin();
  const dados = lerCliente(form);
  await sql.begin(async (tx) => {
    await tx`UPDATE clientes SET ${tx(dados)} WHERE id = ${id}`;
    // Pedidos deste cliente ainda sem representante passam para o escolhido (menos os de mês já fechado)
    if (dados.representante_id) {
      await tx`
        UPDATE pedidos pe SET representante_id = ${dados.representante_id}
        WHERE pe.cliente_id = ${id} AND pe.representante_id IS NULL AND pe.status <> 'cancelado'
          AND NOT EXISTS (SELECT 1 FROM comissoes_fechadas f
                          WHERE f.representante_id = ${dados.representante_id} AND f.mes = date_trunc('month', pe.data_entrega)::date)`;
    }
  });
  revalidatePath("/", "layout");
  redirect(`/clientes/${id}?salvo=1`);
}

export async function excluirCliente(id: number) {
  await exigirLogin();
  const [uso] = await sql<{ n: number }[]>`
    SELECT (SELECT count(*) FROM pedidos WHERE cliente_id = ${id})
         + (SELECT count(*) FROM contas_receber WHERE cliente_id = ${id})
         + (SELECT count(*) FROM solicitacoes WHERE cliente_id = ${id})
         + (SELECT count(*) FROM anexos WHERE cliente_id = ${id}) AS n`;
  if (Number(uso.n) > 0) redirect(`/clientes/${id}?erro=em-uso`);
  await sql`DELETE FROM clientes WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/clientes");
}
