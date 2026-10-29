import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarPedidos, type Pedido, type StatusPedido } from "@/lib/dados";
import { brl, dataBR, diasEntre, hoje, qtd } from "@/lib/formato";
import { Enviar } from "@/components/botoes";
import { Abas, Cartao, Titulo, Vazio, cls } from "@/components/ui";
import { marcarEntregue } from "./actions";
import { SeloEntrega } from "./selo";

export const metadata: Metadata = { title: "Pedidos" };

const STATUS: { valor: StatusPedido; rotulo: string }[] = [
  { valor: "pendente", rotulo: "A entregar" },
  { valor: "entregue", rotulo: "Entregues" },
  { valor: "cancelado", rotulo: "Cancelados" },
];

function grupoData(data: string, dia: string) {
  const d = diasEntre(dia, data);
  if (d < 0) return "Atrasados";
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(new Date(data + "T12:00:00Z"));
  return `${semana[0].toUpperCase()}${semana.slice(1)}, ${dataBR(data)}`;
}

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const status = (STATUS.find((s) => s.valor === sp.status)?.valor ?? "pendente") as StatusPedido;
  const pedidos = await listarPedidos({ status, limite: status === "pendente" ? 500 : 100 });
  const dia = hoje();

  const grupos = new Map<string, Pedido[]>();
  for (const p of pedidos) {
    const g = status === "pendente" ? grupoData(p.data_entrega, dia) : dataBR(p.data_entrega);
    grupos.set(g, [...(grupos.get(g) ?? []), p]);
  }

  // Lista de separação: soma de cada produto nos pedidos a entregar
  const separar = new Map<string, { q: number; un: string }>();
  if (status === "pendente") {
    for (const p of pedidos)
      for (const i of p.itens) {
        const nome = i.sabor ? `${i.produto} · ${i.sabor}` : i.produto;
        const a = separar.get(nome) ?? { q: 0, un: i.unidade };
        a.q += i.quantidade;
        separar.set(nome, a);
      }
  }

  return (
    <>
      <Titulo titulo="Pedidos" subtitulo={status === "pendente" ? `${pedidos.length} a entregar` : undefined}>
        <Link href="/pedidos/novo" className={cls.botao}>
          + Novo pedido
        </Link>
      </Titulo>
      <Abas atual={status} itens={STATUS.map((s) => ({ valor: s.valor, rotulo: s.rotulo, href: `/pedidos?status=${s.valor}` }))} />

      {pedidos.length === 0 && <Vazio>{status === "pendente" ? "Nenhum pedido a entregar. 🎉" : "Nenhum pedido aqui."}</Vazio>}

      {separar.size > 0 && (
        <details className="mb-6 rounded-xl border border-line bg-surface">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Lista de separação (todos os pedidos a entregar)</summary>
          <ul className="grid gap-x-6 border-t border-line px-4 py-3 text-sm sm:grid-cols-2">
            {[...separar].map(([nome, s]) => (
              <li key={nome} className="flex justify-between py-1">
                <span>{nome}</span>
                <span className="tabular font-semibold">
                  {qtd(s.q)} {s.un}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="space-y-6">
        {[...grupos].map(([grupo, lista]) => (
          <section key={grupo}>
            <h2 className={`mb-2 text-sm font-semibold ${grupo === "Atrasados" ? "text-danger" : "text-muted"}`}>
              {grupo} <span className="font-normal">({lista.length})</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {lista.map((p) => (
                <Cartao key={p.id} className="flex flex-col">
                  <Link href={`/pedidos/${p.id}`} className="block flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold">{p.cliente}</div>
                        <div className="text-sm text-muted">📍 {p.endereco || "Sem endereço"}</div>
                      </div>
                      <SeloEntrega pedido={p} />
                    </div>
                    <ul className="mt-2 text-sm">
                      {p.itens.map((i, n) => (
                        <li key={n}>
                          <span className="tabular font-medium">{qtd(i.quantidade)}</span> {i.unidade} · {i.produto}
                          {i.sabor && <span className="text-accent"> · {i.sabor}</span>}
                        </li>
                      ))}
                    </ul>
                    {p.observacao && <p className="mt-2 text-xs text-muted">📝 {p.observacao}</p>}
                  </Link>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="tabular font-semibold">{brl(p.total)}</span>
                    {p.status === "pendente" && (
                      <form action={marcarEntregue.bind(null, p.id, "/pedidos")}>
                        <Enviar className={cls.botaoPequeno} pendente="…">
                          ✓ Entregue
                        </Enviar>
                      </form>
                    )}
                  </div>
                </Cartao>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
