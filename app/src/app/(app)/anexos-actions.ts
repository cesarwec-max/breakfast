"use server";

import { revalidatePath } from "next/cache";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { LIMITE_ANEXO, TIPOS_ANEXO, mimeAceito } from "@/lib/anexos";

/** Anexa um arquivo (nota, boleto, XML…) a um pedido ou a uma conta a receber. */
export async function enviarAnexo(form: FormData): Promise<{ erro?: string }> {
  await exigirLogin();
  const arquivo = form.get("arquivo");
  const tipo = String(form.get("tipo") ?? "");
  const pedidoId = Number(form.get("pedido_id")) || null;
  const contaId = Number(form.get("conta_id")) || null;
  const contaPagarId = Number(form.get("conta_pagar_id")) || null;

  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha um arquivo." };
  if (!TIPOS_ANEXO.some((t) => t.valor === tipo)) return { erro: "Tipo de documento inválido." };
  if (arquivo.size > LIMITE_ANEXO) return { erro: `"${arquivo.name}" passa de 4 MB.` };
  const mime = mimeAceito(arquivo.name, arquivo.type);
  if (!mime) return { erro: `"${arquivo.name}": envie PDF, XML ou foto.` };

  const conteudo = Buffer.from(await arquivo.arrayBuffer());

  // Contas a pagar (fábrica): anexo sem cliente, preso à conta
  if (contaPagarId) {
    const [cp] = await sql<{ id: number }[]>`SELECT id FROM contas_pagar WHERE id = ${contaPagarId}`;
    if (!cp) return { erro: "Conta a pagar não encontrada." };
    await sql`
      INSERT INTO anexos (conta_pagar_id, tipo, nome_arquivo, mime, tamanho, conteudo)
      VALUES (${contaPagarId}, ${tipo}, ${arquivo.name.slice(0, 200)}, ${mime}, ${arquivo.size}, ${conteudo})`;
    revalidatePath("/", "layout");
    return {};
  }

  // O cliente vem do pedido/conta (não do navegador), para o anexo nunca cair no cliente errado.
  let clienteId: number | null = null;
  let pedidoFinal = pedidoId;
  let contaFinal = contaId;
  if (pedidoId) {
    const [p] = await sql<{ cliente_id: number }[]>`SELECT cliente_id FROM pedidos WHERE id = ${pedidoId}`;
    clienteId = p?.cliente_id ?? null;
  } else if (contaId) {
    const [c] = await sql<{ cliente_id: number; pedido_id: number | null }[]>`
      SELECT r.cliente_id, s.pedido_id FROM contas_receber r
      LEFT JOIN solicitacoes s ON s.id = r.solicitacao_id WHERE r.id = ${contaId}`;
    clienteId = c?.cliente_id ?? null;
    // Se o boleto veio de um pedido, o anexo fica no pedido (aparece em todas as parcelas dele).
    if (c?.pedido_id) {
      pedidoFinal = c.pedido_id;
      contaFinal = null;
    }
  }
  if (!clienteId) return { erro: "Pedido ou conta não encontrado." };

  await sql`
    INSERT INTO anexos (cliente_id, pedido_id, conta_receber_id, tipo, nome_arquivo, mime, tamanho, conteudo)
    VALUES (${clienteId}, ${pedidoFinal}, ${contaFinal}, ${tipo}, ${arquivo.name.slice(0, 200)}, ${mime}, ${arquivo.size}, ${conteudo})`;
  revalidatePath("/", "layout");
  return {};
}

export async function excluirAnexo(id: number) {
  await exigirLogin();
  await sql`DELETE FROM anexos WHERE id = ${id}`;
  revalidatePath("/", "layout");
}
