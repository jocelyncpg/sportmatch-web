"use client";

import { useState } from "react";
import { cambiarEstadoPostulante, useDatos, type EstadoPostulante } from "@/lib/store.mock";

// Lógica compartida (inicio y postulantes): cambiar estado respetando cupos y abrir el perfil.
export function useGestionPostulantes() {
  const datos = useDatos();
  const [mensaje, setMensaje] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  function cambiar(id: string, nuevo: EstadoPostulante) {
    const p = datos.postulantes.find((x) => x.id === id);
    const conv = datos.convocatorias.find((c) => c.id === p?.convocatoriaId);
    if (p && conv && nuevo === "Aceptado") {
      const ocupados = datos.postulantes.filter((x) => x.convocatoriaId === conv.id && x.estado === "Aceptado").length;
      if (ocupados >= conv.cupos) {
        setMensaje(`No quedan cupos en "${conv.titulo}".`);
        return;
      }
    }
    setMensaje(cambiarEstadoPostulante(id, nuevo));
  }

  return { mensaje, setMensaje, abierto, setAbierto, cambiar };
}