"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { ApiError } from "@/lib/api/cliente";
import {
  listarConsultas,
  listarMensajesConsulta,
  marcarConsultaLeida,
  responderConsulta,
  type HiloClub,
  type Mensaje,
} from "@/lib/api/consultas";
import { ClubState } from "@/components/club/ClubState";
import { useClub } from "@/components/club/useClub";
import { Card, Campo, PageHeader, btnPrimary, fechaHora, inputClass } from "@/components/ui";
import { useSondeo } from "@/components/useSondeo";

function errorDe(error: unknown) {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return error.message;
  }
  return error instanceof Error ? error.message : "No se pudo completar la solicitud.";
}

export default function ConsultaHilo() {
  const { hiloId } = useParams<{ hiloId: string }>();
  const { club, cargando, error } = useClub();
  const [hilo, setHilo] = useState<HiloClub | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [fallo, setFallo] = useState("");
  const [cargandoMensajes, setCargandoMensajes] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const leidoHasta = useRef(0);

  const cargar = useCallback(async () => {
    if (!club) return;
    try {
      const [pagina, lista] = await Promise.all([
        listarMensajesConsulta(club.id, hiloId),
        listarConsultas(club.id),
      ]);
      setMensajes(pagina.mensajes);
      setHilo(lista.find((item) => item.hilo_id === hiloId) ?? null);
      const ultimo = pagina.mensajes.at(-1);
      if (ultimo && ultimo.id > leidoHasta.current) {
        await marcarConsultaLeida(club.id, hiloId, ultimo.id);
        leidoHasta.current = ultimo.id;
      }
      setFallo("");
    } catch (error) {
      setFallo(errorDe(error));
    } finally {
      setCargandoMensajes(false);
    }
  }, [club, hiloId]);

  const sondear = useSondeo(cargar, Boolean(club));

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const mensaje = texto.trim();
    if (!club || !mensaje || enviando) return;
    setEnviando(true);
    try {
      await responderConsulta(club.id, hiloId, {
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

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Consulta" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/consultas" className="mb-4 inline-block text-sm font-semibold text-accent">
        ← Consultas
      </Link>
      <PageHeader
        titulo={hilo?.deportista_nombre ?? "Conversación"}
        subtitulo="Los mensajes se actualizan cada 5 segundos."
      />
      {fallo ? <p role="alert" className="mb-3 text-sm text-danger">{fallo}</p> : null}
      <div role="log" aria-live="polite" aria-label="Mensajes de la consulta">
        <Card className="mb-4 min-h-64 space-y-3">
          {cargandoMensajes ? (
            <p role="status" className="text-sm text-muted">Cargando mensajes…</p>
          ) : mensajes.length ? (
            mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`max-w-[85%] rounded-2xl p-3 ${mensaje.propio ? "ml-auto bg-chip" : "bg-subtle"}`}
              >
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
      <form onSubmit={enviar} className="flex items-end gap-2">
        <Campo label="Mensaje">
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
          aria-label="Enviar mensaje"
        >
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
