"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Mapa from "@/components/Mapa";
import { Avatar, Card, Chip } from "@/components/ui";
import { obtenerClub, type ClubProfile } from "@/lib/api/club";
import type { ConvocatoriaResumen } from "@/lib/api/club";
import { ClubState } from "./useClub";

const estados = { ABIERTA: "Abierta", CERRADA: "Cerrada", FINALIZADA: "Finalizada" };

export default function DetalleClub() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    const temporizador = window.setTimeout(() => {
      setCargando(true);
      setError("");
      void obtenerClub(id)
        .then((perfil) => {
          if (vigente) setClub(perfil);
        })
        .catch((fallo) => {
          if (vigente) setError(fallo instanceof Error ? fallo.message : "No se pudo cargar el club.");
        })
        .finally(() => {
          if (vigente) setCargando(false);
        });
    }, 0);
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [id]);

  if (cargando || error || !club) {
    return (
      <section>
        <Link href="/clubes" className="mb-4 inline-block text-sm font-semibold text-accent">← Directorio</Link>
        <ClubState cargando={cargando} error={error} sinClub={false} />
      </section>
    );
  }

  const ubicacion = club.ubicacion;
  const latitud = ubicacion.latitud;
  const longitud = ubicacion.longitud;
  const coordenadas: [number, number] | null = latitud !== null && longitud !== null
    ? [latitud, longitud]
    : null;

  return (
    <section className="max-w-3xl">
      <Link href="/clubes" className="mb-4 inline-block text-sm font-semibold text-accent">← Directorio</Link>
      <Card className="mb-4 flex items-center gap-4">
        <Avatar nombre={club.nombre} logoUrl={club.logo ?? undefined} size={64} />
        <div>
          <h1 className="text-xl font-bold">{club.nombre}</h1>
          <p className="text-sm text-muted">{[ubicacion.comuna, ubicacion.provincia].filter(Boolean).join(" · ")}</p>
        </div>
      </Card>
      {club.descripcion || club.historia ? (
        <Card className="mb-4">
          <h2 className="mb-2 text-sm font-bold">Sobre el club</h2>
          {club.descripcion ? <p className="text-sm">{club.descripcion}</p> : null}
          {club.historia ? <p className="mt-3 whitespace-pre-line text-sm">{club.historia}</p> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {club.deportes.map((deporte) => <Chip key={deporte.id}>{deporte.nombre}</Chip>)}
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <h2 className="mb-2 text-sm font-bold">Deportes</h2>
          <div className="flex flex-wrap gap-1.5">
            {club.deportes.map((deporte) => <Chip key={deporte.id}>{deporte.nombre}</Chip>)}
          </div>
        </Card>
      )}
      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold">Contacto y ubicación</h2>
        <dl className="space-y-1 text-sm">
          {ubicacion.direccion ? <Fila etiqueta="Dirección" valor={ubicacion.direccion} /> : null}
          {ubicacion.comuna ? <Fila etiqueta="Comuna" valor={ubicacion.comuna} /> : null}
          {ubicacion.provincia ? <Fila etiqueta="Provincia" valor={ubicacion.provincia} /> : null}
          {club.email_contacto ? <Fila etiqueta="Correo" valor={club.email_contacto} /> : null}
          {club.telefono ? <Fila etiqueta="Teléfono" valor={club.telefono} /> : null}
          {club.sitio_web ? <Fila etiqueta="Sitio web" valor={club.sitio_web} /> : null}
          {Object.entries(club.redes_sociales).map(([red, url]) => (
            <Fila key={red} etiqueta={red} valor={url} />
          ))}
        </dl>
        {coordenadas ? (
          <div className="mt-4">
            <Mapa
              alto={240}
              centro={coordenadas}
              zoom={14}
              puntos={[
                {
                  id: club.id,
                  nombre: club.nombre,
                  detalle: ubicacion.comuna ?? undefined,
                  coord: coordenadas,
                },
              ]}
            />
          </div>
        ) : null}
      </Card>
      <h2 className="mb-3 mt-6 text-sm font-bold">Convocatorias abiertas</h2>
      {club.convocatorias_abiertas.length === 0 ? (
        <p className="text-sm text-muted">No hay convocatorias abiertas por ahora.</p>
      ) : (
        <div className="space-y-3">
          {club.convocatorias_abiertas.map((convocatoria) => (
            <ConvocatoriaCard key={convocatoria.id} convocatoria={convocatoria} />
          ))}
        </div>
      )}
    </section>
  );
}

function ConvocatoriaCard({ convocatoria }: { convocatoria: ConvocatoriaResumen }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{convocatoria.titulo ?? "Convocatoria"}</p>
        <Chip>{estados[convocatoria.estado]}</Chip>
      </div>
    </Card>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 capitalize text-muted">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
