import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { listarPedidos } from "@/lib/dados";
import { hoje } from "@/lib/formato";

// Sempre feita na hora (data de hoje e pedidos atuais), nunca guardada em cache.
export const dynamic = "force-dynamic";
import { EquipeJPG } from "@/components/equipe-jpg";
import type { PedidoFolha } from "@/components/folha-pedidos";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "JPG para a equipe" };

export default async function EquipePagina() {
  await exigirLogin();
  const pedidos = await listarPedidos({ status: "pendente" });
  const folha: PedidoFolha[] = pedidos.map((p) => ({
    id: p.id,
    cliente: p.cliente,
    endereco: p.endereco,
    data_entrega: p.data_entrega,
    status: p.status === "em_rota" ? "em_rota" : "pendente",
    observacao: p.observacao,
    itens: p.itens.map((i) => ({
      produto_id: i.produto_id,
      produto: i.produto,
      sabor: i.sabor,
      unidade: i.unidade,
      quantidade: i.quantidade,
      tem_foto: i.tem_foto,
    })),
  }));

  return (
    <>
      <Titulo
        titulo="JPG para a equipe"
        subtitulo={`${folha.length} pedido(s) a entregar. A imagem é feita com os pedidos pendentes e em rota.`}
        voltar={{ href: "/pedidos", rotulo: "Pedidos" }}
      />
      {folha.length === 0 ? <Vazio>Nenhum pedido a entregar no momento.</Vazio> : <EquipeJPG pedidos={folha} hoje={hoje()} />}
    </>
  );
}
