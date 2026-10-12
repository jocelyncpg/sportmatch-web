"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

export type Preferencia = "system" | "light" | "dark";
export type Tema = "light" | "dark";

const KEY = "sportmatch_web_tema";
const oyentes = new Set<() => void>();

function leerPreferencia(): Preferencia {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function resolver(p: Preferencia): Tema {
  if (p !== "system") return p;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function aplicar(p: Preferencia) {
  document.documentElement.dataset.theme = resolver(p);
}

function suscribir(o: () => void) {
  oyentes.add(o);
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const alCambiarSistema = () => {
    if (leerPreferencia() === "system") aplicar("system");
    o();
  };
  mq.addEventListener("change", alCambiarSistema);
  return () => {
    oyentes.delete(o);
    mq.removeEventListener("change", alCambiarSistema);
  };
}

interface Ctx {
  preferencia: Preferencia;
  tema: Tema;
  setPreferencia: (p: Preferencia) => void;
}
const ThemeCtx = createContext<Ctx | null>(null);

// Se guarda la preferencia y se resuelve el tema real (claro u oscuro) leyendo el navegador.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preferencia = useSyncExternalStore<Preferencia>(suscribir, leerPreferencia, () => "system");
  const tema = useSyncExternalStore<Tema>(
    suscribir,
    () => resolver(leerPreferencia()),
    () => "dark"
  );

  const setPreferencia = useCallback((p: Preferencia) => {
    try {
      if (p === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* sin almacenamiento disponible */
    }
    aplicar(p);
    oyentes.forEach((o) => o());
  }, []);

  return <ThemeCtx.Provider value={{ preferencia, tema, setPreferencia }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return c;
}

// Script que corre antes de pintar para evitar el parpadeo de tema al recargar.
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${KEY}");var t=(p==="light"||p==="dark")?p:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;}catch(e){}})();`;