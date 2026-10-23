"use client";

import { useState } from "react";
import { Campo, Chip, btnGhost, btnPrimary, inputClass } from "@/components/ui";
import { aplicarSancion, type TipoSancion } from "@/lib/moderacion.mock";

// HU-45: formulario para suspender a una persona (temporal o definitiva). Se usa desde Reportes y desde Sanciones.
export default function FormSancion({
  usuarioId,
  usuarioNombre,
  reporteId,
  admin,
  onListo,
  onCancelar,
}: {
  usuarioId: string;
  usuarioNombre: string;
  /** Si viene de un reporte, ese reporte queda "escalado". */
  reporteId?: string;
  admin: string;
  onListo: (aviso: string) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoSancion>("temporal");
  const [dias, setDias] = useState("7");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  function aplicar() {
    const r = aplicarSancion(
      { usuarioId, usuarioNombre, tipo, dias: tipo === "temporal" ? Number(dias) : undefined, motivo, reporteId },
      admin
    );
    if (!r.ok) {
      setError(r.motivo);
      return;
    }
    onListo(r.aviso ?? "");
  }

  return (
    <div className="mt-4 space-y-4 rounded-[13px] border border-border bg-subtle p-4">
      <p className="text-sm font-bold">Suspender a {usuarioNombre}</p>

      <div className="flex flex-wrap gap-2">
        <Chip activo={tipo === "temporal"} onClick={() => setTipo("temporal")}>Temporal</Chip>
        <Chip activo={tipo === "definitiva"} onClick={() => setTipo("definitiva")}>Definitiva</Chip>
      </div>

      {tipo === "temporal" ? (
        <Campo label="Duración (días, de 1 a 365)">
          <input
            type="number"
            min={1}
            max={365}
            className={inputClass}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
        </Campo>
      ) : null}

      <Campo label="Motivo (la persona lo recibirá en su notificación)">
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Ej: Acoso reiterado a otras participantes."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Campo>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={aplicar}>
          Aplicar suspensión
        </button>
        <button type="button" className={btnGhost} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}