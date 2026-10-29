import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { ClienteForm } from "@/components/cliente-form";
import { Titulo } from "@/components/ui";
import { criarCliente } from "../actions";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NovoCliente({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  await exigirLogin();
  const { voltar } = await searchParams;
  return (
    <>
      <Titulo titulo="Novo cliente" voltar={{ href: voltar ?? "/clientes", rotulo: "Voltar" }} />
      <ClienteForm acao={criarCliente} voltar={voltar} textoBotao="Cadastrar cliente" />
    </>
  );
}
