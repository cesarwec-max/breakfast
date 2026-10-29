"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { obterProduto } from "@/lib/dados";
import { lerValor } from "@/lib/formato";

function lerProduto(form: FormData) {
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) throw new Error("Informe o nome do produto.");
  return {
    nome,
    sabor: String(form.get("sabor") ?? "").trim(),
    unidade: String(form.get("unidade") ?? "un").trim() || "un",
    preco: lerValor(form.get("preco")),
  };
}

export async function criarProduto(form: FormData) {
  await exigirLogin();
  const dados = lerProduto(form);
  const inicial = lerValor(form.get("estoque_inicial"));
  await sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: number }[]>`INSERT INTO produtos ${tx(dados)} RETURNING id`;
    if (inicial) {
      await tx`INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao)
               VALUES (${id}, 'ajuste', ${inicial}, 'Estoque inicial')`;
    }
  });
  revalidatePath("/", "layout");
  redirect("/estoque?salvo=1");
}

export async function atualizarProduto(id: number, form: FormData) {
  await exigirLogin();
  const dados = { ...lerProduto(form), ativo: form.get("ativo") === "on" };
  await sql`UPDATE produtos SET ${sql(dados)} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  redirect(`/estoque/${id}?salvo=1`);
}

/** Entrada, saída ou contagem (ajusta o saldo para o número contado). */
export async function lancarMovimento(form: FormData) {
  await exigirLogin();
  const produtoId = Number(form.get("produto_id"));
  const tipo = String(form.get("tipo"));
  const quantidade = lerValor(form.get("quantidade"));
  const observacao = String(form.get("observacao") ?? "").trim();
  const voltar = String(form.get("voltar") ?? "/estoque");
  if (!["entrada", "saida", "contagem"].includes(tipo)) throw new Error("Tipo inválido.");

  if (tipo === "contagem") {
    const produto = await obterProduto(produtoId);
    if (!produto) throw new Error("Produto não encontrado.");
    const diferenca = Math.round((quantidade - produto.saldo) * 100) / 100;
    if (diferenca !== 0) {
      await sql`INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao)
                VALUES (${produtoId}, 'ajuste', ${diferenca}, ${observacao || `Contagem: ${quantidade}`})`;
    }
  } else {
    if (quantidade <= 0) throw new Error("Informe a quantidade.");
    await sql`INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao)
              VALUES (${produtoId}, ${tipo}, ${quantidade}, ${observacao})`;
  }
  revalidatePath("/", "layout");
  redirect(voltar.startsWith("/estoque") ? voltar : "/estoque");
}

export async function excluirMovimento(id: number, voltar: string) {
  await exigirLogin();
  // Lançamentos de pedidos (mesmo de pedidos excluídos) não podem ser apagados à mão
  await sql`DELETE FROM estoque_movimentos WHERE id = ${id} AND pedido_id IS NULL AND observacao NOT LIKE 'Pedido #%'`;
  revalidatePath("/", "layout");
  redirect(voltar.startsWith("/estoque") ? voltar : "/estoque");
}

export async function excluirProduto(id: number) {
  await exigirLogin();
  const [uso] = await sql<{ n: number }[]>`
    SELECT (SELECT count(*) FROM pedido_itens WHERE produto_id = ${id})
         + (SELECT count(*) FROM estoque_movimentos WHERE produto_id = ${id}) AS n`;
  if (Number(uso.n) > 0) {
    // Já tem histórico: só esconde da lista.
    await sql`UPDATE produtos SET ativo = false WHERE id = ${id}`;
  } else {
    await sql`DELETE FROM produtos WHERE id = ${id}`;
  }
  revalidatePath("/", "layout");
  redirect("/estoque");
}

/** Foto do produto (aparece no JPG de pedidos). Chega já reduzida pelo navegador. */
export async function salvarFotoProduto(id: number, form: FormData): Promise<{ erro?: string }> {
  await exigirLogin();
  const f = form.get("foto");
  if (!(f instanceof File) || f.size === 0) return { erro: "Escolha uma foto." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return { erro: "Envie uma foto JPG, PNG ou WEBP." };
  if (f.size > 2 * 1024 * 1024) return { erro: "Foto muito grande (máximo 2 MB)." };
  await sql`UPDATE produtos SET foto = ${Buffer.from(await f.arrayBuffer())}, foto_mime = ${f.type} WHERE id = ${id}`;
  revalidatePath("/", "layout");
  return {};
}

export async function removerFotoProduto(id: number) {
  await exigirLogin();
  await sql`UPDATE produtos SET foto = NULL, foto_mime = NULL WHERE id = ${id}`;
  revalidatePath("/", "layout");
}
