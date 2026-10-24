"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSesion, type Sesion } from "@/lib/sesion";

// Protege las páginas del panel: sin sesión vuelve a /login.
export default function AuthGuard({
  children,
}: {
  children: (sesion: Sesion) => React.ReactNode;
}) {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    let activo = true;
    void getSesion().then((s) => {
      if (!activo) return;
      if (!s) router.replace("/login");
      else setSesion(s);
    });
    return () => { activo = false; };
  }, [router]);

  if (!sesion) {
    return <p className="p-8 text-sm text-muted">Cargando…</p>;
  }
  return <>{children(sesion)}</>;
}
