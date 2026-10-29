// Funções de formatação (usadas no servidor e no navegador).

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const brl = (v: number) => moeda.format(v || 0);
export const qtd = (v: number) => numero.format(v || 0);

/** "2026-10-29" → "29/10/2026" */
export function dataBR(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Data de hoje em São Paulo, no formato "AAAA-MM-DD". */
export function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Dias de `a` até `b` (positivo se b é depois de a). */
export function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86_400_000);
}

/** Aceita "1.234,56", "1234,56" ou "1234.56". */
export function lerValor(texto: FormDataEntryValue | string | null | undefined) {
  let s = String(texto ?? "").replace(/[^\d,.-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Número para colocar de volta num campo de texto: 1234.5 → "1234,50" */
export function valorCampo(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return n.toFixed(2).replace(".", ",");
}

export function qtdCampo(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return String(n).replace(".", ",");
}

/** Data (dia) de um momento, no fuso de São Paulo: "AAAA-MM-DD". */
export function diaSP(momento: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(momento);
}
