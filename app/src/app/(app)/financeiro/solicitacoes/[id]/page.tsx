import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { obterSolicitacao, type DadosBoleto, type DadosNF } from "@/lib/dados";
import { diaSP } from "@/lib/formato";
import { Confirmar } from "@/components/botoes";
import { GerarArquivo } from "@/components/gerar-arquivo";
import { Aviso, Titulo, cls } from "@/components/ui";
import { excluirSolicitacao } from "../../actions";

export const metadata: Metadata = { title: "Solicitação" };

export default async function SolicitacaoPagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lancado?: string }>;
}) {
  await exigirLogin();
  const id = Number((await params).id);
  const { lancado } = await searchParams;
  const s = Number.isInteger(id) ? await obterSolicitacao(id) : null;
  if (!s) notFound();
  const criadoEm = diaSP(s.criado_em);
  const nf = s.tipo === "nf";

  return (
    <>
      <Titulo
        titulo={nf ? `Solicitação de NF nº ${id}` : `Solicitação de boleto nº ${id}`}
        subtitulo={s.cliente}
        voltar={{ href: "/financeiro", rotulo: "Financeiro" }}
      >
        {nf ? (
          <Link href={`/financeiro/boleto/novo?${s.pedido_id ? `pedido=${s.pedido_id}` : `cliente=${s.cliente_id}`}`} className={cls.botao2}>
            Agora o boleto →
          </Link>
        ) : (
          <Link href="/receber" className={cls.botao2}>
            Ver contas a receber
          </Link>
        )}
      </Titulo>
      {lancado && <Aviso tom="ok">Boletos lançados em Contas a receber.</Aviso>}

      <div className="mx-auto max-w-3xl">
        {nf ? (
          <GerarArquivo tipo="nf" id={id} data={criadoEm} dados={s.dados as DadosNF} />
        ) : (
          <GerarArquivo tipo="boleto" id={id} data={criadoEm} dados={s.dados as DadosBoleto} />
        )}
        <form action={excluirSolicitacao.bind(null, id)} className="mt-8 border-t border-line pt-6">
          <Confirmar mensagem="Excluir esta solicitação? (Contas a receber já lançadas continuam.)" className={cls.botaoPequeno}>
            Excluir solicitação
          </Confirmar>
        </form>
      </div>
    </>
  );
}
