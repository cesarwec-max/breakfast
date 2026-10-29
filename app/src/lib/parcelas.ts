import { lerValor } from "./formato";

/** Lê as parcelas enviadas pelo ParcelasEditor. */
export function lerParcelas(form: FormData) {
  const valores = form.getAll("parcela_valor").map((v) => lerValor(v));
  const datas = form.getAll("parcela_vencimento").map(String);
  const parcelas = valores
    .map((valor, i) => ({ valor, vencimento: datas[i] ?? "" }))
    .filter((p) => p.valor > 0 && /^\d{4}-\d{2}-\d{2}$/.test(p.vencimento));
  if (parcelas.length === 0) throw new Error("Informe pelo menos um boleto com valor e vencimento.");
  return parcelas;
}
