import Image from "next/image";
import type { EstadoPostulante } from "@/lib/store.mock";

export const inputClass =
  "w-full rounded-[13px] border border-border bg-input px-3.5 py-3 text-sm outline-none focus:border-accent";
export const btnPrimary =
  "rounded-[13px] bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60";
export const btnGhost =
  "rounded-[13px] border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:border-accent";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{titulo}</h1>
        {subtitulo ? <p className="mt-1 text-sm text-muted">{subtitulo}</p> : null}
      </div>
      {accion}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] border border-border bg-card p-5 ${className}`}>{children}</div>
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

const COLOR_ESTADO: Record<EstadoPostulante, string> = {
  Pendiente: "bg-subtle text-muted",
  Preseleccionado: "bg-chip text-accent",
  Aceptado: "bg-success-bg text-success",
  Rechazado: "bg-danger-bg text-danger",
};

export function BadgeEstado({ estado }: { estado: EstadoPostulante }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${COLOR_ESTADO[estado]}`}>{estado}</span>
  );
}

export function Avatar({ nombre, logoUrl, size = 44 }: { nombre: string; logoUrl?: string; size?: number }) {
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
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