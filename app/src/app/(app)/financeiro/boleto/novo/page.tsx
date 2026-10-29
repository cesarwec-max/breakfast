import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth";
import { obterPedido } from "@/lib/dados";
import { hoje, somarDias } from "@/lib/formato";
import { opcoesFormulario } from "@/lib/opcoes";
import { Enviar } from "@/components/botoes";
import { ClienteSelect } from "@/components/cliente-select";
import { ParcelasEditor } from "@/components/parcelas-editor";
import { Aviso, Campo, Titulo, cls } from "@/components/ui";
import { criarSolicitacaoBoleto } from "../../actions";

export const metadata: Metadata = { title: "Solicitar boleto" };

export default async function NovoBoleto({ searchParams }: { searchParams: Promise<{ cliente?: string; pedido?: string }> }) {
  await exigirLogin();
  const sp = await searchParams;
  const pedido = sp.pedido ? await obterPedido(Number(sp.pedido)) : null;
  const { clientes } = await opcoesFormulario();
  const clienteId = pedido?.cliente_id ?? (sp.cliente ? Number(sp.cliente) : undefined);

  return (
    <>
      <Titulo
        titulo="Solicitar boleto"
        subtitulo="Os dados do cliente vêm do cadastro. Só falta colocar os valores e vencimentos."
        voltar={{ href: pedido ? `/pedidos/${pedido.id}` : "/financeiro", rotulo: "Voltar" }}
      />
      {pedido && <Aviso tom="destaque">Valor preenchido com o total do pedido #{pedido.id}.</Aviso>}
      <form action={criarSolicitacaoBoleto} className="space-y-5">
        {pedido && <input type="hidden" name="pedido_id" value={pedido.id} />}
        <ClienteSelect clientes={clientes} inicial={clienteId} voltar="/financeiro/boleto/novo" modo="fiscal" />
        <ParcelasEditor totalSugerido={pedido?.total} primeiroVencimento={somarDias(hoje(), 30)} />
        <Campo rotulo="Referente a (opcional)" dica="Aparece no boleto e em Contas a receber.">
          <input name="referencia" defaultValue={pedido ? `Pedido #${pedido.id}` : ""} className={cls.input} placeholder="Ex.: NF 1234, pedido de outubro" />
        </Campo>
        <Campo rotulo="Observações (opcional)">
          <textarea name="observacoes" rows={2} className={cls.input} />
        </Campo>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="lancar_receber" defaultChecked className="mt-0.5 size-4 accent-accent" />
          <span>Lançar estes boletos em Contas a receber</span>
        </label>
        <Enviar pendente="Gerando…">Gerar solicitação (JPG)</Enviar>
      </form>
    </>
  );
}
