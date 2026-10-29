import { sql } from "./db";

type Tx = Parameters<Parameters<typeof sql.begin>[1]>[0];

/**
 * Mantém em Contas a receber a conta do pedido (valor total, vencimento = "pagar até" ou a data de entrega).
 * - Pedido cancelado/excluído, ou que já tem boletos solicitados no Financeiro: a conta automática some
 *   (os boletos é que valem). Uma conta já marcada como recebida nunca é apagada nem alterada.
 */
export async function sincronizarReceber(tx: Tx, pedidoId: number, excluindo = false) {
  const [p] = await tx<
    { status: string; cliente_id: number; total: number; forma_pagamento: string; vencimento: string; boletos: number }[]
  >`
    SELECT pe.status, pe.cliente_id, pe.forma_pagamento,
      COALESCE(pe.vencimento_pagamento, pe.data_entrega) AS vencimento,
      COALESCE((SELECT SUM(i.quantidade * i.preco_unitario) FROM pedido_itens i WHERE i.pedido_id = pe.id), 0)::numeric AS total,
      (SELECT count(*)::int FROM contas_receber r LEFT JOIN solicitacoes s ON s.id = r.solicitacao_id
        WHERE NOT r.automatica AND (s.pedido_id = pe.id OR r.pedido_id = pe.id)) AS boletos
    FROM pedidos pe WHERE pe.id = ${pedidoId}`;
  if (!p) return;
  const [conta] = await tx<{ id: number; pago_em: string | null }[]>`
    SELECT id, pago_em FROM contas_receber WHERE pedido_id = ${pedidoId} AND automatica ORDER BY id LIMIT 1`;

  const semConta = excluindo || p.status === "cancelado" || p.boletos > 0 || p.total <= 0;
  if (semConta) {
    if (conta && !conta.pago_em) await tx`DELETE FROM contas_receber WHERE id = ${conta.id}`;
    return;
  }
  const descricao = `Pedido #${pedidoId}${p.forma_pagamento ? ` · ${p.forma_pagamento}` : ""}`;
  if (!conta) {
    await tx`
      INSERT INTO contas_receber (cliente_id, pedido_id, automatica, descricao, valor, vencimento)
      VALUES (${p.cliente_id}, ${pedidoId}, true, ${descricao}, ${p.total}, ${p.vencimento})`;
  } else if (!conta.pago_em) {
    await tx`
      UPDATE contas_receber SET cliente_id = ${p.cliente_id}, descricao = ${descricao}, valor = ${p.total}, vencimento = ${p.vencimento}
      WHERE id = ${conta.id}`;
  }
}
