import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportMatch · Panel web",
  description: "Panel web para clubes y administración de SportMatch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< Updated upstream
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
=======
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
>>>>>>> Stashed changes
    </html>
  );
}