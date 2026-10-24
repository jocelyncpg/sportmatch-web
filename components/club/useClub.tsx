"use client";

import { useCallback, useEffect, useState } from "react";
import { miClub, type ClubMio } from "@/lib/api/club";
import { ApiError } from "@/lib/api/cliente";

export function useClub() {
  const [club, setClub] = useState<ClubMio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setClub(await miClub());
    } catch (desconocido) {
      if (desconocido instanceof ApiError && desconocido.status === 404) {
        setClub(null);
      } else {
        setError(desconocido instanceof Error ? desconocido.message : "No se pudo cargar el club.");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  return { club, cargando, error, cargar };
}

export function ClubState({
  cargando,
  error,
  sinClub,
}: {
  cargando: boolean;
  error: string;
  sinClub: boolean;
}) {
  if (cargando) {
    return <p role="status" className="py-8 text-sm text-muted">Cargando información del club…</p>;
  }
  if (error) {
    return <p role="alert" className="rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>;
  }
  if (sinClub) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm">
        Tu cuenta aún no tiene un club. Regístralo desde la app SportMatch.
      </p>
    );
  }
  return null;
}
