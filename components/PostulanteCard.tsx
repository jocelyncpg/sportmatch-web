"use client";

import { Check, Star, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Card } from "@/components/ui";
import type { EstadoRevision, Candidato } from "@/lib/api/postulantes";

export function Foto({ p, className = "" }: { p: Candidato; className?: string }) {
  const [fallo, setFallo] = useState(false);
  const nombre = [p.perfil_deportivo.nombre, p.perfil_deportivo.apellido_inicial].filter(Boolean).join(" ");
  const foto = p.perfil_deportivo.foto_perfil;
  if (foto && !fallo) return <div className={`relative overflow-hidden bg-subtle ${className}`}><Image src={foto} alt={nombre || "Foto del postulante"} fill unoptimized sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 100vw" className="object-cover object-top" onError={() => setFallo(true)} /></div>;
  const iniciales = nombre.split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return <div className={`flex items-center justify-center bg-chip text-3xl font-bold text-accent ${className}`}>{iniciales || "?"}</div>;
}

export default function PostulanteCard({
  p,
  convocatoria,
  onVer,
  onCambiar,
}: {
  p: Candidato;
  convocatoria?: string;
  onVer: () => void;
  onCambiar: (nuevo: EstadoRevision) => void;
}) {
  const nombre = [p.perfil_deportivo.nombre, p.perfil_deportivo.apellido_inicial].filter(Boolean).join(" ");
  const estado = ({ PENDIENTE: "Pendiente", PRESELECCIONADO: "Preseleccionado", ACEPTADO: "Aceptado", RECHAZADO: "Rechazado" } as const)[p.estado];
  const accion =
    "rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent";
  return (
    <Card flush className="flex flex-col overflow-hidden">
      <button type="button" onClick={onVer} className="block text-left" aria-label={`Ver perfil de ${nombre}`}>
        <Foto p={p} className="aspect-[4/3] w-full" />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{nombre || "Postulante"}</p>
            {p.perfil_deportivo.edad != null ? <p className="mt-0.5 text-xs text-muted">{p.perfil_deportivo.edad} años</p> : null}
          </div>
          <span className="rounded-full bg-subtle px-2 py-1 text-xs font-semibold">{estado}</span>
        </div>

        <p className="mt-3 text-xs text-muted">
          {p.perfil_deportivo.deportes.map((d) => `${d.deporte_codigo} · nivel ${d.nivel}`).join(", ")}
        </p>
        {convocatoria ? <p className="mt-1 truncate text-xs text-muted">Postula a: {convocatoria}</p> : null}
        <div className="mt-2">
          {p.mensaje ? <p className="text-xs text-muted">“{p.mensaje}”</p> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <button type="button" onClick={onVer} className="text-sm font-semibold text-accent hover:underline">
            Ver perfil
          </button>
          <div className="flex gap-1.5">
            {p.estado !== "PRESELECCIONADO" && p.estado !== "ACEPTADO" ? (
              <button title="Preseleccionar" aria-label="Preseleccionar" className={accion} onClick={() => onCambiar("PRESELECCIONADO")}>
                <Star size={15} />
              </button>
            ) : null}
            {p.estado !== "ACEPTADO" ? (
              <button title="Aceptar" aria-label="Aceptar" className={accion} onClick={() => onCambiar("ACEPTADO")}>
                <Check size={15} />
              </button>
            ) : null}
            {p.estado !== "RECHAZADO" ? (
              <button
                title="Rechazar"
                aria-label="Rechazar"
                className={`${accion} hover:border-danger hover:text-danger`}
                onClick={() => onCambiar("RECHAZADO")}
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
