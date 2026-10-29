// "Pix copia e cola" (BR Code estático) no padrão do Banco Central (Manual de Padrões para Iniciação do Pix).
// O mesmo texto vira o QR Code da ordem de pedido.

function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, "0") + valor;
}

/** Remove acentos e caracteres fora do padrão (nome e cidade só aceitam letras simples). */
function limpar(t: string, max: number) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como exige o padrão. */
export function crc16(texto: string) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function pixCopiaECola({
  chave,
  nome,
  cidade,
  valor,
  identificador,
}: {
  chave: string;
  nome: string;
  cidade: string;
  valor?: number;
  identificador?: string;
}) {
  const txid = (identificador ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const semCrc =
    campo("00", "01") +
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave.trim())) +
    campo("52", "0000") +
    campo("53", "986") +
    (valor && valor > 0 ? campo("54", valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", limpar(nome, 25)) +
    campo("60", limpar(cidade, 15)) +
    campo("62", campo("05", txid)) +
    "6304";
  return semCrc + crc16(semCrc);
}
