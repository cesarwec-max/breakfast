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

// ---------------------------------------------------------------------------------------------
// "Preencher pedido Breakfast": favorito (bookmarklet) que a pessoa instala uma vez no navegador.
// Depois de entrar no portal com o código, clicar nele lê o pedido copiado no app (área de
// transferência ou colando na janelinha) e coloca as quantidades nos campos do portal (q-<id>).
// Não entra com código, não envia nada: a pessoa confere e clica em "Enviar pedido".
// ---------------------------------------------------------------------------------------------

/** Marca do texto copiado no app, para o favorito reconhecer o pedido. */
export const MARCA_PORTAL = "PEDIDO-BREAKFAST";

/** Texto que o app copia: a marca + "id=quantidade" + a lista legível. */
export function textoParaPortal(itens: { p: ItemPortal; quantidade: number; unidade: string }[]) {
  const codigo = itens.map((x) => `${x.p.id}=${Math.ceil(x.quantidade)}`).join(";");
  return [`${MARCA_PORTAL} ${codigo}`, "", ...itens.map((x) => `${x.p.nome} · ${x.p.variacao}: ${Math.ceil(x.quantidade)} ${x.unidade}`)].join("\n");
}

const preencher = function (marca: string) {
  function aplicar(texto: string | null) {
    if (!texto) return;
    const m = new RegExp(marca + "\\s+([^\\s]+)").exec(texto);
    if (!m) return alert("Não achei o pedido da Breakfast. No app, clique em \"Copiar para o portal\" e tente de novo.");
    const campos = document.querySelectorAll<HTMLInputElement>('input[id^="q-"]');
    if (!campos.length) return alert("Entre no portal com o código de acesso primeiro; depois clique de novo em \"Preencher pedido Breakfast\".");
    for (let i = 0; i < campos.length; i++) {
      campos[i].value = "0";
      campos[i].dispatchEvent(new Event("input", { bubbles: true }));
    }
    const ok: string[] = [], faltou: string[] = [];
    m[1].split(";").forEach(function (par) {
      const p = par.split("="), el = document.getElementById("q-" + p[0]) as HTMLInputElement | null;
      if (!el) return faltou.push(p[0] + " (" + p[1] + ")");
      el.value = p[1];
      el.dispatchEvent(new Event("input", { bubbles: true }));
      ok.push(p[0]);
    });
    const r = document.getElementById("resumo");
    if (r) r.scrollIntoView({ behavior: "smooth", block: "center" });
    alert(
      "✓ " + ok.length + " produto(s) preenchido(s)." +
        (faltou.length ? "\n\n⚠ Não achei no portal: " + faltou.join(", ") + ". Preencha à mão." : "") +
        "\n\nConfira o resumo e clique em \"Enviar pedido\".",
    );
  }
  function colar() {
    aplicar(prompt("Cole aqui o pedido copiado no app da Breakfast (Ctrl+V):"));
  }
  if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t.indexOf(marca) >= 0) aplicar(t); else colar(); }, colar);
  else colar();
};

/** O endereço "javascript:" do favorito (o que se arrasta para a barra de favoritos). */
export function favoritoPortal() {
  return "javascript:" + encodeURIComponent(`(${preencher.toString()})(${JSON.stringify(MARCA_PORTAL)});void 0`);
}
