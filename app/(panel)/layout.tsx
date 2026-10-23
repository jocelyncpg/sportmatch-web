"use client";

import {
  BadgePercent,
  Bell,
  Building2,
  Flag,
  Gavel,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import BrandLogo from "@/components/BrandLogo";
import { SesionCtx } from "@/components/SesionContext";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui";
import { logout, type Rol } from "@/lib/auth.mock";

interface Item {
  href: string;
  label: string;
  icono: LucideIcon;
  roles: Rol[];
}

const GRUPOS: { titulo: string; items: Item[] }[] = [
  {
    titulo: "General",
    items: [
      { href: "/inicio", label: "Inicio", icono: LayoutDashboard, roles: ["club", "admin"] },
      { href: "/clubes", label: "Directorio de clubes", icono: Building2, roles: ["club", "admin"] },
    ],
  },
  {
    titulo: "Gestión del club",
    items: [
      { href: "/perfil", label: "Mi club", icono: ShieldCheck, roles: ["club"] },
      { href: "/convocatorias", label: "Convocatorias", icono: Megaphone, roles: ["club"] },
      { href: "/postulantes", label: "Postulantes", icono: Users, roles: ["club"] },
      { href: "/avisos", label: "Avisos", icono: Bell, roles: ["club"] },
    ],
  },
  {
    titulo: "Plataforma",
    items: [{ href: "/planes", label: "Planes y convenios", icono: BadgePercent, roles: ["admin"] }],
  },
  {
    titulo: "Moderación",
    items: [
      { href: "/reportes", label: "Reportes", icono: Flag, roles: ["admin"] },
      { href: "/sanciones", label: "Sanciones", icono: Gavel, roles: ["admin"] },
      { href: "/auditoria", label: "Auditoría", icono: ScrollText, roles: ["admin"] },
    ],
  },
];

function Panel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AuthGuard>
      {(sesion) => {
        const grupos = GRUPOS.map((g) => ({
          ...g,
          items: g.items.filter((i) => i.roles.includes(sesion.rol)),
        })).filter((g) => g.items.length > 0);
        const todos = grupos.flatMap((g) => g.items);

        return (
          <SesionCtx.Provider value={sesion}>
            <div className="flex min-h-screen">
              <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex">
                <div className="mb-7 px-2">
                  <BrandLogo width={160} />
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto">
                  {grupos.map((g) => (
                    <div key={g.titulo}>
                      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                        {g.titulo}
                      </p>
                      <div className="space-y-1">
                        {g.items.map((m) => {
                          const activo = pathname.startsWith(m.href);
                          const Icono = m.icono;
                          return (
                            <Link
                              key={m.href}
                              href={m.href}
                              className={`flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                                activo
                                  ? "bg-chip text-accent"
                                  : "text-muted hover:bg-subtle hover:text-text"
                              }`}
                            >
                              <Icono size={18} strokeWidth={2.2} />
                              {m.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted">Tema</span>
                  <ThemeToggle compacto />
                </div>
                <div className="flex items-center gap-3 rounded-[14px] bg-subtle p-3">
                  <Avatar nombre={sesion.nombre} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{sesion.nombre}</p>
                    <p className="truncate text-xs text-muted">
                      {sesion.rol === "club" ? "Cuenta de club" : "Administración"}
                    </p>
                  </div>
                  <button
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    onClick={() => {
                      logout();
                      router.replace("/login");
                    }}
                    className="rounded-lg p-2 text-muted hover:bg-card hover:text-danger"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <nav className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card p-3 md:hidden">
                  {todos.map((m) => (
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
                  <span className="ml-auto shrink-0">
                    <ThemeToggle compacto />
                  </span>
                </nav>
                <main className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-10">{children}</main>
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