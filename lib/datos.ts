"use client";

import { useSyncExternalStore } from "react";
import { getSesion } from "./auth";
import { agregarDeporte, editarMiClub, listarClubes, listarDeportes, miClub, obtenerClub, quitarDeporte } from "./api/club";
import { cerrarConvocatoria as cerrarEnApi, listarConvocatorias, publicarConvocatoria } from "./api/convocatorias";
import { listarTodosPostulantes, actualizarPostulante } from "./api/postulantes";
import { listarAvisos, publicarAviso } from "./api/avisos";
import { ApiError } from "./api/cliente";
import { instagramAGuardar, mapAviso, mapClub, mapConvocatoria, mapPostulante, opcional, webAGuardar } from "./datos-mapeo.mjs";

export type EstadoPostulante = "Pendiente" | "Preseleccionado" | "En espera" | "Aceptado" | "Rechazado";
export const ESTADOS: EstadoPostulante[] = ["Pendiente", "Preseleccionado", "En espera", "Aceptado", "Rechazado"];
// Catálogo de Ms-club (GET /clubs/deportes): un deporte fuera de él no se puede guardar.
export const DEPORTES = ["Atletismo", "Básquetbol", "Ciclismo", "Fútbol", "Natación", "Running", "Tenis", "Trekking", "Vóleibol", "Yoga"];
export interface Club { id: string; nombre: string; descripcion: string; zona: string; deportes: string[]; email: string; telefono: string; instagram: string; web: string; logoUrl: string; portadaUrl: string; direccion: string; latitud: number | null; longitud: number | null }
export interface Convocatoria { id: string; clubId: string; titulo: string; deporte: string; categoria: string; fecha: string; requisitos: string; cupos: number; estado: "abierta" | "cerrada"; chatPostulantes: boolean }
export type Nivel = "Principiante" | "Intermedio" | "Avanzado";
export const NIVELES: Nivel[] = ["Principiante", "Intermedio", "Avanzado"];
export interface Postulante { id: string; usuarioId: string; convocatoriaId: string; nombre: string; edad: number; nivel: Nivel; comuna: string; estado: EstadoPostulante; fechaPostulacion: string; deportes: string[]; bio: string; disponibilidad: string; objetivo: string; rating: number; resenas: number; foto: string }
export interface Aviso { id: string; clubId: string; convocatoriaId: string | null; titulo: string; mensaje: string; fecha: string }
export interface Notificacion { id: string; texto: string; fecha: string }
export interface Datos { clubes: Club[]; convocatorias: Convocatoria[]; postulantes: Postulante[]; avisos: Aviso[]; notificaciones: Notificacion[] }

export const CLUB_DEMO_ID = "mi-club";
const VACIO: Datos = { clubes: [], convocatorias: [], postulantes: [], avisos: [], notificaciones: [] };
let estado = VACIO;
let iniciado = false;
let clubRealId: string | null = null;
let convocatoriasReales = new Map<string, string>();
let postulacionesReales = new Map<string, string>();
const oyentes = new Set<() => void>();
const notificar = () => oyentes.forEach((oyente) => oyente());
const reemplazar = (cambios: Partial<Datos>) => { estado = { ...estado, ...cambios }; notificar(); };
const nuevoId = (prefijo: string) => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function registrarError(error: unknown) {
  // El mensaje es del backend o de las validaciones propias; nunca trae datos de sesión.
  const detalle = error instanceof ApiError ? `HTTP ${error.status}: ${error.message}`
    : error instanceof Error ? error.message : "Error";
  console.error("No se pudo sincronizar con el backend:", detalle);
}

async function todosLosClubes() {
  const primera = await listarClubes({ page: 1, page_size: 50 });
  const items = [...primera.items];
  for (let pagina = 2; pagina <= Math.ceil(primera.total / 50); pagina++) {
    items.push(...(await listarClubes({ page: pagina, page_size: 50 })).items);
  }
  return Promise.all(items.map(async (resumen) => {
    try { return mapClub(await obtenerClub(resumen.id)); }
    catch { return mapClub(resumen); }
  }));
}

async function todasLasPaginas<T>(cargar: (pagina: number) => Promise<{ items: T[]; total: number }>) {
  const primera = await cargar(1);
  const items = [...primera.items];
  for (let pagina = 2; pagina <= Math.ceil(primera.total / 50); pagina++) items.push(...(await cargar(pagina)).items);
  return items;
}

async function cargarDesdeApi() {
  const clubes = await todosLosClubes();
  const sesion = getSesion();
  if (!sesion || sesion.rol !== "club") {
    clubRealId = null;
    convocatoriasReales = new Map();
    postulacionesReales = new Map();
    estado = { ...VACIO, clubes };
    notificar();
    return;
  }
  let propio: Awaited<ReturnType<typeof miClub>> | null = null;
  try { propio = await miClub(); }
  catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error; }
  if (!propio) {
    clubRealId = null;
    estado = { ...VACIO, clubes };
    notificar();
    return;
  }

  clubRealId = propio.id;
  postulacionesReales = new Map();
  const clubesAdaptados = clubes.filter((club) => club.id !== propio!.id);
  // Las imágenes elegidas en esta sesión (aún sin subida al servidor) no se pierden al recargar.
  const previo = estado.clubes.find((club) => club.id === CLUB_DEMO_ID);
  const local = (valor?: string) => (valor && valor.startsWith("data:") ? valor : "");
  const adaptado = mapClub(propio, CLUB_DEMO_ID);
  clubesAdaptados.unshift({ ...adaptado, logoUrl: adaptado.logoUrl || local(previo?.logoUrl), portadaUrl: adaptado.portadaUrl || local(previo?.portadaUrl) });
  // Sin estado, la API solo devuelve las ABIERTA: cerradas y finalizadas (y sus postulantes) quedarían fuera.
  const convs = (await Promise.all((["ABIERTA", "CERRADA", "FINALIZADA"] as const).map((estado) =>
    todasLasPaginas((page) => listarConvocatorias({ club_id: propio!.id, estado, page, page_size: 50 }))))).flat();
  convocatoriasReales = new Map(convs.map((convocatoria) => [convocatoria.id, convocatoria.id]));
  const convocatorias = convs.map((convocatoria) => mapConvocatoria(convocatoria, CLUB_DEMO_ID));
  const postulantes = (await Promise.all(convs.map(async (convocatoria) => {
    const pagina = await listarTodosPostulantes(convocatoria.id);
    return pagina.items.map((postulacion) => {
      postulacionesReales.set(postulacion.id, postulacion.id);
      return mapPostulante(postulacion, convocatoria.id);
    });
  }))).flat();
  const avisosApi = await todasLasPaginas((page) => listarAvisos(propio!.id, { page, page_size: 50 }));
  const avisos = avisosApi.map((aviso) => mapAviso(aviso, CLUB_DEMO_ID));
  estado = { clubes: clubesAdaptados, convocatorias, postulantes, avisos, notificaciones: [] };
  notificar();
}

async function recargar() {
  // Sin sesión no hay nada que pedir; así no se llama al backend desde el login ni tras cerrar sesión.
  if (!getSesion()) return;
  try { await cargarDesdeApi(); } catch (error) { registrarError(error); }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  if (!iniciado) { iniciado = true; void recargar(); }
  return () => { oyentes.delete(oyente); };
}

export function useDatos(): Datos {
  return useSyncExternalStore(suscribir, () => estado, () => VACIO);
}

export function refrescarDatos(): void { void recargar(); }

// Al cerrar sesión no deben quedar en memoria los datos del club anterior.
export function reiniciarDatos(): void {
  clubRealId = null;
  convocatoriasReales = new Map();
  postulacionesReales = new Map();
  iniciado = oyentes.size > 0;
  reemplazar(VACIO);
}

export function actualizarClub(id: string, cambios: Partial<Club>): void {
  const anterior = estado.clubes.find((club) => club.id === id);
  reemplazar({ clubes: estado.clubes.map((club) => club.id === id ? { ...club, ...cambios } : club) });
  if (id !== CLUB_DEMO_ID || !clubRealId || !anterior) return;
  void (async () => {
    try {
      const datos: Record<string, unknown> = {};
      if (cambios.nombre !== undefined) datos.nombre = cambios.nombre;
      if (cambios.descripcion !== undefined) datos.descripcion = opcional(cambios.descripcion);
      if (cambios.email !== undefined) datos.email_contacto = opcional(cambios.email);
      if (cambios.telefono !== undefined) datos.telefono = opcional(cambios.telefono);
      if (cambios.instagram !== undefined) datos.redes_sociales = { instagram: instagramAGuardar(cambios.instagram) };
      if (cambios.web !== undefined) datos.sitio_web = webAGuardar(cambios.web);
      if (cambios.logoUrl !== undefined && (!cambios.logoUrl || /^https:\/\//.test(cambios.logoUrl))) datos.logo = cambios.logoUrl || null;
      // Ms-club solo acepta imágenes con dirección HTTPS: una foto recién elegida del equipo queda como vista previa.
      if (cambios.portadaUrl !== undefined && cambios.portadaUrl !== anterior.portadaUrl && (!cambios.portadaUrl || /^https:\/\//.test(cambios.portadaUrl))) datos.portada = cambios.portadaUrl || null;
      // Ubicación: solo se envía lo que cambió. La latitud y la longitud viajan siempre juntas.
      if (cambios.zona !== undefined && cambios.zona !== anterior.zona) datos.comuna = opcional(cambios.zona);
      if (cambios.direccion !== undefined && cambios.direccion !== anterior.direccion) datos.direccion = opcional(cambios.direccion);
      if ((cambios.latitud !== undefined && cambios.latitud !== anterior.latitud) || (cambios.longitud !== undefined && cambios.longitud !== anterior.longitud)) {
        datos.latitud = cambios.latitud ?? null;
        datos.longitud = cambios.longitud ?? null;
      }
      const deportes = cambios.deportes;
      if (deportes) {
        const disponibles = await listarDeportes();
        const ids = new Set(disponibles.filter((deporte) => deportes.includes(deporte.nombre)).map((deporte) => deporte.id));
        for (const deporte of disponibles) {
          const estaba = anterior.deportes.includes(deporte.nombre);
          const queda = ids.has(deporte.id);
          if (!estaba && queda) await agregarDeporte(clubRealId!, deporte.id);
          if (estaba && !queda) await quitarDeporte(clubRealId!, deporte.id);
        }
      }
      if (Object.keys(datos).length) await editarMiClub(clubRealId, datos);
      await recargar();
    } catch (error) { registrarError(error); await recargar(); }
  })();
}

// El formulario solo pide el día; Ms-club exige fecha y hora con su zona (ej. 2026-11-07T18:00:00-03:00).
function fechaConZona(dia: string): string {
  const local = new Date(`${dia}T18:00:00`);
  const minutos = -local.getTimezoneOffset();
  const signo = minutos >= 0 ? "+" : "-";
  const horas = String(Math.floor(Math.abs(minutos) / 60)).padStart(2, "0");
  const resto = String(Math.abs(minutos) % 60).padStart(2, "0");
  return `${dia}T18:00:00${signo}${horas}:${resto}`;
}

export function crearConvocatoria(d: Omit<Convocatoria, "id" | "estado">): void {
  const temporal: Convocatoria = { ...d, id: nuevoId("v"), estado: "abierta" };
  reemplazar({ convocatorias: [temporal, ...estado.convocatorias] });
  if (!clubRealId) return;
  void (async () => {
    try {
      const deportes = await listarDeportes();
      const deporte = deportes.find((item) => item.nombre === d.deporte);
      if (!deporte) throw new Error(`El deporte «${d.deporte}» no está en el catálogo.`);
      // Ms-club solo publica convocatorias de deportes que el club ofrece: si falta, se agrega.
      const propio = estado.clubes.find((club) => club.id === CLUB_DEMO_ID);
      if (propio && !propio.deportes.includes(deporte.nombre)) await agregarDeporte(clubRealId!, deporte.id);
      const creada = await publicarConvocatoria(clubRealId!, {
        deporte_id: deporte.id,
        categoria_edad: d.categoria,
        fecha_prueba: fechaConZona(d.fecha),
        requisitos: d.requisitos.split(",").map((parte) => parte.trim()).filter(Boolean),
        cupos: d.cupos,
        direccion: estado.clubes.find((club) => club.id === CLUB_DEMO_ID)?.zona || "Dirección del club",
        titulo: d.titulo,
        chat_postulantes_habilitado: d.chatPostulantes,
      });
      reemplazar({ convocatorias: estado.convocatorias.map((item) => item.id === temporal.id ? mapConvocatoria(creada, CLUB_DEMO_ID) : item) });
      convocatoriasReales.set(temporal.id, creada.id);
      await recargar();
    } catch (error) { registrarError(error); await recargar(); }
  })();
}

export function cerrarConvocatoria(id: string): void {
  reemplazar({ convocatorias: estado.convocatorias.map((convocatoria) => convocatoria.id === id ? { ...convocatoria, estado: "cerrada" } : convocatoria) });
  const real = convocatoriasReales.get(id) ?? id;
  if (!clubRealId) return;
  void cerrarEnApi(clubRealId, real).catch(async (error) => { registrarError(error); await recargar(); });
}

export function cambiarEstadoPostulante(id: string, nuevo: EstadoPostulante): string {
  const postulante = estado.postulantes.find((item) => item.id === id);
  if (!postulante) return "";
  const texto = `Se notificó a ${postulante.nombre}: su postulación pasó a "${nuevo}".`;
  reemplazar({
    postulantes: estado.postulantes.map((item) => item.id === id ? { ...item, estado: nuevo } : item),
    notificaciones: [{ id: nuevoId("n"), texto, fecha: new Date().toISOString() }, ...estado.notificaciones],
  });
  const real = postulacionesReales.get(id) ?? id;
  const estados = { Pendiente: "PENDIENTE", Preseleccionado: "PRESELECCIONADO", "En espera": "EN_ESPERA", Aceptado: "ACEPTADO", Rechazado: "RECHAZADO" } as const;
  if (nuevo !== "Pendiente") void actualizarPostulante(real, estados[nuevo]).catch(async (error) => { registrarError(error); await recargar(); });
  else { registrarError(new Error("El backend no permite volver una postulación a pendiente.")); void recargar(); }
  return texto;
}

export function emitirAviso(d: Omit<Aviso, "id" | "fecha">): void {
  const temporal: Aviso = { ...d, id: nuevoId("a"), fecha: new Date().toISOString() };
  reemplazar({ avisos: [temporal, ...estado.avisos] });
  if (!clubRealId) return;
  void (async () => {
    try {
      await publicarAviso(clubRealId!, { titulo: d.titulo, contenido: d.mensaje, audiencia: "POSTULANTES" });
      await recargar();
    } catch (error) { registrarError(error); await recargar(); }
  })();
}