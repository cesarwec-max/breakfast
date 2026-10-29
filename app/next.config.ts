import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Anexos (notas e boletos) chegam por ação do servidor; a Vercel aceita até 4,5 MB por envio.
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
