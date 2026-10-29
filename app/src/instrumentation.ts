// Roda uma vez quando o servidor liga: garante que as tabelas do banco existem.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrar } = await import("./lib/migrar");
    await migrar();
  }
}
