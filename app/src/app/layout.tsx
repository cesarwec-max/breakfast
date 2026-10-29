import type { Metadata, Viewport } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";

// Poppins: textos do app (parecida com a marca). Oswald: títulos condensados das solicitações.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const oswald = Oswald({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: { default: "Breakfast", template: "%s · Breakfast" },
  description: "Gestão da Breakfast: pedidos, estoque, financeiro e contas.",
  robots: { index: false, follow: false },
  appleWebApp: { title: "Breakfast", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#232325",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${oswald.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
