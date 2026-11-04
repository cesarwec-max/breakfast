"use client";

import { useState } from "react";
import { valorCampo } from "@/lib/formato";
import { cls } from "./ui";

type Linha = { chave: number; de: string; pct: string };
let n = 0;

/** Percentual de comissão, com faixas opcionais pelo total vendido no mês. Envia faixa_de / faixa_pct. */
export function FaixasEditor({ inicial }: { inicial: { a_partir_de: number; percentual: number }[] }) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    (inicial.length ? inicial : [{ a_partir_de: 0, percentual: 0 }]).map((f) => ({
      chave: ++n,
      de: valorCampo(f.a_partir_de),
      pct: String(f.percentual).replace(".", ","),
    })),
  );
  const muda = (chave: number, campos: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...campos } : l)));

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-muted">Percentual de comissão *</span>
      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div key={l.chave} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
            {i === 0 ? (
              <>
                <input type="hidden" name="faixa_de" value="0" />
                <span className="text-sm text-muted">{linhas.length > 1 ? "Vendas do mês a partir de R$ 0" : "Sobre todas as vendas do mês"}</span>
              </>
            ) : (
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="shrink-0">Vendas do mês a partir de R$</span>
                <input
                  name="faixa_de"
                  required
                  inputMode="decimal"
                  value={l.de}
                  onChange={(e) => muda(l.chave, { de: e.target.value })}
                  className={cls.input}
                  placeholder="200.000,00"
                />
              </label>
            )}
            <label className="flex items-center gap-1">
              <input
                name="faixa_pct"
                required
                inputMode="decimal"
                value={l.pct}
                onChange={(e) => muda(l.chave, { pct: e.target.value })}
                className={`${cls.input} text-right`}
                aria-label="Percentual"
              />
              <span className="text-sm text-muted">%</span>
            </label>
            {i === 0 ? (
              <span className="w-7" />
            ) : (
              <button
                type="button"
                onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}
                className="w-7 rounded-md py-1 text-sm text-muted hover:bg-danger-soft hover:text-danger"
                aria-label="Remover faixa"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setLinhas((ls) => [...ls, { chave: ++n, de: "", pct: "" }])} className={`${cls.botao2} mt-2`}>
        + Faixa por valor vendido
      </button>
      <p className="mt-2 text-xs text-muted">
        Com faixas, o percentual da faixa alcançada vale para o total do mês inteiro (ex.: vendeu R$ 250 mil → o percentual da faixa de
        R$ 200 mil sobre os R$ 250 mil).
      </p>
    </div>
  );
}
