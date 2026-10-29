import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "bf_sessao";

// O cookie guarda uma assinatura da senha atual: trocar a senha desconecta todo mundo.
function assinatura() {
  return createHmac("sha256", process.env.SESSAO_SEGREDO ?? "")
    .update("breakfast:" + (process.env.APP_SENHA ?? ""))
    .digest("hex");
}

function iguais(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function estaLogado() {
  if (!process.env.SESSAO_SEGREDO || !process.env.APP_SENHA) return false;
  const valor = (await cookies()).get(COOKIE)?.value;
  return !!valor && iguais(valor, assinatura());
}

/** Use no topo de toda página e de toda ação do servidor. */
export async function exigirLogin() {
  if (!(await estaLogado())) redirect("/login");
}

export async function entrar(senha: string) {
  const correta = process.env.APP_SENHA;
  if (!correta || !process.env.SESSAO_SEGREDO || !iguais(senha, correta)) return false;
  (await cookies()).set(COOKIE, assinatura(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
  return true;
}

export async function sair() {
  (await cookies()).delete(COOKIE);
}
