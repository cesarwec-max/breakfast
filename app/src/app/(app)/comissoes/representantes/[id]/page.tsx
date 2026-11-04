import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { obterRepresentante } from "@/lib/comissoes";
import { Enviar } from "@/components/botoes";
import { FaixasEditor } from "@/components/faixas-editor";
import { Aviso, Campo, Cartao, Secao, Titulo, cls } from "@/components/ui";
import { salvarRepresentante } from "../../actions";

export const metadata: Metadata = { title: "Representante" };

export default async function RepresentantePagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  await exigirLogin();
  const { id: bruto } = await params;
  const { salvo } = await searchParams;
  const novo = bruto === "novo";
  const id = Number(bruto);
  const r = novo ? null : Number.isInteger(id) ? await obterRepresentante(id) : null;
  if (!novo && !r) notFound();
  const clientes = r
    ? await sql<{ id: number; nome: string }[]>`SELECT id, nome FROM clientes WHERE representante_id = ${r.id} ORDER BY lower(nome)`
    : [];

  return (
    <>
      <Titulo titulo={r ? r.nome : "Novo representante"} voltar={{ href: "/comissoes", rotulo: "Comissões" }} />
      {salvo && <Aviso tom="ok">Representante salvo.</Aviso>}
      <Cartao>
        <form action={salvarRepresentante.bind(null, r?.id ?? null)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome *">
              <input name="nome" required defaultValue={r?.nome} className={cls.input} autoFocus={novo} />
            </Campo>
            <Campo rotulo="Telefone / WhatsApp">
              <input name="telefone" inputMode="tel" defaultValue={r?.telefone} className={cls.input} />
            </Campo>
          </div>
          <FaixasEditor key={JSON.stringify(r?.faixas)} inicial={r?.faixas ?? [{ a_partir_de: 0, percentual: 0 }]} />
          {r && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked={r.ativo} className="size-4 accent-accent" />
              Ativo (aparece nos pedidos e nas comissões)
            </label>
          )}
          <p className="text-xs text-muted">Mudar o percentual vale para os meses em aberto. Meses já fechados ficam como foram fechados.</p>
          <Enviar>{r ? "Salvar" : "Cadastrar representante"}</Enviar>
        </form>
      </Cartao>

      {r && (
        <Secao titulo={`Clientes indicados (${clientes.length})`}>
          {clientes.length === 0 ? (
            <p className="text-sm text-muted">Nenhum cliente ligado ainda. Abra o cliente e escolha &quot;Indicado pelo representante&quot;.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-sm">
              {clientes.map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="block px-4 py-2.5 hover:bg-background">
                    {c.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      )}
    </>
  );
}
