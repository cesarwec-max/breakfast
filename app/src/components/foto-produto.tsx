"use client";

/* eslint-disable @next/next/no-img-element */
import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { removerFotoProduto, salvarFotoProduto } from "@/app/(app)/estoque/actions";
import { reduzirFoto } from "./anexos";
import { cls } from "./ui";

/** Foto opcional do produto: aparece na coluna "Produto" do JPG de pedidos. */
export function FotoProduto({ id, temFoto }: { id: number; temFoto: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<{ ocupado: boolean; erro?: string }>({ ocupado: false });
  // Muda depois de cada envio para o navegador buscar a foto nova
  const [versao, setVersao] = useState(0);

  async function enviar(f?: File) {
    if (!f) return;
    setEstado({ ocupado: true });
    const pequena = await reduzirFoto(f, 900, 0);
    const fd = new FormData();
    fd.set("foto", pequena);
    const r = await salvarFotoProduto(id, fd).catch(() => ({ erro: "Não foi possível enviar a foto." }));
    if (entrada.current) entrada.current.value = "";
    setEstado({ ocupado: false, erro: r.erro });
    setVersao((v) => v + 1);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border border-line bg-background">
        {temFoto ? (
          <img src={`/produtos/${id}/foto?v=${versao}`} alt="Foto do produto" className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-muted">Sem foto</span>
        )}
      </div>
      <div className="space-y-2">
        <label className={`${cls.botao2} cursor-pointer ${estado.ocupado ? "pointer-events-none opacity-60" : ""}`}>
          <ImagePlus size={16} />
          {estado.ocupado ? "Enviando…" : temFoto ? "Trocar foto" : "Adicionar foto"}
          <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" onChange={(e) => enviar(e.target.files?.[0])} />
        </label>
        {temFoto && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Remover a foto deste produto?")) return;
              await removerFotoProduto(id);
              router.refresh();
            }}
            className="flex items-center gap-1 text-xs text-muted hover:text-danger"
          >
            <Trash2 size={12} /> Remover foto
          </button>
        )}
        {estado.erro && <p className="text-xs text-danger">{estado.erro}</p>}
        <p className="text-xs text-muted">Aparece no JPG de pedidos para a equipe.</p>
      </div>
    </div>
  );
}
