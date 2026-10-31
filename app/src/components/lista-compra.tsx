"use client";

import { useState } from "react";
import { lerValor, qtd } from "@/lib/formato";
import { Selo, cls } from "./ui";

type Item = { id: number; nome: string; sabor: string; unidade: string; saldo: number; minimo: number; baixo: boolean; sugestao: number };

/** Quantidades a pedir + texto pronto para mandar à fábrica pelo WhatsApp. */
export function ListaCompra({ itens }: { itens: Item[] }) {
  const [qtds, setQtds] = useState<Record<number, string>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, i.sugestao ? String(i.sugestao) : ""])),
  );
  const [copiado, setCopiado] = useState(false);
  const pedidos = itens.filter((i) => lerValor(qtds[i.id]) > 0);
  const texto = [
    "Olá! Segue o pedido da Breakfast:",
    "",
    ...pedidos.map((i) => `• ${qtd(lerValor(qtds[i.id]))} ${i.unidade} – ${i.nome}${i.sabor ? ` ${i.sabor}` : ""}`),
    "",
    "Obrigado!",
  ].join("\n");

  if (itens.length === 0) return <p className="text-sm text-muted">Cadastre produtos no estoque primeiro.</p>;

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {itens.map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {i.nome}
                {i.sabor && <span className="text-accent"> {i.sabor}</span>}
              </div>
              <div className="text-xs text-muted">
                Saldo {qtd(i.saldo)} {i.unidade}
                {i.minimo > 0 && ` · mínimo ${qtd(i.minimo)}`} {i.baixo && <Selo tom={i.saldo <= 0 ? "perigo" : "aviso"}>{i.saldo <= 0 ? "sem estoque" : "acabando"}</Selo>}
              </div>
            </div>
            <div className="w-24 shrink-0">
              <input
                inputMode="decimal"
                value={qtds[i.id] ?? ""}
                onChange={(e) => setQtds({ ...qtds, [i.id]: e.target.value })}
                placeholder="0"
                className={`${cls.input} text-right`}
                aria-label={`Quantidade de ${i.nome} ${i.sabor}`}
              />
            </div>
            <span className="w-12 shrink-0 text-sm text-muted">{i.unidade}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold">Mensagem para a fábrica</h2>
        {pedidos.length === 0 ? (
          <p className="text-sm text-muted">Coloque a quantidade de pelo menos um produto.</p>
        ) : (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 font-sans text-sm">{texto}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className={cls.botao}>
                💬 Enviar no WhatsApp
              </a>
              <button
                type="button"
                className={cls.botao2}
                onClick={async () => {
                  await navigator.clipboard.writeText(texto).catch(() => {});
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
              >
                {copiado ? "Copiado ✓" : "Copiar texto"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
