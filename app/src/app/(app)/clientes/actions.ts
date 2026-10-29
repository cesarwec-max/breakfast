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
  return dados;
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
  await sql`UPDATE clientes SET ${sql(dados)} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(`/clientes/${id}?salvo=1`);
}

export async function excluirCliente(id: number) {
  await exigirLogin();
  const [uso] = await sql<{ n: number }[]>`
    SELECT (SELECT count(*) FROM pedidos WHERE cliente_id = ${id})
         + (SELECT count(*) FROM contas_receber WHERE cliente_id = ${id})
         + (SELECT count(*) FROM solicitacoes WHERE cliente_id = ${id}) AS n`;
  if (Number(uso.n) > 0) redirect(`/clientes/${id}?erro=em-uso`);
  await sql`DELETE FROM clientes WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/clientes");
}
