/* eslint-disable @next/next/no-img-element */

/** Símbolo + "breakfast" (com "fast" em laranja). `escuro` = para fundos escuros. */
export function Logo({
  escuro = false,
  tamanho = 28,
  slogan = false,
}: {
  escuro?: boolean;
  tamanho?: number;
  slogan?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={escuro ? "/marca/simbolo-branco.png" : "/marca/simbolo.png"}
        alt=""
        style={{ height: tamanho * 1.15, width: "auto" }}
      />
      <span className="flex flex-col leading-none">
        <span className="font-semibold tracking-tight" style={{ fontSize: tamanho }}>
          <span className={escuro ? "text-white" : "text-grafite"}>break</span>
          <span className="texto-marca">fast</span>
        </span>
        {slogan && (
          <span
            className={`mt-1 font-semibold uppercase ${escuro ? "text-white/70" : "text-muted"}`}
            style={{ fontSize: Math.max(8, tamanho * 0.28), letterSpacing: "0.08em" }}
          >
            Distribuindo sabor e praticidade
          </span>
        )}
      </span>
    </span>
  );
}
