"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui";

export interface ItemMenuUsuario {
  href: string;
  label: string;
  icono: LucideIcon;
}

// Botón de la barra superior con el avatar y el nombre. Al tocarlo se despliega un mini menú
// con los accesos propios de la cuenta (Mi club, Avisos...). Se cierra al elegir, con Escape o al tocar fuera.
export default function MenuUsuario({
  nombre,
  subtitulo,
  items,
  pathname,
}: {
  nombre: string;
  subtitulo: string;
  items: ItemMenuUsuario[];
  pathname: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const enUnaDeSusPaginas = items.some((i) => pathname.startsWith(i.href));

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-usuario"
        aria-label={`Menú de ${nombre}`}
        onClick={() => setAbierto((v) => !v)}
        className={`flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-subtle ${
          abierto || enUnaDeSusPaginas ? "bg-subtle" : ""
        }`}
      >
        <Avatar nombre={nombre} size={40} />
        <div className="hidden min-w-0 text-left 2xl:block">
          <p className="max-w-[140px] truncate text-sm font-bold leading-tight">{nombre}</p>
          <p className="text-xs text-muted">{subtitulo}</p>
        </div>
        <ChevronDown size={16} className={`text-muted transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto ? (
        <div
          id="menu-usuario"
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-card p-1.5 shadow-lg"
        >
          <div className="border-b border-border px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-bold">{nombre}</p>
            <p className="text-xs text-muted">{subtitulo}</p>
          </div>
          <div className="pt-1.5">
            {items.map((i) => {
              const activo = pathname.startsWith(i.href);
              const Icono = i.icono;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  role="menuitem"
                  onClick={() => setAbierto(false)}
                  aria-current={activo ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-subtle ${
                    activo ? "bg-chip text-accent" : "text-text"
                  }`}
                >
                  <Icono size={17} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}