import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { descreverFaixas, listarRepresentantes, mesValido, nomeMes, resumoComissao, somarMes } from "@/lib/comissoes";
import { brl, dataBR, diaSP, hoje } from "@/lib/formato";
import { Aviso, Cartao, Secao, Selo, Titulo, Vazio, cls } from "@/components/ui";

export const metadata: Metadata = { title: "Comissões" };

const pct = (n: number) => `${String(n).replace(".", ",")}%`;

export default async function Comissoes({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const atual = hoje().slice(0, 7);
  const mes = mesValido(sp.mes) ? sp.mes! : atual;
  const anterior = somarMes(atual, -1);
  const representantes = await listarRepresentantes({ incluirInativos: true });
  const ativos = representantes.filter((r) => r.ativo);
  const resumos = await Promise.all(ativos.map((r) => resumoComissao(r, mes)));
  // O mês passado ainda tem comissão aberta? (lembrete para fechar)
  const pendentesAnterior =
    mes === atual ? (await Promise.all(ativos.map((r) => resumoComissao(r, anterior)))).filter((x) => !x.fechado && x.total > 0) : [];
  const totalComissoes = resumos.reduce((s, r) => s + r.valor, 0);
  const totalVendas = resumos.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <Titulo titulo="Comissões" subtitulo="Vendas de cada representante no mês, pela data de entrega dos pedidos. Pedidos cancelados não contam.">
        <Link href="/comissoes/representantes/novo" className={cls.botao2}>
          + Representante
        </Link>
      </Titulo>

      {pendentesAnterior.length > 0 && (
        <Aviso tom="aviso">
          As comissões de <strong>{nomeMes(anterior)}</strong> ainda não foram fechadas ({pendentesAnterior.map((x) => x.representante.nome).join(", ")}).{" "}
          <Link href={`/comissoes?mes=${anterior}`} className={cls.link}>
            Ver e fechar
          </Link>
        </Aviso>
      )}

      <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-2">
        <Link href={`/comissoes?mes=${somarMes(mes, -1)}`} className={cls.botaoPequeno}>
          ← {nomeMes(somarMes(mes, -1)).split(" ")[0]}
        </Link>
        <div className="text-center">
          <div className="font-semibold">{nomeMes(mes).replace(/^./, (l) => l.toUpperCase())}</div>
          {mes !== atual && (
            <Link href="/comissoes" className="text-xs text-muted hover:text-accent">
              voltar para o mês atual
            </Link>
          )}
        </div>
        <Link href={`/comissoes?mes=${somarMes(mes, 1)}`} className={cls.botaoPequeno}>
          {nomeMes(somarMes(mes, 1)).split(" ")[0]} →
        </Link>
      </div>

      {ativos.length === 0 ? (
        <Vazio>Nenhum representante cadastrado.</Vazio>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {resumos.map((r) => (
              <Link key={r.representante.id} href={`/comissoes/${r.representante.id}?mes=${mes}`} className="block rounded-xl border border-line bg-surface p-4 transition hover:border-accent/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">{r.representante.nome}</div>
                    <div className="text-xs text-muted">{descreverFaixas(r.representante.faixas)}</div>
                  </div>
                  {r.fechado ? <Selo tom="ok">Fechado {dataBR(diaSP(r.fechado.fechado_em))}</Selo> : <Selo tom="aviso">Em aberto</Selo>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-muted">Vendas</div>
                    <div className="tabular font-semibold">{brl(r.total)}</div>
                    <div className="text-xs text-muted">{r.pedidos.length} pedido(s)</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Percentual</div>
                    <div className="tabular font-semibold">{pct(r.percentual)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Comissão</div>
                    <div className="tabular text-lg font-bold text-accent">{brl(r.valor)}</div>
                  </div>
                </div>
                {r.proxima && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="bg-marca h-full rounded-full" style={{ width: `${Math.min(100, (r.total / r.proxima.a_partir_de) * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Faltam <strong>{brl(r.proxima.falta)}</strong> em vendas para subir para {pct(r.proxima.percentual)}
                    </div>
                  </div>
                )}
                {r.aEntregar > 0 && <div className="mt-2 text-xs text-warn">{r.aEntregar} pedido(s) do mês ainda não entregue(s)</div>}
              </Link>
            ))}
          </div>
          <Cartao className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
            <span>
              Vendas dos representantes: <strong className="tabular">{brl(totalVendas)}</strong>
            </span>
            <span>
              Total de comissões: <strong className="tabular text-accent">{brl(totalComissoes)}</strong>
            </span>
          </Cartao>
        </>
      )}

      <Secao titulo="Representantes">
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {representantes.map((r) => (
            <li key={r.id}>
              <Link href={`/comissoes/representantes/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                <div>
                  <div className="font-medium">
                    {r.nome} {!r.ativo && <Selo>inativo</Selo>}
                  </div>
                  <div className="text-xs text-muted">{descreverFaixas(r.faixas)}</div>
                </div>
                <span className="text-sm text-accent">editar</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Para ligar um cliente a um representante, abra o cliente e escolha &quot;Indicado pelo representante&quot;. Os pedidos dele já vêm com a
          comissão marcada.
        </p>
      </Secao>
    </>
  );
}
