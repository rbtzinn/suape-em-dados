import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUAPE em Dados",
  description: "Inteligência, integração e rastreabilidade para o Compliance da SUAPE.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
