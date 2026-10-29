import Link from "next/link";

// Classes reaproveitadas pelo app inteiro.
export const cls = {
  input:
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-background",
  botao:
    "bg-marca inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50",
  botao2:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50",
  botaoPequeno:
    "inline-flex items-center justify-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background disabled:opacity-50",
  perigo:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-danger/30 bg-surface px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-soft",
  link: "font-medium text-accent underline-offset-2 hover:underline",
};

export function Titulo({
  titulo,
  subtitulo,
  voltar,
  children,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {voltar && (
        <Link href={voltar.href} className="mb-2 inline-block text-sm text-muted hover:text-foreground">
          ← {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-grafite">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

export function Secao({ titulo, children, acao }: { titulo: string; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Campo({
  rotulo,
  children,
  className = "",
  dica,
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
  dica?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-muted">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-muted">{dica}</span>}
    </label>
  );
}

type Tom = "neutro" | "ok" | "aviso" | "perigo" | "destaque";

const tons: Record<Tom, string> = {
  neutro: "bg-background text-muted border-line",
  ok: "bg-ok-soft text-ok border-ok/20",
  aviso: "bg-warn-soft text-warn border-warn/20",
  perigo: "bg-danger-soft text-danger border-danger/20",
  destaque: "bg-accent-soft text-accent border-accent/20",
};

export function Selo({ tom = "neutro", children }: { tom?: Tom; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${tons[tom]}`}>
      {children}
    </span>
  );
}

export function Numero({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
  href,
}: {
  rotulo: string;
  valor: React.ReactNode;
  detalhe?: React.ReactNode;
  tom?: Tom;
  href?: string;
}) {
  const cor = { neutro: "", ok: "text-ok", aviso: "text-warn", perigo: "text-danger", destaque: "text-accent" }[tom];
  const conteudo = (
    <>
      <div className="text-sm text-muted">{rotulo}</div>
      <div className={`tabular mt-1 text-2xl font-bold tracking-tight ${cor}`}>{valor}</div>
      {detalhe && <div className="mt-1 text-xs text-muted">{detalhe}</div>}
    </>
  );
  const base = "block rounded-xl border border-line bg-surface p-4";
  return href ? (
    <Link href={href} className={`${base} transition hover:border-accent/40`}>
      {conteudo}
    </Link>
  ) : (
    <div className={base}>{conteudo}</div>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center text-sm text-muted">{children}</div>
  );
}

export function Abas({ itens, atual }: { itens: { valor: string; rotulo: string; href: string }[]; atual: string }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1">
      {itens.map((i) => (
        <Link
          key={i.valor}
          href={i.href}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
            i.valor === atual ? "bg-grafite text-white" : "text-muted hover:bg-background hover:text-foreground"
          }`}
        >
          {i.rotulo}
        </Link>
      ))}
    </div>
  );
}

export function Aviso({ children, tom = "perigo" }: { children: React.ReactNode; tom?: Tom }) {
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tons[tom]}`}>{children}</div>;
}
