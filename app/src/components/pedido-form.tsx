import Link from "next/link";
import { ClienteSelect, type OpcaoCliente } from "./cliente-select";
import { ItensEditor, type OpcaoProduto } from "./itens-editor";
import { Enviar } from "./botoes";
import { FORMAS_PAGAMENTO } from "@/lib/empresa";
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
    forma_pagamento?: string;
    vencimento_pagamento?: string | null;
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Forma de pagamento" dica="Aparece na ordem de pedido. No PIX vai a chave breakfastpix@gmail.com.">
          <input name="forma_pagamento" list="formas-pagamento" defaultValue={inicial.forma_pagamento ?? "PIX"} className={cls.input} />
          <datalist id="formas-pagamento">
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Pagar até (opcional)">
          <input type="date" name="vencimento_pagamento" defaultValue={inicial.vencimento_pagamento ?? ""} className={cls.input} />
        </Campo>
      </div>
      <Campo rotulo="Observação (opcional)">
        <textarea name="observacao" rows={2} defaultValue={inicial.observacao} className={cls.input} placeholder="Ex.: entregar até 10h, falar com Maria" />
      </Campo>
      <Enviar>{textoBotao}</Enviar>
    </form>
  );
}
