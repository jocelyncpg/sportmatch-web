"use client";

import { useState } from "react";
import { Campo, Chip, btnGhost, btnPrimary, inputClass } from "@/components/ui";
import {
  crearOferta,
  editarOferta,
  ETIQUETA_AUDIENCIA,
  formatearCLP,
  type Audiencia,
  type DatosOferta,
  type Oferta,
  type TipoOferta,
} from "@/lib/planes.mock";

const DURACIONES = [
  { dias: 30, etiqueta: "1 mes" },
  { dias: 90, etiqueta: "3 meses" },
  { dias: 180, etiqueta: "6 meses" },
  { dias: 365, etiqueta: "1 año" },
];

// HU-56: formulario para crear o editar un plan o convenio (precio, duración y beneficios).
export default function FormOferta({
  oferta,
  vigentes = 0,
  admin,
  onListo,
  onCancelar,
}: {
  /** Si viene, se edita; si no, se crea una oferta nueva. */
  oferta?: Oferta;
  /** Suscripciones vigentes de la oferta que se edita (para avisar que conservan su precio). */
  vigentes?: number;
  admin: string;
  onListo: (aviso: string) => void;
  onCancelar: () => void;
}) {
  const editando = !!oferta;
  const [tipo, setTipo] = useState<TipoOferta>(oferta?.tipo ?? "plan");
  const [audiencia, setAudiencia] = useState<Audiencia>(oferta?.audiencia ?? "deportista");
  const [nombre, setNombre] = useState(oferta?.nombre ?? "");
  const [institucion, setInstitucion] = useState(oferta?.institucion ?? "");
  const [descripcion, setDescripcion] = useState(oferta?.descripcion ?? "");
  const [precio, setPrecio] = useState(oferta ? String(oferta.precio) : "");
  const [duracion, setDuracion] = useState(oferta ? (oferta.duracionDias === null ? "" : String(oferta.duracionDias)) : "30");
  const [beneficios, setBeneficios] = useState((oferta?.beneficios ?? []).join("\n"));
  const [error, setError] = useState("");

  const precioNuevo = precio.trim() === "" ? NaN : Number(precio);
  const cambiaPrecio = editando && Number.isFinite(precioNuevo) && precioNuevo !== oferta.precio;

  function guardar() {
    const datos: DatosOferta = {
      tipo,
      audiencia,
      nombre,
      institucion,
      descripcion,
      precio: precioNuevo,
      duracionDias: duracion.trim() === "" ? null : Number(duracion),
      beneficios: beneficios.split("\n"),
    };
    const r = oferta ? editarOferta(oferta.id, datos, admin) : crearOferta(datos, admin);
    if (!r.ok) {
      setError(r.motivo);
      return;
    }
    onListo(r.aviso);
  }

  return (
    <div className="mt-4 space-y-4 rounded-[13px] border border-border bg-subtle p-4">
      <p className="text-sm font-bold">{editando ? `Editar ${oferta.nombre}` : "Nuevo plan o convenio"}</p>

      {!editando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Qué vas a crear</span>
            <div className="flex flex-wrap gap-2">
              <Chip activo={tipo === "plan"} onClick={() => setTipo("plan")}>Plan</Chip>
              <Chip activo={tipo === "convenio"} onClick={() => setTipo("convenio")}>Convenio</Chip>
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Para quién</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ETIQUETA_AUDIENCIA) as Audiencia[]).map((a) => (
                <Chip key={a} activo={audiencia === a} onClick={() => setAudiencia(a)}>
                  {ETIQUETA_AUDIENCIA[a]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre">
          <input
            className={inputClass}
            value={nombre}
            maxLength={60}
            placeholder={tipo === "plan" ? "Ej: Pro Anual" : "Ej: Convenio Universidad X"}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Campo>
        {tipo === "convenio" ? (
          <Campo label="Institución">
            <input
              className={inputClass}
              value={institucion}
              maxLength={80}
              placeholder="Con quién se firmó el convenio"
              onChange={(e) => setInstitucion(e.target.value)}
            />
          </Campo>
        ) : null}
      </div>

      <Campo label="Descripción (opcional)">
        <input
          className={inputClass}
          value={descripcion}
          maxLength={200}
          placeholder="Una frase que explique para quién es."
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Precio en pesos (0 = gratis)">
          <input
            type="number"
            min={0}
            max={1000000}
            step={1}
            className={inputClass}
            value={precio}
            placeholder="4990"
            onChange={(e) => setPrecio(e.target.value)}
          />
        </Campo>
        <div className="space-y-1.5">
          <Campo label="Duración en días (1 a 365)">
            <input
              type="number"
              min={1}
              max={365}
              step={1}
              className={inputClass}
              value={duracion}
              placeholder="Vacío = sin vencimiento (solo si es gratis)"
              onChange={(e) => setDuracion(e.target.value)}
            />
          </Campo>
          <div className="flex flex-wrap gap-2">
            {DURACIONES.map((d) => (
              <Chip key={d.dias} activo={duracion === String(d.dias)} onClick={() => setDuracion(String(d.dias))}>
                {d.etiqueta}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {cambiaPrecio && vigentes > 0 ? (
        <p className="rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">
          El nuevo precio ({formatearCLP(precioNuevo)}) vale solo para nuevas contrataciones.{" "}
          {vigentes} {vigentes === 1 ? "suscripción vigente conserva" : "suscripciones vigentes conservan"} el precio que
          pagaron.
        </p>
      ) : null}

      <Campo label="Beneficios (uno por línea, hasta 10)">
        <textarea
          rows={5}
          className={inputClass}
          value={beneficios}
          placeholder={"Actividades sin límite\nFiltros de búsqueda avanzados"}
          onChange={(e) => setBeneficios(e.target.value)}
        />
      </Campo>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={guardar}>
          {editando ? "Guardar cambios" : "Crear"}
        </button>
        <button type="button" className={btnGhost} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}