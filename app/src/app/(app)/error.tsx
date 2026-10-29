"use client";

import { cls } from "@/components/ui";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-danger/30 bg-danger-soft p-6 text-center">
      <h2 className="text-lg font-semibold text-danger">Algo deu errado</h2>
      <p className="mt-2 text-sm text-muted">
        Confira se os campos estão preenchidos corretamente e tente de novo. Se continuar, avise quem cuida do sistema.
      </p>
      <button onClick={reset} className={`${cls.botao} mt-4`}>
        Tentar de novo
      </button>
    </div>
  );
}
