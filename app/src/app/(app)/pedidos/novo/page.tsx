import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { hoje } from "@/lib/formato";
import { opcoesFormulario } from "@/lib/opcoes";
import { PedidoForm } from "@/components/pedido-form";
import { Titulo } from "@/components/ui";
import { criarPedido } from "../actions";

export const metadata: Metadata = { title: "Novo pedido" };

export default async function NovoPedido({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await exigirLogin();
  const { cliente } = await searchParams;
  const { clientes, produtos } = await opcoesFormulario();
  return (
    <>
      <Titulo titulo="Novo pedido" voltar={{ href: "/pedidos", rotulo: "Pedidos" }} />
      <PedidoForm
        acao={criarPedido}
        clientes={clientes}
        produtos={produtos}
        voltar="/pedidos/novo"
        inicial={{ cliente_id: cliente ? Number(cliente) : undefined, data_entrega: hoje() }}
        textoBotao="Salvar pedido"
      />
    </>
  );
}
