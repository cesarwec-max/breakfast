import { desfazerPago } from "@/app/(app)/contas-actions";
import { resumoConta, type Totais } from "@/lib/dados";
import { brl, hoje } from "@/lib/formato";
import { Enviar } from "./botoes";
import { Aviso, Numero, cls } from "./ui";

type Tabela = "contas_receber" | "contas_pagar";

const TEXTOS = {
  contas_receber: { aberto: "Total previsto para receber", mes: "Recebido em", feito: "marcado como recebido", aba: "Recebidos", base: "/receber" },
  contas_pagar: { aberto: "Total pendente de pagamento", mes: "Pago em", feito: "marcado como pago", aba: "Pagos", base: "/pagar" },
};

/** Aviso depois de marcar/desfazer um pagamento + quadros com os totais. */
export async function ContasTopo({
  tabela,
  totais,
  feito,
  desfeito,
  voltar,
}: {
  tabela: Tabela;
  totais: Totais;
  feito?: string;
  desfeito?: string;
  voltar: string;
}) {
  const t = TEXTOS[tabela];
  const conta = feito ? await resumoConta(tabela, Number(feito)) : null;
  const voltou = desfeito ? await resumoConta(tabela, Number(desfeito)) : null;
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(hoje() + "T12:00:00Z"));

  return (
    <>
      {conta?.pago_em && (
        <Aviso tom="ok">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Boleto de <strong>{conta.nome}</strong> ({brl(conta.valor)}) {t.feito}. Ele está na aba <strong>{t.aba}</strong>.
            </span>
            <form action={desfazerPago.bind(null, tabela, Number(feito), voltar)}>
              <Enviar className={cls.botaoPequeno} pendente="…">
                ↩ Desfazer
              </Enviar>
            </form>
          </div>
        </Aviso>
      )}
      {voltou && !voltou.pago_em && (
        <Aviso tom="destaque">
          Boleto de <strong>{voltou.nome}</strong> ({brl(voltou.valor)}) voltou para em aberto.
        </Aviso>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo={t.aberto} valor={brl(totais.aberto)} detalhe={`${totais.qtd_aberto} boleto(s) em aberto`} tom="destaque" />
        <Numero
          rotulo="Vencidos"
          valor={brl(totais.vencido)}
          detalhe={`${totais.qtd_vencido} boleto(s)`}
          tom={totais.vencido > 0 ? "perigo" : "neutro"}
          href={`${t.base}?filtro=vencidos`}
        />
        <Numero rotulo="Vencem nos próximos 7 dias" valor={brl(totais.proximos7)} />
        <Numero
          rotulo={`${t.mes} ${mes}`}
          valor={brl(totais.pago_mes)}
          detalhe={`${totais.qtd_pago_mes} boleto(s) · ver todos`}
          tom="ok"
          href={`${t.base}?filtro=pagos`}
        />
      </div>
    </>
  );
}

/** Linha com a soma dos boletos listados (usada na aba de pagos/recebidos). */
export function SomaLista({ contas, rotulo }: { contas: { valor: number }[]; rotulo: string }) {
  if (contas.length === 0) return null;
  const total = contas.reduce((s, c) => s + c.valor, 0);
  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-ok/20 bg-ok-soft px-4 py-2.5 text-sm">
      <span className="text-ok">
        {contas.length} boleto(s) {rotulo}
      </span>
      <span className="tabular font-semibold text-ok">Total: {brl(total)}</span>
    </div>
  );
}
