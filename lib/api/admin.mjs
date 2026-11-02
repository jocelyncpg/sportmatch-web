// Lógica pura (sin red) de los clientes de administración: HU-45 sanciones, HU-47 reportes, HU-48 auditoría y
// HU-56 planes y convenios. Está en .mjs para poder probarla con node:test; los clientes (reportes.ts, sanciones.ts,
// auditoria.ts, planesAdmin.ts) la usan y llaman al gateway por /api/gw/ con apiGw.

const CONTROL = /[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const LIMITES = {
  motivoMin: 3, motivoMax: 300, diasMin: 1, diasMax: 365,
  nombreMin: 3, nombreMax: 60, descripcionMax: 255, institucionMin: 3, institucionMax: 80,
  precioMax: 10_000_000, duracionMin: 1, duracionMax: 366, beneficiosMax: 10, beneficioMin: 3, beneficioMax: 120,
  paginaMax: 100,
};

const NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'&()/:+%-]*$/;

function texto(valor, etiqueta, min, max) {
  const t = typeof valor === "string" ? valor.trim() : "";
  if (CONTROL.test(t)) throw new Error(`${etiqueta} contiene caracteres no permitidos.`);
  if (t.length < min) throw new Error(`${etiqueta} debe tener al menos ${min} caracteres.`);
  if (t.length > max) throw new Error(`${etiqueta} no puede superar ${max} caracteres.`);
  return t;
}

/** Motivo opcional (reportes, planes): vacío = no se envía; si se escribe, de 3 a 300 caracteres. */
export function motivoOpcional(valor) {
  const t = typeof valor === "string" ? valor.trim() : "";
  return t ? texto(t, "El motivo", LIMITES.motivoMin, LIMITES.motivoMax) : undefined;
}

// -- Etiquetas legibles (auditoría) ----------------------------------------------------------------------------

export const ETIQUETA_ACCION = {
  REPORT_REVIEWED: "Reporte revisado",
  REPORT_DISCARDED: "Reporte descartado",
  REPORT_ESCALATED: "Reporte escalado a sanción",
  USER_SUSPENDED: "Cuenta suspendida",
  USER_REACTIVATED: "Cuenta reactivada",
  SANCTION_APPLIED: "Sanción aplicada",
  SANCTION_LIFTED: "Sanción levantada",
  PLAN_CREATED: "Plan o convenio creado",
  PLAN_UPDATED: "Plan o convenio editado",
  PLAN_DEACTIVATED: "Plan o convenio desactivado",
  PLAN_REACTIVATED: "Plan o convenio reactivado",
  MEMBERSHIP_UPDATED: "Membresía modificada",
  PAYMENT_REFUNDED: "Pago reembolsado",
};
export const ETIQUETA_RECURSO = {
  user: "Cuenta", report: "Reporte", plan: "Plan o convenio", membership: "Membresía", payment: "Pago",
  club: "Club", activity: "Actividad", message: "Mensaje",
};
export const etiquetaAccion = (accion) => ETIQUETA_ACCION[accion] ?? "Acción administrativa";
export const etiquetaRecurso = (tipo) => (tipo ? ETIQUETA_RECURSO[tipo] ?? "Otro" : "—");
export const ETIQUETA_RESULTADO = { success: "Correcto", failure: "Fallido" };

// -- Consultas (query string) ------------------------------------------------------------------------------------

function query(pares) {
  const params = new URLSearchParams();
  for (const [clave, valor] of pares) if (valor !== undefined && valor !== null && valor !== "") params.set(clave, String(valor));
  const t = params.toString();
  return t ? `?${t}` : "";
}

export const queryReportes = (f = {}) => query([["estado", f.estado], ["limit", f.limit], ["pagina", f.pagina]]);
export const querySanciones = (f = {}) => query([["estado", f.estado], ["usuario_id", f.usuarioId], ["limit", f.limit], ["pagina", f.pagina]]);
export const queryPlanes = (f = {}) => query([["estado", f.estado], ["tipo", f.tipo], ["categoria", f.categoria], ["limit", f.limit], ["pagina", f.pagina]]);

/** Fecha de un <input type="date"> (AAAA-MM-DD) a un instante ISO con zona. `fin` = el último instante del día. */
export function fechaAIso(aaaammdd, fin = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(aaaammdd ?? "")) return undefined;
  const d = new Date(`${aaaammdd}T${fin ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function queryAuditoria(f = {}) {
  return query([
    ["desde", f.desde], ["hasta", f.hasta], ["admin_id", f.adminId], ["accion", f.accion],
    ["recurso_tipo", f.recursoTipo], ["resultado", f.resultado], ["pagina", f.pagina], ["por_pagina", f.porPagina],
  ]);
}

// -- Reportes (HU-47) ---------------------------------------------------------------------------------------------

/** Transiciones válidas; el backend responde 409 fuera de ellas. */
export const TRANSICIONES = { pendiente: ["revisado", "descartado", "escalado"], revisado: ["escalado"], descartado: [], escalado: [] };
export const ETIQUETA_ESTADO_REPORTE = {
  pendiente: "Pendiente", revisado: "Revisado", descartado: "Descartado", escalado: "Escalado a sanción",
};

/** La API de reportes no devuelve el total: si llegan tantos como el límite, puede haber otra página. */
export const hayMasPaginas = (recibidos, limite) => recibidos >= limite;

export function cuerpoRevision(estado, motivo) {
  if (!["revisado", "descartado", "escalado"].includes(estado)) throw new Error("Elige una decisión para el reporte.");
  const m = motivoOpcional(motivo);
  return m ? { estado, motivo: m } : { estado };
}

/** Nombre corto de una persona de la API ("Ana T."). Nunca correo, RUT ni foto. */
export function nombreCorto(persona) {
  if (!persona) return "Cuenta eliminada";
  const inicial = persona.apellido_inicial ? ` ${persona.apellido_inicial}${persona.apellido_inicial.endsWith(".") ? "" : "."}` : "";
  return `${persona.nombre ?? ""}${inicial}`.trim() || "Sin nombre";
}

// -- Sanciones (HU-45) ----------------------------------------------------------------------------------------------

export const ETIQUETA_TIPO_SANCION = { temporal: "Temporal", permanente: "Permanente" };

export function cuerpoSancion({ usuarioId, tipo, dias, motivo, reporteId }) {
  if (!UUID.test(usuarioId ?? "")) throw new Error("No se pudo identificar a la cuenta que se va a sancionar.");
  if (tipo !== "temporal" && tipo !== "permanente") throw new Error("Elige si la suspensión es temporal o permanente.");
  const cuerpo = { usuario_id: usuarioId, tipo, motivo: texto(motivo, "El motivo", LIMITES.motivoMin, LIMITES.motivoMax) };
  if (tipo === "temporal") {
    const n = Number(dias);
    if (!Number.isInteger(n) || n < LIMITES.diasMin || n > LIMITES.diasMax) {
      throw new Error(`La duración debe ser un número entero de ${LIMITES.diasMin} a ${LIMITES.diasMax} días.`);
    }
    cuerpo.dias = n;
  }
  if (reporteId) {
    if (!UUID.test(reporteId)) throw new Error("El reporte indicado no es válido.");
    cuerpo.reporte_id = reporteId;
  }
  return cuerpo;
}

export function cuerpoLevantamiento(motivo) {
  return { motivo: texto(motivo, "El motivo", LIMITES.motivoMin, LIMITES.motivoMax) };
}

/** Texto de la duración de una sanción de la API. */
export function textoSancion(s) {
  return s.tipo === "permanente" || !s.fin ? "Permanente" : "Temporal";
}

// -- Planes y convenios (HU-56) -------------------------------------------------------------------------------------

export const ETIQUETA_CATEGORIA = { PLAN: "Plan", CONVENIO: "Convenio" };
export const ETIQUETA_TIPO_PLAN = { USUARIO: "Deportistas", CLUB: "Clubes" };

export const formatearCLP = (monto) => `$${String(Math.round(Number(monto) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
export const textoPrecio = (precio) => (precio === 0 ? "Gratis" : formatearCLP(precio));

export function duracionTexto(dias) {
  if (dias === 365 || dias === 366) return "1 año";
  if (dias % 30 === 0 && dias <= 360) return dias === 30 ? "1 mes" : `${dias / 30} meses`;
  return dias === 1 ? "1 día" : `${dias} días`;
}

/** "uno\nmás" → ["uno", "más"] (sin líneas vacías). */
export const separarBeneficios = (texto_) => String(texto_ ?? "").split(/\r?\n/).map((b) => b.trim()).filter(Boolean);

function validarPlan(datos) {
  const nombre = texto(datos.nombre, "El nombre", LIMITES.nombreMin, LIMITES.nombreMax);
  if (!NOMBRE.test(nombre)) throw new Error("El nombre tiene caracteres no permitidos.");
  if (!Number.isInteger(datos.precio) || datos.precio < 0 || datos.precio > LIMITES.precioMax) {
    throw new Error(`El precio es un número entero de pesos, de 0 a ${formatearCLP(LIMITES.precioMax)}.`);
  }
  // Sin duración = sin vencimiento: solo un plan gratis.
  if (datos.duracionDias === null) {
    if (datos.precio > 0) throw new Error(`Un plan de pago necesita una duración (de ${LIMITES.duracionMin} a ${LIMITES.duracionMax} días).`);
  } else if (!Number.isInteger(datos.duracionDias) || datos.duracionDias < LIMITES.duracionMin || datos.duracionDias > LIMITES.duracionMax) {
    throw new Error(`La duración debe ser de ${LIMITES.duracionMin} a ${LIMITES.duracionMax} días.`);
  }
  const beneficios = (datos.beneficios ?? []).map((b) => texto(b, "Cada beneficio", LIMITES.beneficioMin, LIMITES.beneficioMax));
  if (beneficios.length > LIMITES.beneficiosMax) throw new Error(`Puedes poner hasta ${LIMITES.beneficiosMax} beneficios.`);
  if (new Set(beneficios.map((b) => b.toLowerCase())).size !== beneficios.length) throw new Error("Hay beneficios repetidos.");
  const descripcion = typeof datos.descripcion === "string" ? datos.descripcion.trim() : "";
  if (descripcion.length > LIMITES.descripcionMax) throw new Error(`La descripción no puede superar ${LIMITES.descripcionMax} caracteres.`);
  if (descripcion && CONTROL.test(descripcion)) throw new Error("La descripción contiene caracteres no permitidos.");
  const institucion = typeof datos.institucion === "string" ? datos.institucion.trim() : "";
  if (institucion) {
    texto(institucion, "La institución", LIMITES.institucionMin, LIMITES.institucionMax);
    if (!NOMBRE.test(institucion)) throw new Error("La institución tiene caracteres no permitidos.");
  }
  return { nombre, beneficios, descripcion, institucion };
}

export function cuerpoPlanNuevo(datos) {
  if (!["USUARIO", "CLUB"].includes(datos.tipo)) throw new Error("Elige para quién es.");
  const categoria = datos.categoria === "CONVENIO" ? "CONVENIO" : "PLAN";
  const v = validarPlan(datos);
  const cuerpo = { nombre: v.nombre, tipo: datos.tipo, categoria, precio: datos.precio, duracion_dias: datos.duracionDias, beneficios: v.beneficios };
  if (v.descripcion) cuerpo.descripcion = v.descripcion;
  if (v.institucion) {
    if (categoria !== "CONVENIO") throw new Error("Solo un convenio tiene institución.");
    cuerpo.institucion = v.institucion;
  }
  const motivo = motivoOpcional(datos.motivo);
  if (motivo) cuerpo.motivo = motivo;
  return cuerpo;
}

/** Cambios de un plan activo: solo lo que difiere del original. El tipo y la categoría no se editan. */
export function cuerpoPlanCambios(original, datos) {
  const v = validarPlan(datos);
  const cuerpo = {};
  if (v.nombre !== original.nombre) cuerpo.nombre = v.nombre;
  if ((v.descripcion || null) !== (original.descripcion ?? null)) cuerpo.descripcion = v.descripcion || null;
  if (datos.precio !== original.precio) cuerpo.precio = datos.precio;
  if (datos.duracionDias !== original.duracion_dias) cuerpo.duracion_dias = datos.duracionDias;
  if (JSON.stringify(v.beneficios) !== JSON.stringify(original.beneficios ?? [])) cuerpo.beneficios = v.beneficios;
  if (original.categoria === "CONVENIO" && (v.institucion || null) !== (original.institucion ?? null)) cuerpo.institucion = v.institucion || null;
  if (Object.keys(cuerpo).length === 0) throw new Error("No hay cambios para guardar.");
  const motivo = motivoOpcional(datos.motivo);
  if (motivo) cuerpo.motivo = motivo;
  return cuerpo;
}

export function cuerpoDesactivacion(motivo) {
  const m = motivoOpcional(motivo);
  return m ? { motivo: m } : {};
}

export const cuerpoReactivacion = cuerpoDesactivacion;
