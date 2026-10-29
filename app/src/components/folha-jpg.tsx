"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LARGURA_FOLHA } from "./documentos";
import { fotografar } from "./gerar-arquivo";
import { cls } from "./ui";

/** Prévia reduzida de uma folha de 1024 px + botões para enviar (WhatsApp no celular) ou baixar como JPG. */
export function FolhaJPG({ nomeArquivo, titulo, children }: { nomeArquivo: string; titulo: string; children: React.ReactNode }) {
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

  async function agir(compartilhar: boolean) {
    setOcupado(true);
    setErro("");
    try {
      const url = await fotografar(folha.current!);
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      const f = new File([bytes], nomeArquivo, { type: "image/jpeg" });
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
