// Dados da Breakfast que aparecem nas solicitações. Mude aqui se algo mudar.

export const EMPRESA = {
  slogan: "Distribuindo sabor e praticidade",
  emailFinanceiro: "breakfastpix@gmail.com",
};

export function orientacoesBoleto(qtd: number) {
  return [
    qtd > 1
      ? `Emitir os ${qtd} boletos com os vencimentos e valores informados nesta solicitação.`
      : "Emitir o boleto com o vencimento e o valor informados nesta solicitação.",
    "Conferir CNPJ e endereço do cliente antes da emissão.",
    `Após a emissão, enviar ${qtd > 1 ? "os boletos" : "o boleto"} para ${EMPRESA.emailFinanceiro}.`,
  ];
}

/** Ex.: "Solicitacao-NF-12-Padaria-Teste.pdf" */
export function nomeArquivo(prefixo: string, numero: number, cliente: string, ext: string) {
  const limpo = cliente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${prefixo}-${numero}-${limpo}.${ext}`;
}
