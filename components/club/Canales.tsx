"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import {
  Avatar,
  Card,
  Campo,
  Chip,
  EstadoVacio,
  PageHeader,
  btnPrimary,
  fechaHora,
  inputClass,
} from "@/components/ui";
import { ClubState } from "@/components/club/ClubState";
import { useClub } from "@/components/club/useClub";
import { useSondeo } from "@/components/useSondeo";
import { crearCanal, listarCanales, type CanalClub } from "@/lib/api/canales";

function errorDe(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la solicitud.";
}

export default function Canales() {
  const { club, cargando, error } = useClub();
  const [canales, setCanales] = useState<CanalClub[]>([]);
  const [fallo, setFallo] = useState("");
  const [exito, setExito] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    if (!club) return;
    try {
      setCanales(await listarCanales(club.id));
      setFallo("");
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setCargandoLista(false);
    }
  }, [club]);

  useSondeo(cargar, Boolean(club));

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!club || creando) return;
    const formulario = new FormData(evento.currentTarget);
    const form = evento.currentTarget;
    setCreando(true);
    setFallo("");
    setExito("");
    try {
      await crearCanal(club.id, {
        nombre: String(formulario.get("nombre") ?? "").trim(),
        miembros_escriben: formulario.get("escriben") === "on",
      });
      form.reset();
      setExito("Canal creado. Los postulantes aceptados entran automáticamente.");
      await cargar();
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setCreando(false);
    }
  }

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Canales" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }

  return (
    <section>
      <PageHeader titulo="Canales" subtitulo="Espacios compartidos para los miembros del club." />
      <form onSubmit={crear} className="mb-7">
        <Card className="space-y-4">
          <Campo label="Nombre del canal">
            <input name="nombre" required maxLength={60} className={inputClass} />
          </Campo>
          <label className="flex items-center gap-2 text-sm">
            <input name="escriben" type="checkbox" className="size-4 accent-[var(--primary)]" />
            Los miembros también pueden escribir
          </label>
          <p className="text-sm text-muted">
            Los postulantes aceptados entran automáticamente al canal.
          </p>
          <button type="submit" disabled={creando} className={btnPrimary}>
            Crear canal
          </button>
          {fallo ? <p role="alert" className="text-sm text-danger">{fallo}</p> : null}
          {exito ? <p role="status" className="text-sm text-success">{exito}</p> : null}
        </Card>
      </form>

      <h2 className="mb-3 text-lg font-bold">Tus canales</h2>
      {cargandoLista ? (
        <p role="status" className="py-6 text-sm text-muted">Cargando canales…</p>
      ) : canales.length ? (
        <div className="space-y-3">
          {canales.map((canal) => (
            <Link key={canal.id} href={`/canales/${canal.id}`} className="block">
              <Card className="transition-colors hover:border-accent">
                <div className="flex items-center gap-4">
                  <Avatar nombre={canal.nombre} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{canal.nombre}</p>
                    <p className="truncate text-sm text-muted">
                      {canal.ultimo?.texto ?? "Sin mensajes"}
                    </p>
                    <p className="text-xs text-muted">
                      {canal.miembros} miembros
                      {canal.ultimo ? ` · ${fechaHora(canal.ultimo.enviado_en)}` : ""}
                    </p>
                  </div>
                  {canal.no_leidos > 0 ? <Chip activo>{canal.no_leidos} sin leer</Chip> : null}
                </div>
                {canal.aviso_inactividad_en ? (
                  <p className="mt-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
                    Este canal lleva 30 días sin uso y se eliminará.
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EstadoVacio
          icono={MessagesSquare}
          titulo="Sin canales"
          texto="Crea un canal para conversar con los miembros del club."
        />
      )}
    </section>
  );
}
