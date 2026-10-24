"use client";

<<<<<<< Updated upstream
=======
import {
  BadgePercent,
  Bell,
  Building2,
  Flag,
  Gavel,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
>>>>>>> Stashed changes
import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import BrandLogo from "@/components/BrandLogo";
import { SesionCtx } from "@/components/SesionContext";
import { logout, type Rol } from "@/lib/auth.mock";
import { fuenteTexto, fuenteTitulo } from "@/lib/fuentes";

<<<<<<< Updated upstream
const MENU: { href: string; label: string; roles: Rol[] }[] = [
  { href: "/inicio", label: "Inicio", roles: ["club", "admin"] },
  { href: "/clubes", label: "Directorio de clubes", roles: ["club", "admin"] },
  { href: "/perfil", label: "Mi club", roles: ["club"] },
  { href: "/convocatorias", label: "Convocatorias", roles: ["club"] },
  { href: "/postulantes", label: "Postulantes", roles: ["club"] },
  { href: "/avisos", label: "Avisos", roles: ["club"] },
=======
interface Item {
  href: string;
  label: string;
  /** texto corto para la barra de arriba (si no se indica, se usa label) */
  corto?: string;
  icono: LucideIcon;
  roles: Rol[];
}

const GRUPOS: { titulo: string; items: Item[] }[] = [
  {
    titulo: "General",
    items: [
      { href: "/inicio", label: "Inicio", icono: LayoutDashboard, roles: ["club", "admin"] },
      { href: "/clubes", label: "Directorio de clubes", corto: "Clubes", icono: Building2, roles: ["club", "admin"] },
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
    items: [{ href: "/planes", label: "Planes y convenios", corto: "Planes", icono: BadgePercent, roles: ["admin"] }],
  },
  {
    titulo: "Moderación",
    items: [
      { href: "/reportes", label: "Reportes", icono: Flag, roles: ["admin"] },
      { href: "/sanciones", label: "Sanciones", icono: Gavel, roles: ["admin"] },
      { href: "/auditoria", label: "Auditoría", icono: ScrollText, roles: ["admin"] },
    ],
  },
>>>>>>> Stashed changes
];

function Panel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  return (
    <AuthGuard>
      {(sesion) => {
<<<<<<< Updated upstream
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
=======
        const grupos = GRUPOS.map((g) => ({
          ...g,
          items: g.items.filter((i) => i.roles.includes(sesion.rol)),
        })).filter((g) => g.items.length > 0);
        const todos = grupos.flatMap((g) => g.items);

        const salir = () => {
          logout();
          router.replace("/login");
        };

        return (
          <SesionCtx.Provider value={sesion}>
            <div
              className={`${fuenteTitulo.variable} ${fuenteTexto.variable} min-h-screen bg-bg text-text [font-family:var(--font-texto)]`}
            >
              <header className="sticky top-0 z-40 border-b border-border bg-card">
                <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-5 sm:px-8">
                  <Link href="/inicio" aria-label="SportMatch, inicio" className="shrink-0">
                    <BrandLogo width={190} />
                  </Link>

                  <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 xl:flex">
                    {todos.map((m) => {
                      const activo = pathname.startsWith(m.href);
                      return (
                        <Link
                          key={m.href}
                          href={m.href}
                          aria-current={activo ? "page" : undefined}
                          className={`border-b-2 px-3 py-2 text-[15px] font-semibold transition-colors ${
                            activo
                              ? "border-primary text-text"
                              : "border-transparent text-muted hover:text-text"
                          }`}
                        >
                          {m.corto ?? m.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="ml-auto hidden items-center gap-3 xl:flex">
                    <ThemeToggle compacto />
                    <div className="flex items-center gap-2.5">
                      <Avatar nombre={sesion.nombre} size={40} />
                      <div className="hidden min-w-0 2xl:block">
                        <p className="max-w-[140px] truncate text-sm font-bold leading-tight">{sesion.nombre}</p>
                        <p className="text-xs text-muted">
                          {sesion.rol === "club" ? "Cuenta de club" : "Administración"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={salir}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:border-danger hover:text-danger"
                    >
                      <LogOut size={16} />
                      Salir
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={abierto}
                    aria-controls="menu-panel"
                    onClick={() => setAbierto((v) => !v)}
                    className="ml-auto rounded-md p-2 hover:bg-subtle xl:hidden"
                  >
                    {abierto ? <X size={26} /> : <Menu size={26} />}
>>>>>>> Stashed changes
                  </button>
                </div>

<<<<<<< Updated upstream
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
=======
                {abierto ? (
                  <div id="menu-panel" className="border-t border-border bg-card px-5 pb-6 pt-3 xl:hidden">
                    <nav aria-label="Principal móvil" className="space-y-5">
                      {grupos.map((g) => (
                        <div key={g.titulo}>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                            {g.titulo}
                          </p>
                          {g.items.map((m) => {
                            const activo = pathname.startsWith(m.href);
                            const Icono = m.icono;
                            return (
                              <Link
                                key={m.href}
                                href={m.href}
                                onClick={() => setAbierto(false)}
                                aria-current={activo ? "page" : undefined}
                                className={`flex items-center gap-3 border-b border-border py-3.5 text-base font-semibold ${
                                  activo ? "text-accent" : "text-text"
                                }`}
                              >
                                <Icono size={18} />
                                {m.label}
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </nav>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <ThemeToggle compacto />
                      <button
                        type="button"
                        onClick={salir}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold hover:border-danger hover:text-danger"
                      >
                        <LogOut size={16} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                ) : null}
              </header>

              <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 md:py-12">{children}</main>
>>>>>>> Stashed changes
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