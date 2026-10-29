// Regras dos anexos, usadas no navegador e no servidor.

export const LIMITE_ANEXO = 4 * 1024 * 1024; // a Vercel aceita até 4,5 MB por envio

export const TIPOS_ANEXO = [
  { valor: "nf", rotulo: "Nota fiscal" },
  { valor: "boleto", rotulo: "Boleto" },
  { valor: "outro", rotulo: "Outro (XML, comprovante…)" },
] as const;

export const ROTULO_ANEXO: Record<string, string> = { nf: "Nota fiscal", boleto: "Boleto", outro: "Outro" };

const IMAGENS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

/** Tipo do arquivo que vamos guardar, ou null se não for aceito (PDF, XML ou foto). */
export function mimeAceito(nome: string, mime: string) {
  const n = nome.toLowerCase();
  if (mime === "application/pdf" || n.endsWith(".pdf")) return "application/pdf";
  if (IMAGENS.includes(mime)) return mime;
  if (/\.(jpe?g)$/.test(n)) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (mime.includes("xml") || n.endsWith(".xml")) return "application/xml";
  return null;
}

export const ACEITA_ARQUIVOS = ".pdf,.xml,application/pdf,text/xml,application/xml,image/jpeg,image/png,image/webp,image/heic";

export function tamanhoLegivel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Converte os anexos do banco para o formato da tela (datas em texto). */
export function anexosTela(lista: { id: number; tipo: string; nome_arquivo: string; mime: string; tamanho: number; criado_em: Date }[]) {
  const f = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
  return lista.map((a) => ({ id: a.id, tipo: a.tipo, nome_arquivo: a.nome_arquivo, mime: a.mime, tamanho: a.tamanho, data: f.format(a.criado_em) }));
}
