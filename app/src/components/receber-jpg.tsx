"use client";

import { useState } from "react";
import { FolhaJPG } from "./folha-jpg";
import { FolhaReceber, type ContaFolha } from "./folha-receber";
import { Campo, cls } from "./ui";

/** Gera o JPG "Pedidos pendentes de pagamento". */
export function ReceberJPG({ contas, hoje }: { contas: ContaFolha[]; hoje: string }) {
  const [ate, setAte] = useState(hoje);
  const [soAtrasados, setSoAtrasados] = useState(false);
  const lista = soAtrasados ? contas.filter((c) => c.vencimento < ate) : contas;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Campo rotulo="Situação atualizada até" className="w-48">
          <input type="date" value={ate} onChange={(e) => e.target.value && setAte(e.target.value)} className={cls.input} />
        </Campo>
        <label className="flex items-center gap-2 pb-3 text-sm">
          <input type="checkbox" checked={soAtrasados} onChange={(e) => setSoAtrasados(e.target.checked)} className="size-4 accent-accent" />
          Mostrar só os atrasados
        </label>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-muted">Nenhum boleto atrasado nessa data.</p>
      ) : (
        <FolhaJPG nomeArquivo={`Pendentes-de-pagamento-${ate.slice(8, 10)}-${ate.slice(5, 7)}.jpg`} titulo="Pedidos pendentes de pagamento">
          <FolhaReceber contas={lista} ate={ate} />
        </FolhaJPG>
      )}
    </div>
  );
}
