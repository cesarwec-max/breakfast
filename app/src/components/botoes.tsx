"use client";

import { useFormStatus } from "react-dom";
import { cls } from "./ui";

/** Botão de enviar que mostra "Salvando…" enquanto espera o servidor. */
export function Enviar({
  children,
  className = cls.botao,
  pendente = "Salvando…",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  pendente?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? pendente : children}
    </button>
  );
}

/** Botão que pede confirmação antes de enviar o formulário. */
export function Confirmar({
  children,
  mensagem,
  className = cls.perigo,
}: {
  children: React.ReactNode;
  mensagem: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}
