// Ejecutar: node --test src/services/
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./test-utils/resolverSinExtension.mjs", import.meta.url);

// apiClient usa el navegador: se simulan localStorage, window y fetch.
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: (k) => almacen.delete(k),
};
globalThis.window = new EventTarget();

const { apiFetch, apiFetchBlob, API_URL } = await import("./apiClient.js");
const {
  obtenerSiguienteReporte, subirRubrica, obtenerVistaPrevia, enviarReporteMensual, listarReportesProfesor, obtenerDetalleReporteProfesor, obtenerPdfReporteProfesor,
  obtenerEstadoRubricaProfesor, subirRubricaProfesor, rechazarReporteProfesor, aprobarReporteProfesor,
  obtenerSiguienteReporteGlobal, obtenerVistaPreviaGlobal, enviarReporteGlobal,
  listarReportesAlumno, obtenerSeguimientoReporte, obtenerPdfReporteAlumno, obtenerVistaPreviaCorreccion, reenviarReporteCorregido,
  listarReportesCoordinacion, obtenerDetalleReporteCoordinacion, obtenerPdfReporteCoordinacion, rechazarReporteCoordinacion, aprobarReporteCoordinacion,
} = await import("./reportesService.js");

let peticiones;
function simularFetch(respuesta) {
  peticiones = [];
  globalThis.fetch = async (url, opciones) => {
    peticiones.push({ url, opciones });
    if (respuesta instanceof Error) throw respuesta;
    return typeof respuesta === "function" ? respuesta() : respuesta;
  };
}
const json = (cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
const pdf = () => new Response(new Blob(["%PDF-1.7 prueba"], { type: "application/pdf" }), { status: 200, headers: { "Content-Type": "application/pdf" } });
const html = (status = 502) => new Response("<html>Bad Gateway</html>", { status, headers: { "Content-Type": "text/html" } });
const NO_DISPONIBLE = /servicio no está disponible temporalmente/;

test.beforeEach(() => {
  almacen.clear();
  almacen.set("token", "jwt-de-prueba");
  almacen.set("usuario", "{}");
});

// ── apiFetch (comportamiento existente, sin romper) ──────────

test("apiFetch: devuelve el JSON, manda el token y Content-Type solo si el cuerpo no es FormData", async () => {
  simularFetch(json({ ok: true }));
  assert.deepEqual(await apiFetch("/x", { method: "POST", body: "{}" }), { ok: true });
  assert.equal(peticiones[0].url, `${API_URL}/x`);
  assert.equal(peticiones[0].opciones.headers.Authorization, "Bearer jwt-de-prueba");
  assert.equal(peticiones[0].opciones.headers["Content-Type"], "application/json");

  simularFetch(json({ ok: true }));
  await apiFetch("/x", { method: "POST", body: new FormData() });
  assert.equal(peticiones[0].opciones.headers["Content-Type"], undefined, "el navegador pone el boundary");
});

test("apiFetch: un error del backend lanza Error con el mensaje y conserva status, code y el cuerpo", async () => {
  simularFetch(json({ message: "Todavía no", code: "REPORTE_NO_GENERABLE", motivosBloqueo: [{ codigo: "A", mensaje: "a" }] }, 409));
  await assert.rejects(apiFetch("/x"), (err) => {
    assert.equal(err.message, "Todavía no");
    assert.equal(err.status, 409);
    assert.equal(err.code, "REPORTE_NO_GENERABLE");
    assert.equal(err.detalles.motivosBloqueo[0].codigo, "A");
    return true;
  });
  simularFetch(json({}, 500));
  await assert.rejects(apiFetch("/x"), /Ocurrió un error\./);
});

test("apiFetch: respuesta que no es JSON o sin conexión → servicio no disponible", async () => {
  simularFetch(html());
  await assert.rejects(apiFetch("/x"), NO_DISPONIBLE);
  simularFetch(new TypeError("fetch failed"));
  await assert.rejects(apiFetch("/x"), NO_DISPONIBLE);
});

test("un 401 cierra la sesión (token, usuario y evento), salvo en el login", async () => {
  let eventos = 0;
  globalThis.window.addEventListener("sesion-expirada", () => { eventos += 1; });

  simularFetch(json({ message: "Token inválido" }, 401));
  await assert.rejects(apiFetch("/perfil"), /Token inválido/);
  assert.equal(almacen.has("token"), false);
  assert.equal(almacen.has("usuario"), false);
  assert.equal(eventos, 1);

  almacen.set("token", "otro");
  simularFetch(json({ message: "Credenciales incorrectas" }, 401));
  await assert.rejects(apiFetch("/auth/login", { method: "POST", body: "{}" }), /Credenciales incorrectas/);
  assert.equal(almacen.get("token"), "otro");
  assert.equal(eventos, 1);
});

// ── apiFetchBlob ─────────────────────────────────────────────

test("apiFetchBlob: una respuesta correcta se devuelve como Blob (PDF), con el token", async () => {
  simularFetch(pdf());
  const archivo = await apiFetchBlob("/pdf", { method: "POST", body: "{}" });
  assert.ok(archivo instanceof Blob);
  assert.equal(archivo.type, "application/pdf");
  assert.equal(await archivo.text(), "%PDF-1.7 prueba");
  assert.equal(peticiones[0].opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("apiFetchBlob: los errores llegan como JSON y se manejan como en apiFetch (status, code, 401, no disponible)", async () => {
  simularFetch(json({ message: "Registra tu rúbrica", code: "RUBRICA_NO_REGISTRADA" }, 409));
  await assert.rejects(apiFetchBlob("/pdf"), (err) => err.status === 409 && err.code === "RUBRICA_NO_REGISTRADA" && /rúbrica/.test(err.message));

  simularFetch(json({ message: "Sesión cerrada" }, 401));
  await assert.rejects(apiFetchBlob("/pdf"), /Sesión cerrada/);
  assert.equal(almacen.has("token"), false);

  simularFetch(html());
  await assert.rejects(apiFetchBlob("/pdf"), NO_DISPONIBLE);
  simularFetch(new TypeError("fetch failed"));
  await assert.rejects(apiFetchBlob("/pdf"), NO_DISPONIBLE);
});

// ── reportesService ──────────────────────────────────────────

test("obtenerSiguienteReporte: GET /reportes/mensual/siguiente", async () => {
  simularFetch(json({ puedeGenerar: true }));
  assert.deepEqual(await obtenerSiguienteReporte(), { puedeGenerar: true });
  assert.equal(peticiones[0].url, `${API_URL}/reportes/mensual/siguiente`);
  assert.equal(peticiones[0].opciones.method, undefined);
});

test("subirRubrica: POST multipart en el campo rubrica, sin forzar Content-Type", async () => {
  simularFetch(json({ tieneRubrica: true, requiereSubirRubrica: false }, 201));
  const archivo = new File([new Uint8Array([137, 80, 78, 71])], "firma.png", { type: "image/png" });
  const respuesta = await subirRubrica(archivo);

  assert.equal(respuesta.tieneRubrica, true);
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/rubrica`);
  assert.equal(opciones.method, "POST");
  assert.ok(opciones.body instanceof FormData);
  assert.equal(opciones.body.get("rubrica").name, "firma.png");
  assert.equal(opciones.headers["Content-Type"], undefined);
});

test("obtenerVistaPrevia: POST con { actividades } y devuelve el PDF del servidor como Blob", async () => {
  simularFetch(pdf());
  const archivo = await obtenerVistaPrevia("Primera\nSegunda");
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/mensual/vista-previa`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { actividades: "Primera\nSegunda" });
});

test("obtenerVistaPrevia: si la respuesta no es un PDF falla; los errores del backend conservan su código", async () => {
  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/plain" } }));
  await assert.rejects(obtenerVistaPrevia("x"), /No se pudo generar la vista previa/);

  simularFetch(json({ message: "Tus actividades no caben", code: "ACTIVIDADES_EXCEDEN_ESPACIO", lineasMaximas: 22 }, 422));
  await assert.rejects(obtenerVistaPrevia("x"), (err) => err.code === "ACTIVIDADES_EXCEDEN_ESPACIO" && err.detalles.lineasMaximas === 22);
});

test("enviarReporteMensual: POST /reportes/mensual con { actividades }; el 503 de la TSA llega con su código", async () => {
  simularFetch(json({ reporte: { id: 1, numero: 1, estadoReporte: "pendiente_revision_profesor" }, fechaEnvio: "2026-09-20T18:00:00.000Z" }, 201));
  const respuesta = await enviarReporteMensual("Actividad única");
  assert.equal(respuesta.reporte.numero, 1);
  assert.equal(peticiones[0].url, `${API_URL}/reportes/mensual`);
  assert.equal(peticiones[0].opciones.method, "POST");
  assert.deepEqual(JSON.parse(peticiones[0].opciones.body), { actividades: "Actividad única" });

  simularFetch(json({ message: "Tu reporte no fue enviado", code: "SELLO_TIEMPO_NO_DISPONIBLE", reintentable: true }, 503));
  await assert.rejects(enviarReporteMensual("x"), (err) => err.status === 503 && err.code === "SELLO_TIEMPO_NO_DISPONIBLE" && err.detalles.reintentable === true);
});

// ── CU-REP-05 (profesor) ─────────────────────────────────────

test("listarReportesProfesor: GET /profesor/reportes con el token; el profesor nunca va en la petición", async () => {
  const respuesta = { pendientes: [{ id: 1, tipoReporte: "mensual" }], procesados: [], totales: { pendientes: 1, procesados: 0 } };
  simularFetch(json(respuesta));
  assert.deepEqual(await listarReportesProfesor(), respuesta);

  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/profesor/reportes`);
  assert.equal(opciones.method, undefined);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("obtenerDetalleReporteProfesor: GET /profesor/reportes/:tipoReporte/:id", async () => {
  simularFetch(json({ id: 12, tipoReporte: "mensual", titulo: "Reporte mensual de actividades No. 1", diasLaborados: 4, horasReportadas: 13 }));
  const detalle = await obtenerDetalleReporteProfesor("mensual", 12);
  assert.equal(detalle.diasLaborados, 4);
  assert.equal(peticiones[0].url, `${API_URL}/profesor/reportes/mensual/12`);
});

test("obtenerDetalleReporteProfesor: los segmentos se codifican (no se puede colar otra ruta)", async () => {
  simularFetch(json({}));
  await obtenerDetalleReporteProfesor("mensual/../global", "1?x=y");
  assert.equal(peticiones[0].url, `${API_URL}/profesor/reportes/mensual%2F..%2Fglobal/1%3Fx%3Dy`);
});

test("un reporte ajeno o inexistente llega como Error 404 con su mensaje; 403 para otro rol", async () => {
  simularFetch(json({ message: "Reporte no encontrado." }, 404));
  await assert.rejects(obtenerDetalleReporteProfesor("mensual", 99), (err) => err.status === 404 && err.message === "Reporte no encontrado.");

  simularFetch(json({ message: "No tienes permiso para realizar esta acción." }, 403));
  await assert.rejects(listarReportesProfesor(), (err) => err.status === 403);
});

test("obtenerPdfReporteProfesor: GET /profesor/reportes/:tipoReporte/:id/pdf con el token y devuelve el PDF como Blob", async () => {
  simularFetch(pdf());
  const archivo = await obtenerPdfReporteProfesor("mensual", 12);
  assert.ok(archivo instanceof Blob);
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/profesor/reportes/mensual/12/pdf`);
  assert.equal(opciones.method, undefined);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("obtenerPdfReporteProfesor: los segmentos se codifican y lo que no es PDF falla", async () => {
  simularFetch(pdf());
  await obtenerPdfReporteProfesor("mensual/../global", "1?x=y");
  assert.equal(peticiones[0].url, `${API_URL}/profesor/reportes/mensual%2F..%2Fglobal/1%3Fx%3Dy/pdf`);

  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/html" } }));
  await assert.rejects(obtenerPdfReporteProfesor("mensual", 1), /No se pudo abrir el PDF/);
});

test("obtenerPdfReporteProfesor: ajeno/inexistente 404 y archivo no disponible conservan mensaje y código; 403 para otro rol", async () => {
  simularFetch(json({ message: "Reporte no encontrado." }, 404));
  await assert.rejects(obtenerPdfReporteProfesor("mensual", 99), (err) => err.status === 404 && err.message === "Reporte no encontrado.");

  simularFetch(json({ message: "El archivo del reporte no está disponible.", code: "ARCHIVO_NO_DISPONIBLE" }, 404));
  await assert.rejects(obtenerPdfReporteProfesor("mensual", 1), (err) => err.status === 404 && err.code === "ARCHIVO_NO_DISPONIBLE");

  simularFetch(json({ message: "No tienes permiso para esta acción." }, 403));
  await assert.rejects(obtenerPdfReporteProfesor("mensual", 1), (err) => err.status === 403);
});

test("obtenerEstadoRubricaProfesor: GET /profesor/reportes/rubrica; solo el estado", async () => {
  simularFetch(json({ tieneRubrica: false, requiereSubirRubrica: true }));
  assert.deepEqual(await obtenerEstadoRubricaProfesor(), { tieneRubrica: false, requiereSubirRubrica: true });
  assert.equal(peticiones[0].url, `${API_URL}/profesor/reportes/rubrica`);
  assert.equal(peticiones[0].opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("subirRubricaProfesor: POST multipart en el campo rubrica hacia la ruta del profesor; subirRubrica del alumno no cambia", async () => {
  const archivo = new File([new Uint8Array([137, 80, 78, 71])], "firma.png", { type: "image/png" });
  simularFetch(json({ tieneRubrica: true }, 201));
  await subirRubricaProfesor(archivo);
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/profesor/reportes/rubrica`);
  assert.equal(opciones.method, "POST");
  assert.ok(opciones.body instanceof FormData);
  assert.equal(opciones.body.get("rubrica").name, "firma.png");
  assert.equal(opciones.headers["Content-Type"], undefined);

  simularFetch(json({ tieneRubrica: true }, 201));
  await subirRubrica(archivo);
  assert.equal(peticiones[0].url, `${API_URL}/reportes/rubrica`);
});

test("subirRubricaProfesor: 'ya registrada' llega con su código para poder continuar", async () => {
  simularFetch(json({ message: "Ya tienes una rúbrica registrada.", code: "RUBRICA_YA_REGISTRADA" }, 409));
  await assert.rejects(subirRubricaProfesor(new File([new Uint8Array([1])], "f.png", { type: "image/png" })), (err) => err.status === 409 && err.code === "RUBRICA_YA_REGISTRADA");
});

test("rechazarReporteProfesor: POST /profesor/reportes/:tipo/:id/rechazar con { comentario } y nada más", async () => {
  simularFetch(json({ reporte: { id: 12, numero: 1, estadoReporte: "rechazado_profesor" }, fechaRevision: "2026-09-21T15:00:00.000Z" }));
  const r = await rechazarReporteProfesor("mensual", 12, "Faltan actividades");

  assert.equal(r.reporte.estadoReporte, "rechazado_profesor");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/profesor/reportes/mensual/12/rechazar`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { comentario: "Faltan actividades" });
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("rechazarReporteProfesor: los segmentos se codifican; el motivo obligatorio y los 409 llegan con su código", async () => {
  simularFetch(json({}));
  await rechazarReporteProfesor("mensual/../global", "1?x=y", "x");
  assert.equal(peticiones[0].url, `${API_URL}/profesor/reportes/mensual%2F..%2Fglobal/1%3Fx%3Dy/rechazar`);

  simularFetch(json({ message: "El motivo del rechazo es obligatorio.", code: "COMENTARIO_REQUERIDO" }, 400));
  await assert.rejects(rechazarReporteProfesor("mensual", 1, ""), (err) => err.status === 400 && err.code === "COMENTARIO_REQUERIDO");

  simularFetch(json({ message: "Este reporte ya no está pendiente de tu revisión.", code: "REPORTE_NO_PENDIENTE", estadoReporte: "rechazado_profesor" }, 409));
  await assert.rejects(rechazarReporteProfesor("mensual", 1, "x"), (err) => err.status === 409 && err.code === "REPORTE_NO_PENDIENTE" && err.detalles.estadoReporte === "rechazado_profesor");
});

test("aprobarReporteProfesor: POST /profesor/reportes/:tipo/:id/aprobar SIN cuerpo (el servidor decide todo)", async () => {
  simularFetch(json({ reporte: { id: 12, numero: 1, estadoReporte: "pendiente_revision_coordinador" }, fechaRevision: "2026-09-21T15:00:00.000Z" }));
  const r = await aprobarReporteProfesor("mensual", 12);

  assert.equal(r.reporte.estadoReporte, "pendiente_revision_coordinador");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/profesor/reportes/mensual/12/aprobar`);
  assert.equal(opciones.method, "POST");
  assert.equal(opciones.body, undefined);
});

test("aprobarReporteProfesor: sin rúbrica (409), TSA caída (503 reintentable) y ajeno (404) llegan con status, código y detalles", async () => {
  simularFetch(json({ message: "Registra tu firma antes de aprobar el reporte.", code: "RUBRICA_NO_REGISTRADA" }, 409));
  await assert.rejects(aprobarReporteProfesor("mensual", 1), (err) => err.status === 409 && err.code === "RUBRICA_NO_REGISTRADA");

  simularFetch(json({ message: "No se pudo obtener el sello de tiempo. El reporte no fue aprobado ni firmado; inténtalo de nuevo en unos minutos.", code: "SELLO_TIEMPO_NO_DISPONIBLE", reintentable: true }, 503));
  await assert.rejects(aprobarReporteProfesor("mensual", 1), (err) => err.status === 503 && err.detalles.reintentable === true && /no fue aprobado/.test(err.message));

  simularFetch(json({ message: "Reporte no encontrado." }, 404));
  await assert.rejects(aprobarReporteProfesor("mensual", 99), (err) => err.status === 404);
});

// ── CU-REP-06 (coordinación) ─────────────────────────────────

test("listarReportesCoordinacion: GET /coordinador/reportes con el token; el coordinador nunca va en la petición", async () => {
  const respuesta = { pendientes: [{ id: 1, tipoReporte: "mensual" }], procesados: [], totales: { pendientes: 1, procesados: 0 } };
  simularFetch(json(respuesta));
  assert.deepEqual(await listarReportesCoordinacion(), respuesta);
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/coordinador/reportes`);
  assert.equal(opciones.method, undefined);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("obtenerDetalleReporteCoordinacion: GET /coordinador/reportes/:tipo/:id y los segmentos se codifican", async () => {
  simularFetch(json({ id: 12, tipoReporte: "mensual", titulo: "Reporte mensual de actividades No. 1" }));
  assert.equal((await obtenerDetalleReporteCoordinacion("mensual", 12)).id, 12);
  assert.equal(peticiones[0].url, `${API_URL}/coordinador/reportes/mensual/12`);

  simularFetch(json({}));
  await obtenerDetalleReporteCoordinacion("mensual/../global", "1?x=y");
  assert.equal(peticiones[0].url, `${API_URL}/coordinador/reportes/mensual%2F..%2Fglobal/1%3Fx%3Dy`);
});

test("obtenerPdfReporteCoordinacion: GET .../pdf con el token y devuelve el PDF como Blob; lo que no es PDF falla", async () => {
  simularFetch(pdf());
  const archivo = await obtenerPdfReporteCoordinacion("mensual", 12);
  assert.ok(archivo instanceof Blob);
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/coordinador/reportes/mensual/12/pdf`);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");

  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/html" } }));
  await assert.rejects(obtenerPdfReporteCoordinacion("mensual", 1), /No se pudo abrir el PDF/);
  simularFetch(json({ message: "El archivo del reporte no está disponible.", code: "ARCHIVO_NO_DISPONIBLE" }, 404));
  await assert.rejects(obtenerPdfReporteCoordinacion("mensual", 1), (err) => err.status === 404 && err.code === "ARCHIVO_NO_DISPONIBLE");
});

test("rechazarReporteCoordinacion: POST .../rechazar con { comentario } y nada más; los errores conservan status y código", async () => {
  simularFetch(json({ reporte: { id: 12, numero: 1, estadoReporte: "rechazado_coordinador" }, fechaRevision: "2026-09-22T15:00:00.000Z" }));
  const r = await rechazarReporteCoordinacion("mensual", 12, "Falta el detalle");
  assert.equal(r.reporte.estadoReporte, "rechazado_coordinador");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/coordinador/reportes/mensual/12/rechazar`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { comentario: "Falta el detalle" });

  simularFetch(json({ message: "El motivo del rechazo es obligatorio.", code: "COMENTARIO_REQUERIDO" }, 400));
  await assert.rejects(rechazarReporteCoordinacion("mensual", 1, ""), (err) => err.status === 400 && err.code === "COMENTARIO_REQUERIDO");
  simularFetch(json({ message: "Este reporte ya no está pendiente de tu revisión.", code: "REPORTE_NO_PENDIENTE", estadoReporte: "aprobado_coordinador" }, 409));
  await assert.rejects(rechazarReporteCoordinacion("mensual", 1, "x"), (err) => err.status === 409 && err.code === "REPORTE_NO_PENDIENTE" && err.detalles.estadoReporte === "aprobado_coordinador");
});

test("aprobarReporteCoordinacion: POST .../aprobar SIN cuerpo (el servidor decide todo); TSA caída llega como 503 reintentable", async () => {
  simularFetch(json({ reporte: { id: 12, numero: 1, estadoReporte: "aprobado_coordinador" }, fechaRevision: "2026-09-22T15:00:00.000Z" }));
  const r = await aprobarReporteCoordinacion("mensual", 12);
  assert.equal(r.reporte.estadoReporte, "aprobado_coordinador");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/coordinador/reportes/mensual/12/aprobar`);
  assert.equal(opciones.method, "POST");
  assert.equal(opciones.body, undefined);

  simularFetch(json({ message: "No se pudo obtener el sello de tiempo. El reporte no fue aprobado; inténtalo de nuevo en unos minutos.", code: "SELLO_TIEMPO_NO_DISPONIBLE", reintentable: true }, 503));
  await assert.rejects(aprobarReporteCoordinacion("mensual", 1), (err) => err.status === 503 && err.detalles.reintentable === true);
  simularFetch(json({ message: "Reporte no encontrado." }, 404));
  await assert.rejects(aprobarReporteCoordinacion("mensual", 99), (err) => err.status === 404);
  simularFetch(json({ message: "No tienes permiso para esta acción." }, 403));
  await assert.rejects(aprobarReporteCoordinacion("mensual", 1), (err) => err.status === 403);
});

// ── CU-REP-02 / 03 / 04 (alumno) ─────────────────────────────

test("listarReportesAlumno: GET /reportes con el token; el alumno nunca va en la petición", async () => {
  const respuesta = { reportes: [{ id: 3, tipoReporte: "mensual" }], total: 1 };
  simularFetch(json(respuesta));
  assert.deepEqual(await listarReportesAlumno(), respuesta);
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes`);
  assert.equal(opciones.method, undefined);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("obtenerSeguimientoReporte: GET /reportes/:tipo/:id; los segmentos se codifican y un ajeno llega como 404", async () => {
  simularFetch(json({ id: 12, historial: [] }));
  assert.equal((await obtenerSeguimientoReporte("mensual", 12)).id, 12);
  assert.equal(peticiones[0].url, `${API_URL}/reportes/mensual/12`);

  simularFetch(json({}));
  await obtenerSeguimientoReporte("mensual/../global", "1?x=y");
  assert.equal(peticiones[0].url, `${API_URL}/reportes/mensual%2F..%2Fglobal/1%3Fx%3Dy`);

  simularFetch(json({ message: "Reporte no encontrado." }, 404));
  await assert.rejects(obtenerSeguimientoReporte("mensual", 99), (err) => err.status === 404 && err.message === "Reporte no encontrado.");
});

test("obtenerPdfReporteAlumno: GET .../pdf con el token y devuelve el PDF como Blob; lo que no es PDF falla", async () => {
  simularFetch(pdf());
  const archivo = await obtenerPdfReporteAlumno("mensual", 12);
  assert.ok(archivo instanceof Blob);
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/mensual/12/pdf`);
  assert.equal(opciones.body, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");

  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/html" } }));
  await assert.rejects(obtenerPdfReporteAlumno("mensual", 1), /No se pudo abrir el PDF/);
  simularFetch(json({ message: "El archivo del reporte no está disponible.", code: "ARCHIVO_NO_DISPONIBLE" }, 404));
  await assert.rejects(obtenerPdfReporteAlumno("mensual", 1), (err) => err.status === 404 && err.code === "ARCHIVO_NO_DISPONIBLE");
});

test("obtenerVistaPreviaCorreccion: POST .../correccion/vista-previa con { actividades } y devuelve el PDF del servidor como Blob", async () => {
  simularFetch(pdf());
  const archivo = await obtenerVistaPreviaCorreccion("mensual", 12, "Primera\nSegunda");
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/mensual/12/correccion/vista-previa`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { actividades: "Primera\nSegunda" });

  simularFetch(json({ message: "Modifica las actividades antes de reenviar el reporte.", code: "SIN_CAMBIOS_EN_ACTIVIDADES" }, 422));
  await assert.rejects(obtenerVistaPreviaCorreccion("mensual", 12, "x"), (err) => err.status === 422 && err.code === "SIN_CAMBIOS_EN_ACTIVIDADES");
  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/plain" } }));
  await assert.rejects(obtenerVistaPreviaCorreccion("mensual", 12, "x"), /No se pudo generar la vista previa/);
});

test("reenviarReporteCorregido: POST .../correccion con { actividades } y nada más; los errores conservan status, código y detalles", async () => {
  simularFetch(json({ reporte: { id: 12, numero: 1, estadoReporte: "pendiente_revision_profesor" }, fechaEnvio: "2026-09-22T15:00:00.000Z" }));
  const r = await reenviarReporteCorregido("mensual", 12, "Corregido");
  assert.equal(r.reporte.estadoReporte, "pendiente_revision_profesor");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/mensual/12/correccion`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { actividades: "Corregido" });

  simularFetch(json({ message: "No se pudo obtener el sello de tiempo. Tu reporte no fue enviado; inténtalo de nuevo en unos minutos.", code: "SELLO_TIEMPO_NO_DISPONIBLE", reintentable: true }, 503));
  await assert.rejects(reenviarReporteCorregido("mensual", 12, "x"), (err) => err.status === 503 && err.detalles.reintentable === true);
  simularFetch(json({ message: "Este reporte ya no se puede corregir.", code: "REPORTE_NO_CORREGIBLE", estadoReporte: "pendiente_revision_profesor" }, 409));
  await assert.rejects(reenviarReporteCorregido("mensual", 12, "x"), (err) => err.status === 409 && err.code === "REPORTE_NO_CORREGIBLE" && err.detalles.estadoReporte === "pendiente_revision_profesor");
});

// ── CU-REP-07 (alumno): reporte global ───────────────────────

test("obtenerSiguienteReporteGlobal: GET /reportes/global/siguiente con el token", async () => {
  const respuesta = { horas: { acumuladas: 480, requeridas: 480, suficientes: true }, puedeGenerar: true, motivosBloqueo: [] };
  simularFetch(json(respuesta));
  assert.deepEqual(await obtenerSiguienteReporteGlobal(), respuesta);
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/global/siguiente`);
  assert.equal(opciones.method, undefined);
  assert.equal(opciones.headers.Authorization, "Bearer jwt-de-prueba");
});

test("obtenerVistaPreviaGlobal: POST con { actividades } y devuelve el PDF del servidor como Blob; lo que no es PDF falla", async () => {
  simularFetch(pdf());
  const archivo = await obtenerVistaPreviaGlobal("Resumen del servicio");
  assert.equal(archivo.type, "application/pdf");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/global/vista-previa`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { actividades: "Resumen del servicio" });

  simularFetch(new Response("no soy pdf", { status: 200, headers: { "Content-Type": "text/plain" } }));
  await assert.rejects(obtenerVistaPreviaGlobal("x"), /No se pudo generar la vista previa/);
  simularFetch(json({ message: "El reporte todavía no se puede generar.", code: "REPORTE_NO_GENERABLE", motivosBloqueo: [{ codigo: "HORAS_INSUFICIENTES", mensaje: "x" }] }, 409));
  await assert.rejects(obtenerVistaPreviaGlobal("x"), (err) => err.status === 409 && err.code === "REPORTE_NO_GENERABLE" && err.detalles.motivosBloqueo[0].codigo === "HORAS_INSUFICIENTES");
});

test("enviarReporteGlobal: POST /reportes/global con { actividades } y nada más; el 409 por duplicado y el 503 de la TSA llegan con su código", async () => {
  simularFetch(json({ reporte: { id: 5, numero: null, estadoReporte: "pendiente_revision_profesor" }, fechaEnvio: "2027-03-01T15:00:00.000Z" }, 201));
  const r = await enviarReporteGlobal("Resumen");
  assert.equal(r.reporte.estadoReporte, "pendiente_revision_profesor");
  const { url, opciones } = peticiones[0];
  assert.equal(url, `${API_URL}/reportes/global`);
  assert.equal(opciones.method, "POST");
  assert.deepEqual(JSON.parse(opciones.body), { actividades: "Resumen" });

  simularFetch(json({ message: "Ya existe un reporte global para tu servicio social. Tu envío no se registró.", code: "REPORTE_YA_EXISTE" }, 409));
  await assert.rejects(enviarReporteGlobal("x"), (err) => err.status === 409 && err.code === "REPORTE_YA_EXISTE");
  simularFetch(json({ message: "No se pudo obtener el sello de tiempo.", code: "SELLO_TIEMPO_NO_DISPONIBLE", reintentable: true }, 503));
  await assert.rejects(enviarReporteGlobal("x"), (err) => err.status === 503 && err.detalles.reintentable === true);
});

test("los servicios genéricos aceptan el tipo global: seguimiento, PDF, corrección y reenvío usan /reportes/global/:id", async () => {
  simularFetch(json({ id: 3, tipoReporte: "global" }));
  await obtenerSeguimientoReporte("global", 3);
  assert.equal(peticiones[0].url, `${API_URL}/reportes/global/3`);
  simularFetch(pdf());
  await obtenerPdfReporteAlumno("global", 3);
  assert.equal(peticiones[0].url, `${API_URL}/reportes/global/3/pdf`);
  simularFetch(pdf());
  await obtenerVistaPreviaCorreccion("global", 3, "x");
  assert.equal(peticiones[0].url, `${API_URL}/reportes/global/3/correccion/vista-previa`);
  simularFetch(json({}));
  await reenviarReporteCorregido("global", 3, "x");
  assert.equal(peticiones[0].url, `${API_URL}/reportes/global/3/correccion`);
});
