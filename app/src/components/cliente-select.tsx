"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cls } from "./ui";

export type OpcaoCliente = { id: number; nome: string; endereco: string; faltaFiscal: string[] };

/** Escolha do cliente, com busca e o endereço/dados aparecendo logo abaixo. */
export function ClienteSelect({
  clientes,
  inicial,
  voltar,
  modo = "entrega",
  aoMudar,
}: {
  clientes: OpcaoCliente[];
  inicial?: number;
  voltar: string;
  modo?: "entrega" | "fiscal";
  aoMudar?: (id: number) => void;
}) {
  const [id, setId] = useState<number | "">(inicial ?? "");
  const [busca, setBusca] = useState("");
  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    if (!b) return clientes;
    return clientes.filter((c) => c.nome.toLowerCase().includes(b) || c.id === id);
  }, [busca, clientes, id]);
  const atual = clientes.find((c) => c.id === id);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Cliente *</span>
        <Link href={`/clientes/novo?voltar=${encodeURIComponent(voltar)}`} className={`${cls.link} text-sm`}>
          + cadastrar novo
        </Link>
      </div>
      {clientes.length > 12 && (
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente…"
          className={`${cls.input} mb-2`}
        />
      )}
      <select
        name="cliente_id"
        required
        value={id}
        onChange={(e) => {
          const novo = Number(e.target.value);
          setId(novo);
          aoMudar?.(novo);
        }}
        className={cls.input}
      >
        <option value="" disabled>
          Escolha o cliente…
        </option>
        {filtrados.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      {atual && modo === "entrega" && (
        <p className="mt-1.5 text-sm text-muted">📍 {atual.endereco || "Sem endereço cadastrado"}</p>
      )}
      {atual && modo === "fiscal" && atual.faltaFiscal.length > 0 && (
        <p className="mt-1.5 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Faltam dados no cadastro: {atual.faltaFiscal.join(", ")}.{" "}
          <Link href={`/clientes/${atual.id}`} className="font-semibold underline">
            Completar cadastro
          </Link>
        </p>
      )}
    </div>
  );
}
