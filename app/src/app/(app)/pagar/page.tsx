import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listarContasPagar, totaisContas, type FiltroConta } from "@/lib/dados";
import { brl, hoje, somarDias } from "@/lib/formato";
import { Enviar } from "@/components/botoes";
import { ListaContas } from "@/components/lista-contas";
import { ParcelasEditor } from "@/components/parcelas-editor";
import { Abas, Aviso, Campo, Cartao, Numero, Secao, Titulo, cls } from "@/components/ui";
import { lancarPagar } from "../contas-actions";

export const metadata: Metadata = { title: "Contas a pagar" };

const FILTROS: { valor: FiltroConta; rotulo: string }[] = [
  { valor: "abertos", rotulo: "A pagar" },
  { valor: "vencidos", rotulo: "Vencidos" },
  { valor: "pagos", rotulo: "Pagos" },
  { valor: "todos", rotulo: "Todos" },
];

export default async function Pagar({ searchParams }: { searchParams: Promise<{ filtro?: string; lancado?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const filtro = FILTROS.find((f) => f.valor === sp.filtro)?.valor ?? "abertos";
  const dia = hoje();
  const [contas, totais, fornecedores] = await Promise.all([
    listarContasPagar(filtro, dia),
    totaisContas("contas_pagar", dia, somarDias(dia, 7)),
    sql<{ fornecedor: string }[]>`SELECT DISTINCT fornecedor FROM contas_pagar ORDER BY fornecedor`,
  ]);
  const voltar = `/pagar?filtro=${filtro}`;

  return (
    <>
      <Titulo titulo="Contas a pagar" subtitulo="Boletos da fábrica e de outros fornecedores." />
      {sp.lancado && <Aviso tom="ok">{sp.lancado} boleto(s) lançado(s).</Aviso>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="Total pendente de pagamento" valor={brl(totais.aberto)} detalhe={`${totais.qtd_aberto} boleto(s) em aberto`} tom="destaque" />
        <Numero
          rotulo="Vencidos"
          valor={brl(totais.vencido)}
          detalhe={`${totais.qtd_vencido} boleto(s)`}
          tom={totais.vencido > 0 ? "perigo" : "neutro"}
          href="/pagar?filtro=vencidos"
        />
        <Numero rotulo="Vencem nos próximos 7 dias" valor={brl(totais.proximos7)} />
      </div>

      <Secao titulo="Boletos">
        <Abas atual={filtro} itens={FILTROS.map((f) => ({ ...f, href: `/pagar?filtro=${f.valor}` }))} />
        <ListaContas tabela="contas_pagar" voltar={voltar} rotuloPago="Pago" contas={contas.map((c) => ({ ...c, nome: c.fornecedor }))} />
      </Secao>

      <Secao titulo="Lançar boletos">
        <Cartao>
          <form action={lancarPagar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Fornecedor">
                <input name="fornecedor" defaultValue="Fábrica" list="fornecedores" className={cls.input} />
                <datalist id="fornecedores">
                  {fornecedores.map((f) => (
                    <option key={f.fornecedor} value={f.fornecedor} />
                  ))}
                </datalist>
              </Campo>
              <Campo rotulo="Descrição (opcional)">
                <input name="descricao" className={cls.input} placeholder="Ex.: NF 5678, compra de outubro" />
              </Campo>
            </div>
            <ParcelasEditor primeiroVencimento={somarDias(dia, 30)} />
            <Enviar>Lançar</Enviar>
          </form>
        </Cartao>
      </Secao>
    </>
  );
}
