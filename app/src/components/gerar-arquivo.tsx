"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DadosBoleto, DadosNF } from "@/lib/dados";
import { nomeArquivo } from "@/lib/empresa";
import { arquivoContador, gerarPdfContador } from "@/lib/nf-contador";
import { FolhaBoleto, LARGURA_FOLHA } from "./documentos";
import { FolhaNFContador, LARGURA_A4_PX } from "./folha-nf-contador";
import { cls } from "./ui";

type Props =
  | { tipo: "nf"; id: number; data: string; dados: DadosNF }
  | { tipo: "boleto"; id: number; data: string; dados: DadosBoleto };

// Fontes embutidas na imagem: só as versões latinas (o português cabe nelas). Embutir todas
// (com alfabetos indiano, cirílico…) deixava a imagem tão pesada que o navegador travava.
let fontesLatinas: Promise<string> | null = null;
function cssFontes(folha: HTMLElement) {
  fontesLatinas ??= import("html-to-image").then(async ({ getFontEmbedCSS }) => {
    const css = await getFontEmbedCSS(folha);
    return (css.match(/@font-face\s*{[^}]*}/g) ?? []).filter((b) => /unicode-range:\s*U\+0-FF\b/i.test(b)).join("\n");
  });
  return fontesLatinas;
}

/** Tira uma "foto" da folha em alta resolução (JPG, como data URL). */
export async function fotografar(folha: HTMLElement) {
  const { toJpeg } = await import("html-to-image");
  await document.fonts.ready;
  const opcoes = {
    width: folha.offsetWidth || LARGURA_FOLHA,
    height: folha.offsetHeight,
    pixelRatio: 2,
    quality: 0.92,
    backgroundColor: "#ffffff",
    cacheBust: false,
    fontEmbedCSS: await cssFontes(folha),
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

/** Prévia + botões para enviar (WhatsApp no celular) ou baixar o arquivo. */
export function GerarArquivo(props: Props) {
  const nf = props.tipo === "nf";
  const formato = nf ? "PDF" : "JPG";
  const mime = nf ? "application/pdf" : "image/jpeg";
  const titulo = nf ? `Solicitação de Nota Fiscal nº ${props.id}` : `Solicitação de Boleto nº ${props.id}`;
  const arquivo = props.tipo === "nf" ? arquivoContador(props.dados) : nomeArquivo("Solicitacao-Boleto", props.id, props.dados.cliente.nome, "jpg");
  // NF: folha A4 do contador (PDF de texto). Boleto: folha de 1024 px com a arte da marca (JPG).
  const larguraFolha = nf ? LARGURA_A4_PX : LARGURA_FOLHA;

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

  // A prévia é reduzida para caber na tela.
  useEffect(() => {
    const c = caixa.current;
    const f = folha.current;
    if (!c || !f) return;
    const medir = () => {
      const escala = Math.min(1, c.clientWidth / larguraFolha);
      setMedida({ escala, altura: f.offsetHeight * escala });
    };
    const obs = new ResizeObserver(medir);
    obs.observe(c);
    obs.observe(f);
    return () => obs.disconnect();
  }, [larguraFolha]);

  async function gerar() {
    if (!folha.current) throw new Error("sem folha");
    if (props.tipo === "nf") {
      const bytes = await gerarPdfContador(props.dados, props.id);
      return new File([bytes as BlobPart], arquivo, { type: "application/pdf" });
    }
    return gerarJPG(folha.current, arquivo);
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
        <div style={{ width: larguraFolha, transform: `scale(${medida.escala})`, transformOrigin: "top left" }}>
          <div ref={folha}>
            {props.tipo === "nf" ? (
              <FolhaNFContador dados={props.dados} />
            ) : (
              <FolhaBoleto id={props.id} data={props.data} dados={props.dados} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
