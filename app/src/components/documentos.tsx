/* eslint-disable @next/next/no-img-element */
// Solicitação de boleto e ordem de pedido no visual da Breakfast.
// Desenhadas em 1024 px de largura; viram PDF/JPG em gerar-arquivo.tsx.

import {
  Award,
  CalendarDays,
  CreditCard,
  FileText,
  NotebookPen,
  QrCode,
  Handshake,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Snowflake,
  Truck,
  User,
} from "lucide-react";
import type { Cliente, DadosBoleto } from "@/lib/dados";
import { EMPRESA, orientacoesBoleto } from "@/lib/empresa";
import { brl, dataBR, qtd } from "@/lib/formato";

export const LARGURA_FOLHA = 1024;

const GRADIENTE = "linear-gradient(135deg, #f7941d, #ea4316)";
const textoGradiente: React.CSSProperties = {
  backgroundImage: GRADIENTE,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// ---------- Peças ----------

function Cabecalho({ linha1, linha2, texto, numero, data }: { linha1: string; linha2: string; texto: string; numero: number; data: string }) {
  return (
    <div className="relative h-[310px] overflow-hidden bg-[#1c1c1e]">
      <svg className="absolute inset-0" width={LARGURA_FOLHA} height={310} viewBox="0 0 1024 310" aria-hidden>
        <defs>
          <linearGradient id="gm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7941d" />
            <stop offset="1" stopColor="#ea4316" />
          </linearGradient>
          <radialGradient id="brilho" cx="0.15" cy="0.2" r="0.6">
            <stop offset="0" stopColor="#3a3a3e" />
            <stop offset="1" stopColor="#1c1c1e" />
          </radialGradient>
        </defs>
        <rect width="1024" height="310" fill="url(#brilho)" />
        <path d="M 590 0 C 548 120 568 240 400 310 L 1024 310 L 1024 0 Z" fill="#ffffff" />
        <path d="M 574 0 C 532 120 552 236 380 310" stroke="url(#gm)" strokeWidth="16" fill="none" />
        <path d="M 606 0 C 566 124 586 246 424 310" stroke="url(#gm)" strokeWidth="3" fill="none" opacity="0.5" />
      </svg>

      <div className="absolute left-[44px] top-[46px]">
        <div className="flex items-end gap-3">
          <img src="/marca/simbolo-branco.png" alt="" className="h-[118px] w-auto" />
          <div className="pb-1 font-sans text-[64px] font-semibold leading-none tracking-tight">
            <span className="text-white">break</span>
            <span style={textoGradiente}>fast</span>
          </div>
        </div>
        <div className="mt-5 font-condensada text-[22px] font-normal uppercase tracking-[0.12em] text-white/85">
          Distribuindo <span className="text-[#f7941d]">sabor</span> e <span className="text-[#f7941d]">praticidade</span>
        </div>
        <div className="mt-2 h-[4px] w-[70px] rounded-full" style={{ backgroundImage: GRADIENTE }} />
      </div>

      <div className="absolute left-[600px] top-[34px] w-[396px] font-condensada">
        <div className="text-[46px] font-semibold uppercase leading-[1] text-[#1c1c1e]">{linha1}</div>
        <div className="text-[72px] font-bold uppercase leading-[1.02]" style={textoGradiente}>
          {linha2}
        </div>
        <div className="mt-1 h-[5px] w-[110px] rounded-full" style={{ backgroundImage: GRADIENTE }} />
        <div className="mt-4 flex items-start gap-3">
          <IconeRedondo tamanho={46}>
            <FileText size={22} strokeWidth={2} />
          </IconeRedondo>
          <div className="text-[19px] leading-tight text-[#2d4f8f]">
            {texto}
            <div className="mt-1 font-semibold text-[#1c1c1e]">
              Nº {numero} · {data}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconeRedondo({ children, tamanho = 54 }: { children: React.ReactNode; tamanho?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white shadow-[0_3px_8px_rgba(234,67,22,0.35)]"
      style={{ width: tamanho, height: tamanho, backgroundImage: GRADIENTE }}
    >
      {children}
    </span>
  );
}

function Secao({ numero, titulo, children, className = "" }: { numero: number; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative rounded-[18px] border border-[#e4e4e8] bg-white px-7 pb-6 pt-11 ${className}`}>
      <div className="absolute -top-[22px] left-[14px] flex items-center font-condensada">
        <span className="relative z-10 flex size-[50px] items-center justify-center rounded-full border-[4px] border-[#ee5f12] bg-white text-[28px] font-semibold text-[#1c1c1e]">
          {numero}
        </span>
        <span className="-ml-3 rounded-r-[10px] py-[5px] pl-6 pr-6 text-[25px] font-normal uppercase text-white" style={{ backgroundImage: GRADIENTE }}>
          {titulo}
        </span>
      </div>
      {children}
    </section>
  );
}

function Info({ icone, rotulo, valor, grande = false }: { icone: React.ReactNode; rotulo: string; valor: React.ReactNode; grande?: boolean }) {
  return (
    <div className="flex items-center gap-5 py-3">
      <IconeRedondo>{icone}</IconeRedondo>
      <div className="min-w-0 font-condensada">
        <div className="text-[16px] font-normal uppercase tracking-wide text-[#4a4a4f]">{rotulo}</div>
        <div className={`${grande ? "text-[34px]" : "text-[28px]"} font-medium uppercase leading-[1.15] text-[#1c1c1e]`}>{valor || "—"}</div>
      </div>
    </div>
  );
}

function enderecoDoc(c: Cliente) {
  const rua = [c.endereco, c.numero].filter(Boolean).join(", ") + (c.complemento ? ` (${c.complemento})` : "");
  const linha1 = [rua, c.bairro, c.cidade, c.uf].filter(Boolean).join(" - ");
  return (
    <>
      <span className="text-[25px] font-normal">{linha1 || "—"}</span>
      {c.cep && <span className="block text-[25px] font-normal">CEP {c.cep}</span>}
    </>
  );
}

function DadosCliente({ cliente, contato = false }: { cliente: Cliente; contato?: boolean }) {
  const razao = cliente.razao_social || cliente.nome;
  const fantasia = cliente.razao_social && cliente.nome && cliente.nome !== cliente.razao_social ? cliente.nome : "";
  return (
    <Secao numero={1} titulo="Dados do cliente">
      <Info
        icone={<User size={28} strokeWidth={1.8} />}
        rotulo={fantasia ? `Nome do cliente (${fantasia})` : "Nome do cliente"}
        valor={razao}
        grande
      />
      <div className="grid grid-cols-2 border-t border-[#ececef]">
        <Info icone={<ReceiptText size={26} strokeWidth={1.8} />} rotulo={cliente.cnpj_cpf.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ"} valor={cliente.cnpj_cpf} />
        <div className="border-l border-[#ececef] pl-6">
          <Info icone={<FileText size={26} strokeWidth={1.8} />} rotulo="Inscrição estadual (I.E.)" valor={cliente.inscricao_estadual || "Isento / não informado"} />
        </div>
      </div>
      <div className="border-t border-[#ececef]">
        <Info icone={<MapPin size={28} strokeWidth={1.8} />} rotulo="Endereço" valor={enderecoDoc(cliente)} />
      </div>
      {contato && (cliente.email || cliente.telefone) && (
        <div className="grid grid-cols-2 border-t border-[#ececef]">
          <Info icone={<Mail size={26} strokeWidth={1.8} />} rotulo="E-mail" valor={<span className="normal-case">{cliente.email}</span>} />
          <div className="border-l border-[#ececef] pl-6">
            <Info icone={<Phone size={26} strokeWidth={1.8} />} rotulo="Telefone" valor={cliente.telefone} />
          </div>
        </div>
      )}
    </Secao>
  );
}

function Total({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="mt-5 flex items-center justify-end gap-4 font-condensada">
      <span className="text-[30px] font-semibold uppercase text-[#1c1c1e]">{rotulo}:</span>
      <span className="rounded-[10px] px-5 py-1 text-[46px] font-semibold text-white shadow-[0_4px_12px_rgba(234,67,22,0.35)]" style={{ backgroundImage: GRADIENTE }}>
        {brl(valor)}
      </span>
    </div>
  );
}

function Orientacoes({ numero, itens }: { numero: number; itens: string[] }) {
  return (
    <Secao numero={numero} titulo="Orientações">
      <ul className="relative z-10 space-y-3 pr-16 font-condensada text-[20px] font-light leading-snug text-[#2d4f8f]">
        {itens.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[9px] size-[9px] shrink-0 rounded-full bg-[#ea4316]" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
        <img src="/marca/simbolo.png" alt="" className="absolute -bottom-3 right-3 h-[150px] w-auto opacity-[0.12]" />
      </div>
    </Secao>
  );
}

function Contato() {
  return (
    <div className="mt-6 flex items-center justify-center gap-3 rounded-[14px] border border-[#e4e4e8] py-3 font-condensada text-[20px] text-[#2d4f8f]">
      <IconeRedondo tamanho={40}>
        <Mail size={20} strokeWidth={2} />
      </IconeRedondo>
      Financeiro: {EMPRESA.emailFinanceiro}
    </div>
  );
}

function Rodape() {
  const itens = [
    { i: Snowflake, t: ["Produtos", "congelados"] },
    { i: Package, t: ["Variedade para", "o seu negócio"] },
    { i: Award, t: ["Padrão de", "qualidade"] },
    { i: Handshake, t: ["Parceria", "personalizada"] },
    { i: Truck, t: ["Distribuição", "garantida"] },
  ];
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between bg-[#1c1c1e] px-8 py-5 font-condensada">
        {itens.map(({ i: Icone, t }, n) => (
          <div key={n} className={`flex flex-1 items-center gap-3 ${n ? "border-l border-white/15 pl-4" : ""}`}>
            <Icone size={32} strokeWidth={1.5} className="shrink-0 text-[#f7941d]" />
            <span className="text-[15px] uppercase leading-tight text-white">
              {t[0]}
              <br />
              {t[1]}
            </span>
          </div>
        ))}
      </div>
      <div className="py-3 text-center font-condensada text-[19px] uppercase tracking-[0.45em] text-white" style={{ backgroundImage: GRADIENTE }}>
        {EMPRESA.slogan}
      </div>
    </div>
  );
}

// ---------- Documentos ----------

export function FolhaBoleto({ id, data, dados }: { id: number; data: string; dados: DadosBoleto }) {
  const n = dados.parcelas.length;
  const orientacoes = [...orientacoesBoleto(n), ...dados.observacoes.split("\n").map((l) => l.trim()).filter(Boolean)];
  return (
    <div className="bg-white font-sans text-[#1c1c1e]" style={{ width: LARGURA_FOLHA }}>
      <Cabecalho
        linha1="Solicitação de"
        linha2={n > 1 ? "Boletos" : "Boleto"}
        texto={`Solicitamos a emissão ${n > 1 ? "dos boletos" : "do boleto"} conforme os dados abaixo. Agradecemos!`}
        numero={id}
        data={dataBR(data)}
      />
      <div className="space-y-10 px-7 pt-9">
        <DadosCliente cliente={dados.cliente} contato />

        <Secao numero={2} titulo={n > 1 ? `Dados dos boletos (${n} parcelas)` : "Dados do boleto"}>
          {dados.referencia && (
            <div className="mb-4 font-condensada text-[22px] text-[#2d4f8f]">
              <span className="font-medium uppercase text-[#1c1c1e]">Referente a: </span>
              {dados.referencia}
            </div>
          )}
          <table className="w-full border-collapse font-condensada">
            <thead>
              <tr className="bg-[#1c1c1e] text-[18px] uppercase text-white">
                <th className="rounded-l-[8px] px-4 py-3 text-left font-normal">Parcela</th>
                <th className="px-2 py-3 font-normal">Vencimento</th>
                <th className="rounded-r-[8px] px-4 py-3 text-right font-normal">Valor</th>
              </tr>
            </thead>
            <tbody>
              {dados.parcelas.map((p, i) => (
                <tr key={i} className="border-b border-[#ececef]">
                  <td className="px-4 py-4 text-[26px] font-medium">
                    {i + 1}/{n}
                  </td>
                  <td className="px-2 py-4 text-center text-[30px] font-medium">{dataBR(p.vencimento)}</td>
                  <td className="px-4 py-4 text-right text-[30px] font-semibold text-[#ea4316]">{brl(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Total rotulo={n > 1 ? "Valor total" : "Valor do boleto"} valor={dados.total} />
        </Secao>

        <Orientacoes numero={3} itens={orientacoes} />
        <Contato />
      </div>
      <Rodape />
    </div>
  );
}

// ---------- Ordem de pedido (enviada ao cliente) ----------

export type DadosOrdem = {
  id: number;
  emitidaEm: string; // AAAA-MM-DD
  cliente: Cliente;
  dataEntrega: string;
  itens: { produto: string; sabor: string; unidade: string; quantidade: number; preco_unitario: number }[];
  total: number;
  formaPagamento: string;
  vencimentoPagamento: string | null;
  observacao: string;
};

export function ehPix(forma: string) {
  return /\bpix\b/i.test(forma);
}

export function FolhaOrdem({ dados, qrPix, pixCopiaECola }: { dados: DadosOrdem; qrPix?: string; pixCopiaECola?: string }) {
  const pix = ehPix(dados.formaPagamento);
  const forma = dados.formaPagamento || "A combinar";
  return (
    <div className="bg-white font-sans text-[#1c1c1e]" style={{ width: LARGURA_FOLHA }}>
      <Cabecalho
        linha1="Ordem de"
        linha2="Pedido"
        texto="Confira abaixo os itens e a forma de pagamento do seu pedido. Obrigado pela preferência!"
        numero={dados.id}
        data={dataBR(dados.emitidaEm)}
      />
      <div className="space-y-10 px-7 pt-9">
        <DadosCliente cliente={dados.cliente} contato />

        <Secao numero={2} titulo="Itens do pedido">
          <div className="mb-4 flex items-center gap-3 font-condensada text-[22px] text-[#2d4f8f]">
            <CalendarDays size={24} className="text-[#ea4316]" />
            <span className="font-medium uppercase text-[#1c1c1e]">Entrega prevista:</span> {dataBR(dados.dataEntrega)}
          </div>
          <table className="w-full border-collapse font-condensada">
            <thead>
              <tr className="bg-[#1c1c1e] text-[18px] uppercase text-white">
                <th className="rounded-l-[8px] px-4 py-3 text-left font-normal">Produto</th>
                <th className="px-2 py-3 font-normal">Quantidade</th>
                <th className="px-2 py-3 font-normal">Valor unitário</th>
                <th className="rounded-r-[8px] px-4 py-3 text-right font-normal">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((i, n) => (
                <tr key={n} className="border-b border-[#ececef]">
                  <td className="px-4 py-4">
                    <div className="text-[25px] font-medium uppercase leading-tight">{i.produto}</div>
                    {i.sabor && <div className="text-[20px] font-normal text-[#ea4316]">Sabor {i.sabor}</div>}
                  </td>
                  <td className="px-2 py-4 text-center">
                    <span className="text-[30px] font-medium">{qtd(i.quantidade)}</span>
                    {i.unidade !== "un" && <span className="ml-1 text-[16px] text-[#6b6b70]">{i.quantidade !== 1 && /^[a-zà-ú]{4,}$/i.test(i.unidade) && !/s$/i.test(i.unidade) ? i.unidade + "s" : i.unidade}</span>}
                  </td>
                  <td className="px-2 py-4 text-center text-[27px] font-medium">{brl(i.preco_unitario)}</td>
                  <td className="px-4 py-4 text-right text-[28px] font-semibold text-[#ea4316]">{brl(i.quantidade * i.preco_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Total rotulo="Total do pedido" valor={dados.total} />
        </Secao>

        <Secao numero={3} titulo="Forma de pagamento">
          <div className="grid grid-cols-2 border-b border-[#ececef]">
            <Info icone={<CreditCard size={26} strokeWidth={1.8} />} rotulo="Pagamento" valor={forma} />
            <div className="border-l border-[#ececef] pl-6">
              <Info
                icone={<CalendarDays size={26} strokeWidth={1.8} />}
                rotulo="Pagar até"
                valor={dados.vencimentoPagamento ? dataBR(dados.vencimentoPagamento) : "Na entrega"}
              />
            </div>
          </div>
          {pix && (
            <div className="mt-5 flex items-center gap-7 rounded-[16px] border-2 border-[#f7941d] bg-[#fff6ee] p-5">
              {qrPix ? (
                <img src={qrPix} alt="QR Code do PIX" className="size-[210px] shrink-0 rounded-[8px] bg-white p-2" />
              ) : (
                <span className="flex size-[120px] shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: GRADIENTE }}>
                  <QrCode size={64} className="text-white" />
                </span>
              )}
              <div className="min-w-0 font-condensada">
                <div className="text-[20px] font-medium uppercase text-[#4a4a4f]">Chave PIX (e-mail)</div>
                <div className="text-[40px] font-semibold leading-tight" style={textoGradiente}>
                  {EMPRESA.chavePix}
                </div>
                <div className="mt-1 text-[22px]">
                  Valor: <strong>{brl(dados.total)}</strong>
                </div>
                {qrPix && <div className="mt-2 text-[17px] text-[#2d4f8f]">Aponte a câmera do app do banco para o QR Code ou use o Pix copia e cola:</div>}
                {pixCopiaECola && <div className="mt-1 break-all font-sans text-[12px] leading-snug text-[#4a4a4f]">{pixCopiaECola}</div>}
              </div>
            </div>
          )}
        </Secao>

        {dados.observacao && (
          <Secao numero={4} titulo="Observações">
            <div className="flex items-start gap-4 font-condensada text-[22px] text-[#2d4f8f]">
              <NotebookPen size={28} className="mt-1 shrink-0 text-[#ea4316]" />
              <span className="whitespace-pre-line">{dados.observacao}</span>
            </div>
          </Secao>
        )}
        <Contato />
      </div>
      <Rodape />
    </div>
  );
}
