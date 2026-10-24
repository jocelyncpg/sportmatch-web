"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSesion } from "@/lib/auth.mock";

// La portada es pública. Si la persona ya inició sesión, la llevamos directo a su panel.
export default function RedirigirSiHaySesion() {
  const router = useRouter();
  useEffect(() => {
    if (getSesion()) router.replace("/inicio");
  }, [router]);
  return null;
}