"use client";

import { useEffect, useState } from "react";
import { EMPRESA } from "@/lib/empresa";
import { pixCopiaECola } from "@/lib/pix";
import { FolhaOrdem, ehPix, type DadosOrdem } from "./documentos";
import { FolhaJPG } from "./folha-jpg";

/** Ordem de pedido para mandar ao cliente (JPG ou PDF), com QR Code do PIX quando o pagamento for PIX. */
export function OrdemJPG({ dados }: { dados: DadosOrdem }) {
  const pix = ehPix(dados.formaPagamento);
  const codigo = pix
    ? pixCopiaECola({ chave: EMPRESA.chavePix, nome: EMPRESA.pixNome, cidade: EMPRESA.pixCidade, valor: dados.total, identificador: `PEDIDO${dados.id}` })
    : undefined;
  const [qr, setQr] = useState<string>();

  useEffect(() => {
    if (!codigo) return;
    import("qrcode").then((q) => q.toDataURL(codigo, { margin: 1, width: 420, errorCorrectionLevel: "M" })).then(setQr);
  }, [codigo]);

  const nome = (dados.cliente.nome || "cliente")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return (
    <FolhaJPG nomeArquivo={`Ordem-de-pedido-${dados.id}-${nome}.jpg`} titulo={`Ordem de pedido nº ${dados.id}`} comPdf>
      <FolhaOrdem dados={dados} qrPix={qr} pixCopiaECola={codigo} />
    </FolhaJPG>
  );
}
