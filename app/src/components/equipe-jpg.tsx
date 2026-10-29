"use client";

import { useState } from "react";
import { FolhaJPG } from "./folha-jpg";
import { FolhaPedidos, type PedidoFolha } from "./folha-pedidos";
import { Campo, cls } from "./ui";

/** Gera o JPG "Solicitações de pedidos" para mandar à equipe. */
export function EquipeJPG({ pedidos, semanaInicial }: { pedidos: PedidoFolha[]; semanaInicial: string }) {
  const [semana, setSemana] = useState(semanaInicial);
  const [obs, setObs] = useState("");

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
      <FolhaJPG nomeArquivo={`Pedidos-semana-${semana.slice(8, 10)}-${semana.slice(5, 7)}.jpg`} titulo="Pedidos pendentes">
        <FolhaPedidos pedidos={pedidos} semana={semana} observacoesGerais={obs} />
      </FolhaJPG>
    </div>
  );
}
