import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { listarPedidos } from "@/lib/dados";
import { hoje, somarDias } from "@/lib/formato";
import { EquipeJPG } from "@/components/equipe-jpg";
import type { PedidoFolha } from "@/components/folha-pedidos";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "JPG para a equipe" };

/** Segunda-feira da semana de `dia`. */
function segunda(dia: string) {
  const d = new Date(dia + "T12:00:00Z").getUTCDay(); // 0 = domingo
  return somarDias(dia, d === 0 ? -6 : 1 - d);
}

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
      {folha.length === 0 ? <Vazio>Nenhum pedido a entregar no momento.</Vazio> : <EquipeJPG pedidos={folha} semanaInicial={segunda(hoje())} />}
    </>
  );
}
