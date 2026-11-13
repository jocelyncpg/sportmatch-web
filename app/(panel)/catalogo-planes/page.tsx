"use client";

import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Card, Chip, PageHeader, btnPrimary } from "@/components/ui";
import { listarPlanes, miSuscripcion, precioCLP } from "@/lib/api/pagos";

// Catálogo de planes de SportMatch para el club. Es la misma información que muestra la app:
// los tres planes y lo que incluye cada uno. La contratación con Webpay está en "Mi suscripción".

type PlanVista = {
  id: "gratuito" | "pro" | "club";
  nombre: string;
  resumen: string;
  precio: number;
  paraClubes: boolean;
  beneficios: { texto: string; incluido: boolean }[];
};

const PLANES: PlanVista[] = [
  {
    id: "gratuito",
    nombre: "Gratuito",
    resumen: "Para empezar a entrenar en comunidad",
    precio: 0,
    paraClubes: false,
    beneficios: [
      { texto: "Actividades que puedes organizar al mes: 3", incluido: true },
      { texto: "Postulaciones activas a la vez: 5", incluido: true },
      { texto: "Filtros de búsqueda: Básicos", incluido: true },
      { texto: "Chat con tus matches", incluido: true },
      { texto: "Insignia de perfil destacado", incluido: false },
      { texto: "Panel web para el club", incluido: false },
      { texto: "Convocatorias y gestión de postulantes", incluido: false },
      { texto: "Estadísticas de postulaciones", incluido: false },
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    resumen: "Para deportistas que entrenan seguido",
    precio: 4990,
    paraClubes: false,
    beneficios: [
      { texto: "Actividades que puedes organizar al mes: Sin límite", incluido: true },
      { texto: "Postulaciones activas a la vez: Sin límite", incluido: true },
      { texto: "Filtros de búsqueda: Avanzados", incluido: true },
      { texto: "Chat con tus matches", incluido: true },
      { texto: "Insignia de perfil destacado", incluido: true },
      { texto: "Panel web para el club", incluido: false },
      { texto: "Convocatorias y gestión de postulantes", incluido: false },
      { texto: "Estadísticas de postulaciones", incluido: false },
    ],
  },
  {
    id: "club",
    nombre: "Club",
    resumen: "Para clubes, escuelas y comunidades",
    precio: 19990,
    paraClubes: true,
    beneficios: [
      { texto: "Actividades que puedes organizar al mes: Sin límite", incluido: true },
      { texto: "Postulaciones activas a la vez: Sin límite", incluido: true },
      { texto: "Filtros de búsqueda: Avanzados", incluido: true },
      { texto: "Chat con tus matches", incluido: true },
      { texto: "Insignia de perfil destacado", incluido: true },
      { texto: "Panel web para el club", incluido: true },
      { texto: "Convocatorias y gestión de postulantes", incluido: true },
      { texto: "Estadísticas de postulaciones", incluido: true },
    ],
  },
];

function Contenido() {
  // Precio y descripción reales del plan Club, si el backend ya los entrega; si no, los del diseño.
  const [precioClub, setPrecioClub] = useState<number | null>(null);
  const [descripcionClub, setDescripcionClub] = useState<string | null>(null);
  const [tienePlanClub, setTienePlanClub] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([listarPlanes(), miSuscripcion()])
      .then(([catalogo, suscripcion]) => {
        if (!activo) return;
        const club = [...catalogo].sort((a, b) => a.precio - b.precio || a.id - b.id)[0];
        if (club) {
          setPrecioClub(club.precio);
          setDescripcionClub(club.descripcion?.trim() ? club.descripcion : null);
        }
        setTienePlanClub(suscripcion?.estado === "ACTIVE");
      })
      .catch(() => undefined); // sin backend, se muestran los datos del diseño
    return () => { activo = false; };
  }, []);

  return (
    <>
      <PageHeader
        titulo="Planes y beneficios"
        subtitulo="El plan Club suma el panel web, las convocatorias y la gestión de postulantes."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esClub = plan.id === "club";
          const precio = esClub && precioClub !== null ? precioClub : plan.precio;
          const resumen = esClub && descripcionClub ? descripcionClub : plan.resumen;
          return (
            <Card
              key={plan.id}
              className={`flex flex-col ${esClub ? "border-accent ring-1 ring-accent" : ""}`}
            >
              <div className="mb-3 flex min-h-6 flex-wrap gap-2">
                {esClub && tienePlanClub ? <Chip activo>Tu plan</Chip> : null}
                {esClub && !tienePlanClub ? <Chip activo>Recomendado</Chip> : null}
                {!plan.paraClubes ? <Chip>Para deportistas</Chip> : null}
              </div>
              <h2 className="text-2xl font-bold">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-muted">{resumen}</p>
              <p className="mt-5 text-4xl font-extrabold">
                {precio === 0 ? "$0" : precioCLP(precio)}{" "}
                <span className="text-sm font-normal text-muted">{precio === 0 ? "para siempre" : "al mes"}</span>
              </p>
              <hr className="my-5 border-border" />
              <ul className="flex-1 space-y-3">
                {plan.beneficios.map((b) => (
                  <li key={b.texto} className={`flex items-start gap-3 text-sm ${b.incluido ? "" : "text-muted"}`}>
                    {b.incluido ? (
                      <Check aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--success)]" />
                    ) : (
                      <Minus aria-hidden size={18} className="mt-0.5 shrink-0" />
                    )}
                    <span>
                      {b.texto}
                      {!b.incluido ? <span className="sr-only"> (no incluido)</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
              {esClub ? (
                <Link href="/suscripcion" className={`${btnPrimary} mt-6 text-center`}>
                  {tienePlanClub ? "Administrar mi suscripción" : "Contratar plan Club"}
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Los precios están en pesos chilenos (CLP). El pago se hace en el sitio seguro de Webpay Plus.
      </p>
    </>
  );
}

export default function Page() {
  return (
    <SoloRol roles={["club"]}>
      <Contenido />
    </SoloRol>
  );
}
