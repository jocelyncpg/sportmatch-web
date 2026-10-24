"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { ApiError } from "@/lib/api/cliente";
import {
  cambiarMiembroCanal,
  decidirInactividad,
  editarCanal,
  eliminarCanal,
  enviarMensajeCanal,
  listarMensajesCanal,
  listarMiembrosCanal,
  marcarCanalLeido,
} from "@/lib/api/canales";
import type { CanalClub, MensajeCanal, MiembroCanal } from "@/lib/api/canales";
import { ClubState } from "@/components/club/ClubState";
import { useClub } from "@/components/club/useClub";
import {
  Avatar,
  Card,
  Campo,
  PageHeader,
  btnGhost,
  btnPrimary,
  fechaHora,
  inputClass,
} from "@/components/ui";
import { useSondeo } from "@/components/useSondeo";

function errorDe(error: unknown) {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return error.message;
  }
  return error instanceof Error ? error.message : "No se pudo completar la solicitud.";
}

export default function CanalDetalle() {
  const { canalId } = useParams<{ canalId: string }>();
  const router = useRouter();
  const { club, cargando, error } = useClub();
  const [canal, setCanal] = useState<CanalClub | null>(null);
  const [mensajes, setMensajes] = useState<MensajeCanal[]>([]);
  const [miembros, setMiembros] = useState<MiembroCanal[]>([]);
  const [candidatos, setCandidatos] = useState<MiembroCanal[]>([]);
  const [texto, setTexto] = useState("");
  const [fallo, setFallo] = useState("");
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    if (!club) return;
    try {
      const [pagina, listaMiembros, listaCandidatos] = await Promise.all([
        listarMensajesCanal(club.id, canalId),
        listarMiembrosCanal(club.id, canalId),
        listarMiembrosCanal(club.id, canalId, true),
      ]);
      setCanal(pagina.canal);
      setMensajes(pagina.mensajes);
      setMiembros(listaMiembros);
      setCandidatos(listaCandidatos);
      const ultimo = pagina.mensajes.at(-1);
      if (ultimo) await marcarCanalLeido(club.id, canalId, ultimo.id);
      setFallo("");
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setCargandoDatos(false);
    }
  }, [club, canalId]);

  const sondear = useSondeo(cargar, Boolean(club));

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const mensaje = texto.trim();
    if (!club || !mensaje || enviando) return;
    setEnviando(true);
    try {
      await enviarMensajeCanal(club.id, canalId, {
        texto: mensaje,
        client_message_id: crypto.randomUUID(),
      });
      setTexto("");
      await sondear();
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setEnviando(false);
    }
  }

  function manejarTecla(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      evento.currentTarget.form?.requestSubmit();
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!club) return;
    const datos = new FormData(evento.currentTarget);
    try {
      const actualizado = await editarCanal(club.id, canalId, {
        nombre: String(datos.get("nombre") ?? "").trim(),
        miembros_escriben: datos.get("miembros_escriben") === "on",
      });
      setCanal(actualizado);
      setFallo("");
    } catch (error) {
      setFallo(errorDe(error));
    }
  }

  async function eliminar() {
    if (!club || !window.confirm("¿Eliminar este canal y sus mensajes?")) return;
    try {
      await eliminarCanal(club.id, canalId);
      router.replace("/canales");
    } catch (error) {
      setFallo(errorDe(error));
    }
  }

  async function actualizarMiembro(usuarioId: string, agregar: boolean) {
    if (!club) return;
    if (!agregar && !window.confirm("¿Sacar a esta persona del canal?")) return;
    try {
      await cambiarMiembroCanal(club.id, canalId, usuarioId, agregar);
      await cargar();
    } catch (error) {
      setFallo(errorDe(error));
    }
  }

  async function resolverInactividad(decision: "eliminar" | "mantener") {
    if (!club) return;
    if (decision === "eliminar" && !window.confirm("¿Eliminar este canal?")) return;
    try {
      await decidirInactividad(club.id, canalId, decision);
      if (decision === "eliminar") {
        router.replace("/canales");
      } else {
        await cargar();
      }
    } catch (error) {
      setFallo(errorDe(error));
    }
  }

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Canal" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Link href="/canales" className="mb-4 inline-block text-sm font-semibold text-accent">
        ← Canales
      </Link>
      <PageHeader titulo={canal?.nombre ?? "Canal"} subtitulo={`${canal?.miembros ?? 0} miembros`} />
      {fallo ? <p role="alert" className="mb-3 text-sm text-danger">{fallo}</p> : null}
      {canal?.aviso_inactividad_en ? (
        <Card className="mb-4 border-danger bg-danger/5">
          <p className="font-bold text-danger">
            Este canal lleva 30 días sin uso y se eliminará.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void resolverInactividad("eliminar")}
              className={`${btnGhost} text-danger`}
            >
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => void resolverInactividad("mantener")}
              className={btnPrimary}
            >
              Mantener 30 días más
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4">
        <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
          <Campo label="Nombre del canal">
            <input
              name="nombre"
              defaultValue={canal?.nombre ?? ""}
              maxLength={60}
              required
              className={`${inputClass} min-w-56`}
            />
          </Campo>
          <label className="flex items-center gap-2 pb-3 text-sm">
            <input
              name="miembros_escriben"
              type="checkbox"
              defaultChecked={canal?.miembros_escriben ?? false}
              className="size-4 accent-[var(--primary)]"
            />
            Los miembros también pueden escribir
          </label>
          <button type="submit" className={btnGhost}>Guardar cambios</button>
          <button type="button" onClick={() => void eliminar()} className={`${btnGhost} text-danger`}>
            Eliminar canal
          </button>
        </form>
      </Card>

      <div role="log" aria-live="polite" aria-label="Mensajes del canal">
        <Card className="mb-4 min-h-60 space-y-3">
          {cargandoDatos ? (
            <p role="status" className="text-sm text-muted">Cargando mensajes…</p>
          ) : mensajes.length ? (
            mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`max-w-[85%] rounded-2xl p-3 ${mensaje.propio ? "ml-auto bg-chip" : "bg-subtle"}`}
              >
                <p className="text-xs font-bold">{mensaje.autor_nombre}</p>
                <p className="whitespace-pre-wrap text-sm">{mensaje.texto}</p>
                <time className="mt-1 block text-right text-[11px] text-muted">
                  {fechaHora(mensaje.enviado_en)}
                </time>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">Aún no hay mensajes.</p>
          )}
        </Card>
      </div>

      <form onSubmit={publicar} className="mb-7 flex items-end gap-2">
        <Campo label="Publicar mensaje">
          <textarea
            name="texto"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={manejarTecla}
            maxLength={1000}
            required
            className={`${inputClass} min-h-20`}
          />
          <span className="block text-right text-xs text-muted">{texto.length}/1000</span>
        </Campo>
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className={btnPrimary}
          aria-label="Publicar mensaje"
        >
          <Send size={17} />
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Miembros</h2>
          {miembros.length ? (
            <ul className="space-y-2">
              {miembros.map((miembro) => (
                <li key={miembro.usuario_id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar nombre={miembro.nombre} size={34} />
                    <span className="truncate">{miembro.nombre}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void actualizarMiembro(miembro.usuario_id, false)}
                    className={`${btnGhost} py-1.5`}
                  >
                    Sacar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Sin miembros adicionales.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Agregar desde candidatos</h2>
          {candidatos.length ? (
            <ul className="space-y-2">
              {candidatos.map((candidato) => (
                <li key={candidato.usuario_id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar nombre={candidato.nombre} size={34} />
                    <span className="truncate">{candidato.nombre}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void actualizarMiembro(candidato.usuario_id, true)}
                    className={`${btnGhost} py-1.5`}
                  >
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No hay candidatos aceptados disponibles.</p>
          )}
        </Card>
      </div>
    </section>
  );
}
