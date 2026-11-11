import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { enderecoCurto, listarClientes } from "@/lib/dados";
import { Selo, Titulo, Vazio, cls } from "@/components/ui";
import { sql } from "@/lib/db";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string; nicho?: string }> }) {
  await exigirLogin();
  const { q = "", nicho = "" } = await searchParams;
  const [clientes, usados] = await Promise.all([
    listarClientes(q, nicho),
    sql<{ nicho: string; n: number }[]>`SELECT nicho, count(*)::int AS n FROM clientes WHERE nicho <> '' GROUP BY nicho ORDER BY n DESC, nicho`,
  ]);
  const link = (n: string) => `/clientes?${new URLSearchParams({ ...(q ? { q } : {}), ...(n ? { nicho: n } : {}) })}`;

  return (
    <>
      <Titulo titulo="Clientes" subtitulo="Cadastro único usado em pedidos, notas fiscais, boletos e contas a receber.">
        <Link href="/clientes/novo" className={cls.botao}>
          + Novo cliente
        </Link>
      </Titulo>

      <form className="mb-3">
        {nicho && <input type="hidden" name="nicho" value={nicho} />}
        <input name="q" defaultValue={q} placeholder="Buscar por nome, razão social ou CNPJ…" className={cls.input} />
      </form>
      {usados.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {[{ nicho: "", n: 0 }, ...usados].map((u) => {
            const ativo = u.nicho.toLowerCase() === nicho.toLowerCase();
            return (
              <Link
                key={u.nicho || "todos"}
                href={link(u.nicho)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  ativo ? "border-grafite bg-grafite text-white" : "border-line bg-surface text-muted hover:text-foreground"
                }`}
              >
                {u.nicho ? `${u.nicho} (${u.n})` : "Todos"}
              </Link>
            );
          })}
        </div>
      )}

      {clientes.length === 0 ? (
        <Vazio>{q || nicho ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</Vazio>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {clientes.map((c) => {
            const faltaFiscal = !c.cnpj_cpf || !c.razao_social;
            return (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="block px-4 py-3 transition hover:bg-background">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {c.nome} {c.nicho && <Selo>{c.nicho}</Selo>}
                    </span>
                    {faltaFiscal && <span className="text-xs text-warn">dados fiscais incompletos</span>}
                  </div>
                  <div className="text-sm text-muted">{enderecoCurto(c) || "Sem endereço"}</div>
                  {c.cnpj_cpf && <div className="text-xs text-muted">{c.cnpj_cpf}</div>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
