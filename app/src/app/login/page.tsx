import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { entrar, estaLogado } from "@/lib/auth";
import { Enviar } from "@/components/botoes";
import { Logo } from "@/components/logo";
import { cls } from "@/components/ui";

export const metadata: Metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (await estaLogado()) redirect("/");
  const { erro } = await searchParams;

  async function acao(form: FormData) {
    "use server";
    const ok = await entrar(String(form.get("senha") ?? ""));
    redirect(ok ? "/" : "/login?erro=1");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-grafite to-grafite-escuro p-4">
      <div className="mb-8">
        <Logo escuro tamanho={40} slogan />
      </div>
      <form action={acao} className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h1 className="mb-4 text-lg font-semibold">Entrar no sistema</h1>
        {erro && <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">Senha incorreta.</p>}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">Senha</span>
          <input name="senha" type="password" required autoFocus autoComplete="current-password" className={cls.input} />
        </label>
        <Enviar className={`${cls.botao} mt-4 w-full`} pendente="Entrando…">
          Entrar
        </Enviar>
      </form>
      <div className="bg-marca mt-10 h-1 w-24 rounded-full" />
    </main>
  );
}
