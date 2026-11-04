/* eslint-disable @next/next/no-img-element */
// Folha "Relatório de produção" do representante (comissão do mês), no visual da marca.
// Desenhada em 1024 px de largura; vira JPG/PDF em folha-jpg.tsx.

import { CalendarDays, Coins, Percent, TrendingUp, UserRound } from "lucide-react";
import { EMPRESA } from "@/lib/empresa";
import { brl, dataBR } from "@/lib/formato";

export type DadosRelatorio = {
  representante: string;
  mesNome: string;
  inicio: string;
  fim: string;
  fechado: boolean;
  total: number;
  percentual: number;
  valor: number;
  faixas: string;
  pedidos: { id: number; cliente: string; data_entrega: string; total: number }[];
};

const LARANJA = "#f26a10";
const GRADIENTE = "linear-gradient(135deg, #f7941d, #ea4316)";
const ESCURO = "#2a2b2f";
const LINHA = "#e3e3e6";
const COLUNAS = [70, 170, 470, 280]; // #, entrega, cliente, valor (soma = 990)
const pct = (n: number) => `${String(n).replace(".", ",")}%`;

export function FolhaComissao({ d }: { d: DadosRelatorio }) {
  return (
    <div className="bg-white font-sans text-[#2a2b2f]" style={{ width: 1024 }}>
      {/* Cabeçalho */}
      <div className="flex items-center gap-6 px-6 pb-4 pt-6">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/marca/simbolo.png" alt="" className="h-[100px] w-auto" />
          <div>
            <div className="text-[46px] font-semibold leading-none tracking-tight">
              <span>break</span>
              <span className="texto-marca">fast</span>
            </div>
            <div className="mt-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-wide">
              Distribuindo <span style={{ color: LARANJA }}>sabor</span> e praticidade
            </div>
          </div>
        </div>
        <div className="h-[110px] w-[2px] shrink-0 bg-[#2a2b2f]/70" />
        <div className="font-condensada font-semibold uppercase leading-[0.98]">
          <div className="text-[58px]">Relatório</div>
          <div className="whitespace-nowrap text-[50px]" style={{ color: LARANJA }}>
            de produção
          </div>
        </div>
        {!d.fechado && (
          <div className="ml-auto rotate-[-6deg] rounded-[6px] border-[3px] px-3 py-1 font-condensada text-[26px] font-semibold uppercase" style={{ borderColor: LARANJA, color: LARANJA }}>
            Prévia
          </div>
        )}
      </div>

      {/* Representante e período */}
      <div className="mx-4 flex items-center gap-6 rounded-[14px] px-8 py-4" style={{ background: ESCURO }}>
        <span className="flex size-[78px] shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: GRADIENTE }}>
          <UserRound size={44} strokeWidth={2} className="text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] uppercase tracking-wide text-white/70">Representante</div>
          <div className="truncate font-condensada text-[46px] font-medium uppercase leading-tight text-white">{d.representante}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-[15px] uppercase tracking-wide text-white/70">
            <CalendarDays size={18} /> Período
          </div>
          <div className="font-condensada text-[34px] font-medium uppercase leading-tight text-white">{d.mesNome}</div>
          <div className="text-[15px] text-white/80">
            Entregas de {dataBR(d.inicio)} a {dataBR(d.fim)}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="mx-4 mt-3 overflow-hidden rounded-[10px] border" style={{ borderColor: LINHA }}>
        <div className="flex font-condensada text-[26px] uppercase text-white" style={{ background: ESCURO }}>
          {["#", "Entrega", "Cliente", "Valor do pedido"].map((t, i) => (
            <div key={t} className="py-2 text-center" style={{ width: COLUNAS[i], borderRight: i < 3 ? "1px solid rgba(255,255,255,0.18)" : undefined }}>
              {t}
            </div>
          ))}
        </div>
        {d.pedidos.length === 0 && <div className="py-6 text-center text-[20px] text-[#6b6b70]">Nenhum pedido no período.</div>}
        {d.pedidos.map((p, n) => (
          <div key={p.id} className="flex font-condensada text-[25px]" style={{ borderTop: n ? `1px solid ${LINHA}` : undefined, background: n % 2 ? "#fafafa" : "white" }}>
            <div className="flex items-center justify-center text-white" style={{ width: COLUNAS[0], background: LARANJA }}>
              {n + 1}
            </div>
            <div className="flex items-center justify-center py-1.5" style={{ width: COLUNAS[1], borderRight: `1px solid ${LINHA}` }}>
              {dataBR(p.data_entrega).slice(0, 5)}
            </div>
            <div className="flex items-center px-5 py-1.5 uppercase leading-tight" style={{ width: COLUNAS[2], borderRight: `1px solid ${LINHA}` }}>
              {p.cliente}
            </div>
            <div className="flex items-center justify-end px-6" style={{ width: COLUNAS[3] }}>
              {brl(p.total)}
            </div>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-3">
        {[
          { I: TrendingUp, r: "Vendas no mês", v: brl(d.total), extra: `${d.pedidos.length} pedido${d.pedidos.length === 1 ? "" : "s"}` },
          { I: Percent, r: "Percentual", v: pct(d.percentual), extra: d.faixas },
        ].map(({ I, r, v, extra }) => (
          <div key={r} className="flex items-center gap-4 rounded-[12px] border-[2px] px-5 py-3" style={{ borderColor: LINHA }}>
            <I size={40} strokeWidth={1.8} style={{ color: LARANJA }} className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[14px] uppercase tracking-wide text-[#6b6b70]">{r}</div>
              <div className="font-condensada text-[38px] font-semibold leading-tight">{v}</div>
              <div className="text-[12px] leading-snug text-[#6b6b70]">{extra}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4 rounded-[12px] px-5 py-3 text-white" style={{ backgroundImage: GRADIENTE }}>
          <Coins size={42} strokeWidth={1.8} className="shrink-0" />
          <div>
            <div className="text-[14px] uppercase tracking-wide text-white/85">Comissão</div>
            <div className="font-condensada text-[44px] font-semibold leading-tight">{brl(d.valor)}</div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative mt-5 h-[70px] overflow-hidden" style={{ background: ESCURO }}>
        <div className="absolute inset-x-0 bottom-0 h-[52px] rounded-t-[50%]" style={{ backgroundImage: GRADIENTE }} />
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-5">
          <span className="h-[2px] w-[150px] bg-[#2a2b2f]" />
          <span className="text-[22px] font-semibold italic text-[#2a2b2f]">{EMPRESA.slogan}!</span>
          <span className="h-[2px] w-[150px] bg-[#2a2b2f]" />
        </div>
      </div>
    </div>
  );
}
