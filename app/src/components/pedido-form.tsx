import Link from "next/link";
import { ClienteSelect, type OpcaoCliente } from "./cliente-select";
import { ItensEditor, type OpcaoProduto } from "./itens-editor";
import { Enviar } from "./botoes";
import { Campo, Vazio, cls } from "./ui";

export function PedidoForm({
  acao,
  clientes,
  produtos,
  voltar,
  inicial,
  textoBotao,
}: {
  acao: (form: FormData) => Promise<void>;
  clientes: OpcaoCliente[];
  produtos: OpcaoProduto[];
  voltar: string;
  inicial: {
    cliente_id?: number;
    data_entrega: string;
    observacao?: string;
    itens?: { produto_id: number; quantidade: number; preco_unitario: number }[];
  };
  textoBotao: string;
}) {
  if (produtos.length === 0) {
    return (
      <Vazio>
        Cadastre os produtos primeiro em{" "}
        <Link href="/estoque" className={cls.link}>
          Estoque
        </Link>
        .
      </Vazio>
    );
  }
  return (
    <form action={acao} className="space-y-5">
      <ClienteSelect clientes={clientes} inicial={inicial.cliente_id} voltar={voltar} />
      <Campo rotulo="Data de entrega *" className="max-w-xs">
        <input type="date" name="data_entrega" required defaultValue={inicial.data_entrega} className={cls.input} />
      </Campo>
      <ItensEditor produtos={produtos} inicial={inicial.itens} />
      <Campo rotulo="Observação (opcional)">
        <textarea name="observacao" rows={2} defaultValue={inicial.observacao} className={cls.input} placeholder="Ex.: entregar até 10h, falar com Maria" />
      </Campo>
      <Enviar>{textoBotao}</Enviar>
    </form>
  );
}
