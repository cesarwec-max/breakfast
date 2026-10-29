"use client";

import { useState } from "react";
import type { Produto } from "@/lib/dados";
import { Enviar } from "./botoes";
import { Campo, cls } from "./ui";

/** Lançamento rápido de entrada, saída ou contagem de estoque. */
export function MovimentoForm({
  acao,
  produtos,
  produtoFixo,
  voltar = "/estoque",
}: {
  acao: (form: FormData) => Promise<void>;
  produtos: Produto[];
  produtoFixo?: number;
  voltar?: string;
}) {
  const [tipo, setTipo] = useState("entrada");
  const tipos = [
    { v: "entrada", r: "Entrada", c: "bg-ok text-white" },
    { v: "saida", r: "Saída", c: "bg-danger text-white" },
    { v: "contagem", r: "Contagem", c: "bg-grafite text-white" },
  ];
  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      <input type="hidden" name="voltar" value={voltar} />
      <input type="hidden" name="tipo" value={tipo} />
      <div className="flex gap-1 rounded-lg border border-line bg-background p-1 sm:col-span-2">
        {tipos.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTipo(t.v)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${tipo === t.v ? t.c : "text-muted"}`}
          >
            {t.r}
          </button>
        ))}
      </div>
      {produtoFixo ? (
        <input type="hidden" name="produto_id" value={produtoFixo} />
      ) : (
        <Campo rotulo="Produto">
          <select name="produto_id" required className={cls.input} defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
      )}
      <Campo rotulo={tipo === "contagem" ? "Quantidade contada" : "Quantidade"} className={produtoFixo ? "sm:col-span-2" : ""}>
        <input name="quantidade" required inputMode="decimal" className={cls.input} placeholder="0" />
      </Campo>
      <Campo rotulo="Observação (opcional)" className="sm:col-span-2">
        <input
          name="observacao"
          className={cls.input}
          placeholder={tipo === "entrada" ? "Ex.: chegada da fábrica" : tipo === "saida" ? "Ex.: perda, amostra" : "Ex.: contagem de sexta"}
        />
      </Campo>
      <div className="sm:col-span-2">
        <Enviar>{tipo === "entrada" ? "Lançar entrada" : tipo === "saida" ? "Lançar saída" : "Ajustar estoque"}</Enviar>
        {tipo === "contagem" && (
          <p className="mt-2 text-xs text-muted">A contagem corrige o saldo para o número contado e registra a diferença.</p>
        )}
      </div>
    </form>
  );
}
