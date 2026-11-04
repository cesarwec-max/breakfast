import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { descreverFaixas, limitesMes, mesValido, nomeMes, obterRepresentante, resumoComissao, somarMes } from "@/lib/comissoes";
import { brl, dataBR, diaSP, hoje } from "@/lib/formato";
import { Confirmar, Enviar } from "@/components/botoes";
import { Aviso, Cartao, Numero, Secao, Selo, Titulo, Vazio, cls } from "@/components/ui";
import { fecharMes, reabrirMes } from "../actions";

export const metadata: Metadata = { title: "Comissão" };

const pct = (n: number) => `${String(n).replace(".", ",")}%`;
const STATUS: Record<string, string> = { pendente: "pendente", em_rota: "em rota", entregue: "entregue" };

export default async function ComissaoRepresentante({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string; fechado?: string; reaberto?: string; erro?: string }>;
}) {
  await exigirLogin();
  const id = Number((await params).id);
  const sp = await searchParams;
  const r = Number.isInteger(id) ? await obterRepresentante(id) : null;
  if (!r) notFound();
  const dia = hoje();
  const mes = mesValido(sp.mes) ? sp.mes! : dia.slice(0, 7);
  const c = await resumoComissao(r, mes);
  const { fim } = limitesMes(mes);
  const mesTerminou = fim < dia;
  const vencimentoSugerido = `${somarMes(mes, 1)}-10`;

  return (
    <>
      <Titulo
        titulo={`${r.nome} · ${nomeMes(mes)}`}
        subtitulo={descreverFaixas(r.faixas)}
        voltar={{ href: `/comissoes?mes=${mes}`, rotulo: "Comissões" }}
      >
        <Link href={`/comissoes/${id}/relatorio?mes=${mes}`} className={cls.botao}>
          📄 Relatório de produção
        </Link>
      </Titulo>

      {sp.fechado && <Aviso tom="ok">Mês fechado. {c.fechado?.conta_pagar_id ? "A comissão entrou em Contas a pagar." : ""}</Aviso>}
      {sp.reaberto && <Aviso tom="ok">Mês reaberto: a comissão volta a ser calculada com os pedidos de agora.</Aviso>}
      {sp.erro === "pago" && <Aviso>Esta comissão já foi marcada como paga em Contas a pagar. Desmarque o pagamento antes de reabrir o mês.</Aviso>}

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/comissoes/${id}?mes=${somarMes(mes, -1)}`} className={cls.botaoPequeno}>
          ← mês anterior
        </Link>
        {c.fechado ? <Selo tom="ok">Fechado em {dataBR(diaSP(c.fechado.fechado_em))}</Selo> : <Selo tom="aviso">Em aberto</Selo>}
        <Link href={`/comissoes/${id}?mes=${somarMes(mes, 1)}`} className={cls.botaoPequeno}>
          próximo mês →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Numero rotulo="Vendas no mês" valor={brl(c.total)} detalhe={`${c.pedidos.length} pedido(s)`} />
        <Numero rotulo="Percentual" valor={pct(c.percentual)} detalhe={c.proxima ? `${pct(c.proxima.percentual)} a partir de ${brl(c.proxima.a_partir_de)}` : undefined} />
        <Numero rotulo="Comissão" valor={brl(c.valor)} tom="destaque" />
      </div>
      {c.proxima && (
        <p className="mt-2 text-sm text-muted">
          Faltam <strong>{brl(c.proxima.falta)}</strong> em vendas neste mês para a comissão subir para {pct(c.proxima.percentual)}.
        </p>
      )}

      <Secao titulo="Pedidos do mês (pela data de entrega)">
        {c.pedidos.length === 0 ? (
          <Vazio>Nenhum pedido deste representante com entrega em {nomeMes(mes)}.</Vazio>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">Entrega</th>
                  <th className="px-4 py-2 font-semibold">Cliente</th>
                  <th className="px-4 py-2 text-right font-semibold">Valor</th>
                  <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {c.pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-background">
                    <td className="tabular px-4 py-2.5">{dataBR(p.data_entrega)}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/pedidos/${p.id}`} className="hover:text-accent">
                        {p.cliente} <span className="text-xs text-muted">#{p.id}</span>
                      </Link>
                      {!c.fechado && p.status !== "entregue" && (
                        <span className="ml-2">
                          <Selo tom="aviso">{STATUS[p.status] ?? p.status}</Selo>
                        </span>
                      )}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">{brl(p.total)}</td>
                    <td className="tabular hidden px-4 py-2.5 text-right text-muted sm:table-cell">{brl((p.total * c.percentual) / 100)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line font-semibold">
                <tr>
                  <td colSpan={2} className="px-4 py-2.5">
                    Total
                  </td>
                  <td className="tabular px-4 py-2.5 text-right">{brl(c.total)}</td>
                  <td className="tabular hidden px-4 py-2.5 text-right text-accent sm:table-cell">{brl(c.valor)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Secao>

      <Secao titulo={c.fechado ? "Mês fechado" : "Fechar o mês"}>
        <Cartao>
          {c.fechado ? (
            <div className="space-y-3 text-sm">
              <p>
                Comissão de <strong>{brl(c.valor)}</strong> gravada em {dataBR(diaSP(c.fechado.fechado_em))}. Mudanças nos pedidos depois disso não
                alteram este mês.
              </p>
              {c.fechado.conta_pagar_id && (
                <p>
                  Lançada em{" "}
                  <Link href="/pagar?filtro=todos" className={cls.link}>
                    Contas a pagar
                  </Link>{" "}
                  como &quot;Comissão {r.nome}&quot;.
                </p>
              )}
              <form action={reabrirMes.bind(null, id, mes)}>
                <Confirmar
                  mensagem={`Reabrir ${nomeMes(mes)} de ${r.nome}? A comissão volta a ser calculada com os pedidos de agora${c.fechado.conta_pagar_id ? " e a conta em A pagar é retirada" : ""}.`}
                  className={cls.botao2}
                >
                  Reabrir mês
                </Confirmar>
              </form>
            </div>
          ) : (
            <form action={fecharMes.bind(null, id, mes)} className="space-y-4">
              <p className="text-sm text-muted">
                Fechar grava as vendas, o percentual e a comissão como estão agora. Depois você envia o relatório de produção para {r.nome}.
              </p>
              {!mesTerminou && <Aviso tom="aviso">{nomeMes(mes)} ainda não terminou. O normal é fechar no começo do mês seguinte.</Aviso>}
              {c.aEntregar > 0 && (
                <Aviso tom="aviso">
                  {c.aEntregar} pedido(s) deste mês ainda não foram marcados como entregues. Eles entram no fechamento assim mesmo.
                </Aviso>
              )}
              {c.valor > 0 && (
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex items-center gap-2 pb-3 text-sm">
                    <input type="checkbox" name="lancar" defaultChecked className="size-4 accent-accent" />
                    Lançar {brl(c.valor)} em Contas a pagar, com vencimento em
                  </label>
                  <div className="w-44">
                    <input type="date" name="vencimento" defaultValue={vencimentoSugerido} className={cls.input} aria-label="Vencimento" />
                  </div>
                </div>
              )}
              <Enviar>Fechar {nomeMes(mes)}</Enviar>
            </form>
          )}
        </Cartao>
      </Secao>
    </>
  );
}
