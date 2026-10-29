import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarMovimentos, listarPedidos, listarProdutos } from "@/lib/dados";
import { brl, qtd } from "@/lib/formato";
import { Enviar } from "@/components/botoes";
import { MovimentoForm } from "@/components/movimento-form";
import { ListaMovimentos } from "@/components/movimentos";
import { Aviso, Campo, Cartao, Secao, Titulo, Vazio, cls } from "@/components/ui";
import { criarProduto, lancarMovimento } from "./actions";

export const metadata: Metadata = { title: "Estoque" };

export default async function Estoque({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  await exigirLogin();
  const { salvo } = await searchParams;
  const [produtos, movimentos, pendentes] = await Promise.all([
    listarProdutos(),
    listarMovimentos({ limite: 30 }),
    listarPedidos({ status: "pendente" }),
  ]);

  // Quanto de cada produto já está comprometido com pedidos ainda não entregues
  const reservado = new Map<number, number>();
  for (const p of pendentes) for (const i of p.itens) reservado.set(i.produto_id, (reservado.get(i.produto_id) ?? 0) + i.quantidade);

  return (
    <>
      <Titulo titulo="Estoque" subtitulo="Saldo atual de cada produto. Pedidos entregues dão baixa sozinhos." />
      {salvo && <Aviso tom="ok">Produto cadastrado.</Aviso>}

      {produtos.length === 0 ? (
        <Vazio>Cadastre seus produtos abaixo para começar a controlar o estoque.</Vazio>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">Produto</th>
                <th className="px-4 py-2 text-right font-semibold">Saldo</th>
                <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell">Em pedidos</th>
                <th className="hidden px-4 py-2 text-right font-semibold sm:table-cell">Preço</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {produtos.map((p) => {
                const res = reservado.get(p.id) ?? 0;
                const falta = p.saldo - res < 0;
                return (
                  <tr key={p.id} className="hover:bg-background">
                    <td className="px-4 py-3">
                      <Link href={`/estoque/${p.id}`} className="font-medium hover:text-accent">
                        {p.nome}
                      </Link>
                      {p.sabor && <div className="text-xs text-accent">{p.sabor}</div>}
                      {res > 0 && (
                        <div className={`text-xs sm:hidden ${falta ? "text-danger" : "text-muted"}`}>
                          {qtd(res)} em pedidos pendentes
                        </div>
                      )}
                    </td>
                    <td className={`tabular px-4 py-3 text-right font-semibold ${p.saldo <= 0 ? "text-danger" : ""}`}>
                      {qtd(p.saldo)} <span className="font-normal text-muted">{p.unidade}</span>
                    </td>
                    <td className={`tabular hidden px-4 py-3 text-right sm:table-cell ${falta ? "font-semibold text-danger" : "text-muted"}`}>
                      {res ? qtd(res) : "—"}
                    </td>
                    <td className="tabular hidden px-4 py-3 text-right text-muted sm:table-cell">{brl(p.preco)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {produtos.length > 0 && (
          <Cartao>
            <h2 className="mb-3 font-semibold">Lançar entrada ou saída</h2>
            <MovimentoForm acao={lancarMovimento} produtos={produtos} />
          </Cartao>
        )}
        <Cartao>
          <h2 className="mb-3 font-semibold">Novo produto</h2>
          <form action={criarProduto} className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Nome *" className="sm:col-span-2">
              <input name="nome" required className={cls.input} placeholder="Ex.: Folhado de Ouro 2kg" />
            </Campo>
            <Campo rotulo="Sabor" className="sm:col-span-2">
              <input name="sabor" className={cls.input} placeholder="Ex.: Requeijão" />
            </Campo>
            <Campo rotulo="Unidade" dica="un, cento, kg, caixa…">
              <input name="unidade" defaultValue="un" className={cls.input} />
            </Campo>
            <Campo rotulo="Preço de venda (R$)">
              <input name="preco" inputMode="decimal" className={cls.input} placeholder="0,00" />
            </Campo>
            <Campo rotulo="Estoque atual" className="sm:col-span-2">
              <input name="estoque_inicial" inputMode="decimal" className={cls.input} placeholder="0" />
            </Campo>
            <div className="sm:col-span-2">
              <Enviar>Cadastrar produto</Enviar>
            </div>
          </form>
        </Cartao>
      </div>

      <Secao titulo="Últimas movimentações">
        <ListaMovimentos movimentos={movimentos} voltar="/estoque" />
      </Secao>
    </>
  );
}
