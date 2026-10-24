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

export type Nivel = "Principiante" | "Intermedio" | "Avanzado";
export const NIVELES: Nivel[] = ["Principiante", "Intermedio", "Avanzado"];

export interface Postulante {
  id: string;
  convocatoriaId: string;
  nombre: string;
  edad: number;
  nivel: Nivel;
  comuna: string;
  estado: EstadoPostulante;
  fechaPostulacion: string; // AAAA-MM-DD
  deportes: string[];
  bio: string;
  disponibilidad: string;
  objetivo: string;
  rating: number;
  resenas: number;
  foto: string; // ruta en /public (vacío = se muestran iniciales)
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
      id: "v1", clubId: "c1", titulo: "Prueba masiva sub-23", deporte: "Fútbol",
      categoria: "Sub-23 (18 a 23 años)", fecha: "2026-11-14",
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
    {
      id: "p1", convocatoriaId: "v1", nombre: "Valentina Reyes", edad: 21, nivel: "Avanzado",
      comuna: "Providencia", estado: "Pendiente", fechaPostulacion: "2026-10-10",
      deportes: ["Fútbol", "Running"],
      bio: "Delantera en liga universitaria. Busca un club con entrenamientos regulares y partidos de fin de semana.",
      disponibilidad: "Lun, mié y vie en la tarde · sábados todo el día",
      objetivo: "Competir en una liga federada",
      rating: 4.8, resenas: 14, foto: "/personas/1.png",
    },
    {
      id: "p2", convocatoriaId: "v1", nombre: "Matías Rojas", edad: 22, nivel: "Intermedio",
      comuna: "Providencia", estado: "Pendiente", fechaPostulacion: "2026-10-09",
      deportes: ["Fútbol", "Escalada", "Trekking"],
      bio: "Juega de volante hace 6 años. Los fines de semana sale a la cordillera, por eso cuida mucho la parte física.",
      disponibilidad: "Martes y jueves en la noche · domingos",
      objetivo: "Mejorar el nivel y conocer gente del barrio",
      rating: 4.6, resenas: 9, foto: "/personas/6.png",
    },
    {
      id: "p3", convocatoriaId: "v1", nombre: "Diego Fuentes", edad: 23, nivel: "Avanzado",
      comuna: "Ñuñoa", estado: "Preseleccionado", fechaPostulacion: "2026-10-07",
      deportes: ["Fútbol", "Ciclismo"],
      bio: "Ex jugador de las series formativas de un club de la zona. Entrena ciclismo para la resistencia.",
      disponibilidad: "Lun a vie desde las 19:00",
      objetivo: "Volver a competir de manera estable",
      rating: 4.9, resenas: 21, foto: "/personas/7.png",
    },
    {
      id: "p4", convocatoriaId: "v2", nombre: "Camila Vera", edad: 20, nivel: "Avanzado",
      comuna: "Las Condes", estado: "Pendiente", fechaPostulacion: "2026-10-08",
      deportes: ["Vóleibol", "Ciclismo"],
      bio: "Armadora con 4 temporadas en campeonatos escolares y universitarios.",
      disponibilidad: "Mié y vie en la tarde · sábados en la mañana",
      objetivo: "Integrarse a un equipo adulto competitivo",
      rating: 4.7, resenas: 11, foto: "/personas/4.png",
    },
    {
      id: "p5", convocatoriaId: "v2", nombre: "Fernanda Díaz", edad: 24, nivel: "Intermedio",
      comuna: "Providencia", estado: "Aceptado", fechaPostulacion: "2026-10-03",
      deportes: ["Vóleibol", "Trekking", "Escalada"],
      bio: "Juega vóleibol recreativo y entrena fuerza dos veces por semana.",
      disponibilidad: "Lun a jue después de las 20:00",
      objetivo: "Entrenar con un equipo estable",
      rating: 4.5, resenas: 7, foto: "/personas/3.png",
    },
    {
      id: "p6", convocatoriaId: "v2", nombre: "Ignacia Muñoz", edad: 26, nivel: "Intermedio",
      comuna: "Macul", estado: "Pendiente", fechaPostulacion: "2026-10-05",
      deportes: ["Vóleibol", "Yoga"],
      bio: "Retoma el vóleibol después de una pausa. Complementa con yoga y movilidad.",
      disponibilidad: "Fines de semana",
      objetivo: "Volver al ritmo de competencia",
      rating: 4.4, resenas: 5, foto: "/personas/2.png",
    },
    {
      id: "p7", convocatoriaId: "v1", nombre: "Jorge Soto", edad: 19, nivel: "Principiante",
      comuna: "Santiago", estado: "Rechazado", fechaPostulacion: "2026-09-30",
      deportes: ["Fútbol", "Natación"],
      bio: "Recién empieza en fútbol de campo. Viene de la natación competitiva.",
      disponibilidad: "Lun, mié y vie en la mañana",
      objetivo: "Aprender y sumar experiencia",
      rating: 4.2, resenas: 3, foto: "/personas/5.png",
    },
    {
      id: "p8", convocatoriaId: "v1", nombre: "Tomás Araya", edad: 20, nivel: "Intermedio",
      comuna: "Vitacura", estado: "Pendiente", fechaPostulacion: "2026-10-11",
      deportes: ["Fútbol"],
      bio: "Defensa central. Juega en una liga de barrio y quiere dar el salto.",
      disponibilidad: "Mar y jue en la tarde",
      objetivo: "Competir en un club formativo",
      rating: 4.3, resenas: 4, foto: "",
    },
    {
      id: "p9", convocatoriaId: "v2", nombre: "Sofía Paredes", edad: 22, nivel: "Avanzado",
      comuna: "Peñalolén", estado: "Preseleccionado", fechaPostulacion: "2026-10-06",
      deportes: ["Vóleibol", "Pádel"],
      bio: "Líbero en el equipo de su universidad, buena lectura de juego.",
      disponibilidad: "Lun a vie desde las 18:30",
      objetivo: "Competir en liga adulta",
      rating: 4.8, resenas: 12, foto: "",
    },
    {
      id: "p10", convocatoriaId: "v1", nombre: "Bastián Lagos", edad: 18, nivel: "Principiante",
      comuna: "La Florida", estado: "Pendiente", fechaPostulacion: "2026-10-11",
      deportes: ["Fútbol", "Running"],
      bio: "Recién egresado del colegio, busca un espacio para seguir jugando.",
      disponibilidad: "Tardes de lunes a sábado",
      objetivo: "Seguir jugando de forma regular",
      rating: 4.0, resenas: 2, foto: "",
    },
  ],
  avisos: [],
  notificaciones: [],
};

const KEY = "sportmatch_web_datos_v2";
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