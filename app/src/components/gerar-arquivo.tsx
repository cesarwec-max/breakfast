"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DadosBoleto, DadosNF } from "@/lib/dados";
import { nomeArquivo } from "@/lib/empresa";
import { FolhaBoleto, FolhaNF, LARGURA_FOLHA } from "./documentos";
import { cls } from "./ui";

type Props =
  | { tipo: "nf"; id: number; data: string; dados: DadosNF }
  | { tipo: "boleto"; id: number; data: string; dados: DadosBoleto };

/** Tira uma "foto" da folha em alta resolução (JPG). */
async function fotografar(folha: HTMLElement) {
  const { toJpeg } = await import("html-to-image");
  await document.fonts.ready;
  const opcoes = {
    width: LARGURA_FOLHA,
    height: folha.offsetHeight,
    pixelRatio: 2,
    quality: 0.92,
    backgroundColor: "#ffffff",
    cacheBust: false,
  };
  // A primeira captura às vezes sai sem imagens em alguns navegadores; a segunda vem completa.
  await toJpeg(folha, opcoes);
  return toJpeg(folha, opcoes);
}

async function paraBytes(dataUrl: string) {
  return new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
}

async function gerarJPG(folha: HTMLElement, nome: string) {
  const bytes = await paraBytes(await fotografar(folha));
  return new File([bytes], nome, { type: "image/jpeg" });
}

async function gerarPDF(folha: HTMLElement, nome: string, titulo: string) {
  const { PDFDocument } = await import("pdf-lib");
  const imagem = await PDFDocument.create().then(async (pdf) => {
    pdf.setTitle(titulo);
    pdf.setAuthor("Breakfast");
    const jpg = await pdf.embedJpg(await paraBytes(await fotografar(folha)));
    // Página com a largura de uma A4 e a altura da folha
    const largura = 595.28;
    const altura = (largura * jpg.height) / jpg.width;
    pdf.addPage([largura, altura]).drawImage(jpg, { x: 0, y: 0, width: largura, height: altura });
    return pdf.save();
  });
  return new File([imagem as BlobPart], nome, { type: "application/pdf" });
}

/** Prévia + botões para enviar (WhatsApp no celular) ou baixar o arquivo. */
export function GerarArquivo(props: Props) {
  const nf = props.tipo === "nf";
  const formato = nf ? "PDF" : "JPG";
  const mime = nf ? "application/pdf" : "image/jpeg";
  const titulo = nf ? `Solicitação de Nota Fiscal nº ${props.id}` : `Solicitação de Boleto nº ${props.id}`;
  const arquivo = nomeArquivo(nf ? "Solicitacao-NF" : "Solicitacao-Boleto", props.id, props.dados.cliente.nome, nf ? "pdf" : "jpg");

  const caixa = useRef<HTMLDivElement>(null);
  const folha = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ escala: 0, altura: 0 });
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  // No celular dá para mandar direto ao WhatsApp; no computador, só baixar.
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x", { type: mime })] }),
    () => false,
  );

  // A folha tem 1024 px; a prévia é reduzida para caber na tela.
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

  async function gerar() {
    if (!folha.current) throw new Error("sem folha");
    return nf ? gerarPDF(folha.current, arquivo, titulo) : gerarJPG(folha.current, arquivo);
  }

  async function baixar() {
    setOcupado(true);
    setErro("");
    try {
      const f = await gerar();
      const url = URL.createObjectURL(f);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setErro("Não foi possível gerar o arquivo. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function compartilhar() {
    setOcupado(true);
    setErro("");
    try {
      const f = await gerar();
      await navigator.share({ files: [f], title: titulo });
    } catch {
      // cancelado pelo usuário
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {podeCompartilhar && (
          <button onClick={compartilhar} disabled={ocupado} className={cls.botao}>
            {ocupado ? "Gerando…" : `Enviar ${formato} (WhatsApp…)`}
          </button>
        )}
        <button onClick={baixar} disabled={ocupado} className={podeCompartilhar ? cls.botao2 : cls.botao}>
          {ocupado ? "Gerando…" : `Baixar ${formato}`}
        </button>
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div
        ref={caixa}
        className="overflow-hidden rounded-xl border border-line bg-white shadow-md"
        style={{ height: medida.altura || undefined, visibility: medida.escala ? "visible" : "hidden" }}
      >
        <div style={{ width: LARGURA_FOLHA, transform: `scale(${medida.escala})`, transformOrigin: "top left" }}>
          <div ref={folha}>
            {props.tipo === "nf" ? (
              <FolhaNF id={props.id} data={props.data} dados={props.dados} />
            ) : (
              <FolhaBoleto id={props.id} data={props.data} dados={props.dados} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
