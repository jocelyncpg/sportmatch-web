"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, Card, Chip, PageHeader, fechaCorta } from "@/components/ui";
import { useDatos } from "@/lib/store.mock";

// HU-30: perfil público con descripción, fotos, ubicación y convocatorias abiertas.
export default function PerfilPublicoPage() {
  const { id } = useParams<{ id: string }>();
  const datos = useDatos();
  const club = datos.clubes.find((c) => c.id === id);

  if (!club) {
    return (
      <section>
        <PageHeader titulo="Club no encontrado" />
        <Link href="/clubes" className="text-sm font-semibold text-accent">Volver al directorio</Link>
      </section>
    );
  }

  const abiertas = datos.convocatorias.filter((v) => v.clubId === club.id && v.estado === "abierta");

  return (
    <section className="max-w-3xl">
      <Link href="/clubes" className="mb-4 inline-block text-sm font-semibold text-accent">
        ← Directorio
      </Link>

      <Card className="mb-4 flex items-center gap-4">
        <Avatar nombre={club.nombre} logoUrl={club.logoUrl} size={64} />
        <div>
          <h1 className="text-xl font-extrabold">{club.nombre}</h1>
          <p className="text-sm text-muted">{club.zona}</p>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold">Sobre el club</h2>
        <p className="text-sm">{club.descripcion || "Sin descripción."}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {club.deportes.map((d) => (
            <Chip key={d}>{d}</Chip>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold">Contacto y ubicación</h2>
        <dl className="space-y-1 text-sm">
          <Fila etiqueta="Zona" valor={club.zona} />
          <Fila etiqueta="Correo" valor={club.email} />
          <Fila etiqueta="Teléfono" valor={club.telefono} />
          <Fila etiqueta="Instagram" valor={club.instagram} />
          <Fila etiqueta="Sitio web" valor={club.web} />
        </dl>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold">Fotos</h2>
        <p className="text-sm text-muted">Este club aún no ha publicado fotos.</p>
      </Card>

      <h2 className="mb-3 mt-6 text-sm font-bold">Convocatorias abiertas</h2>
      {abiertas.length === 0 ? (
        <p className="text-sm text-muted">No hay convocatorias abiertas por ahora.</p>
      ) : (
        <div className="space-y-3">
          {abiertas.map((v) => (
            <Card key={v.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{v.titulo}</p>
                <Chip>{v.deporte}</Chip>
              </div>
              <p className="mt-1 text-xs text-muted">
                {v.categoria} · {fechaCorta(v.fecha)} · {v.cupos} cupos
              </p>
              <p className="mt-2 text-sm">{v.requisitos}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted">{etiqueta}</dt>
      <dd>{valor || "—"}</dd>
    </div>
  );
}