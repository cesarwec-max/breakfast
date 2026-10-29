import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { obterCliente, obterPedido } from "@/lib/dados";
import { hoje } from "@/lib/formato";
import { OrdemJPG } from "@/components/ordem-jpg";
import { Aviso, Titulo, cls } from "@/components/ui";

export const metadata: Metadata = { title: "Ordem de pedido" };

export default async function OrdemPagina({ params }: { params: Promise<{ id: string }> }) {
  await exigirLogin();
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await obterPedido(id) : null;
  if (!p) notFound();
  const cliente = await obterCliente(p.cliente_id);
  if (!cliente) notFound();

  return (
    <>
      <Titulo titulo={`Ordem de pedido nº ${id}`} subtitulo={p.cliente} voltar={{ href: `/pedidos/${id}`, rotulo: "Pedido" }}>
        <Link href={`/pedidos/${id}/editar`} className={cls.botao2}>
          Mudar forma de pagamento
        </Link>
      </Titulo>
      {!p.forma_pagamento && (
        <Aviso tom="aviso">
          Este pedido não tem forma de pagamento. Edite o pedido para escolher (ex.: PIX) antes de enviar ao cliente.
        </Aviso>
      )}
      <div className="mx-auto max-w-3xl">
        <OrdemJPG
          dados={{
            id: p.id,
            emitidaEm: hoje(),
            cliente,
            dataEntrega: p.data_entrega,
            itens: p.itens.map((i) => ({ produto: i.produto, sabor: i.sabor, unidade: i.unidade, quantidade: i.quantidade, preco_unitario: i.preco_unitario })),
            total: p.total,
            formaPagamento: p.forma_pagamento,
            vencimentoPagamento: p.vencimento_pagamento,
            observacao: p.observacao,
          }}
        />
      </div>
    </>
  );
}
