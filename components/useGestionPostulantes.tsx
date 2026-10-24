"use client";

import { useCallback, useEffect, useState } from "react";
import { actualizarPostulante, listarTodosPostulantes, type Candidato, type EstadoRevision } from "@/lib/api/postulantes";

// Lógica compartida (inicio y postulantes): cambiar estado respetando cupos y abrir el perfil.
export function useGestionPostulantes(clubId = "", convocatoriaIds: string[] = []) {
  const [mensaje, setMensaje] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [postulantes, setPostulantes] = useState<(Candidato & { convocatoriaId: string; convocatoriaTitulo: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const ids = convocatoriaIds.join("|");
  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const paginas = await Promise.all(ids.split("|").filter(Boolean).map(async (id) => {
        const page = await listarTodosPostulantes(id);
        return page.items.map((p) => ({ ...p, convocatoriaId: id, convocatoriaTitulo: page.convocatoria.titulo ?? "Convocatoria" }));
      }));
      setPostulantes(paginas.flat());
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los postulantes."); }
    finally { setCargando(false); }
  }, [ids]);
  useEffect(() => { const timer = window.setTimeout(() => { if (clubId) void cargar(); }, 0); return () => window.clearTimeout(timer); }, [clubId, cargar]);

  async function cambiar(id: string, nuevo: EstadoRevision | "Pendiente" | "Preseleccionado" | "Aceptado" | "Rechazado") {
    if (nuevo === "Pendiente") return;
    const estado: EstadoRevision = ({ Preseleccionado: "PRESELECCIONADO", Aceptado: "ACEPTADO", Rechazado: "RECHAZADO" } as const)[nuevo as "Preseleccionado" | "Aceptado" | "Rechazado"] ?? nuevo as EstadoRevision;
    try { await actualizarPostulante(id, estado); setMensaje("Estado actualizado."); await cargar(); }
    catch (e) { setMensaje(e instanceof Error ? e.message : "No se pudo actualizar el estado."); }
  }

  return { mensaje, setMensaje, abierto, setAbierto, cambiar, postulantes, cargando, error, recargar: cargar };
}
