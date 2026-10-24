"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, Card, Chip, EstadoVacio, PageHeader, inputClass } from "@/components/ui";
import { listarClubes, type ClubSummary } from "@/lib/api/club";

const errorDe = (error: unknown) => error instanceof Error ? error.message : "No se pudo cargar el directorio.";

export default function DirectorioClubes() {
  const [items, setItems] = useState<ClubSummary[]>([]);
  const [texto, setTexto] = useState("");
  const [deporte, setDeporte] = useState("");
  const [zona, setZona] = useState("");
  const [fallo, setFallo] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    const temporizador = window.setTimeout(() => {
      setCargando(true);
      setFallo("");
      void listarClubes({ nombre: texto.trim() || undefined, page_size: 50 })
        .then((pagina) => {
          if (vigente) setItems(pagina.items);
        })
        .catch((error) => {
          if (vigente) setFallo(errorDe(error));
        })
        .finally(() => {
          if (vigente) setCargando(false);
        });
    }, 250);
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [texto]);

  const zonas = [...new Set(
    items.map((club) => club.comuna).filter((comuna): comuna is string => Boolean(comuna))
  )].sort();
  const deportes = [...new Map(items.flatMap((club) => club.deportes).map((item) => [item.id, item])).values()];
  const lista = items.filter((club) =>
    (!deporte || club.deportes.some((item) => String(item.id) === deporte)) &&
    (!zona || club.comuna === zona)
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
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </div>
        <select
          aria-label="Deporte"
          className={inputClass}
          value={deporte}
          onChange={(evento) => setDeporte(evento.target.value)}
        >
          <option value="">Todos los deportes</option>
          {deportes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </select>
        <select
          aria-label="Comuna"
          className={inputClass}
          value={zona}
          onChange={(evento) => setZona(evento.target.value)}
        >
          <option value="">Todas las comunas</option>
          {zonas.map((comuna) => <option key={comuna} value={comuna}>{comuna}</option>)}
        </select>
      </div>
      {cargando ? <p role="status" className="py-8 text-sm text-muted">Cargando clubes…</p> : null}
      {!cargando && fallo ? (
        <p role="alert" className="rounded-xl bg-danger/10 p-4 text-sm text-danger">
          {fallo}
        </p>
      ) : null}
      {!cargando && !fallo && lista.length === 0 ? (
        <EstadoVacio icono={MapPin} titulo="No hay clubes" texto="No hay clubes que coincidan con la búsqueda." />
      ) : null}
      {!cargando && !fallo && lista.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((club) => (
            <Link key={club.id} href={`/clubes/${club.id}`}>
              <Card className="h-full transition-colors hover:border-accent">
                <div className="flex items-center gap-3">
                  <Avatar nombre={club.nombre} logoUrl={club.logo ?? undefined} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{club.nombre}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} />
                      {[club.comuna, club.direccion].filter(Boolean).join(" · ") || "Ubicación no informada"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {club.deportes.map((item) => <Chip key={item.id}>{item.nombre}</Chip>)}
                </div>
                {club.descripcion_corta ? (
                  <p className="mt-3 line-clamp-2 text-sm">{club.descripcion_corta}</p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
