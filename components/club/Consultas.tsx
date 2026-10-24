"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, Card, Chip, EstadoVacio, PageHeader, fechaHora } from "@/components/ui";
import { ClubState } from "@/components/club/ClubState";
import { useClub } from "@/components/club/useClub";
import { useSondeo } from "@/components/useSondeo";
import { listarConsultas, type HiloClub } from "@/lib/api/consultas";

function errorDe(error: unknown) {
  return error instanceof Error ? error.message : "No se pudieron cargar las consultas.";
}

export default function Consultas() {
  const { club, cargando, error } = useClub();
  const [hilos, setHilos] = useState<HiloClub[]>([]);
  const [fallo, setFallo] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);

  const cargar = useCallback(async () => {
    if (!club) return;
    try {
      setHilos(await listarConsultas(club.id));
      setFallo("");
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setCargandoLista(false);
    }
  }, [club]);

  useSondeo(cargar, Boolean(club));

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Consultas" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }

  return (
    <section>
      <PageHeader titulo="Consultas" subtitulo="Conversaciones privadas con postulantes." />
      {fallo ? <p role="alert" className="mb-4 text-sm text-danger">{fallo}</p> : null}
      {cargandoLista ? (
        <p role="status" className="py-6 text-sm text-muted">Cargando consultas…</p>
      ) : hilos.length ? (
        <div className="space-y-3">
          {hilos.map((hilo) => (
            <Link key={hilo.hilo_id} href={`/consultas/${hilo.hilo_id}`} className="block">
              <Card className="flex items-center gap-4 transition-colors hover:border-accent">
                <Avatar nombre={hilo.deportista_nombre} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{hilo.deportista_nombre}</p>
                  <p className="truncate text-sm text-muted">
                    {hilo.ultimo?.texto ?? "Sin mensajes"}
                  </p>
                  {hilo.ultimo ? (
                    <p className="text-xs text-muted">{fechaHora(hilo.ultimo.enviado_en)}</p>
                  ) : null}
                </div>
                {hilo.no_leidos > 0 ? <Chip activo>{hilo.no_leidos} sin leer</Chip> : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EstadoVacio
          icono={MessageCircle}
          titulo="Sin consultas"
          texto="Cuando un postulante te escriba, la conversación aparecerá aquí."
        />
      )}
    </section>
  );
}
