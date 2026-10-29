// Prévia na tela da solicitação de NF para o contador. Mesmas medidas do PDF (lib/nf-contador.ts), em pontos.

import type { DadosNF } from "@/lib/dados";
import { EMPRESA } from "@/lib/empresa";
import { brl } from "@/lib/formato";
import { A4, COR, MEDIDAS as M, ORIENTACOES_CONTADOR, linhasCliente, linhasProdutos, orientacoesExtras } from "@/lib/nf-contador";

/** Largura da folha em px (A4 a 96 dpi). */
export const LARGURA_A4_PX = Math.round((A4.largura * 96) / 72);

const pt = (n: number) => `${n}pt`;
const fonte = "Helvetica, Arial, sans-serif";

function Secao({ children, topo }: { children: React.ReactNode; topo: number }) {
  return (
    <div style={{ marginTop: pt(topo), marginLeft: pt(M.margemTitulo), fontSize: pt(M.tamSecao), fontWeight: 700, lineHeight: 1 }}>
      {children}
    </div>
  );
}

export function FolhaNFContador({ dados }: { dados: DadosNF }) {
  const tc = M.cliente;
  const tp = M.produtos;
  const larg = (i: number) => tp.cols[i + 1] - tp.cols[i];
  const cel: React.CSSProperties = { border: `0.6pt solid ${COR.borda}`, verticalAlign: "top" };
  const extras = orientacoesExtras(dados);

  return (
    <div
      style={{
        width: pt(A4.largura),
        minHeight: pt(A4.altura),
        background: "#fff",
        color: COR.escuro,
        fontFamily: fonte,
        paddingTop: pt(M.tituloBase - M.tamTitulo * 0.72),
        paddingBottom: pt(40),
      }}
    >
      <div style={{ textAlign: "center", fontSize: pt(M.tamTitulo), fontWeight: 700, lineHeight: 1 }}>BREAKFAST</div>
      <div style={{ textAlign: "center", fontSize: pt(M.tamSecao), fontWeight: 700, color: COR.laranja, marginTop: pt(6), lineHeight: 1 }}>
        SOLICITAÇÃO DE NOTA FISCAL
      </div>

      <Secao topo={22}>DADOS DO CLIENTE</Secao>
      <table style={{ marginTop: pt(7), marginLeft: pt(tc.x), width: pt(tc.xFim - tc.x), borderCollapse: "collapse", fontSize: pt(tc.tam), lineHeight: pt(tc.entrelinha) }}>
        <tbody>
          {linhasCliente(dados.cliente).map(([r, v]) => (
            <tr key={r}>
              <td style={{ ...cel, width: pt(tc.xDivisao - tc.x), background: COR.fundoRotulo, fontWeight: 700, padding: `${pt(4.5)} ${pt(tc.pad)}` }}>{r}</td>
              <td style={{ ...cel, padding: `${pt(4.5)} ${pt(tc.pad)}` }}>{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Secao topo={22}>PRODUTOS DO PEDIDO</Secao>
      <table
        style={{
          marginTop: pt(10),
          marginLeft: pt(tp.cols[0]),
          width: pt(tp.cols[5] - tp.cols[0]),
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: pt(tp.tam),
          lineHeight: pt(tp.entrelinha),
        }}
      >
        <colgroup>
          {[0, 1, 2, 3, 4].map((i) => (
            <col key={i} style={{ width: pt(larg(i)) }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {["Produto", "Sabor", "Qtd.", "Valor unitário", "Subtotal"].map((t) => (
              <th key={t} style={{ ...cel, background: COR.escuro, color: "#fff", textAlign: "left", padding: `${pt(9.5)} ${pt(tp.pad)}` }}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhasProdutos(dados).map((l, n) => (
            <tr key={n}>
              {l.map((t, i) => (
                <td key={i} style={{ ...cel, background: COR.fundoRotulo, textAlign: i < 2 ? "left" : "center", padding: `${pt(9.5)} ${pt(tp.pad)}` }}>
                  {t}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: pt(10.1),
          marginLeft: pt(M.total.x),
          width: pt(M.total.xFim - M.total.x),
          height: pt(M.total.altura),
          background: COR.laranja,
          color: "#fff",
          fontWeight: 700,
          position: "relative",
        }}
      >
        <span style={{ position: "absolute", left: pt(77.2 - M.total.x), top: pt(15.5), fontSize: pt(M.total.tamRotulo), lineHeight: 1 }}>TOTAL DO PEDIDO</span>
        <span style={{ position: "absolute", left: pt(M.total.xValor - M.total.x), top: pt(14.8), fontSize: pt(M.total.tamValor), lineHeight: 1 }}>
          {brl(dados.total)}
        </span>
      </div>

      <Secao topo={25}>INSTRUÇÕES AO CONTADOR</Secao>
      <ul style={{ marginTop: pt(8), marginLeft: pt(M.margemTitulo), marginRight: pt(60), fontSize: pt(M.tamTexto), lineHeight: pt(13) }}>
        {[...ORIENTACOES_CONTADOR.map((t) => <>{t}</>), <>Enviar o XML e o DANFE para <strong>{EMPRESA.emailFinanceiro}</strong>.</>, ...extras.map((t) => <>{t}</>)].map(
          (c, i) => (
            <li key={i} style={{ display: "flex", gap: pt(2.6), marginTop: pt(i ? 6 : 0) }}>
              <span>•</span>
              <span>{c}</span>
            </li>
          ),
        )}
      </ul>

      <div style={{ marginTop: pt(18), marginLeft: pt(64.8), width: pt(530.5 - 64.8), borderTop: `0.8pt solid ${COR.laranja}` }} />
      <div style={{ marginLeft: pt(71.2), marginTop: pt(10), fontSize: pt(M.tamRodape), lineHeight: pt(11) }}>
        <strong>BREAKFAST</strong>
        <div>Distribuindo Sabor e Praticidade.</div>
      </div>
    </div>
  );
}
