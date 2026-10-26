"use client";

import { RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { btnPrimary, fechaHora, inputClass } from "@/components/ui";
import { miClub } from "@/lib/api/club";
import {
  escribirAPostulante,
  listarHilosClub,
  mensajesDeHilo,
  responderHilo,
  TEXTO_CONSULTA_MAX,
  type MensajeConsulta,
} from "@/lib/api/consultas";

// Consulta del club con un postulante (una conversación por deportista y club).
export default function ChatPostulacion({
  usuarioId,
  nombre,
  chatHabilitado,
}: {
  usuarioId: string;
  nombre: string;
  /** Si el postulante puede escribir (lo decide el club en la convocatoria). */
  chatHabilitado: boolean;
}) {
  const [clubId, setClubId] = useState<string | null>(null);
  const [hiloId, setHiloId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeConsulta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const club = await miClub();
      const hilos = await listarHilosClub(club.id);
      const hilo = hilos.find((h) => h.deportista_id === usuarioId) ?? null;
      setClubId(club.id);
      setHiloId(hilo?.hilo_id ?? null);
      setMensajes(hilo ? (await mensajesDeHilo(club.id, hilo.hilo_id)).mensajes : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las consultas.");
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    // La carga es asíncrona: el estado se fija tras la respuesta, no durante el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId || !texto.trim()) return;
    setEnviando(true);
    setError("");
    try {
      if (hiloId) {
        const mensaje = await responderHilo(clubId, hiloId, texto);
        setMensajes((previos) => [...previos, mensaje]);
      } else {
        // Primera consulta: el club escribe al postulante y se crea la conversación.
        const iniciada = await escribirAPostulante(clubId, usuarioId, texto);
        setHiloId(iniciada.hilo_id);
        setMensajes([iniciada.mensaje]);
      }
      setTexto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">Consultas de {nombre}</p>
        <button
          type="button"
          onClick={() => {
            setCargando(true);
            void cargar();
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {!chatHabilitado ? (
        <p className="rounded-xl bg-subtle p-3 text-xs text-muted">
          El chat está desactivado en esta convocatoria: el postulante solo puede leer tus mensajes.
        </p>
      ) : null}

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-subtle p-3">
        {cargando ? <p className="text-xs text-muted">Cargando consultas…</p> : null}
        {!cargando && mensajes.length === 0 ? (
          <p className="text-xs text-muted">Aún no hay consultas con este postulante.</p>
        ) : null}
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.de === "club" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.de === "club" ? "bg-primary text-white" : "bg-card"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.texto}</p>
              <p className={`mt-1 text-[10px] ${m.de === "club" ? "text-white/75" : "text-muted"}`}>
                {m.de === "club" ? "Club" : "Postulante"} · {fechaHora(m.enviado_en)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="flex items-end gap-2">
        <textarea
          rows={2}
          maxLength={TEXTO_CONSULTA_MAX}
          className={inputClass}
          placeholder={hiloId ? "Responder al postulante…" : "Escribir al postulante…"}
          value={texto}
          aria-label="Mensaje al postulante"
          onChange={(e) => setTexto(e.target.value)}
        />
        <button
          type="submit"
          className={`${btnPrimary} shrink-0 px-4`}
          disabled={enviando || !clubId || !texto.trim()}
          aria-label="Enviar mensaje"
        >
          <Send size={16} />
        </button>
      </form>
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}
