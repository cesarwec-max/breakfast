import { sql } from "./db";

// ---------- Clientes ----------

export type Cliente = {
  id: number;
  nome: string;
  razao_social: string;
  cnpj_cpf: string;
  inscricao_estadual: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  observacoes: string;
};

export const CAMPOS_CLIENTE = [
  "nome",
  "razao_social",
  "cnpj_cpf",
  "inscricao_estadual",
  "email",
  "telefone",
  "cep",
  "endereco",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "observacoes",
] as const;

/** "Rua X, 10 - Bairro, Cidade/UF" */
export function enderecoCurto(c: Pick<Cliente, "endereco" | "numero" | "complemento" | "bairro" | "cidade" | "uf">) {
  const rua = [c.endereco, c.numero].filter(Boolean).join(", ");
  const comp = c.complemento ? ` (${c.complemento})` : "";
  const cidade = [c.cidade, c.uf].filter(Boolean).join("/");
  return [rua + comp, c.bairro, cidade].filter(Boolean).join(" - ");
}

export async function listarClientes(busca = "") {
  const q = `%${busca.trim()}%`;
  return sql<Cliente[]>`
    SELECT * FROM clientes
    WHERE ${busca.trim() ? sql`(nome ILIKE ${q} OR razao_social ILIKE ${q} OR cnpj_cpf ILIKE ${q})` : sql`true`}
    ORDER BY lower(nome)`;
}

export async function obterCliente(id: number) {
  const [c] = await sql<Cliente[]>`SELECT * FROM clientes WHERE id = ${id}`;
  return c ?? null;
}

// ---------- Produtos e estoque ----------

export type Produto = {
  id: number;
  nome: string;
  sabor: string;
  unidade: string;
  preco: number;
  ativo: boolean;
  saldo: number;
};

export async function listarProdutos({ incluirInativos = false } = {}) {
  return sql<Produto[]>`
    SELECT p.*, COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN -m.quantidade ELSE m.quantidade END), 0)::numeric AS saldo
    FROM produtos p
    LEFT JOIN estoque_movimentos m ON m.produto_id = p.id
    WHERE ${incluirInativos ? sql`true` : sql`p.ativo`}
    GROUP BY p.id
    ORDER BY p.ativo DESC, lower(p.nome), lower(p.sabor)`;
}

export async function obterProduto(id: number) {
  const [p] = await sql<Produto[]>`
    SELECT p.*, COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN -m.quantidade ELSE m.quantidade END), 0)::numeric AS saldo
    FROM produtos p
    LEFT JOIN estoque_movimentos m ON m.produto_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id`;
  return p ?? null;
}

export type Movimento = {
  id: number;
  produto_id: number;
  produto: string;
  unidade: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  observacao: string;
  pedido_id: number | null;
  criado_em: Date;
};

export async function listarMovimentos({ produtoId, limite = 50 }: { produtoId?: number; limite?: number } = {}) {
  return sql<Movimento[]>`
    SELECT m.*, p.nome AS produto, p.unidade
    FROM estoque_movimentos m JOIN produtos p ON p.id = m.produto_id
    WHERE ${produtoId ? sql`m.produto_id = ${produtoId}` : sql`true`}
    ORDER BY m.criado_em DESC, m.id DESC
    LIMIT ${limite}`;
}

// ---------- Pedidos ----------

export type StatusPedido = "pendente" | "entregue" | "cancelado";

export type ItemPedido = {
  produto_id: number;
  produto: string;
  sabor: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
};

export type Pedido = {
  id: number;
  cliente_id: number;
  cliente: string;
  endereco: string;
  data_entrega: string;
  status: StatusPedido;
  observacao: string;
  entregue_em: Date | null;
  criado_em: Date;
  total: number;
  itens: ItemPedido[];
};

const selectPedido = () => sql`
  SELECT pe.*, c.nome AS cliente,
    concat_ws(' - ',
      nullif(concat_ws(', ', nullif(c.endereco, ''), nullif(c.numero, '')), ''),
      nullif(c.bairro, ''),
      nullif(concat_ws('/', nullif(c.cidade, ''), nullif(c.uf, '')), '')
    ) AS endereco,
    COALESCE((SELECT SUM(i.quantidade * i.preco_unitario) FROM pedido_itens i WHERE i.pedido_id = pe.id), 0)::numeric AS total,
    COALESCE((
      SELECT json_agg(json_build_object(
        'produto_id', i.produto_id, 'produto', p.nome, 'sabor', p.sabor, 'unidade', p.unidade,
        'quantidade', i.quantidade, 'preco_unitario', i.preco_unitario) ORDER BY i.id)
      FROM pedido_itens i JOIN produtos p ON p.id = i.produto_id WHERE i.pedido_id = pe.id
    ), '[]') AS itens
  FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id`;

function normalizarItens(p: Pedido) {
  p.itens = p.itens.map((i) => ({ ...i, quantidade: Number(i.quantidade), preco_unitario: Number(i.preco_unitario) }));
  return p;
}

export async function listarPedidos({ status, clienteId, limite = 200 }: { status?: StatusPedido; clienteId?: number; limite?: number }) {
  const linhas = await sql<Pedido[]>`
    ${selectPedido()}
    WHERE ${status ? sql`pe.status = ${status}` : sql`true`}
      AND ${clienteId ? sql`pe.cliente_id = ${clienteId}` : sql`true`}
    ORDER BY ${status === "pendente" ? sql`pe.data_entrega ASC, pe.id ASC` : sql`pe.data_entrega DESC, pe.id DESC`}
    LIMIT ${limite}`;
  return linhas.map(normalizarItens);
}

export async function obterPedido(id: number) {
  const [p] = await sql<Pedido[]>`${selectPedido()} WHERE pe.id = ${id}`;
  return p ? normalizarItens(p) : null;
}

// ---------- Solicitações (NF e boleto) ----------

export type ItemNF = { descricao: string; sabor?: string; unidade: string; quantidade: number; preco_unitario: number };
export type Parcela = { valor: number; vencimento: string };

export type DadosNF = {
  cliente: Cliente;
  itens: ItemNF[];
  total: number;
  observacoes: string;
  vencimento?: string;
  pagamento?: string;
};

export type DadosBoleto = {
  cliente: Cliente;
  parcelas: Parcela[];
  total: number;
  referencia: string;
  observacoes: string;
};

export type Solicitacao = {
  id: number;
  tipo: "nf" | "boleto";
  cliente_id: number;
  cliente: string;
  pedido_id: number | null;
  dados: DadosNF | DadosBoleto;
  criado_em: Date;
};

export async function listarSolicitacoes({ limite = 30, clienteId }: { limite?: number; clienteId?: number } = {}) {
  return sql<Solicitacao[]>`
    SELECT s.*, c.nome AS cliente FROM solicitacoes s JOIN clientes c ON c.id = s.cliente_id
    WHERE ${clienteId ? sql`s.cliente_id = ${clienteId}` : sql`true`}
    ORDER BY s.criado_em DESC LIMIT ${limite}`;
}

export async function obterSolicitacao(id: number) {
  const [s] = await sql<Solicitacao[]>`
    SELECT s.*, c.nome AS cliente FROM solicitacoes s JOIN clientes c ON c.id = s.cliente_id WHERE s.id = ${id}`;
  return s ?? null;
}

// ---------- Contas ----------

export type ContaReceber = {
  id: number;
  cliente_id: number;
  cliente: string;
  solicitacao_id: number | null;
  descricao: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
};

export type ContaPagar = {
  id: number;
  fornecedor: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
};

export type FiltroConta = "abertos" | "vencidos" | "pagos" | "todos";

function condicaoFiltro(filtro: FiltroConta, hoje: string) {
  if (filtro === "abertos") return sql`pago_em IS NULL`;
  if (filtro === "vencidos") return sql`pago_em IS NULL AND vencimento < ${hoje}`;
  if (filtro === "pagos") return sql`pago_em IS NOT NULL`;
  return sql`true`;
}

export async function listarContasReceber(filtro: FiltroConta, hoje: string, clienteId?: number) {
  return sql<ContaReceber[]>`
    SELECT r.*, c.nome AS cliente FROM contas_receber r JOIN clientes c ON c.id = r.cliente_id
    WHERE ${condicaoFiltro(filtro, hoje)}
      AND ${clienteId ? sql`r.cliente_id = ${clienteId}` : sql`true`}
    ORDER BY ${filtro === "pagos" ? sql`r.pago_em DESC, r.vencimento DESC` : sql`r.vencimento ASC, r.id ASC`}
    LIMIT 500`;
}

export async function listarContasPagar(filtro: FiltroConta, hoje: string) {
  return sql<ContaPagar[]>`
    SELECT * FROM contas_pagar
    WHERE ${condicaoFiltro(filtro, hoje)}
    ORDER BY ${filtro === "pagos" ? sql`pago_em DESC, vencimento DESC` : sql`vencimento ASC, id ASC`}
    LIMIT 500`;
}

export type Totais = { aberto: number; vencido: number; proximos7: number; qtd_aberto: number; qtd_vencido: number };

export async function totaisContas(tabela: "contas_receber" | "contas_pagar", hoje: string, ate7: string) {
  const [t] = await sql<Totais[]>`
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL), 0)::numeric AS aberto,
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL AND vencimento < ${hoje}), 0)::numeric AS vencido,
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL AND vencimento BETWEEN ${hoje} AND ${ate7}), 0)::numeric AS proximos7,
      COUNT(*) FILTER (WHERE pago_em IS NULL)::int AS qtd_aberto,
      COUNT(*) FILTER (WHERE pago_em IS NULL AND vencimento < ${hoje})::int AS qtd_vencido
    FROM ${sql(tabela)}`;
  return t;
}
