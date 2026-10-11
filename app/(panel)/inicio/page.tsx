"use client";

import Link from "next/link";
import { useSesion } from "@/components/SesionContext";
import { Card, Chip, PageHeader, fechaCorta } from "@/components/ui";
import { CLUB_DEMO_ID, useDatos } from "@/lib/store.mock";

export default function InicioPage() {
  const sesion = useSesion();
  const datos = useDatos();

  if (sesion.rol === "admin") {
    return (
      <section>
        <PageHeader titulo="Inicio" subtitulo="Resumen de la plataforma." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Resumen valor={datos.clubes.length} etiqueta="Clubes registrados" />
          <Resumen valor={datos.convocatorias.filter((c) => c.estado === "abierta").length} etiqueta="Convocatorias abiertas" />
          <Resumen valor={datos.postulantes.length} etiqueta="Postulaciones" />
        </div>
      </section>
    );
  }

  const club = datos.clubes.find((c) => c.id === CLUB_DEMO_ID);
  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const abiertas = mias.filter((c) => c.estado === "abierta");
  const idsMias = new Set(mias.map((c) => c.id));
  const pendientes = datos.postulantes.filter((p) => idsMias.has(p.convocatoriaId) && p.estado === "Pendiente");
  const avisos = datos.avisos.filter((a) => a.clubId === CLUB_DEMO_ID);

  return (
    <section>
      <PageHeader titulo={`Hola, ${club?.nombre ?? sesion.nombre}`} subtitulo="Resumen de tu club." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Resumen valor={abiertas.length} etiqueta="Convocatorias abiertas" />
        <Resumen valor={pendientes.length} etiqueta="Postulantes pendientes" />
        <Resumen valor={avisos.length} etiqueta="Avisos enviados" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold">Próximas convocatorias</h2>
      {abiertas.length === 0 ? (
        <p className="text-sm text-muted">
          No tienes convocatorias abiertas.{" "}
          <Link href="/convocatorias" className="font-semibold text-accent">Publicar una</Link>
        </p>
      ) : (
        <div className="space-y-3">
          {abiertas.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{c.titulo}</p>
                <p className="text-xs text-muted">{c.categoria} · {fechaCorta(c.fecha)}</p>
              </div>
              <Chip>{c.deporte}</Chip>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Resumen({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <Card>
      <p className="text-3xl font-extrabold text-accent">{valor}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{etiqueta}</p>
    </Card>
  );
}