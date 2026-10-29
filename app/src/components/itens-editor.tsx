"use client";

import { useState } from "react";
import { brl, lerValor, qtdCampo, valorCampo } from "@/lib/formato";
import { cls } from "./ui";

export type OpcaoProduto = { id: number; nome: string; unidade: string; preco: number };
type Linha = { chave: number; produto_id: number | ""; quantidade: string; preco: string };

let contador = 0;
const nova = (p?: Partial<{ produto_id: number; quantidade: number; preco_unitario: number }>): Linha => ({
  chave: ++contador,
  produto_id: p?.produto_id ?? "",
  quantidade: p?.quantidade ? qtdCampo(p.quantidade) : "",
  preco: p?.preco_unitario !== undefined ? valorCampo(p.preco_unitario) : "",
});

/** Lista de itens (produto, quantidade, preço) com total. Envia item_produto/item_qtd/item_preco. */
export function ItensEditor({
  produtos,
  inicial = [],
}: {
  produtos: OpcaoProduto[];
  inicial?: { produto_id: number; quantidade: number; preco_unitario: number }[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() => (inicial.length ? inicial.map((i) => nova(i)) : [nova()]));
  const muda = (chave: number, campos: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...campos } : l)));
  const total = linhas.reduce((s, l) => s + lerValor(l.quantidade) * lerValor(l.preco), 0);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-muted">Itens do pedido *</span>
      <div className="space-y-2">
        {linhas.map((l) => {
          const produto = produtos.find((p) => p.id === l.produto_id);
          const subtotal = lerValor(l.quantidade) * lerValor(l.preco);
          return (
            <div key={l.chave} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-line bg-background/60 p-2 sm:grid-cols-[1fr_6rem_7rem_6rem_auto] sm:items-center">
              <select
                name="item_produto"
                required
                value={l.produto_id}
                onChange={(e) => {
                  const p = produtos.find((x) => x.id === Number(e.target.value));
                  muda(l.chave, { produto_id: Number(e.target.value), preco: p ? valorCampo(p.preco) : l.preco });
                }}
                className={`${cls.input} col-span-2 sm:col-span-1`}
              >
                <option value="" disabled>
                  Produto…
                </option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <label className="contents">
                <span className="sr-only">Quantidade</span>
                <input
                  name="item_qtd"
                  required
                  inputMode="decimal"
                  placeholder={`Qtd${produto ? ` (${produto.unidade})` : ""}`}
                  value={l.quantidade}
                  onChange={(e) => muda(l.chave, { quantidade: e.target.value })}
                  className={cls.input}
                />
              </label>
              <label className="contents">
                <span className="sr-only">Preço unitário</span>
                <input
                  name="item_preco"
                  inputMode="decimal"
                  placeholder="R$ unit."
                  value={l.preco}
                  onChange={(e) => muda(l.chave, { preco: e.target.value })}
                  className={cls.input}
                />
              </label>
              <span className="tabular self-center text-right text-sm font-medium sm:block">{brl(subtotal)}</span>
              <button
                type="button"
                onClick={() => setLinhas((ls) => (ls.length > 1 ? ls.filter((x) => x.chave !== l.chave) : [nova()]))}
                className="self-center justify-self-end rounded-md px-2 py-1 text-sm text-muted hover:bg-danger-soft hover:text-danger"
                aria-label="Remover item"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => setLinhas((ls) => [...ls, nova()])} className={cls.botao2}>
          + Adicionar item
        </button>
        <div className="text-right">
          <div className="text-xs text-muted">Total</div>
          <div className="tabular text-lg font-bold">{brl(total)}</div>
        </div>
      </div>
    </div>
  );
}
