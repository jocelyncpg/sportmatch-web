import test from "node:test";
import assert from "node:assert/strict";
import { queryString, validarTexto } from "../lib/api/validaciones.mjs";
import { instagramAGuardar, instagramAMostrar, mapAviso, mapClub, mapConvocatoria, mapPostulante, opcional, webAGuardar } from "../lib/datos-mapeo.mjs";

test("validación de campos de servicios respeta mínimos y máximos", () => {
  assert.equal(validarTexto("  Selección  ", "Nombre", 2, 20), "Selección");
  assert.throws(() => validarTexto(" x ", "El título", 3, 20), /al menos 3 caracteres/);
  assert.throws(() => validarTexto("a".repeat(21), "El título", 3, 20), /no puede superar 20 caracteres/);
  assert.equal(validarTexto(" ", "Descripción", 1, 10, true), "");
});
test("serializa filtros de página sin enviar valores indefinidos", () => {
  assert.equal(queryString({ page: 2, page_size: 20, estado: undefined, deporte: "Fútbol" }), "?page=2&page_size=20&deporte=F%C3%BAtbol");
  assert.equal(queryString({}), "");
});
test("tipos compartidos de la API solo muestran campos contractuales", () => {
  const club = { id: "id", nombre: "Club", deportes: [{ id: 1, nombre: "Fútbol", descripcion: null }] };
  const applicant = { usuario_id: "u", estado: "PENDIENTE", perfil_deportivo: { nombre: "Ana", apellido_inicial: "P", edad: null, foto_perfil: null, biografia: null, deportes: [] } };
  assert.deepEqual(Object.keys(club), ["id", "nombre", "deportes"]);
  assert.equal("rating" in applicant.perfil_deportivo, false);
});

test("mapea el perfil del club y los valores opcionales", () => {
  assert.deepEqual(mapClub({ id: "club-1", nombre: "Club", descripcion: null, ubicacion: { comuna: "Ñuñoa" }, email_contacto: "a@b.cl", redes_sociales: { instagram: "@club" }, sitio_web: "https://club.cl", logo: "logo.png", deportes: [{ nombre: "Fútbol" }] }, "mi-club"), {
    id: "mi-club", nombre: "Club", descripcion: "", zona: "Ñuñoa", deportes: ["Fútbol"], email: "a@b.cl", telefono: "", instagram: "@club", web: "https://club.cl", logoUrl: "logo.png",
  });
});

test("mapea convocatoria y postulante a las etiquetas del mock", () => {
  assert.deepEqual(mapConvocatoria({ id: "conv-1", titulo: "Prueba", deporte: { nombre: "Fútbol" }, categoria_edad: "Sub-18", fecha_prueba: "2026-12-01T12:00:00Z", requisitos: ["Ropa", "Cédula"], cupos: 8, estado: "FINALIZADA" }, "mi-club"), {
    id: "conv-1", clubId: "mi-club", titulo: "Prueba", deporte: "Fútbol", categoria: "Sub-18", fecha: "2026-12-01", requisitos: "Ropa, Cédula", cupos: 8, estado: "cerrada", chatPostulantes: false,
  });
  assert.equal(mapConvocatoria({ id: "conv-2", chat_postulantes_habilitado: true, estado: "ABIERTA" }, "mi-club").chatPostulantes, true);
  assert.deepEqual(mapPostulante({ id: "app-1", usuario_id: "u-1", estado: "PRESELECCIONADO", fecha_postulacion: "2026-11-01T10:00:00Z", mensaje: null, perfil_deportivo: { nombre: "Ana", apellido_inicial: "P", edad: null, foto_perfil: null, biografia: null, deportes: [{ deporte_codigo: "FUT", nivel: 4 }] } }, "conv-1"), {
    id: "app-1", usuarioId: "u-1", convocatoriaId: "conv-1", nombre: "Ana P.", edad: 0, nivel: "Avanzado", comuna: "", estado: "Preseleccionado", fechaPostulacion: "2026-11-01", deportes: ["FUT"], bio: "", disponibilidad: "", objetivo: "", rating: 0, resenas: 0, foto: "",
  });
});

test("mapea el estado EN_ESPERA del backend a 'En espera' y los desconocidos a Pendiente", () => {
  assert.equal(mapPostulante({ id: "app-2", estado: "EN_ESPERA", perfil_deportivo: {} }, "conv-1").estado, "En espera");
  assert.equal(mapPostulante({ id: "app-3", estado: "DESCONOCIDO", perfil_deportivo: {} }, "conv-1").estado, "Pendiente");
});

test("mapea avisos del backend y conserva destino nulo cuando no está disponible", () => {
  assert.deepEqual(mapAviso({ id: "av-1", titulo: "Aviso", contenido: "Texto", fecha_creacion: "2026-11-01T10:00:00Z" }, "mi-club"), {
    id: "av-1", clubId: "mi-club", convocatoriaId: null, titulo: "Aviso", mensaje: "Texto", fecha: "2026-11-01T10:00:00Z",
  });
});

test("perfil del club: formatos que acepta Ms-club", () => {
  assert.equal(instagramAGuardar("@clubdemo"), "https://instagram.com/clubdemo");
  assert.equal(instagramAGuardar("instagram.com/clubdemo"), "https://instagram.com/clubdemo");
  assert.equal(instagramAGuardar("https://www.instagram.com/clubdemo"), "https://www.instagram.com/clubdemo");
  assert.equal(instagramAGuardar("  "), null);
  assert.equal(instagramAMostrar("https://instagram.com/clubdemo"), "@clubdemo");
  assert.equal(webAGuardar("club.cl"), "https://club.cl");
  assert.equal(webAGuardar("http://club.cl"), "http://club.cl");
  assert.equal(webAGuardar(""), null);
  assert.equal(opcional(" "), null);
});
