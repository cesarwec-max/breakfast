import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { aEntregar, listarAnexos, obterPedido } from "@/lib/dados";
import { anexosTela } from "@/lib/anexos";
import { Anexos } from "@/components/anexos";
import { brl, dataBR, qtd } from "@/lib/formato";
import { Confirmar, Enviar } from "@/components/botoes";
import { Aviso, Cartao, Secao, Selo, Titulo, cls } from "@/components/ui";
import { cancelarPedido, excluirPedido, marcarEmRota, marcarEntregue, reabrirPedido } from "../actions";
import { SeloEntrega } from "../selo";

export const metadata: Metadata = { title: "Pedido" };

export default async function PedidoPagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string; salvo?: string }>;
}) {
  await exigirLogin();
  const id = Number((await params).id);
  const { novo, salvo } = await searchParams;
  const p = Number.isInteger(id) ? await obterPedido(id) : null;
  if (!p) notFound();
  const anexos = anexosTela(await listarAnexos({ pedidoId: id }));

  return (
    <>
      <Titulo titulo={`Pedido #${p.id}`} voltar={{ href: "/pedidos", rotulo: "Pedidos" }}>
        {aEntregar(p.status) && (
          <Link href={`/pedidos/${id}/editar`} className={cls.botao2}>
            Editar
          </Link>
        )}
      </Titulo>
      {novo && <Aviso tom="ok">Pedido salvo.</Aviso>}
      {salvo && <Aviso tom="ok">Alterações salvas.</Aviso>}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Cartao>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={`/clientes/${p.cliente_id}`} className="text-lg font-semibold hover:text-accent">
                {p.cliente}
              </Link>
              <p className="text-sm text-muted">📍 {p.endereco || "Sem endereço cadastrado"}</p>
            </div>
            <div className="text-right">
              <SeloEntrega pedido={p} />
              <div className="mt-1 text-sm text-muted">Entrega: {dataBR(p.data_entrega)}</div>
            </div>
          </div>

          <table className="mt-4 w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 font-semibold">Produto</th>
                <th className="py-2 text-right font-semibold">Qtd</th>
                <th className="hidden py-2 text-right font-semibold sm:table-cell">Unit.</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {p.itens.map((i, n) => (
                <tr key={n}>
                  <td className="py-2">
                    {i.produto}
                    {i.sabor && <span className="block text-xs text-accent">{i.sabor}</span>}
                  </td>
                  <td className="tabular py-2 text-right">
                    {qtd(i.quantidade)} <span className="text-muted">{i.unidade}</span>
                  </td>
                  <td className="tabular hidden py-2 text-right text-muted sm:table-cell">{brl(i.preco_unitario)}</td>
                  <td className="tabular py-2 text-right">{brl(i.quantidade * i.preco_unitario)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line">
                <td colSpan={3} className="hidden py-2 text-right font-semibold sm:table-cell">
                  Total
                </td>
                <td colSpan={2} className="py-2 text-right font-semibold sm:hidden">
                  Total
                </td>
                <td className="tabular py-2 text-right text-base font-bold">{brl(p.total)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">
            💳 Pagamento: <strong>{p.forma_pagamento || "não informado"}</strong>
            {p.vencimento_pagamento && <> · até {dataBR(p.vencimento_pagamento)}</>}
            {/pix/i.test(p.forma_pagamento) && <span className="text-muted"> · chave breakfastpix@gmail.com</span>}
          </p>
          {p.observacao && <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">📝 {p.observacao}</p>}
        </Cartao>

        <div className="space-y-3">
          {p.status === "pendente" && (
            <form action={marcarEmRota.bind(null, id, undefined)}>
              <Enviar className={`${cls.botao2} w-full`} pendente="Registrando…">
                🚚 Saiu para entrega
              </Enviar>
            </form>
          )}
          {aEntregar(p.status) && (
            <form action={marcarEntregue.bind(null, id, undefined)}>
              <Enviar className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ok px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50" pendente="Registrando…">
                ✓ Marcar como entregue
              </Enviar>
              <p className="mt-1 text-xs text-muted">Os itens já saíram do estoque quando o pedido foi lançado.</p>
            </form>
          )}
          <Cartao className="space-y-2">
            <div className="text-sm font-semibold">Documentos</div>
            <Link href={`/pedidos/${id}/ordem`} className={`${cls.botao} w-full`}>
              📄 Gerar ordem de pedido
            </Link>
            <Link href={`/financeiro/nf/nova?pedido=${id}`} className={`${cls.botao2} w-full`}>
              Solicitar nota fiscal
            </Link>
            <Link href={`/financeiro/boleto/novo?pedido=${id}`} className={`${cls.botao2} w-full`}>
              Solicitar boleto
            </Link>
          </Cartao>
          <div className="flex flex-wrap gap-2 pt-2">
            {p.status !== "pendente" && (
              <form action={reabrirPedido.bind(null, id)}>
                <Confirmar
                  mensagem={
                    p.status === "cancelado"
                      ? "Reabrir este pedido? Os itens saem do estoque de novo."
                      : "Voltar este pedido para pendente?"
                  }
                  className={cls.botaoPequeno}
                >
                  Voltar para pendente
                </Confirmar>
              </form>
            )}
            {p.status !== "cancelado" && (
              <form action={cancelarPedido.bind(null, id)}>
                <Confirmar mensagem="Cancelar este pedido? Os itens voltam para o estoque." className={cls.botaoPequeno}>
                  Cancelar pedido
                </Confirmar>
              </form>
            )}
            <form action={excluirPedido.bind(null, id)}>
              <Confirmar mensagem="Excluir este pedido de vez? Os itens voltam para o estoque." className={`${cls.botaoPequeno} text-danger`}>
                Excluir
              </Confirmar>
            </form>
          </div>
          {p.status === "cancelado" && <Selo>Cancelado</Selo>}
        </div>
      </div>

      <Secao titulo="Nota fiscal e boleto emitidos">
        <p className="-mt-2 mb-3 text-sm text-muted">
          Anexe aqui os arquivos que o financeiro devolver. Eles também aparecem em Contas a receber e na ficha do cliente.
        </p>
        <Anexos anexos={anexos} alvo={{ pedidoId: id }} />
      </Secao>
    </>
  );
}
