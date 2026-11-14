"use client";

import { CampoData } from "@/components/campo-data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarAnexo } from "@/app/(app)/anexos-actions";
import { adicionarParcela } from "@/app/(app)/contas-actions";
import { ACEITA_ARQUIVOS, LIMITE_ANEXO } from "@/lib/anexos";
import { valorCampo } from "@/lib/formato";
import { reduzirFoto } from "./anexos";
import { Campo, cls } from "./ui";

/** "＋ Mais um boleto": acrescenta uma parcela à compra já lançada (mesmo lote), com o arquivo do boleto. */
export function NovoBoleto({ contaId, valor, vencimento }: { contaId: number; valor: number; vencimento: string }) {
  const router = useRouter();
  const [versao, setVersao] = useState(0);
  const [estado, setEstado] = useState<{ ocupado: boolean; msg?: string; erro?: boolean }>({ ocupado: false });

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const quadro = e.currentTarget.closest("details");
    const fd = new FormData(e.currentTarget);
    const arquivo = fd.get("arquivo");
    fd.delete("arquivo");
    setEstado({ ocupado: true, msg: "Lançando o boleto…" });
    let id: number;
    try {
      const r = await adicionarParcela(contaId, fd);
      if (r.erro || !r.id) return setEstado({ ocupado: false, erro: true, msg: r.erro ?? "Não foi possível lançar." });
      id = r.id;
    } catch {
      return setEstado({ ocupado: false, erro: true, msg: "Não foi possível lançar. Tente de novo." });
    }
    if (arquivo instanceof File && arquivo.size > 0) {
      setEstado({ ocupado: true, msg: "Anexando o arquivo…" });
      const f = await reduzirFoto(arquivo);
      let erro = f.size > LIMITE_ANEXO ? "o arquivo passa de 4 MB" : "";
      if (!erro) {
        const a = new FormData();
        a.set("arquivo", f);
        a.set("tipo", "boleto");
        a.set("conta_pagar_id", String(id));
        try {
          erro = (await enviarAnexo(a)).erro ?? "";
        } catch {
          erro = "não foi possível enviar o arquivo";
        }
      }
      if (erro) {
        setVersao((v) => v + 1);
        setEstado({ ocupado: false, erro: true, msg: `Boleto lançado, mas ${erro}. Anexe pelo "📎 Anexar nota/boleto" do novo boleto.` });
        router.refresh();
        return;
      }
    }
    setVersao((v) => v + 1);
    setEstado({ ocupado: false });
    if (quadro) quadro.open = false;
    router.push("/pagar?lancado=1&anexos=" + (arquivo instanceof File && arquivo.size > 0 ? 1 : 0));
    router.refresh();
  }

  return (
    <form key={versao} onSubmit={enviar} className="mt-2 space-y-3 rounded-lg border border-line bg-background p-3">
      <p className="text-xs text-muted">Entra na mesma compra: a nota fiscal já anexada vale para este boleto também.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Valor do boleto">
          <input name="valor" inputMode="decimal" required defaultValue={valorCampo(valor)} className={cls.input} />
        </Campo>
        <Campo rotulo="Vencimento">
          <CampoData name="vencimento" required defaultValue={vencimento} />
        </Campo>
      </div>
      <Campo rotulo="📄 Arquivo do boleto (PDF ou foto)">
        <input
          name="arquivo"
          type="file"
          accept={ACEITA_ARQUIVOS}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold"
        />
      </Campo>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={estado.ocupado} className={cls.botaoPequeno}>
          {estado.ocupado ? "Salvando…" : "Lançar este boleto"}
        </button>
        {estado.msg && <p className={`text-xs ${estado.erro ? "text-danger" : "text-ok"}`}>{estado.msg}</p>}
      </div>
    </form>
  );
}
