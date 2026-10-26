"use client";

import { Check, Clock, MapPin, Star, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BadgeEstado, Card } from "@/components/ui";
import type { EstadoPostulante, Postulante } from "@/lib/datos";

export function Foto({ p, className = "" }: { p: Postulante; className?: string }) {
  const [fallo, setFallo] = useState(false);
  if (p.foto && !fallo) {
    return (
      <div className={`relative overflow-hidden bg-subtle ${className}`}>
        <Image
          src={p.foto}
          alt={p.nombre}
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 100vw"
          className="object-cover object-top"
          onError={() => setFallo(true)}
        />
      </div>
    );
  }
  const iniciales = p.nombre.split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return (
    <div className={`flex items-center justify-center bg-chip text-3xl font-bold text-accent ${className}`}>
      {iniciales}
    </div>
  );
}

export const Valoracion = ({ p }: { p: Postulante }) => (
  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
    <Star size={13} className="fill-current text-accent" /> {p.rating.toFixed(1)} · {p.resenas} reseñas
  </span>
);

// Decisiones del club sobre una postulación; no se ofrece el estado que ya tiene.
export const DECISIONES: { estado: EstadoPostulante; etiqueta: string; icono: typeof Check; peligro?: boolean }[] = [
  { estado: "Preseleccionado", etiqueta: "Preseleccionar", icono: Star },
  { estado: "En espera", etiqueta: "En espera", icono: Clock },
  { estado: "Aceptado", etiqueta: "Aprobar", icono: Check },
  { estado: "Rechazado", etiqueta: "Rechazar", icono: X, peligro: true },
];

export default function PostulanteCard({
  p,
  convocatoria,
  onVer,
  onCambiar,
}: {
  p: Postulante;
  convocatoria?: string;
  onVer: () => void;
  onCambiar: (nuevo: EstadoPostulante) => void;
}) {
  const accion =
    "rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent";
  return (
    <Card flush className="flex flex-col overflow-hidden">
      <button type="button" onClick={onVer} className="block text-left" aria-label={`Ver perfil de ${p.nombre}`}>
        <Foto p={p} className="aspect-[4/3] w-full" />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{p.nombre}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} /> {p.comuna} · {p.edad} años
            </p>
          </div>
          <BadgeEstado estado={p.estado} />
        </div>

        <p className="mt-3 text-xs text-muted">
          {p.nivel} · {p.deportes.join(", ")}
        </p>
        {convocatoria ? <p className="mt-1 truncate text-xs text-muted">Postula a: {convocatoria}</p> : null}
        <div className="mt-2">
          <Valoracion p={p} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <button type="button" onClick={onVer} className="text-sm font-semibold text-accent hover:underline">
            Ver perfil
          </button>
          <div className="flex gap-1.5">
            {DECISIONES.filter((d) => d.estado !== p.estado).map((d) => {
              const Icono = d.icono;
              return (
                <button
                  key={d.estado}
                  type="button"
                  title={d.etiqueta}
                  aria-label={`${d.etiqueta} a ${p.nombre}`}
                  className={`${accion} ${d.peligro ? "hover:border-danger hover:text-danger" : ""}`}
                  onClick={() => onCambiar(d.estado)}
                >
                  <Icono size={15} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
