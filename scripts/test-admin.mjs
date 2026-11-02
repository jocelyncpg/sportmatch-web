import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  ETIQUETA_ACCION, cuerpoReactivacion, cuerpoDesactivacion, cuerpoLevantamiento, cuerpoPlanCambios, cuerpoPlanNuevo, cuerpoRevision, cuerpoSancion,
  duracionTexto, etiquetaAccion, etiquetaRecurso, fechaAIso, formatearCLP, hayMasPaginas, motivoOpcional, nombreCorto,
  queryAuditoria, queryPlanes, queryReportes, querySanciones, separarBeneficios, textoPrecio, TRANSICIONES,
} from "../lib/api/admin.mjs";
import {
  SIN_SOPORTE, limpiarOferta, ofertaDesdeApi, registroDesdeApi, reporteDesdeApi, sancionDesdeApi, suscripcionDesdeApi, tipoSancionAlBackend,
  validarOferta,
} from "../lib/api/mapeo-admin.mjs";

const ID = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";

test("las consultas solo envían lo que tiene valor y respetan los nombres del backend", () => {
  assert.equal(queryReportes({ estado: "pendiente", pagina: 2, limit: 50 }), "?estado=pendiente&limit=50&pagina=2");
  assert.equal(queryReportes({}), "");
  assert.equal(querySanciones({ estado: "activa", usuarioId: ID, limit: 50, pagina: 1 }), `?estado=activa&usuario_id=${ID}&limit=50&pagina=1`);
  assert.equal(queryPlanes({ estado: "activo", categoria: "CONVENIO", limit: 1 }), "?estado=activo&categoria=CONVENIO&limit=1");
  assert.equal(queryAuditoria({ adminId: ID, accion: "PLAN_UPDATED", recursoTipo: "plan", resultado: "success", pagina: 3, porPagina: 25 }),
    `?admin_id=${ID}&accion=PLAN_UPDATED&recurso_tipo=plan&resultado=success&pagina=3&por_pagina=25`);
  assert.equal(queryAuditoria({ desde: "", hasta: undefined }), "");
});

test("las fechas de los filtros pasan a instantes ISO con zona (el día completo)", () => {
  const desde = fechaAIso("2026-11-02");
  const hasta = fechaAIso("2026-11-02", true);
  assert.match(desde, /Z$/);
  assert.ok(new Date(hasta) > new Date(desde));
  assert.equal(new Date(hasta) - new Date(desde), 24 * 3600 * 1000 - 1);
  assert.equal(fechaAIso(""), undefined);
  assert.equal(fechaAIso("02-11-2026"), undefined);
  assert.equal(fechaAIso("2026-13-45"), undefined);
});

test("reportes: la paginación sin total usa 'hay más' cuando llegan tantos como el límite", () => {
  assert.equal(hayMasPaginas(50, 50), true);
  assert.equal(hayMasPaginas(49, 50), false);
  assert.equal(hayMasPaginas(0, 50), false);
  assert.deepEqual(TRANSICIONES.pendiente, ["revisado", "descartado", "escalado"]);
  assert.deepEqual(TRANSICIONES.revisado, ["escalado"]);
  assert.deepEqual(TRANSICIONES.descartado, []);
  assert.deepEqual(TRANSICIONES.escalado, []);
});

test("reportes: la decisión lleva el motivo solo si se escribió, y se valida", () => {
  assert.deepEqual(cuerpoRevision("revisado"), { estado: "revisado" });
  assert.deepEqual(cuerpoRevision("descartado", "   "), { estado: "descartado" });
  assert.deepEqual(cuerpoRevision("escalado", "  Reincidente  "), { estado: "escalado", motivo: "Reincidente" });
  assert.throws(() => cuerpoRevision("pendiente"), /decisión/);
  assert.throws(() => cuerpoRevision("revisado", "ab"), /al menos 3/);
  assert.throws(() => cuerpoRevision("revisado", "x".repeat(301)), /300/);
  assert.throws(() => cuerpoRevision("revisado", "con\u0000nul"), /no permitidos/);
  assert.throws(() => cuerpoRevision("revisado", "mal\ud800"), /no permitidos/);
});

test("los nombres vienen cortos ('Ana T.') y una cuenta eliminada se dice sin inventar datos", () => {
  assert.equal(nombreCorto({ nombre: "Ana", apellido_inicial: "T" }), "Ana T.");
  assert.equal(nombreCorto({ nombre: "Ana", apellido_inicial: "T." }), "Ana T.");
  assert.equal(nombreCorto({ nombre: "Ana", apellido_inicial: "" }), "Ana");
  assert.equal(nombreCorto(null), "Cuenta eliminada");
});

test("sanciones: temporal lleva días, permanente no, y las reglas se revisan antes de enviar", () => {
  assert.deepEqual(cuerpoSancion({ usuarioId: ID, tipo: "temporal", dias: "7", motivo: "  Acoso reiterado " }),
    { usuario_id: ID, tipo: "temporal", motivo: "Acoso reiterado", dias: 7 });
  assert.deepEqual(cuerpoSancion({ usuarioId: ID, tipo: "permanente", dias: 30, motivo: "Conducta grave", reporteId: ID }),
    { usuario_id: ID, tipo: "permanente", motivo: "Conducta grave", reporte_id: ID });
  for (const mala of [
    { tipo: "definitiva" }, { tipo: "temporal", dias: 0 }, { tipo: "temporal", dias: 366 }, { tipo: "temporal", dias: 1.5 },
    { tipo: "temporal", dias: "abc" }, { tipo: "temporal", dias: null }, { motivo: "ab" }, { motivo: "  " },
    { motivo: "x".repeat(301) }, { motivo: "nul\u0000" }, { usuarioId: "no-uuid" }, { reporteId: "no-uuid" },
  ]) {
    assert.throws(() => cuerpoSancion({ usuarioId: ID, tipo: "temporal", dias: 7, motivo: "Motivo válido", ...mala }), Error, JSON.stringify(mala));
  }
  assert.deepEqual(cuerpoLevantamiento(" Apelación aceptada "), { motivo: "Apelación aceptada" });
  assert.throws(() => cuerpoLevantamiento("ab"), Error);
});

const PLAN = { nombre: "Pro Mensual", tipo: "USUARIO", precio: 4990, duracionDias: 30, beneficios: ["Actividades sin límite"], descripcion: "Para quien entrena" };

test("planes: crea el cuerpo con categoría, precio entero y beneficios; la institución solo en convenios", () => {
  assert.deepEqual(cuerpoPlanNuevo(PLAN), {
    nombre: "Pro Mensual", tipo: "USUARIO", categoria: "PLAN", precio: 4990, duracion_dias: 30,
    beneficios: ["Actividades sin límite"], descripcion: "Para quien entrena",
  });
  assert.deepEqual(cuerpoPlanNuevo({ ...PLAN, nombre: "Convenio DuocUC", tipo: "CLUB", categoria: "CONVENIO", institucion: " DuocUC ", precio: 0, motivo: "Firmado hoy", beneficios: [], descripcion: "" }), {
    nombre: "Convenio DuocUC", tipo: "CLUB", categoria: "CONVENIO", precio: 0, duracion_dias: 30, beneficios: [], institucion: "DuocUC", motivo: "Firmado hoy",
  });
  assert.throws(() => cuerpoPlanNuevo({ ...PLAN, institucion: "DuocUC" }), /Solo un convenio/);
});

test("planes: rechaza precios, duraciones, nombres y beneficios fuera de las reglas", () => {
  for (const mala of [
    { nombre: "ab" }, { nombre: "x".repeat(61) }, { nombre: "a@b.cl" }, { nombre: "Plan <b>" }, { nombre: "Plan\u0000" }, { nombre: "Plan\ud800" },
    { precio: -1 }, { precio: 49.9 }, { precio: NaN }, { precio: Infinity }, { precio: 10_000_001 }, { precio: "4990" },
    { duracionDias: 0 }, { duracionDias: 367 }, { duracionDias: 1.5 }, { duracionDias: NaN },
    { beneficios: Array.from({ length: 11 }, (_, i) => `Beneficio ${i}`) }, { beneficios: ["ab"] }, { beneficios: ["x".repeat(121)] },
    { beneficios: ["Igual", "igual"] }, { descripcion: "d".repeat(256) }, { tipo: "ADMIN" }, { motivo: "ab" },
  ]) {
    assert.throws(() => cuerpoPlanNuevo({ ...PLAN, ...mala }), Error, JSON.stringify(mala));
  }
  assert.equal(cuerpoPlanNuevo({ ...PLAN, precio: 10_000_000, duracionDias: 366 }).precio, 10_000_000);
});

test("planes: editar envía solo lo que cambió, nunca tipo ni categoría, y avisa si no hay cambios", () => {
  const original = { id: 7, nombre: "Pro Mensual", tipo: "USUARIO", categoria: "PLAN", descripcion: "Para quien entrena", precio: 4990, duracion_dias: 30, beneficios: ["Actividades sin límite"], institucion: null };
  assert.deepEqual(cuerpoPlanCambios(original, { ...PLAN, precio: 9990, motivo: " Alza " }), { precio: 9990, motivo: "Alza" });
  assert.deepEqual(cuerpoPlanCambios(original, { ...PLAN, descripcion: "", beneficios: ["Uno", "Dos"] }), { descripcion: null, beneficios: ["Uno", "Dos"] });
  assert.throws(() => cuerpoPlanCambios(original, PLAN), /No hay cambios/);
  const cambios = cuerpoPlanCambios(original, { ...PLAN, tipo: "CLUB", categoria: "CONVENIO", precio: 5000 });
  assert.equal("tipo" in cambios, false);
  assert.equal("categoria" in cambios, false);
  const convenio = { ...original, categoria: "CONVENIO", institucion: "DuocUC" };
  assert.deepEqual(cuerpoPlanCambios(convenio, { ...PLAN, institucion: "Inacap" }), { institucion: "Inacap" });
  assert.deepEqual(cuerpoPlanCambios(convenio, { ...PLAN, institucion: "" }), { institucion: null });
  assert.equal("institucion" in cuerpoPlanCambios(original, { ...PLAN, institucion: "DuocUC", precio: 1 }), false);
  assert.deepEqual(cuerpoDesactivacion(), {});
  assert.deepEqual(cuerpoDesactivacion(" Fin de temporada "), { motivo: "Fin de temporada" });
  assert.throws(() => cuerpoDesactivacion("ab"), Error);
});

test("formato de precio, duración y beneficios", () => {
  assert.equal(formatearCLP(4990), "$4.990");
  assert.equal(formatearCLP(10_000_000), "$10.000.000");
  assert.equal(textoPrecio(0), "Gratis");
  assert.equal(duracionTexto(30), "1 mes");
  assert.equal(duracionTexto(90), "3 meses");
  assert.equal(duracionTexto(365), "1 año");
  assert.equal(duracionTexto(7), "7 días");
  assert.equal(duracionTexto(1), "1 día");
  assert.deepEqual(separarBeneficios("uno\r\n\n  dos  \n"), ["uno", "dos"]);
  assert.equal(motivoOpcional("  "), undefined);
});

test("la auditoría muestra etiquetas legibles para todas las acciones del catálogo y nunca el código crudo", () => {
  assert.equal(Object.keys(ETIQUETA_ACCION).length, 13);
  for (const accion of Object.keys(ETIQUETA_ACCION)) assert.doesNotMatch(etiquetaAccion(accion), /^[A-Z_]+$/);
  assert.equal(etiquetaAccion("PLAN_UPDATED"), "Plan o convenio editado");
  assert.equal(etiquetaAccion("ACCION_NUEVA"), "Acción administrativa");
  assert.equal(etiquetaRecurso("plan"), "Plan o convenio");
  assert.equal(etiquetaRecurso(null), "—");
});

// -- Las pantallas de admin ---------------------------------------------------------------------------------------

const PANTALLAS = ["reportes", "sanciones", "auditoria", "planes"].map((p) => `../app/(panel)/${p}/page.tsx`);
const COMPONENTES = ["../components/FormSancion.tsx", "../components/FormOferta.tsx", "../lib/api/moderacion.ts", "../lib/api/ofertas.ts"];
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

test("las pantallas de admin no usan datos simulados, almacenamiento del navegador ni HTML crudo", () => {
  for (const ruta of [...PANTALLAS, ...COMPONENTES]) {
    const fuente = leer(ruta);
    assert.doesNotMatch(fuente, /\.mock["']/, ruta);
    assert.doesNotMatch(fuente, /localStorage|sessionStorage/, ruta);
    assert.doesNotMatch(fuente, /dangerouslySetInnerHTML|innerHTML/, ruta);
    assert.doesNotMatch(fuente, /document\.cookie|Authorization|Bearer/i, ruta);
  }
});

test("cada pantalla de admin está protegida con SoloRol admin y la auditoría es solo de lectura", () => {
  for (const ruta of PANTALLAS) assert.match(leer(ruta), /<SoloRol roles=\{\["admin"\]\}>/, ruta);
  const auditoria = leer("../app/(panel)/auditoria/page.tsx");
  assert.doesNotMatch(auditoria, /method:\s*["'](POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(auditoria, />\s*(Editar|Borrar|Eliminar)\b/);
});

test("ningún archivo de la web importa los mocks de moderación ni de planes (ya no existen)", () => {
  const archivos = [];
  const recorrer = (dir) => {
    for (const e of readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) recorrer(`${dir}${e.name}/`);
      else if (/\.(ts|tsx|mjs)$/.test(e.name)) archivos.push(`${dir}${e.name}`);
    }
  };
  for (const dir of ["../app/", "../components/", "../lib/"]) recorrer(dir);
  for (const ruta of archivos) assert.doesNotMatch(leer(ruta), /moderacion\.mock|planes\.mock/, ruta);
});

// -- Traducción entre el backend y el modelo de las pantallas (el diseño no cambia) ------------------------------------

test("sanciones: la web dice 'definitiva' y el backend 'permanente', en los dos sentidos", () => {
  assert.equal(tipoSancionAlBackend("definitiva"), "permanente");
  assert.equal(tipoSancionAlBackend("temporal"), "temporal");
  const base = { id: "s1", usuario: { user_id: ID, nombre: "Ana", apellido_inicial: "T" }, admin: { nombre: "Admin", apellido_inicial: "" },
    motivo: "Acoso", reporte_id: null, inicio: "2026-11-02T10:00:00Z", estado: "activa" };
  const perm = sancionDesdeApi({ ...base, tipo: "permanente", fin: null });
  assert.equal(perm.tipo, "definitiva");
  assert.equal(perm.dias, null);
  assert.equal(perm.terminaEn, null);
  const temp = sancionDesdeApi({ ...base, tipo: "temporal", fin: "2026-11-09T10:00:00Z" });
  assert.equal(temp.tipo, "temporal");
  assert.equal(temp.dias, 7);
  assert.equal(sancionDesdeApi({ ...base, tipo: "temporal", fin: "2026-11-09T10:00:00Z", estado: "levantada", levantada_en: "2026-11-03T00:00:00Z" }).levantadaEn, "2026-11-03T00:00:00Z");
});

test("reportes: descartado cuenta como revisado y una actividad o mensaje no trae cuenta que sancionar", () => {
  const r = { id: "r1", tipo: "usuario", objetivo_id: ID, objetivo_nombre: "Ana T.", reportado: { user_id: ID, nombre: "Ana", apellido_inicial: "T" },
    reportante: { nombre: "Luis", apellido_inicial: "P" }, motivo: "Spam", detalle: "", fecha_creacion: "2026-11-02T10:00:00Z", estado: "descartado", fecha_revision: "2026-11-02T11:00:00Z" };
  assert.equal(reporteDesdeApi(r).estado, "revisado");
  assert.equal(reporteDesdeApi({ ...r, estado: "escalado" }).estado, "escalado");
  assert.equal(reporteDesdeApi({ ...r, estado: "pendiente" }).resueltoEn, undefined);
  assert.equal(reporteDesdeApi({ ...r, tipo: "mensaje", reportado: null, objetivo_id: "m1" }).usuarioId, "");
  assert.equal(SIN_SOPORTE, "Esta función aún no está disponible");
});

test("auditoría: cada acción del backend cae en una etiqueta del diseño y nunca queda vacía", () => {
  const e = (accion, detalle = null) => registroDesdeApi({ id: "a", fecha: "2026-11-02T10:00:00Z", accion, admin: { nombre: "Admin" }, recurso_tipo: "plan", recurso_id: "7", afectado: null, motivo: null, detalle });
  assert.equal(e("SANCTION_APPLIED").accion, "sancion_aplicada");
  assert.equal(e("USER_REACTIVATED").accion, "sancion_levantada");
  assert.equal(e("REPORT_DISCARDED").accion, "reporte_revisado");
  assert.equal(e("PLAN_DEACTIVATED").accion, "oferta_desactivada");
  assert.equal(e("PLAN_UPDATED", { precio_anterior: 1000, precio_nuevo: 2000 }).resumen, "Plan editado · precio $1.000 → $2.000");
  assert.equal(e("SANCTION_APPLIED", { tipo: "permanente" }).resumen, "Suspensión definitiva");
  assert.equal(e("PLAN_CREATED").recurso, "Plan o convenio N° 7");
});

test("planes: categoria y tipo del backend se traducen a plan/convenio y deportista/club, con las reglas de siempre", () => {
  const p = { id: 7, nombre: "Pro", tipo: "CLUB", categoria: "CONVENIO", institucion: "DuocUC", descripcion: null, precio: 0, duracion_dias: 30,
    beneficios: ["Uno"], is_active: false, suscripciones_vigentes: 3, fecha_creacion: "2026-11-01T00:00:00Z" };
  const o = ofertaDesdeApi(p);
  assert.deepEqual([o.id, o.tipo, o.audiencia, o.institucion, o.activa, o.base, o.desactivadaEn, o.motivoDesactivacion], ["7", "convenio", "club", "DuocUC", false, undefined, undefined, undefined]);
  const retirado = ofertaDesdeApi({ ...p, es_base: true, fecha_desactivacion: "2026-11-02T10:00:00Z", motivo_desactivacion: "Fin del convenio" });
  assert.deepEqual([retirado.base, retirado.desactivadaEn, retirado.motivoDesactivacion], [true, "2026-11-02T10:00:00Z", "Fin del convenio"]);
  assert.equal(ofertaDesdeApi({ ...p, categoria: "PLAN", tipo: "USUARIO" }).institucion, undefined);
  const d = limpiarOferta({ tipo: "plan", audiencia: "club", nombre: " Pro ", institucion: "", descripcion: "", precio: 1000, duracionDias: 30, beneficios: [" a ", "a", ""] });
  assert.deepEqual(d.beneficios, ["a"]);
  assert.equal(validarOferta(d), null);
  assert.equal(validarOferta({ ...d, nombre: "ab" }), "El nombre debe tener entre 3 y 60 letras.");
  assert.equal(validarOferta({ ...d, tipo: "convenio" }), "Indica la institución del convenio (entre 3 y 80 letras).");
  assert.equal(validarOferta({ ...d, precio: 5, duracionDias: null }), "Un plan de pago necesita una duración (entre 1 y 365 días).");
});

test("planes: una suscripción del backend se muestra con el nombre al contratar, el precio pagado y las fechas", () => {
  const s = { id: "s1", suscriptor: "Ana T.", tipo_suscriptor: "USUARIO", estado: "ACTIVE", plan_nombre: "Pro Mensual", precio_pagado: 4990,
    fecha_inicio: "2026-11-01T00:00:00Z", fecha_fin: "2026-12-01T00:00:00Z" };
  assert.deepEqual(suscripcionDesdeApi(s, 7), { id: "s1", ofertaId: "7", ofertaNombre: "Pro Mensual", suscriptor: "Ana T.", precioPagado: 4990,
    inicio: "2026-11-01T00:00:00Z", fin: "2026-12-01T00:00:00Z" });
  assert.equal(suscripcionDesdeApi({ ...s, suscriptor: null }, 7).suscriptor, "Cuenta eliminada");
});

test("auditoría: reactivar un plan cae en la etiqueta 'oferta_reactivada' del diseño", () => {
  const e = registroDesdeApi({ id: "a", fecha: "2026-11-02T10:00:00Z", accion: "PLAN_REACTIVATED", admin: { nombre: "Admin" }, recurso_tipo: "plan",
    recurso_id: "7", afectado: null, motivo: "Vuelve la oferta", detalle: { categoria: "CONVENIO" } });
  assert.deepEqual([e.accion, e.resumen, etiquetaAccion("PLAN_REACTIVATED")], ["oferta_reactivada", "Convenio vuelve al catálogo", "Plan o convenio reactivado"]);
});

test("planes: sin duración (sin vencimiento) vale solo si el plan es gratis, también al armar lo que se envía", () => {
  const base = { tipo: "USUARIO", nombre: "Gratis siempre", precio: 0, duracionDias: null, beneficios: ["Chat con tus matches"] };
  assert.equal(cuerpoPlanNuevo(base).duracion_dias, null);
  assert.throws(() => cuerpoPlanNuevo({ ...base, precio: 4990 }), /necesita una duración/);
  assert.equal(validarOferta({ tipo: "plan", audiencia: "deportista", nombre: "Gratis siempre", institucion: "", descripcion: "", precio: 0, duracionDias: null, beneficios: ["Uno"] }), null);
  const original = { nombre: "Gratis siempre", descripcion: null, precio: 0, duracion_dias: null, beneficios: ["Chat con tus matches"], categoria: "PLAN" };
  assert.deepEqual(cuerpoPlanCambios(original, { ...base, duracionDias: 30 }), { duracion_dias: 30 });
  assert.deepEqual(cuerpoReactivacion(), {});
  assert.deepEqual(cuerpoReactivacion(" Vuelve la oferta "), { motivo: "Vuelve la oferta" });
});

test("reportes: quién lo resolvió y la nota vienen del backend, y un reporte de actividad o mensaje trae la cuenta del autor", () => {
  const base = { id: "r1", tipo: "actividad", objetivo_id: ID, objetivo_nombre: "Running en el parque", reportado: { user_id: ID, nombre: "Beto", apellido_inicial: "T." },
    autor_no_disponible: false, reportante: { nombre: "Luis", apellido_inicial: "P" }, motivo: "Spam o publicidad", detalle: "", fecha_creacion: "2026-11-02T10:00:00Z",
    estado: "pendiente", fecha_revision: null, revisado_por: null, motivo_revision: null };
  const pendiente = reporteDesdeApi(base);
  assert.deepEqual([pendiente.usuarioId, pendiente.usuarioNombre, pendiente.referencia], [ID, "Beto T.", "Running en el parque"]);
  assert.deepEqual([pendiente.resueltoPor, pendiente.resueltoEn, pendiente.nota], [undefined, undefined, undefined]);
  const resuelto = reporteDesdeApi({ ...base, tipo: "mensaje", estado: "revisado", fecha_revision: "2026-11-02T11:00:00Z",
    revisado_por: { user_id: ID, nombre: "Ada", apellido_inicial: "W." }, motivo_revision: "Se revisó y no hay falta" });
  assert.deepEqual([resuelto.resueltoPor, resuelto.resueltoEn, resuelto.nota, resuelto.estado], ["Ada W.", "2026-11-02T11:00:00Z", "Se revisó y no hay falta", "revisado"]);
  // Quien lo resolvió ya no existe: se dice como en el resto de la web, nunca "un administrador" inventado.
  assert.equal(reporteDesdeApi({ ...base, estado: "escalado", fecha_revision: "2026-11-02T11:00:00Z" }).resueltoPor, "Cuenta eliminada");
  // Sin autor conocido no se inventa a quién sancionar: el reporte queda sin cuenta (la pantalla muestra el aviso neutro).
  const sinAutor = reporteDesdeApi({ ...base, reportado: null, autor_no_disponible: true });
  assert.deepEqual([sinAutor.usuarioId, sinAutor.usuarioNombre], ["", "Running en el parque"]);
});
