import { estaLogado } from "@/lib/auth";
import { obterAnexo } from "@/lib/dados";

// Entrega o arquivo anexado (só para quem está logado). ?baixar=1 força o download.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaLogado())) return new Response("Faça login.", { status: 401 });
  const id = Number((await params).id);
  const anexo = Number.isInteger(id) ? await obterAnexo(id) : null;
  if (!anexo) return new Response("Arquivo não encontrado.", { status: 404 });

  // XML sempre como download (um XML aberto no navegador pode rodar código). PDF e fotos podem abrir na tela.
  const baixar = new URL(request.url).searchParams.has("baixar") || anexo.mime === "application/xml";
  const nome = encodeURIComponent(anexo.nome_arquivo);
  return new Response(new Uint8Array(anexo.conteudo), {
    headers: {
      "Content-Type": anexo.mime,
      "Content-Length": String(anexo.conteudo.length),
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename*=UTF-8''${nome}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
