"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { EstadoReporte } from "@/lib/moderacion.mock";
import type { EstadoPostulante } from "@/lib/datos";

export const inputClass =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-accent";
export const btnPrimary =
  "rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60";
export const btnGhost =
  "rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent";

export function PageHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-4xl font-extrabold uppercase leading-none tracking-[0.005em] [font-family:var(--font-titulo)] sm:text-5xl">
          {titulo}
        </h1>
        {subtitulo ? <p className="mt-2 text-base text-muted">{subtitulo}</p> : null}
      </div>
      {accion}
    </div>
  );
}

// flush = sin relleno interno (para tablas y listas que llegan hasta el borde)
export function Card({
  children,
  className = "",
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card ${flush ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
}

export function Chip({
  children,
  activo = false,
  onClick,
}: {
  children: React.ReactNode;
  activo?: boolean;
  onClick?: () => void;
}) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";
  const color = activo ? "bg-primary text-white" : "bg-chip text-accent";
  if (!onClick) return <span className={`${base} ${color}`}>{children}</span>;
  return (
    <button type="button" onClick={onClick} className={`${base} ${color}`}>
      {children}
    </button>
  );
}

// Colores de cada estado; los gráficos usan los mismos para que todo coincida.
export const COLOR_ESTADO: Record<EstadoPostulante, string> = {
  Pendiente: "var(--muted)",
  Preseleccionado: "var(--accent)",
  Aceptado: "var(--success)",
  Rechazado: "var(--danger)",
};

export function BadgeEstado({ estado }: { estado: EstadoPostulante }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full" style={{ background: COLOR_ESTADO[estado] }} />
      {estado}
    </span>
  );
}

// Estado de un reporte de moderación: mismo estilo que BadgeEstado (punto de color + texto).
const COLOR_REPORTE: Record<EstadoReporte, { color: string; texto: string }> = {
  pendiente: { color: "var(--danger)", texto: "Pendiente" },
  revisado: { color: "var(--success)", texto: "Revisado" },
  escalado: { color: "var(--accent)", texto: "Escalado a sanción" },
};

export function BadgeReporte({ estado }: { estado: EstadoReporte }) {
  const c = COLOR_REPORTE[estado];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
      {c.texto}
    </span>
  );
}

export function Avatar({
  nombre,
  logoUrl,
  foto,
  size = 44,
}: {
  nombre: string;
  logoUrl?: string;
  foto?: string;
  size?: number;
}) {
  const [fallo, setFallo] = useState(false);
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (foto && !fallo) {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-full bg-subtle" style={{ width: size, height: size }}>
        <Image
          src={foto}
          alt={nombre}
          fill
          sizes={`${size}px`}
          className="object-cover object-top"
          onError={() => setFallo(true)}
        />
      </div>
    );
  }
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={nombre}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size / 3)) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-chip font-bold text-accent"
    >
      {iniciales}
    </div>
  );
}

export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export const fechaCorta = (aaaammdd: string) =>
  new Date(`${aaaammdd}T12:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Fecha y hora de un instante ISO, para reportes y auditoría. */
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Fila de cifras clave: una sola tarjeta con divisores, sin íconos decorativos.
export function StatStrip({ items }: { items: { valor: number | string; etiqueta: string; nota?: string }[] }) {
  return (
    <Card flush className="grid divide-y divide-border sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0">
      {items.map((i) => (
        <div key={i.etiqueta} className="px-5 py-4">
          <p className="text-xs font-semibold text-muted">{i.etiqueta}</p>
          <p className="mt-1 text-4xl font-extrabold leading-tight [font-family:var(--font-titulo)]">{i.valor}</p>
          {i.nota ? <p className="mt-0.5 text-xs text-muted">{i.nota}</p> : null}
        </div>
      ))}
    </Card>
  );
}

export function ProgressBar({ valor, max }: { valor: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EstadoVacio({
  icono: Icono,
  titulo,
  texto,
}: {
  icono: LucideIcon;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <Icono size={22} className="mb-3 text-muted" />
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{texto}</p>
    </div>
  );
}