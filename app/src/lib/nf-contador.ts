// Solicitação de nota fiscal para o contador: A4 simples, no mesmo formato do modelo
// "Solicitacao_NF_SPORT_BAR_MOOCA_R69500_FINAL.pdf" que o usuário mandou.
// As medidas (em pontos, y de cima para baixo) foram tiradas desse modelo.
// O mesmo layout é usado no PDF (pdf-lib, texto selecionável) e na prévia em HTML.

import type { Cliente, DadosNF } from "./dados";
import { EMPRESA } from "./empresa";
import { brl, qtd } from "./formato";

export const A4 = { largura: 595.28, altura: 841.89 };

export const COR = {
  escuro: "#30343b",
  laranja: "#f28c28",
  fundoRotulo: "#f4f5f7",
  borda: "#d9dde2",
  branco: "#ffffff",
  suave: "#5b5f66",
};

export const MEDIDAS = {
  margemTitulo: 54.19,
  tituloBase: 71.5,
  subtituloBase: 88.5,
  tamTitulo: 23,
  tamSecao: 11,
  // tabela do cliente
  cliente: { x: 65.2, xDivisao: 161.5, xFim: 530, pad: 8, alturaLinha: 22, entrelinha: 13, base: 15.5, tam: 9.5 },
  // tabela de produtos
  produtos: { cols: [79.45, 212.65, 297.6, 334.55, 425.25, 516], alturaLinha: 30, entrelinha: 11, base: 17.5, pad: 6, tam: 8.5 },
  total: { x: 65.2, xFim: 530, altura: 38.8, xValor: 385.8, tamRotulo: 11, tamValor: 14 },
  tamTexto: 9.5,
  tamRodape: 8.5,
};

export const ORIENTACOES_CONTADOR = [
  "Emitir a Nota Fiscal conforme os dados e produtos informados acima.",
  "Conferir CNPJ, Inscrição Estadual e endereço antes da emissão.",
];

/** "R. Borges de Figueiredo, 1250, Loja AL02A, Mooca, São Paulo/SP" (como no modelo) */
export function enderecoContador(c: Cliente) {
  const cidade = [c.cidade, c.uf].filter(Boolean).join("/");
  return [c.endereco, c.numero, c.complemento, c.bairro, cidade].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");
}

export function linhasCliente(c: Cliente): [string, string][] {
  return [
    ["Razão social:", c.razao_social || c.nome],
    ["CNPJ:", c.cnpj_cpf],
    ["Inscrição Estadual:", c.inscricao_estadual],
    ["Endereço:", enderecoContador(c)],
  ];
}

export function linhasProdutos(d: DadosNF) {
  return d.itens.map((i) => [i.descricao, i.sabor ?? "", qtd(i.quantidade), brl(i.preco_unitario), brl(i.quantidade * i.preco_unitario)]);
}

/** Ex.: "Solicitacao_NF_SPORT_BAR_MOOCA_R69500.pdf" */
export function arquivoContador(d: DadosNF) {
  const nome = (d.cliente.razao_social || d.cliente.nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_(LTDA|ME|EPP|EIRELI|S_A|SA)$/, "")
    .slice(0, 50);
  return `Solicitacao_NF_${nome}_R${Math.round(d.total * 100)}.pdf`;
}

export function orientacoesExtras(d: DadosNF) {
  return d.observacoes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ---------- PDF ----------

// A fonte Helvetica padrão do PDF só conhece caracteres latinos.
function latin(t: string) {
  return t.normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…€]/g, "?");
}

export async function gerarPdfContador(d: DadosNF, numero: number) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Solicitação de Nota Fiscal nº ${numero}`);
  pdf.setAuthor("Breakfast");
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);
  const cor = (hex: string) => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
  const M = MEDIDAS;
  let pagina = pdf.addPage([A4.largura, A4.altura]);

  const largura = (t: string, tam: number, b = false) => (b ? negrito : normal).widthOfTextAtSize(latin(t), tam);
  const texto = (t: string, x: number, y: number, tam: number, o: { b?: boolean; c?: string } = {}) =>
    pagina.drawText(latin(t), { x, y: A4.altura - y, size: tam, font: o.b ? negrito : normal, color: cor(o.c ?? COR.escuro) });
  const caixa = (x: number, y: number, l: number, a: number, fundo?: string, borda?: string) =>
    pagina.drawRectangle({
      x,
      y: A4.altura - y - a,
      width: l,
      height: a,
      color: fundo ? cor(fundo) : undefined,
      borderColor: borda ? cor(borda) : undefined,
      borderWidth: borda ? 0.6 : 0,
    });
  const quebrar = (t: string, max: number, tam: number, b = false) => {
    const linhas: string[] = [];
    let atual = "";
    for (const p of t.split(/\s+/).filter(Boolean)) {
      const tent = atual ? `${atual} ${p}` : p;
      if (!atual || largura(tent, tam, b) <= max) atual = tent;
      else {
        linhas.push(atual);
        atual = p;
      }
    }
    linhas.push(atual);
    return linhas;
  };
  /** Abre uma nova página se não couber. */
  const espaco = (y: number, alt: number) => {
    if (y + alt <= A4.altura - 50) return y;
    pagina = pdf.addPage([A4.largura, A4.altura]);
    return 50;
  };
  const centro = (t: string, y: number, tam: number, c: string) => texto(t, (A4.largura - largura(t, tam, true)) / 2, y, tam, { b: true, c });

  // Título
  centro("BREAKFAST", M.tituloBase, M.tamTitulo, COR.escuro);
  centro("SOLICITAÇÃO DE NOTA FISCAL", M.subtituloBase, M.tamSecao, COR.laranja);

  // Dados do cliente
  let y = 118.5;
  texto("DADOS DO CLIENTE", M.margemTitulo, y, M.tamSecao, { b: true });
  y = 128.5;
  const tc = M.cliente;
  for (const [rotulo, valor] of linhasCliente(d.cliente)) {
    const lr = quebrar(rotulo, tc.xDivisao - tc.x - 2 * tc.pad, tc.tam, true);
    const lv = quebrar(valor || "—", tc.xFim - tc.xDivisao - 2 * tc.pad, tc.tam);
    const alt = tc.alturaLinha + tc.entrelinha * (Math.max(lr.length, lv.length) - 1);
    y = espaco(y, alt);
    caixa(tc.x, y, tc.xDivisao - tc.x, alt, COR.fundoRotulo, COR.borda);
    caixa(tc.xDivisao, y, tc.xFim - tc.xDivisao, alt, COR.branco, COR.borda);
    lr.forEach((l, i) => texto(l, tc.x + tc.pad, y + tc.base + i * tc.entrelinha, tc.tam, { b: true }));
    lv.forEach((l, i) => texto(l, tc.xDivisao + tc.pad, y + tc.base + i * tc.entrelinha, tc.tam));
    y += alt;
  }

  // Produtos
  y = espaco(y, 80) + 31;
  texto("PRODUTOS DO PEDIDO", M.margemTitulo, y, M.tamSecao, { b: true });
  y += 10;
  const tp = M.produtos;
  const cabecalho = ["Produto", "Sabor", "Qtd.", "Valor unitário", "Subtotal"];
  const larg = (i: number) => tp.cols[i + 1] - tp.cols[i];
  const desenharCabecalho = () => {
    cabecalho.forEach((t, i) => {
      caixa(tp.cols[i], y, larg(i), tp.alturaLinha, COR.escuro, COR.borda);
      texto(t, tp.cols[i] + tp.pad, y + tp.base, tp.tam, { b: true, c: COR.branco });
    });
    y += tp.alturaLinha;
  };
  y = espaco(y, tp.alturaLinha * 2);
  desenharCabecalho();
  for (const linha of linhasProdutos(d)) {
    const q = linha.map((t, i) => (i < 2 ? quebrar(t, larg(i) - 2 * tp.pad, tp.tam) : [t]));
    const alt = tp.alturaLinha + tp.entrelinha * (Math.max(...q.map((x) => x.length)) - 1);
    const novo = espaco(y, alt);
    if (novo !== y) {
      y = novo;
      desenharCabecalho();
    }
    q.forEach((ls, i) => {
      caixa(tp.cols[i], y, larg(i), alt, COR.fundoRotulo, COR.borda);
      ls.forEach((l, k) => {
        // Produto e sabor alinhados à esquerda; números centralizados (como no modelo)
        const x = i < 2 ? tp.cols[i] + tp.pad : tp.cols[i] + (larg(i) - largura(l, tp.tam)) / 2;
        texto(l, x, y + tp.base + k * tp.entrelinha, tp.tam);
      });
    });
    y += alt;
  }

  // Total
  const tt = M.total;
  y = espaco(y + 10.1, tt.altura);
  caixa(tt.x, y, tt.xFim - tt.x, tt.altura, COR.laranja);
  texto("TOTAL DO PEDIDO", 77.2, y + 23.4, tt.tamRotulo, { b: true, c: COR.branco });
  texto(brl(d.total), tt.xValor, y + 24.9, tt.tamValor, { b: true, c: COR.branco });
  y += tt.altura;

  // Instruções
  const extras = orientacoesExtras(d);
  y = espaco(y, 100) + 33.1;
  texto("INSTRUÇÕES AO CONTADOR", M.margemTitulo, y, M.tamSecao, { b: true });
  const item = (partes: { t: string; b?: boolean }[]) => {
    y += 19;
    // Linhas longas (observações) quebram dentro da largura útil
    const tudo = partes.map((p) => p.t).join("");
    if (partes.length === 1 && largura(tudo, M.tamTexto) > 470) {
      const ls = quebrar(tudo, 470, M.tamTexto);
      y = espaco(y, ls.length * 13);
      texto("•", M.margemTitulo, y, M.tamTexto);
      ls.forEach((l, i) => texto(l, 60.15, y + i * 13, M.tamTexto));
      y += (ls.length - 1) * 13;
      return;
    }
    y = espaco(y, 13);
    texto("•", M.margemTitulo, y, M.tamTexto);
    let x = 60.15;
    for (const p of partes) {
      texto(p.t, x, y, M.tamTexto, { b: p.b });
      x += largura(p.t, M.tamTexto, p.b);
    }
  };
  for (const t of ORIENTACOES_CONTADOR) item([{ t }]);
  item([{ t: "Enviar o XML e o DANFE para " }, { t: EMPRESA.emailFinanceiro, b: true }, { t: "." }]);
  for (const t of extras) item([{ t }]);

  // Rodapé
  y = espaco(y, 40) + 25.3;
  pagina.drawLine({
    start: { x: 64.8, y: A4.altura - y },
    end: { x: 530.5, y: A4.altura - y },
    thickness: 0.8,
    color: cor(COR.laranja),
  });
  texto("BREAKFAST", 71.2, y + 16.7, M.tamRodape, { b: true });
  texto("Distribuindo Sabor e Praticidade.", 71.2, y + 27.7, M.tamRodape);

  return pdf.save();
}
