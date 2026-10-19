import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Empresta Aí | Equipamentos que circulam",
  description:
    "Uma experiência simples para descobrir, solicitar e acompanhar equipamentos compartilhados.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
