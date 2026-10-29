import postgres from "postgres";

// Uma única conexão por processo (o modo dev recarrega os módulos a cada mudança).
const global = globalThis as unknown as { _sql?: ReturnType<typeof criar> };

function criar() {
  return postgres(process.env.DATABASE_URL!, {
    // Na Vercel cada função usa poucas conexões; o Neon usa um "pooler" que não aceita prepared statements.
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: 20,
    prepare: false,
    types: {
      // numeric → number (valores e quantidades)
      numero: {
        to: 1700,
        from: [1700],
        serialize: (x: number) => String(x),
        parse: (x: string) => Number(x),
      },
      // date → "AAAA-MM-DD" (sem fuso horário)
      data: {
        to: 1082,
        from: [1082],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
    },
  });
}

export const sql = global._sql ?? criar();
if (process.env.NODE_ENV !== "production") global._sql = sql;
