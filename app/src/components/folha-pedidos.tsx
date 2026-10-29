/* eslint-disable @next/next/no-img-element */
// Folha "Solicitações de pedidos" para atualizar a equipe (JPG), no visual do modelo do usuário.
// Desenhada em 1024 px de largura; vira imagem em gerar-jpg.tsx.

import { CalendarDays, CircleCheck, ClipboardList, Clock, ShoppingCart, Truck, User } from "lucide-react";
import { dataBR, qtd } from "@/lib/formato";

export type PedidoFolha = {
  id: number;
  cliente: string;
  endereco: string;
  data_entrega: string;
  status: "pendente" | "em_rota";
  observacao: string;
  itens: { produto_id: number; produto: string; sabor: string; unidade: string; quantidade: number; tem_foto: boolean }[];
};

const VERMELHO = "#e3161b";
const PRETO = "#141416";
const LINHA = "#d9d9dc";
const COLUNAS = [46, 170, 268, 122, 116, 238]; // item, cliente, descrição, status, observações, produto (soma = 960)

function Slogan({ tamanho = 13, espaco = "0.32em" }: { tamanho?: number; espaco?: string }) {
  return (
    <span className="font-sans font-semibold uppercase" style={{ fontSize: tamanho, letterSpacing: espaco }}>
      <span className="text-[#141416]">Distribuindo </span>
      <span style={{ color: VERMELHO }}>sabor</span>
      <span className="text-[#141416]"> e </span>
      <span style={{ color: VERMELHO }}>praticidade</span>
    </span>
  );
}

function unidade(i: { unidade: string; quantidade: number }) {
  const u = i.unidade.trim().toLowerCase();
  if (u === "un" || u === "unid" || u === "unidade") return i.quantidade === 1 ? "unidade" : "unidades";
  // pacote → pacotes, caixa → caixas (abreviações como kg ficam iguais)
  if (i.quantidade !== 1 && /^[a-zà-ú]{4,}$/i.test(u) && !u.endsWith("s")) return i.unidade + "s";
  return i.unidade;
}

function Status({ status }: { status: PedidoFolha["status"] }) {
  const Icone = status === "em_rota" ? Truck : Clock;
  return (
    <div className="flex flex-col items-center gap-1.5 font-condensada" style={{ color: VERMELHO }}>
      <Icone size={50} strokeWidth={2.2} />
      <span className="text-[27px] font-semibold uppercase leading-none">{status === "em_rota" ? "Em rota" : "Pendente"}</span>
    </div>
  );
}

export function FolhaPedidos({
  pedidos,
  semana,
  observacoesGerais,
}: {
  pedidos: PedidoFolha[];
  semana: string; // AAAA-MM-DD
  observacoesGerais: string;
}) {
  const fotoDestaque = pedidos.flatMap((p) => p.itens).find((i) => i.tem_foto)?.produto_id;
  const vazias = Math.max(0, 4 - pedidos.length);
  const celula = { borderRight: `1px solid ${LINHA}` } as const;

  return (
    <div className="relative overflow-hidden font-sans text-[#141416]" style={{ width: 1024, background: "linear-gradient(180deg, #f4f4f5, #e9e9eb)" }}>
      {/* Círculo decorativo com a foto de um produto (ou o símbolo da marca) */}
      <div className="absolute -right-[70px] -top-[70px] size-[430px] rounded-full" style={{ background: VERMELHO }} />
      <div className="absolute -right-[40px] -top-[40px] size-[370px] rounded-full" style={{ background: PRETO }} />
      <div className="absolute right-[8px] top-[8px] flex size-[274px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        <img
          src={fotoDestaque ? `/produtos/${fotoDestaque}/foto` : "/marca/simbolo.png"}
          alt=""
          className={fotoDestaque ? "h-[86%] w-[86%] object-contain" : "h-[58%] w-auto"}
        />
      </div>

      {/* Cabeçalho */}
      <div className="relative px-10 pt-7" style={{ height: 392 }}>
        <div className="flex items-end gap-2">
          <img src="/marca/simbolo.png" alt="" className="h-[62px] w-auto" />
          <div className="pb-0.5 text-[48px] font-semibold leading-none tracking-tight">
            <span className="text-[#141416]">break</span>
            <span className="texto-marca">fast</span>
          </div>
        </div>
        <div className="mt-2">
          <Slogan tamanho={11} />
        </div>
        <div className="mt-4 font-condensada font-bold uppercase leading-[0.92]">
          <div className="text-[78px] text-[#141416]">Solicitações</div>
          <div className="text-[92px]" style={{ color: VERMELHO }}>
            de pedidos
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ClipboardList size={40} strokeWidth={1.8} style={{ color: VERMELHO }} />
          <span className="text-[19px] font-light leading-snug">
            Acompanhe as entregas e dê baixa
            <br />
            conforme cada pedido for entregue.
          </span>
        </div>

        {/* Semana */}
        <div className="absolute left-[504px] top-[70px] flex w-[132px] flex-col items-center rounded-[18px] px-3 pb-5 pt-4 font-condensada" style={{ background: PRETO }}>
          <CalendarDays size={58} strokeWidth={1.8} style={{ color: VERMELHO }} />
          <span className="mt-2 text-[25px] uppercase leading-none text-white">Semana de</span>
          <span className="mt-1 text-[50px] font-semibold leading-none" style={{ color: VERMELHO }}>
            {dataBR(semana).slice(0, 5)}
          </span>
          <span className="mt-3 h-[14px] w-[64px] rounded-full" style={{ background: VERMELHO }} />
        </div>
      </div>

      {/* Tabela */}
      <div className="relative mx-8 overflow-hidden rounded-[14px] border bg-[#f3f3f4]" style={{ borderColor: LINHA }}>
        <div className="flex items-center gap-4 px-3 py-2" style={{ background: PRETO }}>
          <span className="flex size-[40px] items-center justify-center rounded-full" style={{ background: VERMELHO }}>
            <ShoppingCart size={22} strokeWidth={2.2} className="text-white" />
          </span>
          <span className="font-condensada text-[32px] uppercase text-white">Pedidos pendentes</span>
        </div>
        <div className="flex font-condensada text-[20px] uppercase text-white" style={{ background: VERMELHO }}>
          {["Item", "Cliente", "Descrição do pedido", "Status", "Observações", "Produto"].map((t, i) => (
            <div key={t} className="py-2.5 text-center" style={{ width: COLUNAS[i], borderRight: i < 5 ? "1px solid rgba(0,0,0,0.12)" : undefined }}>
              {t}
            </div>
          ))}
        </div>

        {pedidos.map((p, n) => (
          <div key={p.id} className="flex border-b" style={{ borderColor: LINHA, minHeight: 168 }}>
            <div className="flex items-center justify-center font-condensada text-[62px] font-semibold" style={{ width: COLUNAS[0], ...celula }}>
              {n + 1}
            </div>
            <div className="flex flex-col justify-center gap-2 px-2.5 py-3" style={{ width: COLUNAS[1], ...celula }}>
              <div className="flex items-center gap-2">
                <span className="flex size-[54px] shrink-0 items-center justify-center rounded-full" style={{ background: VERMELHO }}>
                  <User size={30} strokeWidth={2.2} className="text-white" />
                </span>
                <span className="font-condensada text-[25px] font-medium uppercase leading-[1.05]">{p.cliente}</span>
              </div>
              {p.endereco && <span className="text-[12px] leading-snug text-[#55555c]">📍 {p.endereco}</span>}
            </div>
            <div className="flex flex-col justify-center px-4 py-3" style={{ width: COLUNAS[2], ...celula }}>
              <ul className="space-y-2.5">
                {p.itens.map((i, k) => (
                  <li key={k} className="flex gap-3 text-[16px] font-light leading-snug">
                    <span className="mt-[9px] size-[7px] shrink-0 rounded-full bg-[#141416]" />
                    <span>
                      <span className="font-normal">
                        {qtd(i.quantidade)} {unidade(i)}
                      </span>
                      <br />
                      {i.produto}
                      {i.sabor && ` (${i.sabor})`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 py-3" style={{ width: COLUNAS[3], ...celula }}>
              <Status status={p.status} />
              <span className="text-[12px] text-[#55555c]">Entrega {dataBR(p.data_entrega).slice(0, 5)}</span>
            </div>
            <div className="flex items-center justify-center px-2 py-3 text-center text-[15px] leading-snug" style={{ width: COLUNAS[4], ...celula }}>
              {p.observacao || "—"}
            </div>
            <div className="flex flex-col items-center justify-center gap-2 px-3 py-3" style={{ width: COLUNAS[5] }}>
              {p.itens.filter((i) => i.tem_foto).slice(0, 2).map((i) => (
                <img key={i.produto_id} src={`/produtos/${i.produto_id}/foto`} alt={i.produto} className="max-h-[104px] w-full object-contain" />
              ))}
              {!p.itens.some((i) => i.tem_foto) && (
                <span className="text-center font-condensada text-[20px] uppercase leading-tight text-[#55555c]">
                  {p.itens.map((i) => i.produto).join(" · ")}
                </span>
              )}
            </div>
          </div>
        ))}
        {Array.from({ length: vazias }, (_, n) => (
          <div key={`v${n}`} className="flex border-b last:border-b-0" style={{ borderColor: LINHA, height: 140 }}>
            {COLUNAS.map((l, i) => (
              <div key={i} style={{ width: l, ...(i < 5 ? celula : {}) }} />
            ))}
          </div>
        ))}
      </div>

      {/* Observações + lembrete */}
      <div className="mx-8 mt-10 flex items-stretch gap-6">
        <div className="flex flex-1 flex-col gap-2 rounded-[12px] border bg-white/50 px-4 py-3" style={{ borderColor: LINHA }}>
          <div className="flex items-center gap-3">
            <span className="flex size-[44px] items-center justify-center rounded-[10px]" style={{ background: VERMELHO }}>
              <ClipboardList size={24} strokeWidth={2} className="text-white" />
            </span>
            <span className="font-condensada text-[24px] font-medium uppercase">Observações gerais</span>
          </div>
          {observacoesGerais.trim() && <p className="whitespace-pre-line text-[16px] leading-snug">{observacoesGerais.trim()}</p>}
        </div>
        <div className="flex flex-[1.25] items-center gap-4 rounded-[12px] border bg-white/50 px-4 py-3" style={{ borderColor: LINHA }}>
          <Truck size={70} strokeWidth={1.6} style={{ color: VERMELHO }} className="shrink-0" />
          <div>
            <div className="font-condensada text-[25px] font-semibold uppercase leading-none" style={{ color: VERMELHO }}>
              Mantenha os pedidos atualizados!
            </div>
            <div className="mt-1 text-[15px] font-light leading-snug">Após a entrega, dê baixa e mantenha o controle sempre em dia.</div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mx-8 mt-4 flex items-center justify-between rounded-[14px] px-6 py-4" style={{ background: PRETO }}>
        {[
          { I: Clock, t: "Pendente:", d: ["pedido ainda", "não entregue."] },
          { I: Truck, t: "Em rota:", d: ["pedido em", "transporte."] },
          { I: CircleCheck, t: "Entregue:", d: ["pedido entregue", "com sucesso."] },
        ].map(({ I, t, d }, n) => (
          <div key={t} className={`flex flex-1 items-center justify-center gap-4 ${n ? "border-l border-white/20" : ""}`}>
            <I size={60} strokeWidth={1.8} style={{ color: VERMELHO }} />
            <div>
              <div className="font-condensada text-[28px] font-semibold uppercase leading-none" style={{ color: VERMELHO }}>
                {t}
              </div>
              <div className="mt-1 text-[17px] font-light leading-tight text-white">
                {d[0]}
                <br />
                {d[1]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mx-10 flex items-center gap-6 pb-9 pt-7">
        <span className="h-px flex-1 bg-[#141416]/40" />
        <Slogan tamanho={13} espaco="0.4em" />
        <span className="h-px flex-1 bg-[#141416]/40" />
      </div>
    </div>
  );
}
