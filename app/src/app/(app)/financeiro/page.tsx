import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { listarClientes, listarSolicitacoes } from "@/lib/dados";
import { brl, dataBR, diaSP } from "@/lib/formato";
import { faltaFiscal } from "@/lib/opcoes";
import { Cartao, Secao, Selo, Titulo, Vazio, cls } from "@/components/ui";

export const metadata: Metadata = { title: "Financeiro" };

export default async function Financeiro() {
  await exigirLogin();
  const [solicitacoes, clientes] = await Promise.all([listarSolicitacoes({ limite: 40 }), listarClientes()]);
  const incompletos = clientes.filter((c) => faltaFiscal(c).length > 0);

  return (
    <>
      <Titulo titulo="Financeiro" subtitulo="Gere as solicitações de nota fiscal (PDF) e de boleto (JPG) para enviar ao setor." />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/financeiro/nf/nova" className="group rounded-xl border border-line bg-surface p-5 transition hover:border-accent/50">
          <div className="text-2xl">🧾</div>
          <div className="mt-2 font-semibold group-hover:text-accent">Solicitar nota fiscal</div>
          <p className="text-sm text-muted">Escolha o cliente e coloque o pedido. Sai em PDF.</p>
        </Link>
        <Link href="/financeiro/boleto/novo" className="group rounded-xl border border-line bg-surface p-5 transition hover:border-accent/50">
          <div className="text-2xl">💳</div>
          <div className="mt-2 font-semibold group-hover:text-accent">Solicitar boleto</div>
          <p className="text-sm text-muted">Escolha o cliente, valores e vencimentos. Sai em JPG e já entra em Contas a receber.</p>
        </Link>
      </div>

      {incompletos.length > 0 && (
        <Cartao className="mt-4 border-warn/30 bg-warn-soft">
          <p className="text-sm text-warn">
            <strong>{incompletos.length}</strong> cliente(s) com dados fiscais incompletos:{" "}
            {incompletos.slice(0, 6).map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/clientes/${c.id}`} className="underline">
                  {c.nome}
                </Link>
              </span>
            ))}
            {incompletos.length > 6 && "…"}
          </p>
        </Cartao>
      )}

      <Secao titulo="Solicitações recentes" acao={<Link href="/clientes" className={`${cls.link} text-sm`}>Cadastro de clientes →</Link>}>
        {solicitacoes.length === 0 ? (
          <Vazio>Nenhuma solicitação gerada ainda.</Vazio>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {solicitacoes.map((s) => (
              <li key={s.id}>
                <Link href={`/financeiro/solicitacoes/${s.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-background">
                  <Selo tom={s.tipo === "nf" ? "destaque" : "neutro"}>{s.tipo === "nf" ? "NF · PDF" : "Boleto · JPG"}</Selo>
                  <span className="min-w-0 flex-1 truncate font-medium">{s.cliente}</span>
                  <span className="tabular hidden sm:inline">{brl(s.dados.total)}</span>
                  <span className="text-muted">{dataBR(diaSP(s.criado_em))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </>
  );
}
