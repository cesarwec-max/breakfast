import { sql } from "./db";
import { sincronizarReceber } from "./receber-pedido";

// Cria as tabelas que ainda não existem. Roda sozinho quando o servidor liga.
// Para mudar uma tabela existente, adicione um "ALTER TABLE ... IF NOT EXISTS" no fim.
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS clientes (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  razao_social text NOT NULL DEFAULT '',
  cnpj_cpf text NOT NULL DEFAULT '',
  inscricao_estadual text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  numero text NOT NULL DEFAULT '',
  complemento text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  uf text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  preco numeric(12,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  data_entrega date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','entregue','cancelado')),
  observacao text NOT NULL DEFAULT '',
  entregue_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id serial PRIMARY KEY,
  pedido_id integer NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id integer NOT NULL REFERENCES produtos(id),
  quantidade numeric(12,2) NOT NULL,
  preco_unitario numeric(12,2) NOT NULL DEFAULT 0
);

-- Estoque: entrada (+), saída (-) e ajuste (diferença, pode ser negativa)
CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id serial PRIMARY KEY,
  produto_id integer NOT NULL REFERENCES produtos(id),
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric(12,2) NOT NULL,
  observacao text NOT NULL DEFAULT '',
  pedido_id integer REFERENCES pedidos(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Solicitações de nota fiscal (PDF) e de boleto (JPG) enviadas ao setor financeiro
CREATE TABLE IF NOT EXISTS solicitacoes (
  id serial PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('nf','boleto')),
  cliente_id integer NOT NULL REFERENCES clientes(id),
  pedido_id integer REFERENCES pedidos(id) ON DELETE SET NULL,
  dados jsonb NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  solicitacao_id integer REFERENCES solicitacoes(id) ON DELETE SET NULL,
  descricao text NOT NULL DEFAULT '',
  valor numeric(12,2) NOT NULL,
  vencimento date NOT NULL,
  pago_em date,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id serial PRIMARY KEY,
  fornecedor text NOT NULL DEFAULT 'Fábrica',
  descricao text NOT NULL DEFAULT '',
  valor numeric(12,2) NOT NULL,
  vencimento date NOT NULL,
  pago_em date,
  criado_em timestamptz NOT NULL DEFAULT now()
);
`;

// Mudanças depois da primeira versão
const ATUALIZACOES = `
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS sabor text NOT NULL DEFAULT '';

-- Notas fiscais, boletos e outros arquivos devolvidos pelo financeiro
CREATE TABLE IF NOT EXISTS anexos (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  pedido_id integer REFERENCES pedidos(id) ON DELETE SET NULL,
  conta_receber_id integer REFERENCES contas_receber(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('nf','boleto','outro')),
  nome_arquivo text NOT NULL,
  mime text NOT NULL,
  tamanho integer NOT NULL,
  conteudo bytea NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS anexos_pedido ON anexos (pedido_id);
CREATE INDEX IF NOT EXISTS anexos_cliente ON anexos (cliente_id);
CREATE INDEX IF NOT EXISTS anexos_conta ON anexos (conta_receber_id);

-- Anexos da fábrica (contas a pagar): não têm cliente
ALTER TABLE anexos ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE anexos ADD COLUMN IF NOT EXISTS conta_pagar_id integer REFERENCES contas_pagar(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS anexos_conta_pagar ON anexos (conta_pagar_id);
-- Boletos lançados juntos (parcelas da mesma compra) compartilham o "lote" e os anexos
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS lote integer;

-- Status "em rota" (saiu para entrega) e foto opcional do produto
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK (status IN ('pendente','em_rota','entregue','cancelado'));
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS foto bytea;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS foto_mime text;

-- Forma de pagamento do pedido (aparece na ordem de pedido)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento text NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vencimento_pagamento date;

-- Conta a receber criada direto pelo pedido (sem solicitação de boleto)
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS pedido_id integer REFERENCES pedidos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS contas_receber_pedido ON contas_receber (pedido_id);
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS automatica boolean NOT NULL DEFAULT false;
`;

export async function migrar() {
  await sql.unsafe(ESQUEMA);
  await sql.unsafe(ATUALIZACOES);
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS migracoes (nome text PRIMARY KEY, feita_em timestamptz NOT NULL DEFAULT now())`);

  // Uma vez só: o estoque passou a ser descontado no lançamento do pedido (antes era na entrega).
  // Pedidos que já estavam a entregar recebem o desconto agora.
  await sql.begin(async (tx) => {
    const [nova] = await tx`INSERT INTO migracoes (nome) VALUES ('estoque-no-lancamento') ON CONFLICT DO NOTHING RETURNING nome`;
    if (!nova) return;
    await tx`
      INSERT INTO estoque_movimentos (produto_id, tipo, quantidade, observacao, pedido_id)
      SELECT i.produto_id, 'saida', SUM(i.quantidade), 'Pedido #' || pe.id || ' a entregar (desconto no lançamento)', pe.id
      FROM pedidos pe JOIN pedido_itens i ON i.pedido_id = pe.id
      WHERE pe.status IN ('pendente', 'em_rota')
        AND NOT EXISTS (SELECT 1 FROM estoque_movimentos m WHERE m.pedido_id = pe.id)
      GROUP BY pe.id, i.produto_id`;
  });

  // Uma vez só: pedidos passaram a gerar conta em "A receber". Entram os já lançados que não foram
  // cancelados, ainda não têm conta e já têm forma de pagamento ou ainda vão ser entregues.
  await sql.begin(async (tx) => {
    const [nova] = await tx`INSERT INTO migracoes (nome) VALUES ('receber-dos-pedidos') ON CONFLICT DO NOTHING RETURNING nome`;
    if (!nova) return;
    const pedidos = await tx<{ id: number }[]>`
      SELECT pe.id FROM pedidos pe
      WHERE pe.status <> 'cancelado'
        AND (pe.forma_pagamento <> '' OR pe.status IN ('pendente', 'em_rota'))
        AND NOT EXISTS (
          SELECT 1 FROM contas_receber r LEFT JOIN solicitacoes s ON s.id = r.solicitacao_id
          WHERE r.pedido_id = pe.id OR s.pedido_id = pe.id)`;
    for (const p of pedidos) await sincronizarReceber(tx, p.id);
  });
}
