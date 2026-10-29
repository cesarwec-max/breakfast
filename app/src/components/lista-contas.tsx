import Link from "next/link";
import { brl, dataBR, diasEntre, hoje, valorCampo } from "@/lib/formato";
import { atualizarConta, desfazerPago, excluirConta, marcarPago } from "@/app/(app)/contas-actions";
import { Confirmar, Enviar } from "./botoes";
import { Selo, Vazio, cls } from "./ui";

export type LinhaConta = {
  id: number;
  nome: string;
  href?: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
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
              </div>
            </div>
            <div className="text-right">
              <div className="tabular font-semibold">{brl(c.valor)}</div>
              <SeloVencimento vencimento={c.vencimento} pago_em={c.pago_em} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {c.pago_em ? (
              <form action={desfazerPago.bind(null, tabela, c.id, voltar)}>
                <Enviar className={cls.botaoPequeno} pendente="…">
                  Desfazer pagamento
                </Enviar>
              </form>
            ) : (
              <form action={marcarPago.bind(null, tabela, c.id, voltar)}>
                <Enviar className={`${cls.botaoPequeno} border-ok/30 text-ok`} pendente="…">
                  ✓ {rotuloPago}
                </Enviar>
              </form>
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
            <form action={excluirConta.bind(null, tabela, c.id, voltar)} className="ml-auto">
              <Confirmar mensagem="Excluir este boleto?" className="text-xs text-muted hover:text-danger">
                excluir
              </Confirmar>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
