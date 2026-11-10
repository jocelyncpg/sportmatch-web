"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Pantalla de carga de la portada: fondo negro y el logo completo de SportMatch en grande, que aparece
// con un fundido suave, respira un poco y se desvanece.
// Se muestra una vez por sesión del navegador (no cada vez que se vuelve a la portada).
const CLAVE = "sportmatch_splash_visto";

// Corre antes de que cargue React: si ya se vio en esta sesión, la oculta sin parpadeo.
const SCRIPT = `try{if(sessionStorage.getItem("${CLAVE}"))document.documentElement.dataset.splash="visto"}catch(e){}`;

const ESTILOS = `
@keyframes sm-entrada {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes sm-respiro {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.035); }
}
@media (prefers-reduced-motion: no-preference) {
  .sm-logo { animation: sm-entrada 0.9s cubic-bezier(0.22, 1, 0.36, 1) both, sm-respiro 2.2s ease-in-out 0.9s infinite; }
}
`;

type Fase = "visible" | "saliendo" | "fuera";

export default function PantallaCarga() {
  const [fase, setFase] = useState<Fase>("visible");

  useEffect(() => {
    // Si ya se vio en esta sesión, el CSS la oculta y no hay nada que animar.
    if (document.documentElement.dataset.splash === "visto") return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setFase("saliendo"), reducir ? 1200 : 3200);
    const t2 = window.setTimeout(() => {
      try {
        sessionStorage.setItem(CLAVE, "1");
      } catch {}
      setFase("fuera");
    }, reducir ? 1500 : 3800);
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
          src="/logo-dark.png"
          alt="SportMatch"
          width={1200}
          height={262}
          priority
          className="sm-logo h-auto w-[82vw] max-w-[620px]"
        />
      </div>
    </>
  );
}