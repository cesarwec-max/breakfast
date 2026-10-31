"use client";

import { useState } from "react";
import { brl, lerValor, somarDias, valorCampo } from "@/lib/formato";
import { ACEITA_ARQUIVOS } from "@/lib/anexos";
import { cls } from "./ui";

type Linha = { chave: number; valor: string; vencimento: string };
let contador = 0;
const nova = (valor = "", vencimento = ""): Linha => ({ chave: ++contador, valor, vencimento });

/** Lista de boletos (valor + vencimento). Envia parcela_valor / parcela_vencimento. */
export function ParcelasEditor({
  totalSugerido,
  primeiroVencimento,
  linhasIniciais = 1,
  comBoleto = false,
}: {
  totalSugerido?: number;
  primeiroVencimento: string;
  /** Quantos boletos já aparecem vazios (a fábrica sempre manda 2). */
  linhasIniciais?: number;
  /** Mostra, em cada boleto, um campo para anexar o arquivo (envia parcela_boleto). */
  comBoleto?: boolean;
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    totalSugerido ? [nova(valorCampo(totalSugerido), "")] : Array.from({ length: linhasIniciais }, () => nova()),
  );
  const [dividir, setDividir] = useState({ total: totalSugerido ? valorCampo(totalSugerido) : "", n: "2", intervalo: "30", inicio: primeiroVencimento });
  const muda = (chave: number, campos: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...campos } : l)));
  const total = linhas.reduce((s, l) => s + lerValor(l.valor), 0);

  function aplicarDivisao() {
    const t = lerValor(dividir.total);
    const n = Math.max(1, Math.min(48, Number(dividir.n) || 1));
    const intervalo = Number(dividir.intervalo) || 30;
    if (!t || !dividir.inicio) return;
    // Divide em centavos; a diferença do arredondamento vai na primeira parcela
    const centavos = Math.round(t * 100);
    const base = Math.floor(centavos / n);
    setLinhas(
      Array.from({ length: n }, (_, i) =>
        nova(valorCampo((base + (i === 0 ? centavos - base * n : 0)) / 100), somarDias(dividir.inicio, i * intervalo)),
      ),
    );
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-muted">Boletos (valor e vencimento) *</span>
      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div key={l.chave} className={comBoleto ? "rounded-lg border border-line p-2" : ""}>
          <div className="grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-2">
            <span className="text-center text-sm text-muted">{i + 1}.</span>
            <input
              name="parcela_valor"
              required
              inputMode="decimal"
              placeholder="Valor R$"
              value={l.valor}
              onChange={(e) => muda(l.chave, { valor: e.target.value })}
              className={cls.input}
              aria-label={`Valor da parcela ${i + 1}`}
            />
            <input
              name="parcela_vencimento"
              type="date"
              required
              value={l.vencimento}
              onChange={(e) => muda(l.chave, { vencimento: e.target.value })}
              className={cls.input}
              aria-label={`Vencimento da parcela ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => setLinhas((ls) => (ls.length > 1 ? ls.filter((x) => x.chave !== l.chave) : [nova()]))}
              className="rounded-md px-2 py-1 text-sm text-muted hover:bg-danger-soft hover:text-danger"
              aria-label="Remover parcela"
            >
              ✕
            </button>
          </div>
          {comBoleto && (
            <label className="mt-2 flex items-center gap-2 pl-10 text-sm text-muted">
              <span className="shrink-0">📎 Arquivo do boleto {i + 1}:</span>
              <input
                name="parcela_boleto"
                type="file"
                accept={ACEITA_ARQUIVOS}
                className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-md file:border file:border-line file:bg-surface file:px-2 file:py-1 file:text-xs file:font-semibold"
                aria-label={`Arquivo do boleto ${i + 1}`}
              />
            </label>
          )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const ultima = linhas[linhas.length - 1]?.vencimento;
            setLinhas((ls) => [...ls, nova("", ultima ? somarDias(ultima, 30) : "")]);
          }}
          className={cls.botao2}
        >
          + Adicionar boleto
        </button>
        <div className="text-right">
          <div className="text-xs text-muted">Total</div>
          <div className="tabular text-lg font-bold">{brl(total)}</div>
        </div>
      </div>

      <details className="mt-3 rounded-lg border border-line bg-background/60">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Dividir um valor em parcelas</summary>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-3 sm:grid-cols-4">
          <label className="text-xs text-muted">
            Valor total
            <input inputMode="decimal" value={dividir.total} onChange={(e) => setDividir({ ...dividir, total: e.target.value })} className={cls.input} />
          </label>
          <label className="text-xs text-muted">
            Nº de parcelas
            <input inputMode="numeric" value={dividir.n} onChange={(e) => setDividir({ ...dividir, n: e.target.value })} className={cls.input} />
          </label>
          <label className="text-xs text-muted">
            1º vencimento
            <input type="date" value={dividir.inicio} onChange={(e) => setDividir({ ...dividir, inicio: e.target.value })} className={cls.input} />
          </label>
          <label className="text-xs text-muted">
            A cada (dias)
            <input inputMode="numeric" value={dividir.intervalo} onChange={(e) => setDividir({ ...dividir, intervalo: e.target.value })} className={cls.input} />
          </label>
          <button type="button" onClick={aplicarDivisao} className={`${cls.botao2} col-span-2 sm:col-span-4`}>
            Gerar parcelas
          </button>
        </div>
      </details>
    </div>
  );
}
