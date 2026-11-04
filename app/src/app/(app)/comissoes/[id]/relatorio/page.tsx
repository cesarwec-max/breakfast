import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirLogin } from "@/lib/auth";
import { descreverFaixas, limitesMes, mesValido, nomeMes, obterRepresentante, resumoComissao } from "@/lib/comissoes";
import { hoje } from "@/lib/formato";
import { ComissaoJPG } from "@/components/comissao-jpg";
import { Aviso, Titulo } from "@/components/ui";

export const metadata: Metadata = { title: "Relatório de produção" };

export default async function RelatorioComissao({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string }> }) {
  await exigirLogin();
  const id = Number((await params).id);
  const sp = await searchParams;
  const r = Number.isInteger(id) ? await obterRepresentante(id) : null;
  if (!r) notFound();
  const mes = mesValido(sp.mes) ? sp.mes! : hoje().slice(0, 7);
  const c = await resumoComissao(r, mes);
  const { inicio, fim } = limitesMes(mes);
  const limpo = r.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-");

  return (
    <>
      <Titulo
        titulo="Relatório de produção"
        subtitulo={`${r.nome} · ${nomeMes(mes)}`}
        voltar={{ href: `/comissoes/${id}?mes=${mes}`, rotulo: "Voltar" }}
      />
      {!c.fechado && <Aviso tom="aviso">O mês ainda está em aberto: o relatório sai marcado como &quot;Prévia&quot;. Feche o mês para o relatório final.</Aviso>}
      <ComissaoJPG
        nomeArquivo={`Relatorio-producao-${limpo}-${mes}.jpg`}
        dados={{
          representante: r.nome,
          mesNome: nomeMes(mes),
          inicio,
          fim,
          fechado: !!c.fechado,
          total: c.total,
          percentual: c.percentual,
          valor: c.valor,
          faixas: descreverFaixas(r.faixas),
          pedidos: c.pedidos.map((p) => ({ id: p.id, cliente: p.cliente, data_entrega: p.data_entrega, total: p.total })),
        }}
      />
    </>
  );
}
