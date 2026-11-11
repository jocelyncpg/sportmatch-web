"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { btnPrimary } from "@/components/ui";
import {
  RUTA_PLANES_CLUB,
  alLlegarAlLimite,
  avisarLimitePlan,
  limitePlanActual,
  mensajeLimitePlan,
  textoSeLibera,
  type LimitePlan,
} from "@/lib/limitePlan";

// HU-54: aviso fijo cuando una acción del club llega a un límite del plan gratuito, con enlace a Mi suscripción.
export default function AvisoLimitePlan() {
  const [limite, setLimite] = useState<LimitePlan | null>(limitePlanActual);
  useEffect(() => alLlegarAlLimite(setLimite), []);
  if (!limite) return null;
  const libera = textoSeLibera(limite);
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-6"
    >
      <p className="text-sm font-bold">Llegaste al límite de tu plan</p>
      <p className="mt-1 text-sm">{mensajeLimitePlan(limite)}</p>
      {libera ? <p className="mt-1 text-xs text-muted">{libera}</p> : null}
      <div className="mt-3 flex items-center gap-3">
        <Link href={RUTA_PLANES_CLUB} className={btnPrimary} onClick={() => avisarLimitePlan(null)}>
          Ver planes
        </Link>
        <button type="button" className="text-sm font-semibold text-muted hover:text-text" onClick={() => avisarLimitePlan(null)}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
