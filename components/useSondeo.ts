"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSondeo(tarea: () => Promise<void>, activo: boolean, intervalo = 5000) {
  const tareaRef = useRef(tarea);
  const ocupada = useRef(false);

  useEffect(() => {
    tareaRef.current = tarea;
  }, [tarea]);

  const ejecutar = useCallback(async () => {
    if (ocupada.current) return;
    ocupada.current = true;
    try {
      await tareaRef.current();
    } finally {
      ocupada.current = false;
    }
  }, []);

  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    let temporizador: number;

    const ciclo = async () => {
      await ejecutar();
      if (vigente) temporizador = window.setTimeout(ciclo, intervalo);
    };

    void ciclo();
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [activo, ejecutar, intervalo]);

  return ejecutar;
}
