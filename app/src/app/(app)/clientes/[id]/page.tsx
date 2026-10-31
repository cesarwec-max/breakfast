import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { listarAnexos, listarContasReceber, listarPedidos, obterCliente } from "@/lib/dados";
import { anexosTela } from "@/lib/anexos";
import { linkCobranca } from "@/lib/cobranca";
import { SeloVencimento } from "@/components/lista-contas";
import { Anexos } from "@/components/anexos";
import { brl, dataBR, hoje } from "@/lib/formato";
import { ClienteForm } from "@/components/cliente-form";
import { Confirmar } from "@/components/botoes";
import { Aviso, Secao, Selo, Titulo, cls } from "@/components/ui";
import { atualizarCliente, excluirCliente } from "../actions";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientePagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  await exigirLogin();
  const id = Number((await params).id);
  const { salvo, erro } = await searchParams;
  const cliente = Number.isInteger(id) ? await obterCliente(id) : null;
  if (!cliente) notFound();

  const dia = hoje();
  const [pedidos, contas, anexosBrutos] = await Promise.all([
    listarPedidos({ clienteId: id, limite: 10 }),
    listarContasReceber("abertos", dia, id),
    listarAnexos({ clienteId: id }),
  ]);
  const anexos = anexosTela(anexosBrutos);
  const emAberto = contas.reduce((s, c) => s + c.valor, 0);

  return (
    <>
      <Titulo titulo={cliente.nome} subtitulo={cliente.razao_social || undefined} voltar={{ href: "/clientes", rotulo: "Clientes" }}>
        <Link href={`/pedidos/novo?cliente=${id}`} className={cls.botao}>
          Novo pedido
        </Link>
        <Link href={`/financeiro/nf/nova?cliente=${id}`} className={cls.botao2}>
          Solicitar NF
        </Link>
        <Link href={`/financeiro/boleto/novo?cliente=${id}`} className={cls.botao2}>
          Solicitar boleto
        </Link>
      </Titulo>

      {salvo && <Aviso tom="ok">Cliente salvo.</Aviso>}
      {erro === "em-uso" && (
        <Aviso>Este cliente tem pedidos, solicitações ou contas registradas e não pode ser excluído.</Aviso>
      )}

      <ClienteForm key={JSON.stringify(cliente)} acao={atualizarCliente.bind(null, id)} inicial={cliente} />

      <Secao titulo={`Notas e boletos emitidos (${anexos.length})`}>
        <Anexos anexos={anexos} vazio="Nenhum documento anexado. Anexe a nota e o boleto na página do pedido." />
      </Secao>

      <Secao titulo="Últimos pedidos">
        {pedidos.length === 0 ? (
          <p className="text-sm text-muted">Nenhum pedido.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-background">
                  <span>
                    #{p.id} · entrega {dataBR(p.data_entrega)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular">{brl(p.total)}</span>
                    <Selo tom={p.status === "entregue" ? "ok" : p.status === "cancelado" ? "neutro" : "aviso"}>
                      {{ pendente: "pendente", em_rota: "em rota", entregue: "entregue", cancelado: "cancelado" }[p.status]}
                    </Selo>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao
        titulo={`Contas a receber em aberto: ${brl(emAberto)}`}
        acao={
          contas.length > 0 && (
            <a href={linkCobranca({ ...cliente, cliente: cliente.nome }, contas, dia)} target="_blank" rel="noreferrer" className={cls.botaoPequeno}>
              💬 Cobrar {contas.length > 1 ? "tudo " : ""}no WhatsApp
            </a>
          )
        }
      >
        {contas.length === 0 ? (
          <p className="text-sm text-muted">Nada em aberto.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {contas.map((c) => (
              <li key={c.id} className="flex justify-between px-4 py-2.5">
                <span>
                  Vence {dataBR(c.vencimento)} <SeloVencimento vencimento={c.vencimento} pago_em={null} />
                </span>
                <span className="tabular">{brl(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <form action={excluirCliente.bind(null, id)} className="mt-10 border-t border-line pt-6">
        <Confirmar mensagem={`Excluir o cliente "${cliente.nome}"?`}>Excluir cliente</Confirmar>
      </form>
    </>
  );
}
