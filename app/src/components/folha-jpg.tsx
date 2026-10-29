"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LARGURA_FOLHA } from "./documentos";
import { fotografar } from "./gerar-arquivo";
import { cls } from "./ui";

/** Prévia reduzida de uma folha de 1024 px + botões para enviar (WhatsApp no celular) ou baixar como JPG (e PDF, se pedir). */
export function FolhaJPG({
  nomeArquivo,
  titulo,
  comPdf = false,
  children,
}: {
  nomeArquivo: string;
  titulo: string;
  /** Também oferece o arquivo em PDF (a mesma imagem dentro de uma página). */
  comPdf?: boolean;
  children: React.ReactNode;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const caixa = useRef<HTMLDivElement>(null);
  const folha = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ escala: 0, altura: 0 });
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.jpg", { type: "image/jpeg" })] }),
    () => false,
  );

  useEffect(() => {
    const c = caixa.current;
    const f = folha.current;
    if (!c || !f) return;
    const medir = () => {
      const escala = Math.min(1, c.clientWidth / LARGURA_FOLHA);
      setMedida({ escala, altura: f.offsetHeight * escala });
    };
    const obs = new ResizeObserver(medir);
    obs.observe(c);
    obs.observe(f);
    return () => obs.disconnect();
  }, []);

  async function gerar(pdf: boolean) {
    const url = await fotografar(folha.current!);
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    if (!pdf) return new File([bytes], nomeArquivo, { type: "image/jpeg" });
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    doc.setTitle(titulo);
    doc.setAuthor("Breakfast");
    const jpg = await doc.embedJpg(bytes);
    const largura = 595.28; // largura de uma A4
    const altura = (largura * jpg.height) / jpg.width;
    doc.addPage([largura, altura]).drawImage(jpg, { x: 0, y: 0, width: largura, height: altura });
    return new File([(await doc.save()) as BlobPart], nomeArquivo.replace(/\.jpg$/, ".pdf"), { type: "application/pdf" });
  }

  async function agir(compartilhar: boolean, pdf = false) {
    setOcupado(true);
    setErro("");
    try {
      const f = await gerar(pdf);
      if (compartilhar) {
        await navigator.share({ files: [f], title: titulo }).catch(() => {});
      } else {
        const u = URL.createObjectURL(f);
        const a = document.createElement("a");
        a.href = u;
        a.download = f.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 10_000);
      }
    } catch {
      setErro("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {podeCompartilhar && (
          <button onClick={() => agir(true)} disabled={ocupado} className={cls.botao}>
            {ocupado ? "Gerando…" : "Enviar JPG (WhatsApp…)"}
          </button>
        )}
        <button onClick={() => agir(false)} disabled={ocupado} className={podeCompartilhar ? cls.botao2 : cls.botao}>
          {ocupado ? "Gerando…" : "Baixar JPG"}
        </button>
        {comPdf && podeCompartilhar && (
          <button onClick={() => agir(true, true)} disabled={ocupado} className={cls.botao2}>
            {ocupado ? "Gerando…" : "Enviar PDF"}
          </button>
        )}
        {comPdf && (
          <button onClick={() => agir(false, true)} disabled={ocupado} className={cls.botao2}>
            {ocupado ? "Gerando…" : "Baixar PDF"}
          </button>
        )}
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div
        ref={caixa}
        className="overflow-hidden rounded-xl border border-line bg-white shadow-md"
        style={{ height: medida.altura || undefined, visibility: medida.escala ? "visible" : "hidden" }}
      >
        <div style={{ width: LARGURA_FOLHA, transform: `scale(${medida.escala})`, transformOrigin: "top left" }}>
          <div ref={folha}>{children}</div>
        </div>
      </div>
    </div>
  );
}
