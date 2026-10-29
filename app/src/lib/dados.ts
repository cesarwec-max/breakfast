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
  tem_foto: boolean;
};

export async function listarProdutos({ incluirInativos = false } = {}) {
  return sql<Produto[]>`
    SELECT p.id, p.nome, p.sabor, p.unidade, p.preco, p.ativo, p.criado_em, (p.foto IS NOT NULL) AS tem_foto,
      COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN -m.quantidade ELSE m.quantidade END), 0)::numeric AS saldo
    FROM produtos p
    LEFT JOIN estoque_movimentos m ON m.produto_id = p.id
    WHERE ${incluirInativos ? sql`true` : sql`p.ativo`}
    GROUP BY p.id
    ORDER BY p.ativo DESC, lower(p.nome), lower(p.sabor)`;
}

export async function obterProduto(id: number) {
  const [p] = await sql<Produto[]>`
    SELECT p.id, p.nome, p.sabor, p.unidade, p.preco, p.ativo, p.criado_em, (p.foto IS NOT NULL) AS tem_foto,
      COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN -m.quantidade ELSE m.quantidade END), 0)::numeric AS saldo
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

export type StatusPedido = "pendente" | "em_rota" | "entregue" | "cancelado";

/** Ainda não entregue (pendente ou em rota). */
export const aEntregar = (s: StatusPedido) => s === "pendente" || s === "em_rota";

export type ItemPedido = {
  produto_id: number;
  produto: string;
  sabor: string;
  tem_foto: boolean;
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
  forma_pagamento: string;
  vencimento_pagamento: string | null;
  entregue_em: Date | null;
  criado_em: Date;
  total: number;
  itens: ItemPedido[];
  anexos: number;
};

const selectPedido = () => sql`
  SELECT pe.*, c.nome AS cliente,
    concat_ws(' - ',
      nullif(concat_ws(', ', nullif(c.endereco, ''), nullif(c.numero, '')), ''),
      nullif(c.bairro, ''),
      nullif(concat_ws('/', nullif(c.cidade, ''), nullif(c.uf, '')), '')
    ) AS endereco,
    COALESCE((SELECT SUM(i.quantidade * i.preco_unitario) FROM pedido_itens i WHERE i.pedido_id = pe.id), 0)::numeric AS total,
    (SELECT count(*)::int FROM anexos a WHERE a.pedido_id = pe.id) AS anexos,
    COALESCE((
      SELECT json_agg(json_build_object(
        'produto_id', i.produto_id, 'produto', p.nome, 'sabor', p.sabor, 'tem_foto', p.foto IS NOT NULL, 'unidade', p.unidade,
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
    WHERE ${
      // "pendente" na lista = tudo que ainda vai ser entregue (inclui os que já saíram para entrega)
      status === "pendente" ? sql`pe.status IN ('pendente', 'em_rota')` : status ? sql`pe.status = ${status}` : sql`true`
    }
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
  pedido_id: number | null;
};

export type ContaPagar = {
  id: number;
  /** Parcelas lançadas juntas têm o mesmo lote (o id da primeira). */
  lote: number;
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
    SELECT r.id, r.cliente_id, r.solicitacao_id, r.descricao, r.valor, r.vencimento, r.pago_em, r.criado_em,
      c.nome AS cliente, COALESCE(r.pedido_id, s.pedido_id) AS pedido_id
    FROM contas_receber r
    JOIN clientes c ON c.id = r.cliente_id
    LEFT JOIN solicitacoes s ON s.id = r.solicitacao_id
    WHERE ${condicaoFiltro(filtro, hoje)}
      AND ${clienteId ? sql`r.cliente_id = ${clienteId}` : sql`true`}
    ORDER BY ${filtro === "pagos" ? sql`r.pago_em DESC, r.vencimento DESC` : sql`r.vencimento ASC, r.id ASC`}
    LIMIT 500`;
}

export async function listarContasPagar(filtro: FiltroConta, hoje: string) {
  return sql<ContaPagar[]>`
    SELECT *, COALESCE(lote, id) AS lote FROM contas_pagar
    WHERE ${condicaoFiltro(filtro, hoje)}
    ORDER BY ${filtro === "pagos" ? sql`pago_em DESC, vencimento DESC` : sql`vencimento ASC, id ASC`}
    LIMIT 500`;
}

export type Totais = {
  aberto: number;
  vencido: number;
  proximos7: number;
  qtd_aberto: number;
  qtd_vencido: number;
  /** Pago/recebido no mês atual */
  pago_mes: number;
  qtd_pago_mes: number;
};

export async function totaisContas(tabela: "contas_receber" | "contas_pagar", hoje: string, ate7: string) {
  const [t] = await sql<Totais[]>`
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL), 0)::numeric AS aberto,
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL AND vencimento < ${hoje}), 0)::numeric AS vencido,
      COALESCE(SUM(valor) FILTER (WHERE pago_em IS NULL AND vencimento BETWEEN ${hoje} AND ${ate7}), 0)::numeric AS proximos7,
      COUNT(*) FILTER (WHERE pago_em IS NULL)::int AS qtd_aberto,
      COUNT(*) FILTER (WHERE pago_em IS NULL AND vencimento < ${hoje})::int AS qtd_vencido,
      COALESCE(SUM(valor) FILTER (WHERE pago_em >= ${hoje.slice(0, 8) + "01"}), 0)::numeric AS pago_mes,
      COUNT(*) FILTER (WHERE pago_em >= ${hoje.slice(0, 8) + "01"})::int AS qtd_pago_mes
    FROM ${sql(tabela)}`;
  return t;
}

/** Nome (cliente ou fornecedor) e valor de um boleto, para o aviso "marcado como pago". */
export async function resumoConta(tabela: "contas_receber" | "contas_pagar", id: number) {
  const [c] =
    tabela === "contas_receber"
      ? await sql<{ nome: string; valor: number; pago_em: string | null }[]>`
          SELECT c.nome, r.valor, r.pago_em FROM contas_receber r JOIN clientes c ON c.id = r.cliente_id WHERE r.id = ${id}`
      : await sql<{ nome: string; valor: number; pago_em: string | null }[]>`
          SELECT fornecedor AS nome, valor, pago_em FROM contas_pagar WHERE id = ${id}`;
  return c ?? null;
}

// ---------- Anexos (notas e boletos emitidos) ----------

export type TipoAnexo = "nf" | "boleto" | "outro";

export type Anexo = {
  id: number;
  cliente_id: number | null;
  conta_pagar_id: number | null;
  pedido_id: number | null;
  conta_receber_id: number | null;
  tipo: TipoAnexo;
  nome_arquivo: string;
  mime: string;
  tamanho: number;
  criado_em: Date;
};

const COLUNAS_ANEXO = sql`id, cliente_id, pedido_id, conta_receber_id, conta_pagar_id, tipo, nome_arquivo, mime, tamanho, criado_em`;

export async function listarAnexos(filtro: { pedidoId?: number; clienteId?: number; contaIds?: number[]; pedidoIds?: number[] }) {
  const conds = [];
  if (filtro.pedidoId) conds.push(sql`pedido_id = ${filtro.pedidoId}`);
  if (filtro.clienteId) conds.push(sql`cliente_id = ${filtro.clienteId}`);
  if (filtro.contaIds?.length || filtro.pedidoIds?.length) {
    const ids = filtro.contaIds?.length ? filtro.contaIds : [0];
    const ped = filtro.pedidoIds?.length ? filtro.pedidoIds : [0];
    conds.push(sql`(conta_receber_id IN ${sql(ids)} OR pedido_id IN ${sql(ped)})`);
  }
  if (conds.length === 0) return [];
  const where = conds.reduce((a, c) => sql`${a} AND ${c}`);
  return sql<Anexo[]>`SELECT ${COLUNAS_ANEXO} FROM anexos WHERE ${where} ORDER BY tipo, criado_em DESC`;
}

export async function obterAnexo(id: number) {
  const [a] = await sql<(Anexo & { conteudo: Buffer })[]>`SELECT ${COLUNAS_ANEXO}, conteudo FROM anexos WHERE id = ${id}`;
  return a ?? null;
}

/** Anexos das contas a pagar, com o lote (compra) a que pertencem. */
export async function listarAnexosPagar(lotes: number[]) {
  if (lotes.length === 0) return [];
  return sql<(Anexo & { lote: number })[]>`
    SELECT a.id, a.cliente_id, a.pedido_id, a.conta_receber_id, a.conta_pagar_id, a.tipo, a.nome_arquivo, a.mime,
           a.tamanho, a.criado_em, COALESCE(cp.lote, cp.id) AS lote
    FROM anexos a JOIN contas_pagar cp ON cp.id = a.conta_pagar_id
    WHERE COALESCE(cp.lote, cp.id) IN ${sql(lotes)}
    ORDER BY a.tipo, a.criado_em DESC`;
}

export async function obterFotoProduto(id: number) {
  const [f] = await sql<{ foto: Buffer | null; foto_mime: string | null }[]>`SELECT foto, foto_mime FROM produtos WHERE id = ${id}`;
  return f?.foto ? { foto: f.foto, mime: f.foto_mime ?? "image/jpeg" } : null;
}

/** Contas a receber de um pedido (a automática ou as dos boletos solicitados). */
export async function contasDoPedido(pedidoId: number) {
  return sql<{ id: number; valor: number; vencimento: string; pago_em: string | null; descricao: string }[]>`
    SELECT r.id, r.valor, r.vencimento, r.pago_em, r.descricao
    FROM contas_receber r LEFT JOIN solicitacoes s ON s.id = r.solicitacao_id
    WHERE r.pedido_id = ${pedidoId} OR s.pedido_id = ${pedidoId}
    ORDER BY r.vencimento, r.id`;
}
