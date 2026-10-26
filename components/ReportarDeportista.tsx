"use client";

import { useEffect, useState } from "react";
import { Campo, btnGhost, btnPrimary, inputClass } from "@/components/ui";
import {
  JUSTIFICACION_MAX,
  JUSTIFICACION_MIN,
  MOTIVOS_REPORTE_DEPORTISTA,
  reportarDeportista,
  type MotivoReporteDeportista,
} from "@/lib/api/reportes";

// El club reporta a un deportista (HU-42 del lado del club). La justificación es obligatoria.
export default function ReportarDeportista({
  usuarioId,
  nombre,
  onCerrar,
  onEnviado,
}: {
  usuarioId: string;
  nombre: string;
  onCerrar: () => void;
  onEnviado: () => void;
}) {
  const [motivo, setMotivo] = useState<MotivoReporteDeportista>(MOTIVOS_REPORTE_DEPORTISTA[0]);
  const [justificacion, setJustificacion] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const largo = justificacion.trim().length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await reportarDeportista(usuarioId, nombre, motivo, justificacion);
      onEnviado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el reporte.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay p-4" onClick={onCerrar}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={`Reportar a ${nombre}`}
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-[13px] border border-border bg-card p-6"
      >
        <div>
          <p className="text-base font-bold">Reportar a {nombre}</p>
          <p className="mt-1 text-xs text-muted">
            El reporte queda para revisión del equipo de SportMatch. Explica qué ocurrió.
          </p>
        </div>

        <Campo label="Motivo">
          <select
            className={inputClass}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoReporteDeportista)}
          >
            {MOTIVOS_REPORTE_DEPORTISTA.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Campo>

        <Campo label={`Justificación (mínimo ${JUSTIFICACION_MIN} caracteres)`}>
          <textarea
            rows={4}
            maxLength={JUSTIFICACION_MAX}
            className={inputClass}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            aria-describedby="contador-justificacion"
          />
        </Campo>
        <p id="contador-justificacion" className="text-right text-xs text-muted">
          {largo}/{JUSTIFICACION_MAX}
        </p>

        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onCerrar}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={enviando || largo < JUSTIFICACION_MIN}>
            {enviando ? "Enviando…" : "Enviar reporte"}
          </button>
        </div>
      </form>
    </div>
  );
}
