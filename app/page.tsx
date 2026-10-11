"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSesion } from "@/lib/auth.mock";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getSesion() ? "/inicio" : "/login");
  }, [router]);
  return null;
}