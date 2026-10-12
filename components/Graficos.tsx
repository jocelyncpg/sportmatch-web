"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";

const TICK = { fill: "var(--muted)", fontSize: 12 };

function TooltipCaja({ active, payload, label, unidad }: { active?: boolean; payload?: { value?: number }[]; label?: string; unidad: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 text-muted">
        {payload[0].value} {unidad}
      </p>
    </div>
  );
}

// Tarjeta con título y vista alternativa en tabla (accesible, sin depender del color).
export function ChartCard({
  titulo,
  subtitulo,
  columnas,
  filas,
  children,
  className = "",
}: {
  titulo: string;
  subtitulo?: string;
  columnas: [string, string];
  filas: [string, number | string][];
  children: React.ReactNode;
  className?: string;
}) {
  const [tabla, setTabla] = useState(false);
  return (
    <Card className={className}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">{titulo}</h2>
          {subtitulo ? <p className="mt-0.5 text-xs text-muted">{subtitulo}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setTabla((t) => !t)}
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
        >
          {tabla ? "Ver gráfico" : "Ver tabla"}
        </button>
      </div>
      {tabla ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 font-semibold">{columnas[0]}</th>
              <th className="py-2 text-right font-semibold">{columnas[1]}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filas.map(([a, b]) => (
              <tr key={a}>
                <td className="py-2">{a}</td>
                <td className="py-2 text-right font-semibold">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </Card>
  );
}

export function GraficoLinea({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Postulaciones recibidas por día">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="rellenoLinea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="etiqueta" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={2} />
          <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
            content={<TooltipCaja unidad="postulaciones" />}
          />
          <Area
            type="linear"
            dataKey="valor"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#rellenoLinea)"
            dot={false}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2, fill: "var(--accent)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Barras horizontales con el valor al final; colores opcionales por fila.
export function GraficoBarras({
  datos,
  colores,
  alto,
  unidad = "postulantes",
}: {
  datos: { nombre: string; valor: number }[];
  colores?: Record<string, string>;
  alto?: number;
  unidad?: string;
}) {
  const h = alto ?? Math.max(120, datos.length * 44 + 8);
  return (
    <div style={{ height: h }} role="img" aria-label="Gráfico de barras">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={12}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={118}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: "var(--subtle)" }} content={<TooltipCaja unidad={unidad} />} />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={14} background={{ fill: "var(--subtle)", radius: 4 }}>
            {datos.map((d) => (
              <Cell key={d.nombre} fill={colores?.[d.nombre] ?? "var(--accent)"} />
            ))}
            <LabelList dataKey="valor" position="right" fill="var(--text)" fontSize={12} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}