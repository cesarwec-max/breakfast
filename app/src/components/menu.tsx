"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ITENS = [
  { href: "/", rotulo: "Início" },
  { href: "/pedidos", rotulo: "Pedidos" },
  { href: "/estoque", rotulo: "Estoque" },
  { href: "/financeiro", rotulo: "Financeiro" },
  { href: "/receber", rotulo: "A receber" },
  { href: "/pagar", rotulo: "A pagar" },
  { href: "/clientes", rotulo: "Clientes" },
];

export function Menu() {
  const caminho = usePathname();
  const nav = useRef<HTMLElement>(null);
  // No celular o menu rola de lado: mantém a aba aberta visível.
  useEffect(() => {
    nav.current?.querySelector("[aria-current]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [caminho]);
  return (
    <nav ref={nav} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2">
      {ITENS.map((i) => {
        const ativo = i.href === "/" ? caminho === "/" : caminho.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={ativo ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              ativo ? "bg-marca text-white shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
