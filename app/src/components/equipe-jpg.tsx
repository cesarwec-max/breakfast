"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LARGURA_FOLHA } from "./documentos";
import { FolhaPedidos, type PedidoFolha } from "./folha-pedidos";
import { fotografar } from "./gerar-arquivo";
import { Campo, cls } from "./ui";

/** Gera o JPG "Solicitações de pedidos" para mandar à equipe. */
export function EquipeJPG({ pedidos, semanaInicial }: { pedidos: PedidoFolha[]; semanaInicial: string }) {
  const [semana, setSemana] = useState(semanaInicial);
  const [obs, setObs] = useState("");
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
  const nome = `Pedidos-semana-${semana.slice(8, 10)}-${semana.slice(5, 7)}.jpg`;

  // Prévia reduzida para caber na tela
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
    const url = await fotografar(folha.current!);
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    return new File([bytes], nome, { type: "image/jpeg" });
  }

  async function agir(compartilhar: boolean) {
    setOcupado(true);
    setErro("");
    try {
      const f = await gerar();
      if (compartilhar) {
        await navigator.share({ files: [f], title: "Pedidos pendentes" }).catch(() => {});
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
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <Campo rotulo="Semana de">
          <input type="date" value={semana} onChange={(e) => e.target.value && setSemana(e.target.value)} className={cls.input} />
        </Campo>
        <Campo rotulo="Observações gerais (opcional)">
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className={cls.input} placeholder="Ex.: Quinta não tem entrega na zona sul" />
        </Campo>
      </div>
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
          <div ref={folha}>
            <FolhaPedidos pedidos={pedidos} semana={semana} observacoesGerais={obs} />
          </div>
        </div>
      </div>
    </div>
  );
}
