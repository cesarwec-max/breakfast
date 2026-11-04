import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarMovimentos, listarProdutos, acabando } from "@/lib/dados";
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
  const [produtos, movimentos] = await Promise.all([listarProdutos(), listarMovimentos({ limite: 30 })]);

  const baixos = produtos.filter(acabando).length;

  return (
    <>
      <Titulo titulo="Estoque" subtitulo="Quanto há na prateleira, quanto está separado para pedidos e quanto está livre para vender.">
        <Link href="/estoque/compra" className={cls.botao2}>
          🛒 Lista de compra{baixos ? ` (${baixos})` : ""}
        </Link>
      </Titulo>
      {salvo && <Aviso tom="ok">Produto cadastrado.</Aviso>}

      {produtos.length === 0 ? (
        <Vazio>Cadastre seus produtos abaixo para começar a controlar o estoque.</Vazio>
      ) : (
        <>
          <div className="mb-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
            <p>
              <strong className="text-foreground">📦 Na prateleira:</strong> o que existe de verdade na distribuidora. Só diminui quando o
              pedido sai (em rota ou entregue).
            </p>
            <p>
              <strong className="text-foreground">🔒 Reservado:</strong> separado para pedidos lançados que ainda não saíram.
            </p>
            <p>
              <strong className="text-foreground">✅ Livre para vender:</strong> prateleira menos reservado.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold sm:px-4">Produto</th>
                  <th className="px-2 py-2 text-right font-semibold sm:px-4">
                    📦 <span className="hidden sm:inline">Na </span>prateleira
                  </th>
                  <th className="px-2 py-2 text-right font-semibold sm:px-4">🔒 Reservado</th>
                  <th className="px-3 py-2 text-right font-semibold sm:px-4">
                    ✅ Livre<span className="hidden sm:inline"> para vender</span>
                  </th>
                  <th className="hidden px-4 py-2 text-right font-semibold md:table-cell">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-background">
                    <td className="px-3 py-3 sm:px-4">
                      <Link href={`/estoque/${p.id}`} className="font-medium hover:text-accent">
                        {p.nome}
                      </Link>
                      {p.sabor && <div className="text-xs text-accent">{p.sabor}</div>}
                      <div className="text-xs text-muted">{p.unidade}</div>
                    </td>
                    <td className={`tabular px-2 py-3 text-right text-base font-bold sm:px-4 ${p.fisico <= 0 ? "text-danger" : ""}`}>{qtd(p.fisico)}</td>
                    <td className="tabular px-2 py-3 text-right text-muted sm:px-4">{p.reservado ? qtd(p.reservado) : "—"}</td>
                    <td className={`tabular px-3 py-3 text-right font-semibold sm:px-4 ${p.saldo <= 0 ? "text-danger" : acabando(p) ? "text-warn" : ""}`}>
                      {qtd(p.saldo)}
                      {p.saldo < 0 ? (
                        <div className="text-xs font-normal">faltam {qtd(-p.saldo)} p/ pedidos</div>
                      ) : (
                        acabando(p) && p.saldo > 0 && <div className="text-xs font-normal">acabando (mín. {qtd(p.estoque_minimo)})</div>
                      )}
                    </td>
                    <td className="tabular hidden px-4 py-3 text-right text-muted md:table-cell">{brl(p.preco)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
            <Campo rotulo="Estoque mínimo" dica="Ao chegar nele, o produto aparece em “acabando” e na lista de compra." className="sm:col-span-2">
              <input name="estoque_minimo" inputMode="decimal" className={cls.input} placeholder="0" />
            </Campo>
            <Campo rotulo="Estoque atual (na prateleira)" className="sm:col-span-2">
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
