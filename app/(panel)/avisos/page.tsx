"use client";

import { useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Campo, Card, PageHeader, btnPrimary, inputClass } from "@/components/ui";
import { CLUB_DEMO_ID, emitirAviso, useDatos } from "@/lib/datos";

// HU-38: el club emite comunicados hacia sus postulantes o miembros.
export default function AvisosPage() {
  return (
    <SoloRol roles={["club"]}>
      <Contenido />
    </SoloRol>
  );
}

function Contenido() {
  const datos = useDatos();
  const [destino, setDestino] = useState("");
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState("");

  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const idsMias = new Set(mias.map((c) => c.id));
  const avisos = datos.avisos.filter((a) => a.clubId === CLUB_DEMO_ID);

  const destinatarios = (convId: string | null) =>
    datos.postulantes.filter((p) => (convId ? p.convocatoriaId === convId : idsMias.has(p.convocatoriaId))).length;

  function onEnviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviado("");
    if (!titulo.trim() || !mensaje.trim()) {
      setError("Escribe un título y un mensaje.");
      return;
    }
    const n = destinatarios(destino || null);
    if (n === 0) {
      setError("No hay postulantes para ese destino.");
      return;
    }
    emitirAviso({ clubId: CLUB_DEMO_ID, convocatoriaId: destino || null, titulo: titulo.trim(), mensaje: mensaje.trim() });
    setTitulo("");
    setMensaje("");
    setEnviado(`Aviso enviado a ${n} ${n === 1 ? "postulante" : "postulantes"}.`);
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Avisos" subtitulo="Envía comunicados a tus postulantes y miembros." />

      <form onSubmit={onEnviar}>
        <Card className="space-y-4">
          <Campo label="Destinatarios">
            <select className={inputClass} value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">Todos los postulantes del club</option>
              {mias.map((c) => (
                <option key={c.id} value={c.id}>Postulantes de: {c.titulo}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Título">
            <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </Campo>
          <Campo label="Mensaje">
            <textarea className={`${inputClass} min-h-28`} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </Campo>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex items-center gap-4">
            <button type="submit" className={btnPrimary}>Enviar aviso</button>
            {enviado ? <p className="text-sm font-semibold text-success">{enviado}</p> : null}
          </div>
        </Card>
      </form>

      <h2 className="mb-3 mt-8 text-sm font-bold">Avisos enviados</h2>
      {avisos.length === 0 ? (
        <p className="text-sm text-muted">Aún no has enviado avisos.</p>
      ) : (
        <div className="space-y-3">
          {avisos.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{a.titulo}</p>
                <p className="text-xs text-muted">
                  {new Date(a.fecha).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted">
                Para: {a.convocatoriaId ? mias.find((c) => c.id === a.convocatoriaId)?.titulo : "todos los postulantes"}
              </p>
              <p className="mt-2 text-sm">{a.mensaje}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}