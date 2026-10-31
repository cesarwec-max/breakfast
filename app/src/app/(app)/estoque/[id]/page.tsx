import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { listarMovimentos, obterProduto, acabando } from "@/lib/dados";
import { qtd, qtdCampo, valorCampo } from "@/lib/formato";
import { Confirmar, Enviar } from "@/components/botoes";
import { FotoProduto } from "@/components/foto-produto";
import { MovimentoForm } from "@/components/movimento-form";
import { ListaMovimentos } from "@/components/movimentos";
import { Aviso, Campo, Cartao, Numero, Secao, Titulo, cls } from "@/components/ui";
import { atualizarProduto, excluirProduto, lancarMovimento } from "../actions";

export const metadata: Metadata = { title: "Produto" };

export default async function ProdutoPagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  await exigirLogin();
  const id = Number((await params).id);
  const { salvo } = await searchParams;
  const produto = Number.isInteger(id) ? await obterProduto(id) : null;
  if (!produto) notFound();
  const movimentos = await listarMovimentos({ produtoId: id, limite: 100 });
  const voltar = `/estoque/${id}`;

  return (
    <>
      <Titulo titulo={produto.nome} subtitulo={produto.sabor || undefined} voltar={{ href: "/estoque", rotulo: "Estoque" }} />
      {salvo && <Aviso tom="ok">Produto salvo.</Aviso>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Numero rotulo="Saldo atual" valor={`${qtd(produto.saldo)} ${produto.unidade}`} tom={produto.saldo <= 0 ? "perigo" : acabando(produto) ? "aviso" : "neutro"}
            detalhe={produto.estoque_minimo > 0 ? `mínimo: ${qtd(produto.estoque_minimo)} ${produto.unidade}` : "sem estoque mínimo definido"}
          />
          <Cartao>
            <h2 className="mb-3 font-semibold">Lançar movimentação</h2>
            <MovimentoForm acao={lancarMovimento} produtos={[]} produtoFixo={id} voltar={voltar} />
          </Cartao>
        </div>
        <Cartao>
          <h2 className="mb-3 font-semibold">Dados do produto</h2>
          <div className="mb-4">
            <FotoProduto id={id} temFoto={produto.tem_foto} />
          </div>
          <form action={atualizarProduto.bind(null, id)} className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Nome *" className="sm:col-span-2">
              <input name="nome" required defaultValue={produto.nome} className={cls.input} />
            </Campo>
            <Campo rotulo="Sabor" className="sm:col-span-2">
              <input name="sabor" defaultValue={produto.sabor} className={cls.input} />
            </Campo>
            <Campo rotulo="Unidade">
              <input name="unidade" defaultValue={produto.unidade} className={cls.input} />
            </Campo>
            <Campo rotulo="Preço de venda (R$)">
              <input name="preco" inputMode="decimal" defaultValue={valorCampo(produto.preco)} className={cls.input} />
            </Campo>
            <Campo rotulo="Estoque mínimo" dica="Ao chegar nele, o produto aparece em “acabando” e na lista de compra." className="sm:col-span-2">
              <input name="estoque_minimo" inputMode="decimal" defaultValue={produto.estoque_minimo ? qtdCampo(produto.estoque_minimo) : ""} className={cls.input} placeholder="0" />
            </Campo>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="ativo" defaultChecked={produto.ativo} className="size-4 accent-accent" />
              Ativo (aparece nos pedidos e na lista do estoque)
            </label>
            <div className="sm:col-span-2">
              <Enviar>Salvar</Enviar>
            </div>
          </form>
        </Cartao>
      </div>

      <Secao titulo="Histórico">
        <ListaMovimentos movimentos={movimentos} voltar={voltar} mostrarProduto={false} />
      </Secao>

      <form action={excluirProduto.bind(null, id)} className="mt-10 border-t border-line pt-6">
        <Confirmar mensagem={`Excluir "${produto.nome}"? Se já tiver histórico, ele só será desativado.`}>Excluir produto</Confirmar>
      </form>
    </>
  );
}
