import Link from "next/link";
import type { Movimento } from "@/lib/dados";
import { qtd } from "@/lib/formato";
import { excluirMovimento } from "@/app/(app)/estoque/actions";
import { Confirmar } from "./botoes";
import { Vazio, cls } from "./ui";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function ListaMovimentos({ movimentos, voltar, mostrarProduto = true }: { movimentos: Movimento[]; voltar: string; mostrarProduto?: boolean }) {
  if (movimentos.length === 0) return <Vazio>Nenhuma movimentação ainda.</Vazio>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-sm">
      {movimentos.map((m) => {
        const sinal = m.tipo === "saida" ? -m.quantidade : m.quantidade;
        const rotulo = m.tipo === "entrada" ? "Entrada" : m.tipo === "saida" ? "Saída" : "Ajuste";
        return (
          <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`tabular w-20 shrink-0 text-right font-semibold ${sinal >= 0 ? "text-ok" : "text-danger"}`}>
              {sinal >= 0 ? "+" : "−"}
              {qtd(Math.abs(sinal))}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                {mostrarProduto && <span className="font-medium">{m.produto} · </span>}
                <span className="text-muted">{rotulo}</span>
                {m.observacao && <span className="text-muted"> — {m.observacao}</span>}
                {m.pedido_id && (
                  <Link href={`/pedidos/${m.pedido_id}`} className={`${cls.link} ml-1`}>
                    pedido #{m.pedido_id}
                  </Link>
                )}
              </div>
              <div className="text-xs text-muted">{dataHora.format(m.criado_em)}</div>
            </div>
            {!m.pedido_id && !m.observacao.startsWith("Pedido #") && (
              <form action={excluirMovimento.bind(null, m.id, voltar)}>
                <Confirmar mensagem="Apagar este lançamento? O saldo será recalculado." className="text-xs text-muted hover:text-danger">
                  apagar
                </Confirmar>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
