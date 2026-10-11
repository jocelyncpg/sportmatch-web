"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import BrandLogo from "@/components/BrandLogo";
import { SesionCtx } from "@/components/SesionContext";
import { logout, type Rol } from "@/lib/auth.mock";

const MENU: { href: string; label: string; roles: Rol[] }[] = [
  { href: "/inicio", label: "Inicio", roles: ["club", "admin"] },
  { href: "/clubes", label: "Directorio de clubes", roles: ["club", "admin"] },
  { href: "/perfil", label: "Mi club", roles: ["club"] },
  { href: "/convocatorias", label: "Convocatorias", roles: ["club"] },
  { href: "/postulantes", label: "Postulantes", roles: ["club"] },
  { href: "/avisos", label: "Avisos", roles: ["club"] },
];

function Panel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AuthGuard>
      {(sesion) => {
        const items = MENU.filter((m) => m.roles.includes(sesion.rol));
        return (
          <SesionCtx.Provider value={sesion}>
            <div className="flex min-h-screen">
              <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-5 md:flex">
                <div className="mb-6">
                  <BrandLogo width={170} />
                </div>
                <nav className="flex-1 space-y-1">
                  {items.map((m) => {
                    const activo = pathname.startsWith(m.href);
                    return (
                      <Link
                        key={m.href}
                        href={m.href}
                        className={`block rounded-[13px] px-3 py-2.5 text-sm font-semibold ${
                          activo ? "bg-chip text-accent" : "text-muted hover:text-text"
                        }`}
                      >
                        {m.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-border pt-4 text-xs">
                  <p className="font-semibold">{sesion.nombre}</p>
                  <p className="mb-3 text-muted">{sesion.email}</p>
                  <button
                    onClick={() => {
                      logout();
                      router.replace("/login");
                    }}
                    className="font-semibold text-danger"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <nav className="flex gap-2 overflow-x-auto border-b border-border bg-card p-3 md:hidden">
                  {items.map((m) => (
                    <Link
                      key={m.href}
                      href={m.href}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        pathname.startsWith(m.href) ? "bg-chip text-accent" : "text-muted"
                      }`}
                    >
                      {m.label}
                    </Link>
                  ))}
                </nav>
                <main className="p-6 md:p-10">{children}</main>
              </div>
            </div>
          </SesionCtx.Provider>
        );
      }}
    </AuthGuard>
  );
}

// Suspense: el panel lee la ruta y la sesión en el cliente (requerido por Next 16 en rutas dinámicas).
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Cargando…</p>}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}