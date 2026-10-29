import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listarAnexosPagar, listarContasPagar, totaisContas, type FiltroConta } from "@/lib/dados";
import { anexosTela } from "@/lib/anexos";
import { hoje, somarDias } from "@/lib/formato";
import { Enviar } from "@/components/botoes";
import { ContasTopo, SomaLista } from "@/components/contas-topo";
import { ListaContas } from "@/components/lista-contas";
import { ParcelasEditor } from "@/components/parcelas-editor";
import { Abas, Aviso, Campo, Cartao, Secao, Titulo, cls } from "@/components/ui";
import { lancarPagar } from "../contas-actions";

export const metadata: Metadata = { title: "Contas a pagar" };

const FILTROS: { valor: FiltroConta; rotulo: string }[] = [
  { valor: "abertos", rotulo: "A pagar" },
  { valor: "vencidos", rotulo: "Vencidos" },
  { valor: "pagos", rotulo: "Pagos" },
  { valor: "todos", rotulo: "Todos" },
];

export default async function Pagar({ searchParams }: { searchParams: Promise<{ filtro?: string; lancado?: string; feito?: string; desfeito?: string }> }) {
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
  // Nota e boletos da fábrica: valem para todas as parcelas da mesma compra (lote)
  const brutos = await listarAnexosPagar([...new Set(contas.map((c) => c.lote))]);
  const telas = anexosTela(brutos);
  const anexosDoLote = (lote: number) => telas.filter((_, i) => brutos[i].lote === lote);

  return (
    <>
      <Titulo
        titulo="Contas a pagar"
        subtitulo="Boletos da fábrica e de outros fornecedores. Anexe a nota e os boletos da compra para não depender do papel."
      />
      {sp.lancado && <Aviso tom="ok">{sp.lancado} boleto(s) lançado(s).</Aviso>}

      <ContasTopo tabela="contas_pagar" totais={totais} feito={sp.feito} desfeito={sp.desfeito} voltar={voltar} />

      <Secao titulo="Boletos">
        <Abas atual={filtro} itens={FILTROS.map((f) => ({ ...f, href: `/pagar?filtro=${f.valor}` }))} />
        {filtro === "pagos" && <SomaLista contas={contas} rotulo="pago(s)" />}
        <ListaContas tabela="contas_pagar" voltar={voltar} rotuloPago="Pago" contas={contas.map((c) => ({ ...c, nome: c.fornecedor, anexos: anexosDoLote(c.lote) }))} />
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
