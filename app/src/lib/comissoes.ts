// Comissões dos representantes: vendas do mês (pedidos não cancelados, pela data de entrega) × percentual da faixa.
// A faixa vale para o total do mês inteiro (ex.: Marco vendeu R$ 250 mil → 4,5% sobre os R$ 250 mil).

import { sql } from "./db";

export type Faixa = { a_partir_de: number; percentual: number };

export type Representante = {
  id: number;
  nome: string;
  telefone: string;
  faixas: Faixa[];
  ativo: boolean;
};

export type PedidoComissao = {
  id: number;
  cliente: string;
  data_entrega: string;
  status: string;
  total: number;
};

export type Fechamento = {
  id: number;
  representante_id: number;
  mes: string;
  total: number;
  percentual: number;
  valor: number;
  pedidos: PedidoComissao[];
  conta_pagar_id: number | null;
  fechado_em: Date;
};

/** "2026-11" → primeiro e último dia do mês */
export function limitesMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

export function mesValido(mes: string | undefined) {
  return !!mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

/** "2026-11" → "2026-12" (ou -1 para voltar) */
export function somarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function nomeMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return `${NOMES_MES[m - 1]} de ${a}`;
}

/** Faixas em ordem, sempre começando do zero. */
export function ordenarFaixas(faixas: Faixa[]) {
  const f = faixas.filter((x) => Number.isFinite(x.a_partir_de) && Number.isFinite(x.percentual)).sort((a, b) => a.a_partir_de - b.a_partir_de);
  if (f.length === 0 || f[0].a_partir_de > 0) f.unshift({ a_partir_de: 0, percentual: f[0]?.percentual ?? 0 });
  return f;
}

/** Percentual que vale para o total vendido no mês, e quanto falta para a próxima faixa. */
export function faixaDoTotal(faixas: Faixa[], total: number) {
  const f = ordenarFaixas(faixas);
  let i = 0;
  while (i + 1 < f.length && total >= f[i + 1].a_partir_de) i++;
  const proxima = f[i + 1];
  return { percentual: f[i].percentual, indice: i, proxima: proxima ? { ...proxima, falta: proxima.a_partir_de - total } : null };
}

export const calcularComissao = (total: number, percentual: number) => Math.round(total * percentual) / 100;

export async function listarRepresentantes({ incluirInativos = false } = {}) {
  return sql<Representante[]>`
    SELECT id, nome, telefone, faixas, ativo FROM representantes
    WHERE ${incluirInativos ? sql`true` : sql`ativo`}
    ORDER BY ativo DESC, lower(nome)`;
}

export async function obterRepresentante(id: number) {
  const [r] = await sql<Representante[]>`SELECT id, nome, telefone, faixas, ativo FROM representantes WHERE id = ${id}`;
  return r ?? null;
}

/** Pedidos do representante com entrega no mês (cancelados não contam). */
export async function pedidosDoMes(representanteId: number, mes: string) {
  const { inicio, fim } = limitesMes(mes);
  return sql<PedidoComissao[]>`
    SELECT pe.id, c.nome AS cliente, pe.data_entrega, pe.status,
      COALESCE((SELECT SUM(i.quantidade * i.preco_unitario) FROM pedido_itens i WHERE i.pedido_id = pe.id), 0)::numeric AS total
    FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id
    WHERE pe.representante_id = ${representanteId} AND pe.status <> 'cancelado'
      AND pe.data_entrega BETWEEN ${inicio} AND ${fim}
    ORDER BY pe.data_entrega, pe.id`;
}

export async function obterFechamento(representanteId: number, mes: string) {
  const [f] = await sql<Fechamento[]>`
    SELECT id, representante_id, to_char(mes, 'YYYY-MM') AS mes, total, percentual, valor, pedidos, conta_pagar_id, fechado_em
    FROM comissoes_fechadas WHERE representante_id = ${representanteId} AND mes = ${`${mes}-01`}`;
  return f ?? null;
}

export type ResumoComissao = {
  representante: Representante;
  mes: string;
  fechado: Fechamento | null;
  pedidos: PedidoComissao[];
  total: number;
  percentual: number;
  valor: number;
  proxima: { a_partir_de: number; percentual: number; falta: number } | null;
  /** Pedidos do mês que ainda não foram entregues */
  aEntregar: number;
};

/** Comissão do mês: a gravada no fechamento ou, se o mês está aberto, a calculada agora. */
export async function resumoComissao(r: Representante, mes: string): Promise<ResumoComissao> {
  const fechado = await obterFechamento(r.id, mes);
  if (fechado) {
    return {
      representante: r,
      mes,
      fechado,
      pedidos: fechado.pedidos,
      total: fechado.total,
      percentual: fechado.percentual,
      valor: fechado.valor,
      proxima: null,
      aEntregar: 0,
    };
  }
  const pedidos = await pedidosDoMes(r.id, mes);
  const total = Math.round(pedidos.reduce((s, p) => s + p.total, 0) * 100) / 100;
  const { percentual, proxima } = faixaDoTotal(r.faixas, total);
  return {
    representante: r,
    mes,
    fechado: null,
    pedidos,
    total,
    percentual,
    valor: calcularComissao(total, percentual),
    proxima,
    aEntregar: pedidos.filter((p) => p.status === "pendente" || p.status === "em_rota").length,
  };
}

/** "3,5% até R$ 199.999,99 · 4,5% a partir de R$ 200.000,00 · …" */
export function descreverFaixas(faixas: Faixa[]) {
  const f = ordenarFaixas(faixas);
  const pct = (n: number) => `${String(n).replace(".", ",")}%`;
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (f.length === 1) return `${pct(f[0].percentual)} sobre as vendas`;
  return f.map((x, i) => (i === 0 ? `${pct(x.percentual)} abaixo de ${brl(f[1].a_partir_de)}` : `${pct(x.percentual)} a partir de ${brl(x.a_partir_de)}`)).join(" · ");
}
