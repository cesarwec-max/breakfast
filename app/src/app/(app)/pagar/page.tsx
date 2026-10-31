import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CompraFabrica } from "@/components/compra-fabrica";
import { listarAnexosPagar, listarContasPagar, totaisContas, type FiltroConta } from "@/lib/dados";
import { anexosTela } from "@/lib/anexos";
import { hoje, somarDias } from "@/lib/formato";
import { ContasTopo, SomaLista } from "@/components/contas-topo";
import { ListaContas } from "@/components/lista-contas";
import { Abas, Aviso, Cartao, Secao, Titulo } from "@/components/ui";

export const metadata: Metadata = { title: "Contas a pagar" };

const FILTROS: { valor: FiltroConta; rotulo: string }[] = [
  { valor: "abertos", rotulo: "A pagar" },
  { valor: "vencidos", rotulo: "Vencidos" },
  { valor: "pagos", rotulo: "Pagos" },
  { valor: "todos", rotulo: "Todos" },
];

export default async function Pagar({ searchParams }: { searchParams: Promise<{ filtro?: string; lancado?: string; anexos?: string; feito?: string; desfeito?: string }> }) {
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
  // A nota vale para a compra inteira (lote); cada boleto fica preso à sua parcela.
  const brutos = await listarAnexosPagar([...new Set(contas.map((c) => c.lote))]);
  const telas = anexosTela(brutos);
  const linha = (c: (typeof contas)[number]) => {
    const doLote = telas.map((t, i) => ({ t, b: brutos[i] })).filter((x) => x.b.lote === c.lote);
    const meus = doLote.filter((x) => x.b.tipo === "boleto" && x.b.conta_pagar_id === c.id);
    const boletosLote = doLote.filter((x) => x.b.tipo === "boleto").length;
    // Falta o boleto se esta parcela não tem o seu e a compra tem menos boletos que parcelas
    const faltaBoleto = !c.pago_em && meus.length === 0 && boletosLote < c.parcelas_lote;
    // Mostra o boleto desta parcela + nota e outros da compra. Os boletos das outras parcelas só aparecem
    // em compras antigas, em que todos os boletos foram anexados juntos numa parcela só.
    const juntos = meus.length === 0 && boletosLote >= c.parcelas_lote;
    const ordem = [...meus, ...doLote.filter((x) => x.b.tipo !== "boleto" || (juntos && !meus.includes(x)))].map((x) => x.t);
    return { ...c, nome: c.fornecedor, anexos: ordem, aviso: faltaBoleto ? "Falta anexar o boleto" : undefined };
  };
  const faltando = contas.filter((c) => linha(c).aviso).length;

  return (
    <>
      <Titulo
        titulo="Contas a pagar"
        subtitulo="Boletos da fábrica e de outros fornecedores. Anexe a nota e os boletos da compra para não depender do papel."
      />
      {sp.lancado && (
        <Aviso tom="ok">
          {sp.lancado} boleto(s) lançado(s){Number(sp.anexos) > 0 ? ` e ${sp.anexos} arquivo(s) anexado(s)` : ""}.
        </Aviso>
      )}
      {faltando > 0 && (
        <Aviso tom="aviso">
          {faltando} boleto(s) em aberto sem o arquivo anexado. Use &quot;📎 Anexar nota/boleto&quot; no boleto marcado.
        </Aviso>
      )}

      <ContasTopo tabela="contas_pagar" totais={totais} feito={sp.feito} desfeito={sp.desfeito} voltar={voltar} />

      <Secao titulo="Boletos">
        <Abas atual={filtro} itens={FILTROS.map((f) => ({ ...f, href: `/pagar?filtro=${f.valor}` }))} />
        {filtro === "pagos" && <SomaLista contas={contas} rotulo="pago(s)" />}
        <ListaContas tabela="contas_pagar" voltar={voltar} rotuloPago="Pago" contas={contas.map(linha)} />
      </Secao>

      <Secao titulo="Lançar compra (nota + boletos)">
        <Cartao>
          <CompraFabrica fornecedores={fornecedores.map((f) => f.fornecedor)} primeiroVencimento={somarDias(dia, 30)} />
        </Cartao>
      </Secao>
    </>
  );
}
