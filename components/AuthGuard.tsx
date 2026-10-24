"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSesion, type Sesion } from "@/lib/auth";

// Protege las páginas del panel: sin sesión vuelve a /login.
export default function AuthGuard({
  children,
}: {
  children: (sesion: Sesion) => React.ReactNode;
}) {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    const s = getSesion();
    if (!s) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSesion(s);
  }, [router]);

  if (!sesion) {
    return <p className="p-8 text-sm text-muted">Cargando…</p>;
  }
  return <>{children(sesion)}</>;
}