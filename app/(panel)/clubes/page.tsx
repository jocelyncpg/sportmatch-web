"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import Mapa from "@/components/Mapa";
import { Avatar, Card, Chip, PageHeader, inputClass } from "@/components/ui";
import { CENTRO_SANTIAGO, COMUNAS } from "@/lib/comunas";
import { DEPORTES, useDatos } from "@/lib/store.mock";

// HU-30: listado y búsqueda de clubes por nombre, deporte y zona.
export default function DirectorioPage() {
  const datos = useDatos();
  const [texto, setTexto] = useState("");
  const [deporte, setDeporte] = useState("");
  const [zona, setZona] = useState("");

  const zonas = useMemo(
    () => Array.from(new Set(datos.clubes.map((c) => c.zona))).sort(),
    [datos.clubes]
  );

  const lista = datos.clubes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(texto.trim().toLowerCase()) &&
      (!deporte || c.deportes.includes(deporte)) &&
      (!zona || c.zona === zona)
  );

  return (
    <section>
      <PageHeader titulo="Directorio de clubes" subtitulo="Explora clubes deportivos y su información pública." />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Buscar por nombre…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
        <select className={inputClass} value={deporte} onChange={(e) => setDeporte(e.target.value)}>
          <option value="">Todos los deportes</option>
          {DEPORTES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className={inputClass} value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <Mapa
          alto={280}
          centro={CENTRO_SANTIAGO}
          zoom={11}
          puntos={lista.flatMap((c) =>
            COMUNAS[c.zona]
              ? [{ id: c.id, nombre: c.nombre, detalle: `${c.zona} · ${c.deportes.join(", ")}`, coord: COMUNAS[c.zona] }]
              : []
          )}
        />
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-muted">No hay clubes que coincidan con la búsqueda.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => {
            const abiertas = datos.convocatorias.filter((v) => v.clubId === c.id && v.estado === "abierta").length;
            return (
              <Link key={c.id} href={`/clubes/${c.id}`}>
                <Card className="h-full transition-colors hover:border-accent">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={c.nombre} logoUrl={c.logoUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{c.nombre}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin size={12} /> {c.zona}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.deportes.map((d) => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-muted">
                    {abiertas} {abiertas === 1 ? "convocatoria abierta" : "convocatorias abiertas"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}