import type { Pedido } from "@/lib/dados";
import { diasEntre, hoje } from "@/lib/formato";
import { Selo } from "@/components/ui";

export function SeloEntrega({ pedido }: { pedido: Pick<Pedido, "status" | "data_entrega"> }) {
  if (pedido.status === "entregue") return <Selo tom="ok">Entregue</Selo>;
  if (pedido.status === "cancelado") return <Selo>Cancelado</Selo>;
  const dias = diasEntre(hoje(), pedido.data_entrega);
  if (dias < 0) return <Selo tom="perigo">Atrasado</Selo>;
  if (dias === 0) return <Selo tom="destaque">Entregar hoje</Selo>;
  if (dias === 1) return <Selo tom="aviso">Amanhã</Selo>;
  return <Selo tom="aviso">Pendente</Selo>;
}
