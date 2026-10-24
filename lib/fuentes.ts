import { Barlow_Condensed, Inter } from "next/font/google";

// Tipografía del panel (la misma de la portada): Barlow Condensed para títulos, Inter para texto.
export const fuenteTitulo = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-titulo",
  display: "swap",
});
export const fuenteTexto = Inter({
  subsets: ["latin"],
  variable: "--font-texto",
  display: "swap",
});