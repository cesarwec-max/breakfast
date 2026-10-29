import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarContasPagar, listarContasReceber, listarPedidos, listarProdutos, totaisContas } from "@/lib/dados";
import { brl, dataBR, diasEntre, hoje, qtd, somarDias } from "@/lib/formato";
import { SeloVencimento } from "@/components/lista-contas";
import { Numero, Secao, Vazio, cls } from "@/components/ui";
import { SeloEntrega } from "./pedidos/selo";

export default async function Inicio() {
  await exigirLogin();
  const dia = hoje();
  const ate7 = somarDias(dia, 7);
  const [pendentes, receber, pagar, produtos, vencidosReceber, proximosPagar] = await Promise.all([
    listarPedidos({ status: "pendente" }),
    totaisContas("contas_receber", dia, ate7),
    totaisContas("contas_pagar", dia, ate7),
    listarProdutos(),
    listarContasReceber("vencidos", dia),
    listarContasPagar("abertos", dia),
  ]);
  const paraHoje = pendentes.filter((p) => diasEntre(dia, p.data_entrega) <= 0);
  const zerados = produtos.filter((p) => p.saldo <= 0);
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
          detalhe={pagar.vencido > 0 ? <span className="text-danger">{brl(pagar.vencido)} vencido</span> : `${brl(pagar.proximos7)} em 7 dias`}
          href="/pagar"
        />
        <Numero
          rotulo="Estoque"
          valor={`${produtos.length} produto${produtos.length === 1 ? "" : "s"}`}
          detalhe={zerados.length ? <span className="text-danger">{zerados.length} sem estoque</span> : "todos com saldo"}
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
                  <div className="text-right">
                    <div className="tabular font-semibold">{brl(c.valor)}</div>
                    <SeloVencimento vencimento={c.vencimento} pago_em={null} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {vencidosReceber.length > 0 && (
          <Secao titulo="Clientes com boleto vencido" acao={<Link href="/receber?filtro=vencidos" className={`${cls.link} text-sm`}>ver todos</Link>}>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {vencidosReceber.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.cliente_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.cliente}</div>
                      <div className="text-xs text-muted">Venceu {dataBR(c.vencimento)}</div>
                    </div>
                    <div className="tabular font-semibold text-danger">{brl(c.valor)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {zerados.length > 0 && (
          <Secao titulo="Produtos sem estoque">
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {zerados.map((p) => (
                <li key={p.id}>
                  <Link href={`/estoque/${p.id}`} className="flex justify-between px-4 py-3 hover:bg-background">
                    <span>{p.nome}</span>
                    <span className="tabular font-semibold text-danger">
                      {qtd(p.saldo)} {p.unidade}
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
