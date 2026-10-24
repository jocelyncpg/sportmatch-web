"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { Chip, btnGhost, fechaHora } from "@/components/ui";
import type { EstadoRevision, Candidato } from "@/lib/api/postulantes";
import { Foto } from "@/components/PostulanteCard";
import { btnPrimary } from "@/components/ui";

// Perfil completo del postulante (panel lateral). Se cierra con Esc o haciendo clic fuera.
export default function PerfilPostulante({
  p,
  convocatoria,
  onCerrar,
  onCambiar,
  onEscribir,
}: {
  p: Candidato;
  convocatoria?: string;
  onCerrar: () => void;
  onCambiar: (nuevo: EstadoRevision) => void;
  onEscribir?: () => void;
}) {
  const nombre = [p.perfil_deportivo.nombre, p.perfil_deportivo.apellido_inicial].filter(Boolean).join(" ") || "Postulante";
  const estado = ({ PENDIENTE: "Pendiente", PRESELECCIONADO: "Preseleccionado", ACEPTADO: "Aceptado", RECHAZADO: "Rechazado" } as const)[p.estado];
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
        aria-label={`Perfil de ${nombre}`}
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
              <h2 className="text-xl font-bold">{nombre}</h2>
              <span className="text-xs font-semibold">{estado}</span>
            </div>
            {p.perfil_deportivo.edad != null ? <p className="mt-1 flex items-center gap-1 text-sm text-muted">{p.perfil_deportivo.edad} años</p> : null}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Deportes</p>
            <div className="flex flex-wrap gap-1.5">
              {p.perfil_deportivo.deportes.map((d) => (
                <Chip key={d.deporte_codigo}>{d.deporte_codigo} · nivel {d.nivel}</Chip>
              ))}
            </div>
          </div>

          {p.perfil_deportivo.biografia ? <div>
            <p className="mb-1 text-xs font-semibold text-muted">Sobre mí</p>
            <p className="text-sm leading-relaxed">{p.perfil_deportivo.biografia}</p>
          </div> : null}

          {p.antecedentes.length ? <div>
            <p className="mb-2 text-xs font-semibold text-muted">Antecedentes</p>
            <ul className="space-y-2 text-sm">{p.antecedentes.map((a, i) => <li key={`${a.institucion}-${i}`}><strong>{a.institucion}</strong> · {a.deporte} · {a.anio_inicio}{a.anio_fin ? `–${a.anio_fin}` : "–actualidad"}{a.logros ? <p className="text-xs text-muted">{a.logros}</p> : null}</li>)}</ul>
          </div> : null}

          <div className="rounded-xl bg-subtle p-4 text-sm">
            <p className="text-xs font-semibold text-muted">Postulación</p>
            <p className="mt-1 font-semibold">{convocatoria ?? "—"}</p>
            <p className="text-xs text-muted">Recibida el {fechaHora(p.fecha_postulacion)}</p>
            {p.mensaje ? <p className="mt-2">{p.mensaje}</p> : null}
            {p.comentario_club ? <p className="mt-2 text-xs text-muted">Comentario del club: {p.comentario_club}</p> : null}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card p-4">
          {p.estado !== "RECHAZADO" && onEscribir ? <button type="button" onClick={onEscribir} className={btnPrimary}>Escribir al postulante</button> : null}
          {p.estado !== "ACEPTADO" ? (
            <button
              onClick={() => onCambiar("ACEPTADO")}
              className="rounded-[13px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              Aceptar
            </button>
          ) : null}
          {p.estado !== "PRESELECCIONADO" && p.estado !== "ACEPTADO" ? (
            <button onClick={() => onCambiar("PRESELECCIONADO")} className={btnGhost}>
              Preseleccionar
            </button>
          ) : null}
          {p.estado !== "RECHAZADO" ? (
            <button onClick={() => onCambiar("RECHAZADO")} className={`${btnGhost} hover:border-danger hover:text-danger`}>
              Rechazar
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
