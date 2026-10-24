import { Bike, Footprints, Mountain } from "lucide-react";

// Mapa ilustrado de ejemplo (SVG propio, sin servicios externos ni ubicaciones reales).
// Se muestra mientras carga el mapa de Leaflet.
const PINES = [
  {
    Icono: Bike,
    texto: "Ciclismo · 1,2 km",
    pos: "left-[52%] top-[14%]",
  },
  {
    Icono: Footprints,
    texto: "Running · 0,8 km",
    pos: "left-[6%] top-[52%]",
  },
  {
    Icono: Mountain,
    texto: "Escalada · 2,4 km",
    pos: "left-[56%] top-[66%]",
  },
];

export default function MapaEjemplo() {
  return (
    <figure>
      <div
        role="img"
        aria-label="Mapa ilustrado de ejemplo con una ruta y tres personas cercanas que practican ciclismo, running y escalada"
        className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-slate-200 bg-[#EEF1F4] shadow-sm"
      >
        <svg
          viewBox="0 0 640 512"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Parque */}
          <path
            d="M392 36 C470 22 560 40 604 92 C632 128 618 190 566 214 C500 244 420 226 384 178 C356 140 350 54 392 36 Z"
            fill="#DCEBDC"
          />
          {/* Río */}
          <path
            d="M-20 430 C100 380 190 470 300 430 C420 386 500 340 660 360"
            fill="none"
            stroke="#CDE2F4"
            strokeWidth="54"
            strokeLinecap="round"
          />
          {/* Calles secundarias */}
          <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round">
            <path d="M0 110 H640" />
            <path d="M0 250 H640" />
            <path d="M0 330 H420" />
            <path d="M120 0 V512" />
            <path d="M290 0 V400" />
            <path d="M470 250 V512" />
            <path d="M560 0 V120" />
          </g>
          {/* Avenidas */}
          <g stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none">
            <path d="M-10 190 C140 170 260 210 420 150 S600 130 660 90" />
            <path d="M200 -10 C230 120 180 250 250 380 S340 480 330 530" />
          </g>

          {/* Ruta */}
          <path
            d="M80 392 C130 340 150 300 210 276 S290 214 346 222 S440 200 486 156 S560 120 584 92"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M80 392 C130 340 150 300 210 276 S290 214 346 222 S440 200 486 156 S560 120 584 92"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inicio y fin */}
          <circle cx="80" cy="392" r="11" fill="#FFFFFF" />
          <circle cx="80" cy="392" r="6" fill="#16A34A" />
          <circle cx="584" cy="92" r="13" fill="#FFFFFF" />
          <circle cx="584" cy="92" r="7" fill="#0B0F19" />
          {/* Tú */}
          <circle cx="210" cy="276" r="22" fill="#2563EB" opacity="0.18" />
          <circle cx="210" cy="276" r="11" fill="#FFFFFF" />
          <circle cx="210" cy="276" r="7" fill="#2563EB" />
        </svg>

        {PINES.map(({ Icono, texto, pos }) => (
          <div
            key={texto}
            className={`absolute ${pos} flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 shadow-lg ring-1 ring-black/5`}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[#7C3AED] text-white sm:size-8">
              <Icono size={16} strokeWidth={2.4} />
            </span>
            <span className="whitespace-nowrap text-xs font-bold text-slate-900 sm:text-sm">
              {texto}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-sm text-slate-500">
        Ilustración de ejemplo. No muestra ubicaciones ni personas reales.
      </figcaption>
    </figure>
  );
}