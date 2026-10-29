import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { enderecoCurto, listarClientes } from "@/lib/dados";
import { Titulo, Vazio, cls } from "@/components/ui";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirLogin();
  const { q = "" } = await searchParams;
  const clientes = await listarClientes(q);

  return (
    <>
      <Titulo titulo="Clientes" subtitulo="Cadastro único usado em pedidos, notas fiscais, boletos e contas a receber.">
        <Link href="/clientes/novo" className={cls.botao}>
          + Novo cliente
        </Link>
      </Titulo>

      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Buscar por nome, razão social ou CNPJ…" className={cls.input} />
      </form>

      {clientes.length === 0 ? (
        <Vazio>{q ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</Vazio>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {clientes.map((c) => {
            const faltaFiscal = !c.cnpj_cpf || !c.razao_social;
            return (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="block px-4 py-3 transition hover:bg-background">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.nome}</span>
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
