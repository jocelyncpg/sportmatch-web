"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// El inicio de sesión ahora es un modal sobre la portada. Esta ruta se mantiene
// para los enlaces antiguos y para las páginas protegidas que redirigen aquí.
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?login=1");
  }, [router]);
  return null;
}