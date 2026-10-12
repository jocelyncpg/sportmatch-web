import type { Metadata } from "next";
import { ThemeProvider, SCRIPT_TEMA } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportMatch · Panel web",
  description: "Panel web para clubes y administración de SportMatch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}