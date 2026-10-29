"use client";

import { useState } from "react";
import type { Cliente } from "@/lib/dados";
import { Enviar } from "./botoes";
import { Campo, cls } from "./ui";

type Valores = Partial<Cliente>;

/** Formulário de cliente. O CEP preenche o endereço sozinho (ViaCEP). */
export function ClienteForm({
  acao,
  inicial = {},
  voltar,
  textoBotao = "Salvar cliente",
}: {
  acao: (form: FormData) => Promise<void>;
  inicial?: Valores;
  voltar?: string;
  textoBotao?: string;
}) {
  const [v, setV] = useState<Valores>(inicial);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const muda = (campo: keyof Cliente) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((a) => ({ ...a, [campo]: e.target.value }));

  async function buscarCep() {
    const cep = (v.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setV((a) => ({
          ...a,
          endereco: d.logradouro || a.endereco,
          bairro: d.bairro || a.bairro,
          cidade: d.localidade || a.cidade,
          uf: d.uf || a.uf,
        }));
      }
    } catch {
      // sem internet ou CEP inválido: preenche à mão
    } finally {
      setBuscandoCep(false);
    }
  }

  const campo = (nome: keyof Cliente, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input name={nome} value={String(v[nome] ?? "")} onChange={muda(nome)} className={cls.input} {...props} />
  );

  return (
    <form action={acao} className="space-y-6">
      {voltar && <input type="hidden" name="voltar" value={voltar} />}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold">Para pedidos e entregas</legend>
        <Campo rotulo="Nome do cliente *" className="sm:col-span-2" dica="Como vocês chamam o cliente no dia a dia.">
          {campo("nome", { required: true, autoFocus: !inicial.id })}
        </Campo>
        <Campo rotulo={buscandoCep ? "CEP (buscando…)" : "CEP"} dica="Digite o CEP para preencher o endereço.">
          {campo("cep", { inputMode: "numeric", onBlur: buscarCep, placeholder: "00000-000" })}
        </Campo>
        <Campo rotulo="Telefone / WhatsApp">{campo("telefone", { inputMode: "tel" })}</Campo>
        <Campo rotulo="Endereço (rua, avenida)" className="sm:col-span-2">
          {campo("endereco")}
        </Campo>
        <Campo rotulo="Número">{campo("numero")}</Campo>
        <Campo rotulo="Complemento">{campo("complemento")}</Campo>
        <Campo rotulo="Bairro">{campo("bairro")}</Campo>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Campo rotulo="Cidade">{campo("cidade")}</Campo>
          <Campo rotulo="UF">{campo("uf", { maxLength: 2, className: `${cls.input} uppercase` })}</Campo>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">Para nota fiscal e boleto</legend>
        <p className="text-xs text-muted sm:col-span-2">Preencha uma vez; as solicitações usam esses dados automaticamente.</p>
        <Campo rotulo="Razão social" className="sm:col-span-2">
          {campo("razao_social")}
        </Campo>
        <Campo rotulo="CNPJ ou CPF">{campo("cnpj_cpf", { inputMode: "numeric" })}</Campo>
        <Campo rotulo="Inscrição estadual">{campo("inscricao_estadual")}</Campo>
        <Campo rotulo="E-mail (para envio da nota/boleto)" className="sm:col-span-2">
          {campo("email", { type: "email", inputMode: "email" })}
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2">
          <textarea name="observacoes" value={v.observacoes ?? ""} onChange={muda("observacoes")} rows={2} className={cls.input} />
        </Campo>
      </fieldset>

      <Enviar>{textoBotao}</Enviar>
    </form>
  );
}
