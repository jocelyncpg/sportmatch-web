"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Preferencia } from "@/lib/theme";

const OPCIONES: { valor: Preferencia; label: string; icono: typeof Sun }[] = [
  { valor: "light", label: "Claro", icono: Sun },
  { valor: "dark", label: "Oscuro", icono: Moon },
  { valor: "system", label: "Sistema", icono: Monitor },
];

// Selector de tema: claro, oscuro o el del sistema.
export default function ThemeToggle({ compacto = false }: { compacto?: boolean }) {
  const { preferencia, setPreferencia } = useTheme();
  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-[10px] border border-border bg-subtle p-0.5">
      {OPCIONES.map(({ valor, label, icono: Icono }) => {
        const activo = preferencia === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={label}
            onClick={() => setPreferencia(valor)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              activo ? "bg-card text-text" : "text-muted hover:text-text"
            }`}
          >
            <Icono size={14} />
            {compacto ? <span className="sr-only">{label}</span> : label}
          </button>
        );
      })}
    </div>
  );
}