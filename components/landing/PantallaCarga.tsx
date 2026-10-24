"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Pantalla de carga de la portada: fondo negro y el icono de SportMatch latiendo.
// Se muestra una vez por sesión del navegador (no cada vez que se vuelve a la portada).
const CLAVE = "sportmatch_splash_visto";

// Corre antes de que cargue React: si ya se vio en esta sesión, la oculta sin parpadeo.
const SCRIPT = `try{if(sessionStorage.getItem("${CLAVE}"))document.documentElement.dataset.splash="visto"}catch(e){}`;

const ESTILOS = `
@keyframes sm-latido {
  0%, 100% { transform: scale(0.9); opacity: 0.85; }
  50% { transform: scale(1.06); opacity: 1; }
}
@media (prefers-reduced-motion: no-preference) {
  .sm-icono { animation: sm-latido 1.1s ease-in-out infinite; }
}
`;

type Fase = "visible" | "saliendo" | "fuera";

export default function PantallaCarga() {
  const [fase, setFase] = useState<Fase>("visible");

  useEffect(() => {
    // Si ya se vio en esta sesión, el CSS la oculta y no hay nada que animar.
    if (document.documentElement.dataset.splash === "visto") return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setFase("saliendo"), reducir ? 400 : 1500);
    const t2 = window.setTimeout(() => {
      try {
        sessionStorage.setItem(CLAVE, "1");
      } catch {}
      setFase("fuera");
    }, reducir ? 700 : 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (fase === "fuera") return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: ESTILOS }} />
      <div
        role="status"
        aria-label="Cargando SportMatch"
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 [html[data-splash=visto]_&]:hidden ${
          fase === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src="/brand/icono.png"
          alt=""
          width={320}
          height={320}
          priority
          className="sm-icono h-auto w-40 sm:w-52"
        />
      </div>
    </>
  );
}