// Traducción entre lo que devuelve el backend y el modelo que usan las pantallas de admin de siempre (reportes,
// sanciones, auditoría, planes y convenios). Es lógica pura: la pantalla no cambia, los nombres se resuelven aquí.
import { nombreCorto } from "./admin.mjs";

export const SIN_SOPORTE = "Esta función aún no está disponible";

// ---------- reportes ----------

export function reporteDesdeApi(r) {
  const persona = r.reportado;
  const usuarioNombre = persona ? nombreCorto(persona) : r.objetivo_nombre;
  const resuelto = r.estado !== "pendiente";
  return {
    id: r.id,
    tipo: r.tipo,
    referencia: r.tipo === "usuario" ? `Perfil de ${usuarioNombre}` : r.objetivo_nombre,
    usuarioId: persona?.user_id ?? (r.tipo === "usuario" ? r.objetivo_id : ""),
    usuarioNombre,
    motivo: r.motivo,
    detalle: r.detalle,
    emitidoPor: nombreCorto(r.reportante),
    creadoEn: r.fecha_creacion,
    // "descartado" no existe en el diseño: un reporte descartado es uno revisado sin sanción.
    estado: r.estado === "escalado" ? "escalado" : r.estado === "pendiente" ? "pendiente" : "revisado",
    resueltoEn: resuelto ? r.fecha_revision ?? undefined : undefined,
    resueltoPor: resuelto ? nombreCorto(r.revisado_por) : undefined,
    nota: resuelto ? r.motivo_revision ?? undefined : undefined,
  };
}

// ---------- sanciones ----------

export function sancionDesdeApi(s) {
  // La web dice "definitiva"; el backend, "permanente".
  const definitiva = s.tipo === "permanente" || !s.fin;
  const dias = definitiva ? null : Math.max(1, Math.round((new Date(s.fin).getTime() - new Date(s.inicio).getTime()) / 86_400_000));
  return {
    id: s.id,
    usuarioId: s.usuario.user_id,
    usuarioNombre: nombreCorto(s.usuario),
    tipo: definitiva ? "definitiva" : "temporal",
    dias,
    motivo: s.motivo,
    reporteId: s.reporte_id,
    aplicadaPor: nombreCorto(s.admin),
    aplicadaEn: s.inicio,
    terminaEn: definitiva ? null : s.fin,
    levantadaEn: s.estado === "levantada" ? s.levantada_en ?? s.inicio : undefined,
  };
}

/** Lo que la pantalla le manda al backend al sancionar: "definitiva" pasa a "permanente". */
export const tipoSancionAlBackend = (tipo) => (tipo === "definitiva" ? "permanente" : "temporal");

// ---------- auditoría ----------

export const ACCION_UI = {
  REPORT_REVIEWED: "reporte_revisado", REPORT_DISCARDED: "reporte_revisado", REPORT_ESCALATED: "reporte_revisado",
  USER_SUSPENDED: "sancion_aplicada", SANCTION_APPLIED: "sancion_aplicada",
  USER_REACTIVATED: "sancion_levantada", SANCTION_LIFTED: "sancion_levantada",
  PLAN_CREATED: "oferta_creada", PLAN_UPDATED: "oferta_editada", PLAN_DEACTIVATED: "oferta_desactivada",
  PLAN_REACTIVATED: "oferta_reactivada",
  MEMBERSHIP_UPDATED: "membresia_modificada", PAYMENT_REFUNDED: "pago_reembolsado",
};
const CAMPOS = {
  nombre: "nombre", descripcion: "descripción", precio: "precio", duracion_dias: "duración", beneficios: "beneficios",
  institucion: "institución", is_active: "estado",
};
const clp = (n) => `$${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const esNumero = (v) => typeof v === "number";

export function resumenDeAccion(e) {
  const d = e.detalle ?? {};
  const tipoOferta = d.categoria === "CONVENIO" ? "Convenio" : "Plan";
  switch (e.accion) {
    case "REPORT_REVIEWED": return "Reporte marcado como revisado";
    case "REPORT_DISCARDED": return "Reporte descartado";
    case "REPORT_ESCALATED": return "Reporte escalado a sanción";
    case "SANCTION_APPLIED":
      return d.tipo === "permanente" ? "Suspensión definitiva" : `Suspensión temporal por ${esNumero(d.dias) ? `${d.dias} ${d.dias === 1 ? "día" : "días"}` : "un tiempo"}`;
    case "SANCTION_LIFTED": return "Se devolvió el acceso a la cuenta";
    case "PLAN_CREATED": return `${tipoOferta} creado${esNumero(d.precio_nuevo) ? ` · ${d.precio_nuevo === 0 ? "Gratis" : clp(d.precio_nuevo)}` : ""}`;
    case "PLAN_UPDATED": {
      const partes = [];
      if (esNumero(d.precio_anterior) && esNumero(d.precio_nuevo) && d.precio_anterior !== d.precio_nuevo) partes.push(`precio ${clp(d.precio_anterior)} → ${clp(d.precio_nuevo)}`);
      if (typeof d.campos === "string" && d.campos) {
        const otros = d.campos.split(",").filter((c) => c !== "precio").map((c) => CAMPOS[c] ?? c);
        if (otros.length) partes.push(`cambió ${otros.join(", ")}`);
      }
      return `${tipoOferta} editado${partes.length ? ` · ${partes.join("; ")}` : ""}`;
    }
    case "PLAN_DEACTIVATED": return `${tipoOferta} quitado del catálogo`;
    case "PLAN_REACTIVATED": return `${tipoOferta} vuelve al catálogo`;
    default: return "";
  }
}

export function registroDesdeApi(e) {
  const accion = ACCION_UI[e.accion] ?? "oferta_editada";
  const base = e.recurso_tipo === "plan" ? "Plan o convenio" : e.recurso_tipo === "report" ? "Reporte" : e.recurso_tipo === "user" ? "Cuenta" : "Recurso";
  const recurso = e.afectado?.nombre ? e.afectado.nombre : e.recurso_tipo === "plan" && e.recurso_id ? `${base} N° ${e.recurso_id}` : base;
  return { id: e.id, fecha: e.fecha, admin: e.admin.nombre ?? "Cuenta eliminada", accion, resumen: resumenDeAccion(e), recurso, motivo: e.motivo ?? "" };
}

// ---------- planes y convenios ----------

export function ofertaDesdeApi(p) {
  const convenio = p.categoria === "CONVENIO";
  return {
    id: String(p.id),
    tipo: convenio ? "convenio" : "plan",
    audiencia: p.tipo === "CLUB" ? "club" : "deportista",
    nombre: p.nombre,
    institucion: convenio ? p.institucion ?? undefined : undefined,
    descripcion: p.descripcion ?? "",
    precio: p.precio,
    duracionDias: p.duracion_dias,
    beneficios: p.beneficios,
    activa: p.is_active,
    base: p.es_base || undefined,
    creadaEn: p.fecha_creacion ?? "",
    actualizadaEn: p.fecha_creacion ?? "",
    desactivadaEn: p.fecha_desactivacion ?? undefined,
    motivoDesactivacion: p.motivo_desactivacion ?? undefined,
  };
}

/** Una fila de la tabla de suscripciones de la pantalla de planes. */
export function suscripcionDesdeApi(s, ofertaId) {
  return {
    id: s.id,
    ofertaId: String(ofertaId),
    ofertaNombre: s.plan_nombre,
    suscriptor: s.suscriptor ?? "Cuenta eliminada",
    precioPagado: s.precio_pagado,
    inicio: s.fecha_inicio,
    fin: s.fecha_fin,
  };
}

export const audienciaAlBackend = (audiencia) => (audiencia === "club" ? "CLUB" : "USUARIO");
export const tipoOfertaAlBackend = (tipo) => (tipo === "convenio" ? "CONVENIO" : "PLAN");

export function limpiarOferta(d) {
  const beneficios = d.beneficios.map((b) => b.trim()).filter((b, i, todos) => b !== "" && todos.indexOf(b) === i);
  return { ...d, nombre: d.nombre.trim(), institucion: d.institucion.trim(), descripcion: d.descripcion.trim(), beneficios };
}

/** Las mismas reglas y mensajes de siempre del formulario de planes y convenios. */
export function validarOferta(d) {
  if (d.nombre.length < 3 || d.nombre.length > 60) return "El nombre debe tener entre 3 y 60 letras.";
  if (d.tipo === "convenio" && (d.institucion.length < 3 || d.institucion.length > 80)) {
    return "Indica la institución del convenio (entre 3 y 80 letras).";
  }
  if (d.descripcion.length > 200) return "La descripción puede tener hasta 200 letras.";
  if (!Number.isInteger(d.precio) || d.precio < 0 || d.precio > 1_000_000) {
    return "El precio debe ser un monto entero en pesos, entre $0 y $1.000.000.";
  }
  if (d.duracionDias === null) {
    if (d.precio > 0) return "Un plan de pago necesita una duración (entre 1 y 365 días).";
  } else if (!Number.isInteger(d.duracionDias) || d.duracionDias < 1 || d.duracionDias > 365) {
    return "La duración debe ser de 1 a 365 días.";
  }
  if (d.beneficios.length < 1) return "Agrega al menos un beneficio.";
  if (d.beneficios.length > 10) return "Puedes agregar hasta 10 beneficios.";
  if (d.beneficios.some((b) => b.length > 80)) return "Cada beneficio puede tener hasta 80 letras.";
  return null;
}
