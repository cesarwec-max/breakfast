"use client";

import { FileText, Image as ImageIcon, Paperclip, Send, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { enviarAnexo, excluirAnexo } from "@/app/(app)/anexos-actions";
import { ACEITA_ARQUIVOS, LIMITE_ANEXO, ROTULO_ANEXO, TIPOS_ANEXO, tamanhoLegivel } from "@/lib/anexos";
import { cls } from "./ui";

export type AnexoTela = { id: number; tipo: string; nome_arquivo: string; mime: string; tamanho: number; data: string };

/** Fotos grandes do celular são reduzidas antes de enviar (cabem no limite e carregam rápido). */
export async function reduzirFoto(f: File, ladoMax = 2200, aPartirDe = 1.5 * 1024 * 1024) {
  if (!f.type.startsWith("image/") || f.size < aPartirDe) return f;
  try {
    const img = await createImageBitmap(f);
    const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * escala);
    c.height = Math.round(img.height * escala);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.85));
    if (!blob) return f;
    return new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return f;
  }
}

function Lista({ anexos, mostrarExcluir }: { anexos: AnexoTela[]; mostrarExcluir: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.pdf", { type: "application/pdf" })] }),
    () => false,
  );

  async function enviar(a: AnexoTela) {
    setOcupado(a.id);
    try {
      const blob = await fetch(`/anexos/${a.id}`).then((r) => r.blob());
      await navigator.share({ files: [new File([blob], a.nome_arquivo, { type: a.mime })], title: a.nome_arquivo });
    } catch {
      // cancelado
    } finally {
      setOcupado(null);
    }
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {anexos.map((a) => {
        const Icone = a.mime.startsWith("image/") ? ImageIcon : FileText;
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <Icone size={18} className="shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <a href={`/anexos/${a.id}`} target="_blank" rel="noreferrer" className="block truncate font-medium hover:text-accent">
                {ROTULO_ANEXO[a.tipo] ?? "Arquivo"}: {a.nome_arquivo}
              </a>
              <div className="text-xs text-muted">
                {tamanhoLegivel(a.tamanho)} · anexado em {a.data}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {podeCompartilhar && (
                <button onClick={() => enviar(a)} disabled={ocupado === a.id} className={cls.botaoPequeno} title="Enviar pelo WhatsApp">
                  <Send size={14} /> {ocupado === a.id ? "…" : "Enviar"}
                </button>
              )}
              <a href={`/anexos/${a.id}?baixar=1`} className={cls.botaoPequeno} title="Baixar">
                <Download size={14} /> Baixar
              </a>
              {mostrarExcluir && (
                <button
                  onClick={async () => {
                    if (!confirm(`Excluir "${a.nome_arquivo}"?`)) return;
                    setOcupado(a.id);
                    await excluirAnexo(a.id);
                    router.refresh();
                    setOcupado(null);
                  }}
                  className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                  title="Excluir"
                  aria-label={`Excluir ${a.nome_arquivo}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Enviar({ alvo, tipoInicial = "nf", compacto = false }: { alvo: { pedidoId?: number; contaId?: number; contaPagarId?: number }; tipoInicial?: string; compacto?: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState(tipoInicial);
  const [estado, setEstado] = useState<{ ocupado: boolean; msg?: string; erro?: boolean }>({ ocupado: false });

  async function enviarArquivos(lista: FileList | null) {
    if (!lista?.length) return;
    setEstado({ ocupado: true, msg: "Enviando…" });
    const erros: string[] = [];
    let ok = 0;
    for (const original of Array.from(lista)) {
      const f = await reduzirFoto(original);
      if (f.size > LIMITE_ANEXO) {
        erros.push(`"${f.name}" passa de 4 MB.`);
        continue;
      }
      const fd = new FormData();
      fd.set("arquivo", f);
      fd.set("tipo", tipo);
      if (alvo.pedidoId) fd.set("pedido_id", String(alvo.pedidoId));
      if (alvo.contaId) fd.set("conta_id", String(alvo.contaId));
      if (alvo.contaPagarId) fd.set("conta_pagar_id", String(alvo.contaPagarId));
      try {
        const r = await enviarAnexo(fd);
        if (r.erro) erros.push(r.erro);
        else ok++;
      } catch {
        erros.push(`Não foi possível enviar "${f.name}".`);
      }
    }
    if (entrada.current) entrada.current.value = "";
    router.refresh();
    setEstado(
      erros.length
        ? { ocupado: false, erro: true, msg: erros.join(" ") }
        : { ocupado: false, msg: ok === 1 ? "Arquivo anexado." : `${ok} arquivos anexados.` },
    );
  }

  return (
    <div className={compacto ? "" : "rounded-lg border border-dashed border-line bg-background/60 p-3"}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${cls.input} w-auto py-2 text-sm`} aria-label="Tipo do documento">
          {TIPOS_ANEXO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
        <label className={`${cls.botao} cursor-pointer ${estado.ocupado ? "pointer-events-none opacity-60" : ""}`}>
          <Paperclip size={16} />
          {estado.ocupado ? "Enviando…" : "Anexar arquivo"}
          <input
            ref={entrada}
            type="file"
            multiple
            accept={ACEITA_ARQUIVOS}
            className="sr-only"
            onChange={(e) => enviarArquivos(e.target.files)}
          />
        </label>
      </div>
      {estado.msg && !estado.ocupado && <p className={`mt-2 text-xs ${estado.erro ? "text-danger" : "text-ok"}`}>{estado.msg}</p>}
      {!compacto && <p className="mt-2 text-xs text-muted">PDF, XML ou foto, até 4 MB cada. Fotos grandes são reduzidas sozinhas.</p>}
    </div>
  );
}

/** Lista de anexos + botão para anexar. Use `alvo` com o pedido ou a conta a receber. */
export function Anexos({
  anexos,
  alvo,
  vazio = "Nenhum documento anexado ainda.",
  compacto = false,
  podeAnexar = true,
  tipoInicial,
}: {
  anexos: AnexoTela[];
  alvo?: { pedidoId?: number; contaId?: number; contaPagarId?: number };
  vazio?: string;
  compacto?: boolean;
  podeAnexar?: boolean;
  /** Tipo já escolhido no botão de anexar (senão: nota, ou boleto se a nota já está lá). */
  tipoInicial?: string;
}) {
  const temNF = anexos.some((a) => a.tipo === "nf");
  return (
    <div className="space-y-2">
      {anexos.length > 0 ? <Lista anexos={anexos} mostrarExcluir={podeAnexar} /> : !compacto && vazio && <p className="text-sm text-muted">{vazio}</p>}
      {podeAnexar && alvo && <Enviar alvo={alvo} tipoInicial={tipoInicial ?? (temNF ? "boleto" : "nf")} compacto={compacto} />}
    </div>
  );
}
