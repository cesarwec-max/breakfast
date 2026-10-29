import { lerValor } from "./formato";

/** Lê os itens enviados pelo ItensEditor (item_produto / item_qtd / item_preco). */
export function lerItens(form: FormData) {
  const produtos = form.getAll("item_produto").map(Number);
  const qtds = form.getAll("item_qtd").map((v) => lerValor(v));
  const precos = form.getAll("item_preco").map((v) => lerValor(v));
  const itens = produtos
    .map((produto_id, i) => ({ produto_id, quantidade: qtds[i] ?? 0, preco_unitario: precos[i] ?? 0 }))
    .filter((i) => i.produto_id && i.quantidade > 0);
  if (itens.length === 0) throw new Error("Adicione pelo menos um item.");
  return itens;
}
