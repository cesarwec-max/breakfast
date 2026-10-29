import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarAnexos, listarContasReceber, totaisContas, type FiltroConta } from "@/lib/dados";
import { anexosTela } from "@/lib/anexos";
import { hoje, somarDias } from "@/lib/formato";
import { opcoesFormulario } from "@/lib/opcoes";
import { Enviar } from "@/components/botoes";
import { ClienteSelect } from "@/components/cliente-select";
import { ContasTopo, SomaLista } from "@/components/contas-topo";
import { ListaContas } from "@/components/lista-contas";
import { ParcelasEditor } from "@/components/parcelas-editor";
import { Abas, Aviso, Campo, Cartao, Secao, Titulo, cls } from "@/components/ui";
import { lancarReceber } from "../contas-actions";

export const metadata: Metadata = { title: "Contas a receber" };

const FILTROS: { valor: FiltroConta; rotulo: string }[] = [
  { valor: "abertos", rotulo: "Em aberto" },
  { valor: "vencidos", rotulo: "Vencidos" },
  { valor: "pagos", rotulo: "Recebidos" },
  { valor: "todos", rotulo: "Todos" },
];

export default async function Receber({ searchParams }: { searchParams: Promise<{ filtro?: string; lancado?: string; feito?: string; desfeito?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const filtro = FILTROS.find((f) => f.valor === sp.filtro)?.valor ?? "abertos";
  const dia = hoje();
  const [contas, totais, { clientes }] = await Promise.all([
    listarContasReceber(filtro, dia),
    totaisContas("contas_receber", dia, somarDias(dia, 7)),
    opcoesFormulario(),
  ]);
  const voltar = `/receber?filtro=${filtro}`;
  // Notas e boletos anexados: do pedido de origem ou da própria conta
  const brutos = await listarAnexos({
    contaIds: contas.map((c) => c.id),
    pedidoIds: contas.map((c) => c.pedido_id).filter((x): x is number => !!x),
  });
  const telas = anexosTela(brutos);
  const anexosDa = (contaId: number, pedidoId: number | null) =>
    telas.filter((_, i) => brutos[i].conta_receber_id === contaId || (!!pedidoId && brutos[i].pedido_id === pedidoId));

  return (
    <>
      <Titulo titulo="Contas a receber" subtitulo="Boletos dos clientes. Os gerados no Financeiro entram aqui sozinhos.">
        <Link href="/receber/jpg" className={cls.botao2}>
          🖼️ JPG de pendentes
        </Link>
      </Titulo>
      {sp.lancado && <Aviso tom="ok">{sp.lancado} boleto(s) lançado(s).</Aviso>}

      <ContasTopo tabela="contas_receber" totais={totais} feito={sp.feito} desfeito={sp.desfeito} voltar={voltar} />

      <Secao titulo="Boletos">
        <Abas atual={filtro} itens={FILTROS.map((f) => ({ ...f, href: `/receber?filtro=${f.valor}` }))} />
        {filtro === "pagos" && <SomaLista contas={contas} rotulo="recebido(s)" />}
        <ListaContas
          tabela="contas_receber"
          voltar={voltar}
          rotuloPago="Recebido"
          contas={contas.map((c) => ({ ...c, nome: c.cliente, href: `/clientes/${c.cliente_id}`, anexos: anexosDa(c.id, c.pedido_id) }))}
        />
      </Secao>

      <Secao titulo="Lançar boleto manualmente">
        <Cartao>
          <form action={lancarReceber} className="space-y-4">
            <ClienteSelect clientes={clientes} voltar="/receber" modo="fiscal" />
            <ParcelasEditor primeiroVencimento={somarDias(dia, 30)} />
            <Campo rotulo="Descrição (opcional)">
              <input name="descricao" className={cls.input} placeholder="Ex.: NF 1234" />
            </Campo>
            <Enviar>Lançar</Enviar>
          </form>
        </Cartao>
      </Secao>
    </>
  );
}
