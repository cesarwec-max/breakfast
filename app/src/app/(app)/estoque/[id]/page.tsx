import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import Link from "next/link";
import { listarMovimentos, listarPedidos, obterProduto, acabando } from "@/lib/dados";
import { dataBR, qtd, qtdCampo, valorCampo } from "@/lib/formato";
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
  const [movimentos, pendentes] = await Promise.all([listarMovimentos({ produtoId: id, limite: 100 }), listarPedidos({ status: "pendente" })]);
  // Pedidos que ainda não saíram e seguram este produto
  const reservas = pendentes
    .filter((p) => p.status === "pendente")
    .map((p) => ({ ...p, quantidade: p.itens.filter((i) => i.produto_id === id).reduce((t, i) => t + i.quantidade, 0) }))
    .filter((p) => p.quantidade > 0);
  const voltar = `/estoque/${id}`;

  return (
    <>
      <Titulo titulo={produto.nome} subtitulo={produto.sabor || undefined} voltar={{ href: "/estoque", rotulo: "Estoque" }} />
      {salvo && <Aviso tom="ok">Produto salvo.</Aviso>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Numero
              rotulo="📦 Na prateleira"
              valor={`${qtd(produto.fisico)} ${produto.unidade}`}
              tom={produto.fisico <= 0 ? "perigo" : acabando(produto) ? "aviso" : "neutro"}
              detalhe={
                produto.saldo < 0 ? (
                  <span className="text-danger">faltam {qtd(-produto.saldo)} para os pedidos</span>
                ) : produto.estoque_minimo > 0 ? (
                  `mínimo: ${qtd(produto.estoque_minimo)}`
                ) : (
                  "sem mínimo definido"
                )
              }
            />
            <Numero rotulo="🔒 Reservado" valor={`${qtd(produto.reservado)} ${produto.unidade}`} detalhe="em pedidos que ainda não saíram" />
          </div>
          {reservas.length > 0 && (
            <Cartao>
              <h2 className="mb-2 font-semibold">Reservado para estes pedidos</h2>
              <ul className="divide-y divide-line text-sm">
                {reservas.map((r) => (
                  <li key={r.id}>
                    <Link href={`/pedidos/${r.id}`} className="flex justify-between gap-3 py-2 hover:text-accent">
                      <span>
                        #{r.id} · {r.cliente} · entrega {dataBR(r.data_entrega)}
                      </span>
                      <span className="tabular font-semibold">
                        {qtd(r.quantidade)} {produto.unidade}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Sai da prateleira quando o pedido for marcado como &quot;em rota&quot; ou entregue.</p>
            </Cartao>
          )}
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
