import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { listarContasReceber } from "@/lib/dados";
import { brl, hoje } from "@/lib/formato";
import { ReceberJPG } from "@/components/receber-jpg";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "JPG de pendentes de pagamento" };

export default async function ReceberJPGPagina() {
  await exigirLogin();
  const dia = hoje();
  const contas = await listarContasReceber("abertos", dia);
  const total = contas.reduce((s, c) => s + c.valor, 0);

  return (
    <>
      <Titulo
        titulo="JPG de pendentes de pagamento"
        subtitulo={`${contas.length} boleto(s) em aberto · ${brl(total)}`}
        voltar={{ href: "/receber", rotulo: "Contas a receber" }}
      />
      {contas.length === 0 ? (
        <Vazio>Nenhum boleto em aberto. 🎉</Vazio>
      ) : (
        <ReceberJPG contas={contas.map((c) => ({ id: c.id, cliente: c.cliente, valor: c.valor, vencimento: c.vencimento }))} hoje={dia} />
      )}
    </>
  );
}
