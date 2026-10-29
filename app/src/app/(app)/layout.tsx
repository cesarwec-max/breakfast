import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirLogin, sair } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Menu } from "@/components/menu";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await exigirLogin();

  async function acaoSair() {
    "use server";
    await sair();
    redirect("/login");
  }

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-20 bg-grafite-escuro shadow-md">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" aria-label="Início">
              <Logo escuro tamanho={24} />
            </Link>
            <form action={acaoSair}>
              <button className="text-sm text-white/60 hover:text-white">Sair</button>
            </form>
          </div>
          <Menu />
        </div>
        <div className="bg-marca h-1" />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
