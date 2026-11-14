"use client";

import { CampoData } from "@/components/campo-data";
import { useState } from "react";
import { FolhaJPG } from "./folha-jpg";
import { FolhaPedidos, type PedidoFolha } from "./folha-pedidos";
import { Campo, cls } from "./ui";

/** Gera o JPG "Solicitações de pedidos" para mandar à equipe. */
export function EquipeJPG({ pedidos, hoje }: { pedidos: PedidoFolha[]; hoje: string }) {
  const [data, setData] = useState(hoje);
  const [obs, setObs] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <Campo rotulo="Atualizado em" dica="Já vem com a data de hoje.">
          <CampoData value={data} onChange={(v) => v && setData(v)} />
        </Campo>
        <Campo rotulo="Observações gerais (opcional)">
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className={cls.input} placeholder="Ex.: Quinta não tem entrega na zona sul" />
        </Campo>
      </div>
      <FolhaJPG nomeArquivo={`Pedidos-${data.slice(8, 10)}-${data.slice(5, 7)}.jpg`} titulo="Pedidos pendentes">
        <FolhaPedidos pedidos={pedidos} data={data} observacoesGerais={obs} />
      </FolhaJPG>
    </div>
  );
}
