/* eslint-disable @next/next/no-img-element */
// Folha "Pedidos pendentes de pagamento" (contas a receber em aberto), no visual do modelo do usuário.
// Desenhada em 1024 px de largura; vira JPG em folha-jpg.tsx.

import {
  Award,
  CalendarDays,
  ChartColumnIncreasing,
  Coins,
  DollarSign,
  FileCheck,
  Headset,
  Package,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { EMPRESA } from "@/lib/empresa";
import { brl, dataBR } from "@/lib/formato";

export type ContaFolha = { id: number; cliente: string; valor: number; vencimento: string };

const LARANJA = "#f26a10";
const GRADIENTE = "linear-gradient(135deg, #f7941d, #ea4316)";
const ESCURO = "#2a2b2f";
const VERMELHO = "#d71920";
const LINHA = "#e3e3e6";
const COLUNAS = [74, 264, 234, 226, 192]; // #, cliente, valor, vencimento, situação (soma = 990)

export function FolhaReceber({ contas, ate }: { contas: ContaFolha[]; ate: string }) {
  const total = contas.reduce((s, c) => s + c.valor, 0);
  return (
    <div className="bg-white font-sans text-[#2a2b2f]" style={{ width: 1024 }}>
      {/* Cabeçalho */}
      <div className="flex items-center gap-6 px-6 pb-4 pt-6">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/marca/simbolo.png" alt="" className="h-[112px] w-auto" />
          <div>
            <div className="text-[50px] font-semibold leading-none tracking-tight">
              <span>break</span>
              <span className="texto-marca">fast</span>
            </div>
            <div className="mt-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-wide">
              Distribuindo <span style={{ color: LARANJA }}>sabor</span> e praticidade
            </div>
          </div>
        </div>
        <div className="h-[120px] w-[2px] shrink-0 bg-[#2a2b2f]/70" />
        <div className="font-condensada font-semibold uppercase leading-[0.98]">
          <div className="text-[60px]">Pedidos</div>
          <div className="whitespace-nowrap text-[50px]" style={{ color: LARANJA }}>
            Pendentes de pagamento
          </div>
        </div>
      </div>

      {/* Situação atualizada até */}
      <div className="mx-4 flex items-center justify-between gap-6 rounded-[14px] px-10 py-4" style={{ background: ESCURO }}>
        <span className="flex size-[92px] items-center justify-center rounded-full" style={{ backgroundImage: GRADIENTE }}>
          <CalendarDays size={50} strokeWidth={2} className="text-white" />
        </span>
        <span className="whitespace-nowrap font-condensada text-[42px] font-medium uppercase text-white">Situação atualizada até:</span>
        <span className="whitespace-nowrap rounded-[8px] px-6 py-1 font-condensada text-[46px] font-medium text-white" style={{ backgroundImage: GRADIENTE }}>
          {dataBR(ate)}
        </span>
      </div>

      {/* Tabela */}
      <div className="mx-4 mt-3 overflow-hidden rounded-[10px] border" style={{ borderColor: LINHA }}>
        <div className="flex font-condensada text-[30px] uppercase text-white" style={{ background: ESCURO }}>
          {["#", "Cliente", "Valor", "Vencimento", "Situação"].map((t, i) => (
            <div key={t} className="py-2.5 text-center" style={{ width: COLUNAS[i], borderRight: i < 4 ? "1px solid rgba(255,255,255,0.18)" : undefined }}>
              {t}
            </div>
          ))}
        </div>
        {contas.map((c, n) => {
          const atrasado = c.vencimento < ate;
          return (
            <div key={c.id} className="flex font-condensada text-[30px]" style={{ borderTop: n ? `1px solid ${LINHA}` : undefined }}>
              <div className="flex items-center justify-center text-white" style={{ width: COLUNAS[0], background: LARANJA }}>
                {n + 1}
              </div>
              <div className="flex items-center px-6 py-1.5 uppercase leading-tight" style={{ width: COLUNAS[1], borderRight: `1px solid ${LINHA}` }}>
                {c.cliente}
              </div>
              <div className="flex items-center justify-center" style={{ width: COLUNAS[2], borderRight: `1px solid ${LINHA}` }}>
                {brl(c.valor)}
              </div>
              <div className="flex items-center justify-center" style={{ width: COLUNAS[3], borderRight: `1px solid ${LINHA}` }}>
                {dataBR(c.vencimento)}
              </div>
              <div className="flex items-center justify-center py-1.5" style={{ width: COLUNAS[4] }}>
                <span
                  className="w-[144px] rounded-[4px] py-0.5 text-center text-[26px] uppercase text-white"
                  style={atrasado ? { background: VERMELHO } : { backgroundImage: GRADIENTE }}
                >
                  {atrasado ? "Atrasado" : "Pendente"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total geral */}
      <div className="mx-4 mt-3 flex items-center gap-6 rounded-[14px] px-10 py-3" style={{ background: ESCURO }}>
        <span className="flex size-[64px] items-center justify-center rounded-full border-[3px] border-white">
          <DollarSign size={38} strokeWidth={2.4} className="text-white" />
        </span>
        <span className="font-condensada text-[44px] font-medium uppercase text-white">Total geral</span>
        <span className="ml-6 flex-1 rounded-[8px] py-1 text-center font-condensada text-[62px] font-semibold text-white" style={{ backgroundImage: GRADIENTE }}>
          {brl(total)}
        </span>
        <Coins size={70} strokeWidth={1.6} className="ml-6 text-white" />
      </div>

      {/* Atenção */}
      <div className="mx-4 mt-3 flex items-center rounded-[12px] border-[2px] px-6 py-4" style={{ borderColor: LARANJA }}>
        <div className="flex flex-1 items-center gap-5 border-r pr-6" style={{ borderColor: "#c9c9cc" }}>
          <span className="flex size-[78px] shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: GRADIENTE }}>
            <TriangleAlert size={42} strokeWidth={2.2} className="text-white" />
          </span>
          <div>
            <div className="font-condensada text-[34px] font-semibold uppercase leading-none" style={{ color: LARANJA }}>
              Atenção!
            </div>
            <div className="mt-1 text-[18px] leading-snug">
              Acompanhar a regularização
              <br />
              dos pagamentos em atraso.
            </div>
          </div>
        </div>
        <div className="flex flex-[1.15] items-center gap-5 pl-8">
          <FileCheck size={72} strokeWidth={1.4} className="shrink-0" style={{ color: LARANJA }} />
          <div className="text-[18px] leading-snug">
            Manter os <strong style={{ color: LARANJA }}>pagamentos em dia</strong> fortalece nossa parceria e garante a continuidade do nosso trabalho!
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative mt-4 overflow-hidden pb-14" style={{ background: ESCURO }}>
        <div className="flex items-center justify-between px-6 py-5">
          {[
            { I: Award, t: ["Produtos", "de qualidade"] },
            { I: Package, t: ["Variedade para", "o seu negócio"] },
            { I: Truck, t: ["Entrega rápida", "e confiável"] },
            { I: Headset, t: ["Atendimento", "especializado"] },
            { I: ChartColumnIncreasing, t: ["Parceria que", "gera resultados"] },
          ].map(({ I, t }, n) => (
            <div key={n} className={`flex flex-1 items-center gap-2.5 ${n ? "border-l border-white/25 pl-3" : ""}`}>
              <I size={44} strokeWidth={1.5} className="shrink-0" style={{ color: LARANJA }} />
              <span className="text-[13px] uppercase leading-tight text-white">
                {t[0]}
                <br />
                {t[1]}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[58px] rounded-t-[50%]" style={{ backgroundImage: GRADIENTE }} />
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-5">
          <span className="h-[2px] w-[150px] bg-[#2a2b2f]" />
          <span className="text-[24px] font-semibold italic text-[#2a2b2f]">{EMPRESA.slogan}!</span>
          <span className="h-[2px] w-[150px] bg-[#2a2b2f]" />
        </div>
      </div>
    </div>
  );
}
