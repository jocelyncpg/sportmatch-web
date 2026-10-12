"use client";

import { CalendarClock, MapPin, Target, X } from "lucide-react";
import { useEffect } from "react";
import { Foto, Valoracion } from "@/components/PostulanteCard";
import { BadgeEstado, Chip, btnGhost, fechaCorta } from "@/components/ui";
import type { EstadoPostulante, Postulante } from "@/lib/store.mock";

// Perfil completo del postulante (panel lateral). Se cierra con Esc o haciendo clic fuera.
export default function PerfilPostulante({
  p,
  convocatoria,
  onCerrar,
  onCambiar,
}: {
  p: Postulante;
  convocatoria?: string;
  onCerrar: () => void;
  onCambiar: (nuevo: EstadoPostulante) => void;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-overlay" onClick={onCerrar}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${p.nombre}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card"
      >
        <div className="relative">
          <Foto p={p} className="aspect-[4/3] w-full" />
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white hover:bg-black/75"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{p.nombre}</h2>
              <BadgeEstado estado={p.estado} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin size={14} /> {p.comuna} · {p.edad} años
            </p>
            <div className="mt-2">
              <Valoracion p={p} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Deportes · nivel {p.nivel.toLowerCase()}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.deportes.map((d) => (
                <Chip key={d}>{d}</Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Sobre mí</p>
            <p className="text-sm leading-relaxed">{p.bio}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <CalendarClock size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <dt className="text-xs font-semibold text-muted">Disponibilidad</dt>
                <dd>{p.disponibilidad}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Target size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <dt className="text-xs font-semibold text-muted">Objetivo</dt>
                <dd>{p.objetivo}</dd>
              </div>
            </div>
          </dl>

          <div className="rounded-xl bg-subtle p-4 text-sm">
            <p className="text-xs font-semibold text-muted">Postulación</p>
            <p className="mt-1 font-semibold">{convocatoria ?? "—"}</p>
            <p className="text-xs text-muted">Recibida el {fechaCorta(p.fechaPostulacion)}</p>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card p-4">
          {p.estado !== "Aceptado" ? (
            <button
              onClick={() => onCambiar("Aceptado")}
              className="rounded-[13px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              Aceptar
            </button>
          ) : null}
          {p.estado !== "Preseleccionado" && p.estado !== "Aceptado" ? (
            <button onClick={() => onCambiar("Preseleccionado")} className={btnGhost}>
              Preseleccionar
            </button>
          ) : null}
          {p.estado !== "Rechazado" ? (
            <button onClick={() => onCambiar("Rechazado")} className={`${btnGhost} hover:border-danger hover:text-danger`}>
              Rechazar
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}