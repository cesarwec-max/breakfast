// Mensagem de cobrança pronta para o WhatsApp (abre a conversa com o cliente e o texto já escrito).

import { EMPRESA } from "./empresa";
import { brl, dataBR, diasEntre } from "./formato";
import { pixCopiaECola } from "./pix";

export type ContaCobranca = {
  id: number;
  valor: number;
  vencimento: string;
  /** Veio de um boleto (Financeiro) ou o pedido é pago no boleto: não manda PIX, oferece reenviar o boleto. */
  boleto: boolean;
};

/** Telefone no formato do WhatsApp (55 + DDD + número) ou null se não der para usar. */
export function numeroWhatsApp(telefone: string) {
  let d = telefone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d.length === 12 || d.length === 13 ? d : null;
}

function situacao(vencimento: string, hoje: string) {
  const d = diasEntre(hoje, vencimento);
  if (d < 0) return `venceu em ${dataBR(vencimento)}, há ${-d} dia${d === -1 ? "" : "s"}`;
  if (d === 0) return "vence hoje";
  return `vence em ${dataBR(vencimento)}`;
}

export function mensagemCobranca(cliente: string, contas: ContaCobranca[], hoje: string, empresa = false) {
  // Pessoa: só o primeiro nome. Empresa: o nome inteiro ("Olá, Padaria Mooca!")
  const nome = empresa ? cliente.trim() : (cliente.trim().split(/\s+/)[0] ?? "");
  const total = contas.reduce((s, c) => s + c.valor, 0);
  const linhas = [`Olá${nome ? `, ${nome}` : ""}! Tudo bem? Aqui é da Breakfast 🥐`, ""];
  if (contas.length === 1) {
    const c = contas[0];
    linhas.push(`Passando para lembrar do pagamento de *${brl(c.valor)}*, que ${situacao(c.vencimento, hoje)}.`);
  } else {
    linhas.push("Passando para lembrar dos pagamentos em aberto:");
    for (const c of contas) linhas.push(`• *${brl(c.valor)}*: ${situacao(c.vencimento, hoje)}`);
    linhas.push(`Total: *${brl(total)}*`);
  }
  const pix = contas.filter((c) => !c.boleto);
  if (pix.length) {
    const valorPix = pix.reduce((s, c) => s + c.valor, 0);
    linhas.push("", `Para pagar pelo PIX${pix.length < contas.length ? ` (${brl(valorPix)})` : ""}:`, `Chave: ${EMPRESA.chavePix}`);
    linhas.push(
      "",
      "PIX copia e cola:",
      pixCopiaECola({
        chave: EMPRESA.chavePix,
        nome: EMPRESA.pixNome,
        cidade: EMPRESA.pixCidade,
        valor: valorPix,
        identificador: `COB${pix.map((c) => c.id).join("")}`,
      }),
    );
  }
  if (pix.length < contas.length) linhas.push("", "Se precisar, reenviamos o boleto.");
  linhas.push("", "Se já pagou, por favor desconsidere esta mensagem. Obrigado! 🙏");
  return linhas.join("\n");
}

/** Link que abre o WhatsApp com a mensagem. Sem telefone válido, abre o WhatsApp para escolher o contato. */
export function linkCobranca(
  c: { telefone: string; cliente: string; cnpj_cpf: string },
  contas: ContaCobranca[],
  hoje: string,
) {
  const numero = numeroWhatsApp(c.telefone);
  const empresa = c.cnpj_cpf.replace(/\D/g, "").length === 14;
  const texto = encodeURIComponent(mensagemCobranca(c.cliente, contas, hoje, empresa));
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
