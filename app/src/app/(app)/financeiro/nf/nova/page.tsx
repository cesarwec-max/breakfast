import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { obterPedido } from "@/lib/dados";
import { opcoesFormulario } from "@/lib/opcoes";
import { Enviar } from "@/components/botoes";
import { ClienteSelect } from "@/components/cliente-select";
import { ItensEditor } from "@/components/itens-editor";
import { Aviso, Campo, Titulo, Vazio, cls } from "@/components/ui";
import { criarSolicitacaoNF } from "../../actions";

export const metadata: Metadata = { title: "Solicitar nota fiscal" };

export default async function NovaNF({ searchParams }: { searchParams: Promise<{ cliente?: string; pedido?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const pedido = sp.pedido ? await obterPedido(Number(sp.pedido)) : null;
  const { clientes, produtos } = await opcoesFormulario();
  const clienteId = pedido?.cliente_id ?? (sp.cliente ? Number(sp.cliente) : undefined);

  return (
    <>
      <Titulo
        titulo="Solicitar nota fiscal"
        subtitulo="Os dados do cliente vêm do cadastro. Só falta colocar o pedido."
        voltar={{ href: pedido ? `/pedidos/${pedido.id}` : "/financeiro", rotulo: "Voltar" }}
      />
      {pedido && <Aviso tom="destaque">Itens preenchidos a partir do pedido #{pedido.id}. Confira e ajuste se precisar.</Aviso>}
      {produtos.length === 0 ? (
        <Vazio>
          Cadastre os produtos primeiro em{" "}
          <Link href="/estoque" className={cls.link}>
            Estoque
          </Link>
          .
        </Vazio>
      ) : (
        <form action={criarSolicitacaoNF} className="space-y-5">
          {pedido && <input type="hidden" name="pedido_id" value={pedido.id} />}
          <ClienteSelect clientes={clientes} inicial={clienteId} voltar="/financeiro/nf/nova" modo="fiscal" />
          <ItensEditor produtos={produtos} inicial={pedido?.itens} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Vencimento (opcional)">
              <input type="date" name="vencimento" className={cls.input} />
            </Campo>
            <Campo rotulo="Forma de pagamento">
              <input name="pagamento" list="formas-pagamento" defaultValue="Boleto bancário" className={cls.input} />
              <datalist id="formas-pagamento">
                <option value="Boleto bancário" />
                <option value="PIX" />
                <option value="Transferência bancária" />
                <option value="Dinheiro" />
                <option value="Cartão" />
              </datalist>
            </Campo>
          </div>
          <Campo rotulo="Observações para a nota (opcional)">
            <textarea
              name="observacoes"
              rows={3}
              className={cls.input}
              placeholder="Uma observação por linha. Ex.: nº do pedido do cliente"
            />
          </Campo>
          <Enviar pendente="Gerando…">Gerar solicitação (PDF)</Enviar>
        </form>
      )}
    </>
  );
}
