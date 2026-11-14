// Portal de pedidos da fábrica (JRM Foods). O pedido é feito lá, por uma pessoa, com o código de acesso
// da Breakfast — o código NÃO fica no app (o repositório é público).
// Os itens seguem a mesma ordem e os mesmos nomes do portal, para copiar as quantidades rapidinho.

export const PORTAL_FABRICA = { nome: "JRM Foods", url: "https://jrmfoods.com.br/pedidos" };

export type ItemPortal = { id: string; nome: string; variacao: string; caixa?: boolean };

export const ITENS_PORTAL: ItemPortal[] = [
  { id: "fl-req", nome: "Folhadinho de Ouro LANCHE", variacao: "Requeijão" },
  { id: "fl-pq", nome: "Folhadinho de Ouro LANCHE", variacao: "Presunto e queijo" },
  { id: "fm-req", nome: "Folhadinho de Ouro MINI LANCHE", variacao: "Requeijão" },
  { id: "fm-pq", nome: "Folhadinho de Ouro MINI LANCHE", variacao: "Presunto e queijo" },
  { id: "cb-tr", nome: "Cubinhos Dourados", variacao: "Queijo coalho (tradicional)" },
  { id: "cb-pr", nome: "Cubinhos Dourados", variacao: "Provolone" },
  { id: "cx-req", nome: "Folhadinho de Ouro MINI LANCHE 400 g", variacao: "Requeijão", caixa: true },
  { id: "cx-pq", nome: "Folhadinho de Ouro MINI LANCHE 400 g", variacao: "Presunto e queijo", caixa: true },
];

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Qual item do portal corresponde a um produto nosso (pelo nome + sabor), ou null. */
export function itemDoPortal(nome: string, sabor: string): ItemPortal | null {
  const t = sem(`${nome} ${sabor}`);
  const recheio = /requeij/.test(t) ? "req" : /presunto/.test(t) ? "pq" : /provolone/.test(t) ? "pr" : /coalho|tradicional/.test(t) ? "tr" : "";
  let linha = "";
  if (/cubinho|dadinho/.test(t)) linha = "cb";
  else if (/folhad/.test(t)) linha = /400\s*g|caixa/.test(t) ? "cx" : /mini/.test(t) ? "fm" : /lanche/.test(t) ? "fl" : "";
  return ITENS_PORTAL.find((i) => i.id === `${linha}-${recheio}`) ?? null;
}
