"use client";

import { useEffect, useRef, useState } from "react";
import { lerValor, qtd } from "@/lib/formato";
import { ITENS_PORTAL, PORTAL_FABRICA, favoritoPortal, itemDoPortal, textoParaPortal } from "@/lib/portal-fabrica";
import { Selo, cls } from "./ui";

type Item = { id: number; nome: string; sabor: string; unidade: string; saldo: number; fisico: number; minimo: number; baixo: boolean; sugestao: number };

/** Quantidades a pedir + texto pronto para mandar à fábrica pelo WhatsApp. */
export function ListaCompra({ itens }: { itens: Item[] }) {
  const [qtds, setQtds] = useState<Record<number, string>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, i.sugestao ? String(i.sugestao) : ""])),
  );
  const [copiado, setCopiado] = useState(false);
  const [copiadoPortal, setCopiadoPortal] = useState(false);
  const pedidos = itens.filter((i) => lerValor(qtds[i.id]) > 0);
  const texto = [
    "Olá! Segue o pedido da Breakfast:",
    "",
    ...pedidos.map((i) => `• ${qtd(lerValor(qtds[i.id]))} ${i.unidade} – ${i.nome}${i.sabor ? ` ${i.sabor}` : ""}`),
    "",
    "Obrigado!",
  ].join("\n");

  // Pedido na ordem e com os nomes do portal da fábrica
  const noPortal = ITENS_PORTAL.map((p) => ({
    p,
    quantidade: pedidos.filter((i) => itemDoPortal(i.nome, i.sabor)?.id === p.id).reduce((s, i) => s + lerValor(qtds[i.id]), 0),
    unidade: pedidos.find((i) => itemDoPortal(i.nome, i.sabor)?.id === p.id)?.unidade ?? "",
  })).filter((x) => x.quantidade > 0);
  const foraDoPortal = pedidos.filter((i) => !itemDoPortal(i.nome, i.sabor));
  const textoPortal = textoParaPortal(noPortal);

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
                Prateleira {qtd(i.fisico)} {i.unidade} · reservado {qtd(i.fisico - i.saldo)}
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

      <div className="rounded-xl border-2 border-accent/30 bg-surface p-4">
        <h2 className="mb-1 font-semibold">🛒 Pedido no portal da {PORTAL_FABRICA.nome}</h2>
        <p className="mb-3 text-sm text-muted">
          Abra o portal, entre com o código de acesso da Breakfast e coloque estas quantidades (mesma ordem e mesmos nomes do portal).
        </p>
        {noPortal.length === 0 ? (
          <p className="text-sm text-muted">Coloque a quantidade de pelo menos um produto da fábrica.</p>
        ) : (
          <ol className="mb-3 divide-y divide-line rounded-lg border border-line bg-background">
            {noPortal.map((x) => (
              <li key={x.p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{x.p.nome}</span> · <span className="text-accent">{x.p.variacao}</span>
                  {x.p.caixa && <span className="block text-xs text-muted">No portal é vendido em caixa fechada (25 pacotes de 400 g).</span>}
                </span>
                <span className="tabular shrink-0 text-base font-bold">
                  {qtd(x.quantidade)} <span className="text-xs font-normal text-muted">{x.unidade}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        {foraDoPortal.length > 0 && (
          <p className="mb-3 text-xs text-warn">
            Não achei no portal: {foraDoPortal.map((i) => `${i.nome}${i.sabor ? ` ${i.sabor}` : ""}`).join(", ")}. Peça esses pelo WhatsApp.
          </p>
        )}
        {noPortal.length > 0 && (
          <ol className="mb-3 list-decimal space-y-0.5 pl-5 text-sm">
            <li>
              Clique em <b>&quot;Copiar para o portal e abrir&quot;</b>.
            </li>
            <li>No portal, entre com o código de acesso da Breakfast.</li>
            <li>
              Clique no favorito <b>&quot;Preencher pedido Breakfast&quot;</b> (na barra de favoritos): as quantidades entram sozinhas.
            </li>
            <li>
              Confira o resumo do portal com esta lista e clique em <b>&quot;Enviar pedido&quot;</b> lá.
            </li>
          </ol>
        )}
        <div className="flex flex-wrap gap-2">
          {noPortal.length > 0 ? (
            <a
              href={PORTAL_FABRICA.url}
              target="_blank"
              rel="noreferrer"
              className={cls.botao}
              onClick={() => {
                navigator.clipboard.writeText(textoPortal).catch(() => {});
                setCopiadoPortal(true);
                setTimeout(() => setCopiadoPortal(false), 4000);
              }}
            >
              {copiadoPortal ? "Copiado ✓ — portal aberto em outra aba" : "📋 Copiar para o portal e abrir ↗"}
            </a>
          ) : (
            <a href={PORTAL_FABRICA.url} target="_blank" rel="noreferrer" className={cls.botao2}>
              Abrir o portal da {PORTAL_FABRICA.nome} ↗
            </a>
          )}
        </div>
        <InstalarFavorito />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold">Ou mande pelo WhatsApp</h2>
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

/** Primeira vez: arrastar o favorito "Preencher pedido Breakfast" para a barra de favoritos do navegador. */
function InstalarFavorito() {
  const link = useRef<HTMLAnchorElement>(null);
  // O React não aceita "javascript:" no href; colocamos direto no elemento.
  useEffect(() => {
    link.current?.setAttribute("href", favoritoPortal());
  }, []);
  return (
    <details className="mt-4 rounded-lg border border-line bg-background p-3 text-sm">
      <summary className="cursor-pointer font-semibold">⚙ Primeira vez neste computador? Instale o botão &quot;Preencher pedido Breakfast&quot;</summary>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        <li>
          Mostre a barra de favoritos do navegador: aperte <kbd className="rounded border border-line bg-surface px-1">Ctrl</kbd>+
          <kbd className="rounded border border-line bg-surface px-1">Shift</kbd>+<kbd className="rounded border border-line bg-surface px-1">B</kbd>.
        </li>
        <li>
          <b>Arraste</b> (clique, segure e solte) este botão para a barra de favoritos:{" "}
          <a
            ref={link}
            draggable
            onClick={(e) => {
              e.preventDefault();
              alert("Não é para clicar aqui: arraste este botão para a barra de favoritos. Depois use-o dentro do portal da fábrica.");
            }}
            className="ml-1 inline-flex cursor-grab items-center rounded-lg border-2 border-dashed border-accent bg-accent-soft px-3 py-1.5 font-semibold text-accent"
          >
            🥐 Preencher pedido Breakfast
          </a>
        </li>
        <li>Pronto! Ele fica na barra. Só funciona dentro do portal, depois de entrar com o código.</li>
      </ol>
      <p className="mt-2 text-xs text-muted">
        O botão só coloca as quantidades nos produtos: não entra com o código, não guarda senha e não envia o pedido. Na primeira vez, o navegador pode
        perguntar se o portal pode ler o que foi copiado: clique em &quot;Permitir&quot;. Se não permitir, ele abre uma janelinha para colar (Ctrl+V).
      </p>
    </details>
  );
}
