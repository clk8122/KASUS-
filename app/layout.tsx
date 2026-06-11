import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: {
    default: "KASUS",
    template: "%s - KASUS"
  },
  description: "La suite métier des professionnels de l'immobilier."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable} lang="fr">
      <body>{children}</body>
    </html>
  );
}
