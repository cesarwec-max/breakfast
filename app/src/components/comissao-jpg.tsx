"use client";

import { FolhaComissao, type DadosRelatorio } from "./folha-comissao";
import { FolhaJPG } from "./folha-jpg";

/** Relatório de produção do representante em JPG ou PDF. */
export function ComissaoJPG({ dados, nomeArquivo }: { dados: DadosRelatorio; nomeArquivo: string }) {
  return (
    <FolhaJPG nomeArquivo={nomeArquivo} titulo={`Relatório de produção · ${dados.representante}`} comPdf>
      <FolhaComissao d={dados} />
    </FolhaJPG>
  );
}
