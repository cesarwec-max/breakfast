"use client";

import { useEffect, useRef, useState } from "react";
import { cls } from "./ui";

/** "2026-12-10" → "10/12/2026" */
const paraTexto = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "");

/** "10/12/2026" → "2026-12-10", ou "" se a data não existe. */
function paraIso(texto: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return "";
  const [, d, mes, a] = m;
  const dt = new Date(Date.UTC(+a, +mes - 1, +d));
  return dt.getUTCFullYear() === +a && dt.getUTCMonth() === +mes - 1 && dt.getUTCDate() === +d ? `${a}-${mes}-${d}` : "";
}

/** Coloca as barras enquanto a pessoa digita: "10122026" → "10/12/2026". */
function mascara(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join("/");
}

/**
 * Campo de data sempre em DD/MM/AAAA (o campo nativo do navegador muda conforme o idioma do aparelho).
 * Envia no formulário (`name`) a data no formato do banco (AAAA-MM-DD). Tem o botão 📅 para abrir o calendário.
 */
export function CampoData({
  name,
  value,
  defaultValue,
  onChange,
  required,
  className = cls.input,
  ...resto
}: {
  name?: string;
  /** Controlado: data em AAAA-MM-DD. */
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [texto, setTexto] = useState(() => paraTexto(value ?? defaultValue ?? ""));
  const calendario = useRef<HTMLInputElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const iso = paraIso(texto);

  // Quando o valor vem de fora (ex.: "dividir em parcelas"), mostra a data nova
  const [anterior, setAnterior] = useState(value);
  if (value !== anterior) {
    setAnterior(value);
    if (value !== undefined && value !== iso) setTexto(paraTexto(value));
  }

  useEffect(() => {
    campo.current?.setCustomValidity(texto && !iso ? "Data inválida. Use DD/MM/AAAA." : "");
  }, [texto, iso]);

  function mudar(t: string) {
    setTexto(t);
    const novo = paraIso(t);
    if (onChange && (novo || t === "")) onChange(novo);
  }

  return (
    <div className="relative">
      <input
        ref={campo}
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={texto}
        onChange={(e) => mudar(mascara(e.target.value))}
        required={required}
        className={`${className} pr-10`}
        {...resto}
      />
      {name && <input type="hidden" name={name} value={iso} />}
      <input
        ref={calendario}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={iso}
        onChange={(e) => mudar(paraTexto(e.target.value))}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
      <button
        type="button"
        onClick={() => {
          try {
            calendario.current?.showPicker();
          } catch {
            campo.current?.focus();
          }
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground"
        aria-label="Abrir calendário"
      >
        📅
      </button>
    </div>
  );
}
