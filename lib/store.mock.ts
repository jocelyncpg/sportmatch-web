// MOCK de datos de clubes. Solo para desarrollo local (se guarda en localStorage).
// Cuando el Gateway esté listo, cada función de abajo se reemplaza por una llamada a la API.
// NO subir este archivo a main.

import { useSyncExternalStore } from "react";

export type EstadoPostulante = "Pendiente" | "Preseleccionado" | "Aceptado" | "Rechazado";
export const ESTADOS: EstadoPostulante[] = ["Pendiente", "Preseleccionado", "Aceptado", "Rechazado"];

export const DEPORTES = [
  "Fútbol", "Básquetbol", "Vóleibol", "Natación", "Tenis", "Running",
  "Ciclismo", "Escalada", "Boxeo", "Yoga", "Pádel", "Atletismo",
];

export interface Club {
  id: string;
  nombre: string;
  descripcion: string;
  zona: string;
  deportes: string[];
  email: string;
  telefono: string;
  instagram: string;
  web: string;
  logoUrl: string;
}

export interface Convocatoria {
  id: string;
  clubId: string;
  titulo: string;
  deporte: string;
  categoria: string;
  fecha: string; // AAAA-MM-DD
  requisitos: string;
  cupos: number;
  estado: "abierta" | "cerrada";
}

export interface Postulante {
  id: string;
  convocatoriaId: string;
  nombre: string;
  nivel: string;
  comuna: string;
  estado: EstadoPostulante;
}

export interface Aviso {
  id: string;
  clubId: string;
  convocatoriaId: string | null; // null = todos los postulantes del club
  titulo: string;
  mensaje: string;
  fecha: string; // ISO
}

export interface Notificacion {
  id: string;
  texto: string;
  fecha: string; // ISO
}

export interface Datos {
  clubes: Club[];
  convocatorias: Convocatoria[];
  postulantes: Postulante[];
  avisos: Aviso[];
  notificaciones: Notificacion[];
}

// Club con el que inicia sesión club@sportmatch.cl
export const CLUB_DEMO_ID = "c1";

const SEMILLA: Datos = {
  clubes: [
    {
      id: "c1", nombre: "Club Deportivo Demo",
      descripcion: "Club formativo de Santiago con foco en fútbol y vóleibol para todas las edades.",
      zona: "Providencia", deportes: ["Fútbol", "Vóleibol"],
      email: "club@sportmatch.cl", telefono: "+56 9 1234 5678",
      instagram: "@clubdemo", web: "", logoUrl: "",
    },
    {
      id: "c2", nombre: "Natación Maipú",
      descripcion: "Escuela de natación con niveles inicial, intermedio y competitivo.",
      zona: "Maipú", deportes: ["Natación"],
      email: "contacto@natacionmaipu.cl", telefono: "+56 9 8765 4321",
      instagram: "@natacionmaipu", web: "", logoUrl: "",
    },
    {
      id: "c3", nombre: "Escaladores Ñuñoa",
      descripcion: "Comunidad de escalada en muro y roca. Salidas mensuales a la cordillera.",
      zona: "Ñuñoa", deportes: ["Escalada"],
      email: "hola@escaladoresnunoa.cl", telefono: "",
      instagram: "@escaladoresnunoa", web: "", logoUrl: "",
    },
    {
      id: "c4", nombre: "Running Las Condes",
      descripcion: "Grupo de running con entrenamientos guiados los fines de semana.",
      zona: "Las Condes", deportes: ["Running", "Atletismo"],
      email: "info@runninglc.cl", telefono: "",
      instagram: "@runninglc", web: "", logoUrl: "",
    },
  ],
  convocatorias: [
    {
      id: "v1", clubId: "c1", titulo: "Prueba masiva sub-17", deporte: "Fútbol",
      categoria: "Sub-17 (15 a 17 años)", fecha: "2026-11-14",
      requisitos: "Cédula de identidad, ropa deportiva y certificado médico.",
      cupos: 12, estado: "abierta",
    },
    {
      id: "v2", clubId: "c1", titulo: "Selección de armadores", deporte: "Vóleibol",
      categoria: "Adultos (18+)", fecha: "2026-11-21",
      requisitos: "Experiencia mínima de 1 año en competencias amateur.",
      cupos: 4, estado: "abierta",
    },
    {
      id: "v3", clubId: "c2", titulo: "Prueba equipo competitivo", deporte: "Natación",
      categoria: "Juvenil (14 a 18 años)", fecha: "2026-11-08",
      requisitos: "Marcas de 100 m libre del último año.",
      cupos: 6, estado: "abierta",
    },
  ],
  postulantes: [
    { id: "p1", convocatoriaId: "v1", nombre: "Matías Rojas", nivel: "Intermedio", comuna: "Providencia", estado: "Pendiente" },
    { id: "p2", convocatoriaId: "v1", nombre: "Diego Fuentes", nivel: "Avanzado", comuna: "Ñuñoa", estado: "Preseleccionado" },
    { id: "p3", convocatoriaId: "v1", nombre: "Jorge Soto", nivel: "Principiante", comuna: "Santiago", estado: "Rechazado" },
    { id: "p4", convocatoriaId: "v2", nombre: "Camila Vera", nivel: "Avanzado", comuna: "Las Condes", estado: "Pendiente" },
    { id: "p5", convocatoriaId: "v2", nombre: "Fernanda Díaz", nivel: "Intermedio", comuna: "Providencia", estado: "Aceptado" },
    { id: "p6", convocatoriaId: "v2", nombre: "Ignacia Muñoz", nivel: "Intermedio", comuna: "Macul", estado: "Pendiente" },
  ],
  avisos: [],
  notificaciones: [],
};

const KEY = "sportmatch_web_datos";
let estado: Datos = SEMILLA;
let cargado = false;
const oyentes = new Set<() => void>();

function cargar() {
  if (cargado || typeof window === "undefined") return;
  cargado = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) estado = JSON.parse(raw) as Datos;
  } catch {
    /* sin datos guardados: se usa la semilla */
  }
}

function guardar(siguiente: Datos) {
  estado = siguiente;
  try {
    localStorage.setItem(KEY, JSON.stringify(siguiente));
  } catch {
    /* sin almacenamiento disponible */
  }
  oyentes.forEach((o) => o());
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
}

export function useDatos(): Datos {
  return useSyncExternalStore(
    suscribir,
    () => {
      cargar();
      return estado;
    },
    () => SEMILLA
  );
}

const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function actualizarClub(id: string, cambios: Partial<Club>) {
  guardar({ ...estado, clubes: estado.clubes.map((c) => (c.id === id ? { ...c, ...cambios } : c)) });
}

export function crearConvocatoria(d: Omit<Convocatoria, "id" | "estado">) {
  guardar({
    ...estado,
    convocatorias: [{ ...d, id: nuevoId("v"), estado: "abierta" }, ...estado.convocatorias],
  });
}

export function cerrarConvocatoria(id: string) {
  guardar({
    ...estado,
    convocatorias: estado.convocatorias.map((c) => (c.id === id ? { ...c, estado: "cerrada" } : c)),
  });
}

// Cambia el estado y deja registrada la notificación que recibiría el postulante.
export function cambiarEstadoPostulante(id: string, nuevo: EstadoPostulante): string {
  const p = estado.postulantes.find((x) => x.id === id);
  if (!p) return "";
  const texto = `Se notificó a ${p.nombre}: su postulación pasó a "${nuevo}".`;
  guardar({
    ...estado,
    postulantes: estado.postulantes.map((x) => (x.id === id ? { ...x, estado: nuevo } : x)),
    notificaciones: [{ id: nuevoId("n"), texto, fecha: new Date().toISOString() }, ...estado.notificaciones],
  });
  return texto;
}

export function emitirAviso(d: Omit<Aviso, "id" | "fecha">) {
  guardar({
    ...estado,
    avisos: [{ ...d, id: nuevoId("a"), fecha: new Date().toISOString() }, ...estado.avisos],
  });
}