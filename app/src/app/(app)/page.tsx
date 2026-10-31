import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import {
  acabando,
  listarContasPagar,
  listarContasReceber,
  listarPedidos,
  listarProdutos,
  pagarSemBoleto,
  resumoVendas,
  totaisContas,
} from "@/lib/dados";
import { linkCobranca } from "@/lib/cobranca";
import { brl, dataBR, diasEntre, hoje, qtd, somarDias } from "@/lib/formato";
import { SeloVencimento } from "@/components/lista-contas";
import { Numero, Secao, Selo, Vazio, cls } from "@/components/ui";
import { SeloEntrega } from "./pedidos/selo";

export default async function Inicio() {
  await exigirLogin();
  const dia = hoje();
  const ate7 = somarDias(dia, 7);
  const [pendentes, receber, pagar, produtos, abertosReceber, proximosPagar, vendas, semBoleto] = await Promise.all([
    listarPedidos({ status: "pendente" }),
    totaisContas("contas_receber", dia, ate7),
    totaisContas("contas_pagar", dia, ate7),
    listarProdutos(),
    listarContasReceber("abertos", dia),
    listarContasPagar("abertos", dia),
    resumoVendas(dia),
    pagarSemBoleto(),
  ]);
  const paraHoje = pendentes.filter((p) => diasEntre(dia, p.data_entrega) <= 0);
  const zerados = produtos.filter(acabando);
  const paraCobrar = abertosReceber.filter((c) => c.vencimento <= dia);
  const variacao = vendas.mes_passado > 0 ? Math.round(((vendas.mes - vendas.mes_passado) / vendas.mes_passado) * 100) : null;
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const saudacao = hora < 12 ? "Bom dia! ☕" : hora < 18 ? "Boa tarde! 🥐" : "Boa noite! 🌙";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{saudacao}</h1>
          <p className="text-sm text-muted">Resumo de hoje, {dataBR(dia)}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pedidos/novo" className={cls.botao}>
            + Pedido
          </Link>
          <Link href="/financeiro/nf/nova" className={cls.botao2}>
            NF
          </Link>
          <Link href="/financeiro/boleto/novo" className={cls.botao2}>
            Boleto
          </Link>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero
          rotulo="Vendas de hoje"
          valor={brl(vendas.hoje)}
          detalhe={`${vendas.qtd_hoje} pedido${vendas.qtd_hoje === 1 ? "" : "s"} lançado${vendas.qtd_hoje === 1 ? "" : "s"}`}
          tom={vendas.hoje > 0 ? "destaque" : "neutro"}
          href="/pedidos"
        />
        <Numero
          rotulo="Vendas do mês"
          valor={brl(vendas.mes)}
          detalhe={
            variacao === null ? (
              `${vendas.qtd_mes} pedido${vendas.qtd_mes === 1 ? "" : "s"}`
            ) : (
              <span className={variacao >= 0 ? "text-ok" : "text-danger"}>
                {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao)}% vs. mês passado até hoje
              </span>
            )
          }
        />
        <Numero
          rotulo="Ticket médio do mês"
          valor={brl(vendas.qtd_mes ? vendas.mes / vendas.qtd_mes : 0)}
          detalhe="valor médio por pedido"
        />
        <Numero
          rotulo="Recebido no mês"
          valor={brl(receber.pago_mes)}
          detalhe={`${receber.qtd_pago_mes} conta${receber.qtd_pago_mes === 1 ? "" : "s"} recebida${receber.qtd_pago_mes === 1 ? "" : "s"}`}
          tom={receber.pago_mes > 0 ? "ok" : "neutro"}
          href="/receber?filtro=pagos"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero
          rotulo="Pedidos a entregar"
          valor={pendentes.length}
          detalhe={paraHoje.length ? `${paraHoje.length} para hoje ou atrasado(s)` : "nenhum para hoje"}
          tom={paraHoje.length ? "destaque" : "neutro"}
          href="/pedidos"
        />
        <Numero
          rotulo="A receber"
          valor={brl(receber.aberto)}
          detalhe={receber.vencido > 0 ? <span className="text-danger">{brl(receber.vencido)} vencido</span> : "nada vencido"}
          href="/receber"
        />
        <Numero
          rotulo="A pagar"
          valor={brl(pagar.aberto)}
          detalhe={
            pagar.vencido > 0 ? (
              <span className="text-danger">{brl(pagar.vencido)} vencido</span>
            ) : semBoleto.size > 0 ? (
              <span className="text-warn">{semBoleto.size} sem o arquivo do boleto</span>
            ) : (
              `${brl(pagar.proximos7)} em 7 dias`
            )
          }
          href="/pagar"
        />
        <Numero
          rotulo="Estoque"
          valor={`${produtos.length} produto${produtos.length === 1 ? "" : "s"}`}
          detalhe={zerados.length ? <span className="text-danger">{zerados.length} acabando</span> : "todos com saldo"}
          href="/estoque"
        />
      </div>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Secao titulo="Próximas entregas" acao={<Link href="/pedidos" className={`${cls.link} text-sm`}>ver todas</Link>}>
          {pendentes.length === 0 ? (
            <Vazio>Nenhum pedido a entregar.</Vazio>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {pendentes.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{p.cliente}</div>
                      <div className="truncate text-xs text-muted">
                        {p.itens.map((i) => `${qtd(i.quantidade)} ${i.produto}${i.sabor ? ` ${i.sabor}` : ""}`).join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <SeloEntrega pedido={p} />
                      <div className="mt-0.5 text-xs text-muted">{dataBR(p.data_entrega)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Boletos a pagar" acao={<Link href="/pagar" className={`${cls.link} text-sm`}>ver todos</Link>}>
          {proximosPagar.length === 0 ? (
            <Vazio>Nenhum boleto a pagar.</Vazio>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {proximosPagar.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.fornecedor}</div>
                    <div className="text-xs text-muted">Vence {dataBR(c.vencimento)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <div className="tabular font-semibold">{brl(c.valor)}</div>
                    <SeloVencimento vencimento={c.vencimento} pago_em={null} />
                    {semBoleto.has(c.id) && <Selo tom="aviso">⚠ sem boleto anexado</Selo>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Para cobrar (vence hoje ou vencido)" acao={<Link href="/receber?filtro=vencidos" className={`${cls.link} text-sm`}>ver todos</Link>}>
          {paraCobrar.length === 0 ? (
            <Vazio>Nenhum cliente para cobrar hoje. 🎉</Vazio>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {paraCobrar.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/clientes/${c.cliente_id}`} className="min-w-0 flex-1 hover:text-accent">
                    <div className="truncate font-medium">{c.cliente}</div>
                    <div className="text-xs text-muted">{c.vencimento === dia ? "Vence hoje" : `Venceu ${dataBR(c.vencimento)}`}</div>
                  </Link>
                  <div className={`tabular font-semibold ${c.vencimento < dia ? "text-danger" : ""}`}>{brl(c.valor)}</div>
                  <a
                    href={linkCobranca(c, [c], dia)}
                    target="_blank"
                    rel="noreferrer"
                    className={`${cls.botaoPequeno} border-[#25d366]/40 text-[#128c4a]`}
                    title="Cobrar no WhatsApp"
                  >
                    💬 Cobrar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Mais vendidos do mês">
          {vendas.mais_vendidos.length === 0 ? (
            <Vazio>Nenhuma venda este mês ainda.</Vazio>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {vendas.mais_vendidos.map((m, n) => {
                const maior = vendas.mais_vendidos[0].quantidade || 1;
                return (
                  <li key={n} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">
                        {n + 1}. {m.produto}
                        {m.sabor && <span className="text-accent"> {m.sabor}</span>}
                      </span>
                      <span className="tabular shrink-0 text-muted">
                        {qtd(m.quantidade)} {m.unidade} · {brl(m.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="bg-marca h-full rounded-full" style={{ width: `${(m.quantidade / maior) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>

        {zerados.length > 0 && (
          <Secao titulo="Produtos acabando" acao={<Link href="/estoque/compra" className={`${cls.link} text-sm`}>🛒 lista de compra</Link>}>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {zerados.map((p) => (
                <li key={p.id}>
                  <Link href={`/estoque/${p.id}`} className="flex justify-between px-4 py-3 hover:bg-background">
                    <span>{p.nome}</span>
                    <span className={`tabular font-semibold ${p.saldo <= 0 ? "text-danger" : "text-warn"}`}>
                      {qtd(p.saldo)} {p.unidade}
                      {p.estoque_minimo > 0 && <span className="font-normal text-muted"> / mín. {qtd(p.estoque_minimo)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}
      </div>
    </>
  );
}
