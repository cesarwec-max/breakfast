import type { MetadataRoute } from "next";

// Permite "Adicionar à tela inicial" no celular e abrir como um app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Breakfast",
    short_name: "Breakfast",
    description: "Pedidos, estoque, financeiro e contas da Breakfast.",
    start_url: "/",
    display: "standalone",
    background_color: "#232325",
    theme_color: "#232325",
    icons: [
      { src: "/marca/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/marca/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
