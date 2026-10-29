import { enderecoCurto, listarClientes, listarProdutos, type Cliente } from "./dados";
import type { OpcaoCliente } from "@/components/cliente-select";
import type { OpcaoProduto } from "@/components/itens-editor";

export function faltaFiscal(c: Cliente) {
  const falta: string[] = [];
  if (!c.razao_social) falta.push("razão social");
  if (!c.cnpj_cpf) falta.push("CNPJ/CPF");
  if (!c.endereco || !c.cidade) falta.push("endereço");
  if (!c.email) falta.push("e-mail");
  return falta;
}

/** Listas enxutas para os campos de escolha (cliente e produto). */
export async function opcoesFormulario() {
  const [clientes, produtos] = await Promise.all([listarClientes(), listarProdutos()]);
  return {
    clientes: clientes.map<OpcaoCliente>((c) => ({ id: c.id, nome: c.nome, endereco: enderecoCurto(c), faltaFiscal: faltaFiscal(c) })),
    produtos: produtos.map<OpcaoProduto>((p) => ({ id: p.id, nome: p.sabor ? `${p.nome} · ${p.sabor}` : p.nome, unidade: p.unidade, preco: p.preco })),
  };
}
