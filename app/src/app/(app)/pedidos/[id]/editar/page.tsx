import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { aEntregar, obterPedido } from "@/lib/dados";
import { opcoesFormulario } from "@/lib/opcoes";
import { PedidoForm } from "@/components/pedido-form";
import { Titulo } from "@/components/ui";
import { atualizarPedido } from "../../actions";

export const metadata: Metadata = { title: "Editar pedido" };

export default async function EditarPedido({ params }: { params: Promise<{ id: string }> }) {
  await exigirLogin();
  const id = Number((await params).id);
  const pedido = Number.isInteger(id) ? await obterPedido(id) : null;
  if (!pedido) notFound();
  if (!aEntregar(pedido.status)) redirect(`/pedidos/${id}`);
  const { clientes, produtos } = await opcoesFormulario();

  // Mantém na lista um produto que foi desativado depois do pedido
  for (const i of pedido.itens) {
    if (!produtos.some((p) => p.id === i.produto_id)) {
      produtos.push({ id: i.produto_id, nome: i.sabor ? `${i.produto} · ${i.sabor}` : i.produto, unidade: i.unidade, preco: i.preco_unitario });
    }
  }

  return (
    <>
      <Titulo titulo={`Editar pedido #${id}`} voltar={{ href: `/pedidos/${id}`, rotulo: "Voltar" }} />
      <PedidoForm
        acao={atualizarPedido.bind(null, id)}
        clientes={clientes}
        produtos={produtos}
        voltar={`/pedidos/${id}/editar`}
        inicial={pedido}
        textoBotao="Salvar alterações"
      />
    </>
  );
}
