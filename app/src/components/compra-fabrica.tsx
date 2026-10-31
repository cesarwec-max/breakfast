"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarAnexo } from "@/app/(app)/anexos-actions";
import { lancarPagar } from "@/app/(app)/contas-actions";
import { ACEITA_ARQUIVOS, LIMITE_ANEXO } from "@/lib/anexos";
import { lerValor } from "@/lib/formato";
import { reduzirFoto } from "./anexos";
import { ParcelasEditor } from "./parcelas-editor";
import { Campo, cls } from "./ui";

const arquivoEscolhido = (v: FormDataEntryValue | null): v is File => v instanceof File && v.size > 0;

/**
 * Lançar uma compra (da fábrica ou de outro fornecedor): boletos + nota fiscal e o arquivo de cada boleto.
 * Primeiro lança as parcelas; depois envia os arquivos um a um (cada envio cabe no limite da Vercel).
 */
export function CompraFabrica({ fornecedores, primeiroVencimento }: { fornecedores: string[]; primeiroVencimento: string }) {
  const router = useRouter();
  const [versao, setVersao] = useState(0); // trocar a chave limpa o formulário (inclusive os boletos)
  const [estado, setEstado] = useState<{ ocupado: boolean; msg?: string; erro?: boolean }>({ ocupado: false });

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nota = fd.get("nota");
    const boletos = fd.getAll("parcela_boleto");
    fd.delete("nota");
    fd.delete("parcela_boleto");

    // As mesmas parcelas que o servidor aceita (valor > 0 e data), para casar cada arquivo com o seu boleto
    const valores = fd.getAll("parcela_valor").map((v) => lerValor(v));
    const datas = fd.getAll("parcela_vencimento").map(String);
    const validas = valores.map((v, i) => v > 0 && /^\d{4}-\d{2}-\d{2}$/.test(datas[i] ?? "")).map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0);

    setEstado({ ocupado: true, msg: "Lançando os boletos…" });
    let ids: number[];
    try {
      const r = await lancarPagar(fd);
      if (r.erro || !r.ids) return setEstado({ ocupado: false, erro: true, msg: r.erro ?? "Não foi possível lançar." });
      ids = r.ids;
    } catch {
      return setEstado({ ocupado: false, erro: true, msg: "Não foi possível lançar. Tente de novo." });
    }

    const envios: { arquivo: File; tipo: string; contaId: number; rotulo: string }[] = [];
    if (arquivoEscolhido(nota)) envios.push({ arquivo: nota, tipo: "nf", contaId: ids[0], rotulo: "a nota fiscal" });
    validas.forEach((linha, n) => {
      const b = boletos[linha];
      if (arquivoEscolhido(b) && ids[n]) envios.push({ arquivo: b, tipo: "boleto", contaId: ids[n], rotulo: `o boleto ${n + 1}` });
    });

    const erros: string[] = [];
    for (const [n, x] of envios.entries()) {
      setEstado({ ocupado: true, msg: `Anexando arquivos (${n + 1} de ${envios.length})…` });
      const f = await reduzirFoto(x.arquivo);
      if (f.size > LIMITE_ANEXO) {
        erros.push(`${x.rotulo} passa de 4 MB`);
        continue;
      }
      const a = new FormData();
      a.set("arquivo", f);
      a.set("tipo", x.tipo);
      a.set("conta_pagar_id", String(x.contaId));
      try {
        const r = await enviarAnexo(a);
        if (r.erro) erros.push(`${x.rotulo}: ${r.erro}`);
      } catch {
        erros.push(`não foi possível enviar ${x.rotulo}`);
      }
    }

    if (erros.length) {
      setEstado({
        ocupado: false,
        erro: true,
        msg: `Boletos lançados, mas ${erros.join("; ")}. Anexe de novo pelo botão "📎 Anexar nota/boleto" na lista acima.`,
      });
      setVersao((v) => v + 1);
      router.refresh();
      return;
    }
    setVersao((v) => v + 1);
    setEstado({ ocupado: false });
    router.push(`/pagar?lancado=${ids.length}&anexos=${envios.length}`);
    router.refresh();
  }

  return (
    <form key={versao} onSubmit={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Fornecedor">
          <input name="fornecedor" defaultValue="Fábrica" list="fornecedores" className={cls.input} />
          <datalist id="fornecedores">
            {fornecedores.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Descrição (opcional)">
          <input name="descricao" className={cls.input} placeholder="Ex.: NF 5678, compra de outubro" />
        </Campo>
      </div>
      <Campo rotulo="📄 Nota fiscal da compra (PDF ou foto)" dica="Opcional agora: dá para anexar depois na lista.">
        <input
          name="nota"
          type="file"
          accept={ACEITA_ARQUIVOS}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold"
        />
      </Campo>
      <ParcelasEditor primeiroVencimento={primeiroVencimento} linhasIniciais={2} comBoleto />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={estado.ocupado} className={cls.botao}>
          {estado.ocupado ? "Salvando…" : "Lançar compra"}
        </button>
        {estado.msg && <p className={`text-sm ${estado.erro ? "text-danger" : "text-muted"}`}>{estado.msg}</p>}
      </div>
    </form>
  );
}
