import Link from "next/link";
import { brl, dataBR, diasEntre, hoje, valorCampo } from "@/lib/formato";
import { atualizarConta, desfazerPago, excluirConta, marcarPago } from "@/app/(app)/contas-actions";
import { Confirmar, Enviar } from "./botoes";
import { Anexos, type AnexoTela } from "./anexos";
import { Selo, Vazio, cls } from "./ui";

export type LinhaConta = {
  id: number;
  nome: string;
  href?: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  pedido_id?: number | null;
  /** Notas e boletos anexados (em Contas a pagar: os da compra toda). */
  anexos?: AnexoTela[];
  /** Alerta ao lado do vencimento (ex.: falta anexar o boleto). */
  aviso?: string;
  /** Link do WhatsApp com a cobrança pronta (Contas a receber). */
  cobrar?: string;
};

export function SeloVencimento({ vencimento, pago_em }: { vencimento: string; pago_em: string | null }) {
  if (pago_em) return <Selo tom="ok">Pago {dataBR(pago_em)}</Selo>;
  const d = diasEntre(hoje(), vencimento);
  if (d < 0) return <Selo tom="perigo">Vencido há {-d} dia{d === -1 ? "" : "s"}</Selo>;
  if (d === 0) return <Selo tom="destaque">Vence hoje</Selo>;
  if (d <= 7) return <Selo tom="aviso">Vence em {d} dia{d === 1 ? "" : "s"}</Selo>;
  return <Selo>A vencer</Selo>;
}

/** Lista de boletos com "marcar como pago", editar e excluir. */
export function ListaContas({
  tabela,
  contas,
  voltar,
  rotuloPago,
}: {
  tabela: "contas_receber" | "contas_pagar";
  contas: LinhaConta[];
  voltar: string;
  rotuloPago: string;
}) {
  if (contas.length === 0) return <Vazio>Nenhum boleto aqui.</Vazio>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {contas.map((c) => (
        <li key={c.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {c.href ? (
                  <Link href={c.href} className="hover:text-accent">
                    {c.nome}
                  </Link>
                ) : (
                  c.nome
                )}
              </div>
              <div className="text-sm text-muted">
                Vence {dataBR(c.vencimento)}
                {c.descricao && ` · ${c.descricao}`}
                {c.pedido_id && (
                  <>
                    {" · "}
                    <Link href={`/pedidos/${c.pedido_id}`} className={cls.link}>
                      ver pedido
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="tabular font-semibold">{brl(c.valor)}</div>
              <SeloVencimento vencimento={c.vencimento} pago_em={c.pago_em} />
              {c.aviso && (
                <div className="mt-1">
                  <Selo tom="aviso">⚠ {c.aviso}</Selo>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {c.pago_em ? (
              <form action={desfazerPago.bind(null, tabela, c.id, voltar)}>
                <Enviar className={cls.botaoPequeno} pendente="…">
                  ↩ Voltar para em aberto
                </Enviar>
              </form>
            ) : (
              <form action={marcarPago.bind(null, tabela, c.id, voltar)}>
                <Enviar className={`${cls.botaoPequeno} border-ok/30 text-ok`} pendente="…">
                  ✓ {rotuloPago}
                </Enviar>
              </form>
            )}
            {c.cobrar && !c.pago_em && (
              <a href={c.cobrar} target="_blank" rel="noreferrer" className={`${cls.botaoPequeno} border-[#25d366]/40 text-[#128c4a]`}>
                💬 Cobrar no WhatsApp
              </a>
            )}
            <details className="group">
              <summary className={`${cls.botaoPequeno} cursor-pointer list-none`}>Editar</summary>
              <form action={atualizarConta.bind(null, tabela, c.id)} className="mt-2 grid gap-2 rounded-lg border border-line bg-background p-3 sm:grid-cols-3">
                <input type="hidden" name="voltar" value={voltar} />
                <input name="valor" inputMode="decimal" defaultValue={valorCampo(c.valor)} className={cls.input} aria-label="Valor" />
                <input name="vencimento" type="date" defaultValue={c.vencimento} className={cls.input} aria-label="Vencimento" />
                <input name="descricao" defaultValue={c.descricao} placeholder="Descrição" className={cls.input} aria-label="Descrição" />
                <div className="flex gap-2 sm:col-span-3">
                  <Enviar className={cls.botaoPequeno}>Salvar</Enviar>
                </div>
              </form>
            </details>
            {c.anexos && (
              <details className="group order-last open:w-full">
                <summary className={`${cls.botaoPequeno} cursor-pointer list-none`}>📎 Anexar nota/boleto</summary>
                <div className="mt-2">
                  <Anexos
                    anexos={[]}
                    vazio=""
                    alvo={tabela === "contas_receber" ? { contaId: c.id } : { contaPagarId: c.id }}
                    tipoInicial={c.aviso || c.anexos?.some((a) => a.tipo === "nf") ? "boleto" : undefined}
                  />
                </div>
              </details>
            )}
            <form action={excluirConta.bind(null, tabela, c.id, voltar)} className="ml-auto">
              <Confirmar
                mensagem={
                  tabela === "contas_pagar" && c.anexos?.length
                    ? "Excluir este boleto? Se for a única parcela desta compra, os documentos anexados também serão apagados."
                    : "Excluir este boleto?"
                }
                className="text-xs text-muted hover:text-danger"
              >
                excluir
              </Confirmar>
            </form>
          </div>
          {c.anexos && c.anexos.length > 0 && (
            <div className="mt-2">
              <Anexos anexos={c.anexos} compacto />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
