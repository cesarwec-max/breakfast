import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { acabando, listarProdutos } from "@/lib/dados";
import { ListaCompra } from "@/components/lista-compra";
import { Titulo } from "@/components/ui";

export const metadata: Metadata = { title: "Lista de compra" };

export default async function Compra() {
  await exigirLogin();
  const produtos = await listarProdutos();
  // Sugestão: o suficiente para ficar com o dobro do mínimo (ou o mínimo, se o saldo estiver negativo)
  const itens = produtos
    .map((p) => {
      const baixo = acabando(p);
      const sugestao = baixo && p.estoque_minimo > 0 ? Math.max(0, Math.ceil(p.estoque_minimo * 2 - p.saldo)) : baixo ? Math.max(0, Math.ceil(-p.saldo)) : 0;
      return { id: p.id, nome: p.nome, sabor: p.sabor, unidade: p.unidade, saldo: p.saldo, minimo: p.estoque_minimo, baixo, sugestao };
    })
    .sort((a, b) => Number(b.baixo) - Number(a.baixo));

  return (
    <>
      <Titulo
        titulo="Lista de compra"
        subtitulo="Produtos acabando aparecem primeiro, já com uma quantidade sugerida (o dobro do mínimo). Ajuste e envie para a fábrica."
        voltar={{ href: "/estoque", rotulo: "Estoque" }}
      />
      <ListaCompra itens={itens} />
    </>
  );
}
