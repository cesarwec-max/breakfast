"use client";

/* eslint-disable @next/next/no-img-element */
import { Camera, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { enviarAnexo } from "@/app/(app)/anexos-actions";
import { LIMITE_ANEXO } from "@/lib/anexos";
import { reduzirFoto, type AnexoTela } from "./anexos";
import { cls } from "./ui";

/**
 * Foto do canhoto assinado por quem recebeu a entrega (comprovante para divergência de pagamento).
 * Fica nos anexos do pedido (tipo "canhoto"): aparece também em Contas a receber e na ficha do cliente.
 */
export function Canhoto({ pedidoId, canhotos, entregue }: { pedidoId: number; canhotos: AnexoTela[]; entregue: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<{ ocupado: boolean; erro?: string }>({ ocupado: false });

  async function enviar(lista: FileList | null) {
    if (!lista?.length) return;
    setEstado({ ocupado: true });
    let erro = "";
    for (const original of Array.from(lista)) {
      const f = await reduzirFoto(original);
      if (f.size > LIMITE_ANEXO) {
        erro = "A foto passa de 4 MB.";
        continue;
      }
      const fd = new FormData();
      fd.set("arquivo", f);
      fd.set("tipo", "canhoto");
      fd.set("pedido_id", String(pedidoId));
      try {
        const r = await enviarAnexo(fd);
        if (r.erro) erro = r.erro;
      } catch {
        erro = "Não foi possível enviar. Tente de novo.";
      }
    }
    if (entrada.current) entrada.current.value = "";
    router.refresh();
    setEstado({ ocupado: false, erro });
  }

  const tem = canhotos.length > 0;
  return (
    <div className={`space-y-2 rounded-xl border p-4 ${tem ? "border-ok/30 bg-ok-soft/40" : entregue ? "border-warn/40 bg-warn-soft/50" : "border-line bg-surface"}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {tem ? <CheckCircle2 size={18} className="text-ok" /> : <Camera size={18} className="text-accent" />}
        Canhoto assinado
      </div>
      {tem ? (
        <div className="flex flex-wrap gap-2">
          {canhotos.map((c) =>
            c.mime.startsWith("image/") ? (
              <a key={c.id} href={`/anexos/${c.id}`} target="_blank" rel="noreferrer" title={`Abrir ${c.nome_arquivo}`}>
                <img src={`/anexos/${c.id}`} alt="Canhoto assinado" className="h-24 w-24 rounded-lg border border-line object-cover" />
              </a>
            ) : (
              <a key={c.id} href={`/anexos/${c.id}`} target="_blank" rel="noreferrer" className={cls.botaoPequeno}>
                📄 {c.nome_arquivo}
              </a>
            ),
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">
          {entregue
            ? "Ainda sem a foto do canhoto. Envie para ter o comprovante da entrega."
            : "Na entrega, tire uma foto do canhoto assinado por quem recebeu. Serve de comprovante se houver divergência no pagamento."}
        </p>
      )}
      <label className={`${tem ? cls.botao2 : cls.botao} w-full cursor-pointer ${estado.ocupado ? "pointer-events-none opacity-60" : ""}`}>
        <Camera size={16} />
        {estado.ocupado ? "Enviando…" : tem ? "Enviar outra foto" : "📸 Foto do canhoto"}
        <input ref={entrada} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => enviar(e.target.files)} />
      </label>
      {estado.erro && <p className="text-xs text-danger">{estado.erro}</p>}
      {tem && <p className="text-xs text-muted">Para enviar ao cliente ou apagar, use a lista de documentos abaixo.</p>}
    </div>
  );
}
