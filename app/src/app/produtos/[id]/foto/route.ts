import { estaLogado } from "@/lib/auth";
import { obterFotoProduto } from "@/lib/dados";

// Foto do produto (só para quem está logado).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaLogado())) return new Response("Faça login.", { status: 401 });
  const id = Number((await params).id);
  const f = Number.isInteger(id) ? await obterFotoProduto(id) : null;
  if (!f) return new Response("Sem foto.", { status: 404 });
  return new Response(new Uint8Array(f.foto), {
    headers: { "Content-Type": f.mime, "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff" },
  });
}
