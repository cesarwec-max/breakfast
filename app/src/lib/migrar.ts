import { sql } from "./db";

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
`;

export async function migrar() {
  await sql.unsafe(ESQUEMA);
  await sql.unsafe(ATUALIZACOES);
}
