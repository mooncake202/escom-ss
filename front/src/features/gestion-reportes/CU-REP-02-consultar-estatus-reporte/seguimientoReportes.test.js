// Ejecutar: node --test src/features/gestion-reportes/CU-REP-02-consultar-estatus-reporte/
import test from "node:test";
import assert from "node:assert/strict";
import {
  ESTADO_ALUMNO_MAP, estadoAlumnoDe, describirEvento, textoEsperaActual, fechaUltimoEvento, nombreEtapa, consultaDeReporte, destacadoDeConsulta, esNotificacionDeReporte,
} from "./seguimientoReportes.js";

test("estados: los 5 reales de estado_reporte tienen etiqueta para el alumno; uno desconocido se muestra tal cual y en neutro", () => {
  assert.deepEqual(Object.keys(ESTADO_ALUMNO_MAP).sort(), [
    "aprobado_coordinador", "pendiente_revision_coordinador", "pendiente_revision_profesor", "rechazado_coordinador", "rechazado_profesor",
  ]);
  assert.equal(estadoAlumnoDe("pendiente_revision_profesor").label, "En revisión del profesor");
  assert.equal(estadoAlumnoDe("rechazado_profesor").label, "Rechazado por el profesor");
  assert.equal(estadoAlumnoDe("pendiente_revision_coordinador").label, "En revisión de coordinación");
  assert.equal(estadoAlumnoDe("rechazado_coordinador").label, "Rechazado por coordinación");
  assert.equal(estadoAlumnoDe("aprobado_coordinador").label, "Aprobado");
  const C = { bgInput: "gris", textMuted: "tenue" };
  assert.equal(estadoAlumnoDe("raro").label, "raro");
  assert.equal(estadoAlumnoDe("raro").bg(C), "gris");
});

test("describirEvento: un título por cada etapa y resultado real, marcando los rechazos", () => {
  const titulo = (etapa, resultado) => describirEvento({ etapa, resultado }).titulo;
  assert.equal(titulo("alumno", "enviado"), "Reporte enviado al profesor");
  assert.equal(titulo("alumno", "reenviado"), "Corrección reenviada al profesor");
  assert.equal(titulo("profesor", "aprobado"), "Aprobado por el profesor");
  assert.equal(titulo("profesor", "rechazado"), "Rechazado por el profesor");
  assert.equal(titulo("coordinacion", "aprobado"), "Validado por coordinación");
  assert.equal(titulo("coordinacion", "rechazado"), "Rechazado por coordinación");
  assert.equal(describirEvento({ etapa: "profesor", resultado: "rechazado" }).rechazo, true);
  assert.equal(describirEvento({ etapa: "profesor", resultado: "aprobado" }).rechazo, false);
  assert.equal(titulo("otra", "cosa"), "otra · cosa", "lo desconocido no se disfraza");
});

test("textoEsperaActual: lo que sigue según el estado actual; aprobado y desconocidos no muestran nada", () => {
  assert.equal(textoEsperaActual("pendiente_revision_profesor"), "En espera de la revisión del profesor");
  assert.equal(textoEsperaActual("pendiente_revision_coordinador"), "En espera de la validación de coordinación");
  assert.equal(textoEsperaActual("rechazado_profesor"), "En espera de tu corrección");
  assert.equal(textoEsperaActual("rechazado_coordinador"), "En espera de tu corrección");
  assert.equal(textoEsperaActual("aprobado_coordinador"), null);
  assert.equal(textoEsperaActual("raro"), null);
});

test("fechaUltimoEvento: la del último evento guardado; sin historial, null", () => {
  assert.equal(fechaUltimoEvento([{ fecha: "2026-08-16T15:00:00.000Z" }, { fecha: "2026-08-18T15:00:00.000Z" }]), "2026-08-18T15:00:00.000Z");
  assert.equal(fechaUltimoEvento([]), null);
  assert.equal(fechaUltimoEvento(undefined), null);
});

test("nombreEtapa: nombres legibles para la etapa de un rechazo", () => {
  assert.deepEqual(["alumno", "profesor", "coordinacion", "x"].map(nombreEtapa), ["Alumno", "Profesor", "Coordinación", "x"]);
});

test("consultaDeReporte: el mensual va con su id; el global lleva ?tipo=global para no confundirse con un mensual del mismo id", () => {
  assert.equal(consultaDeReporte({ id: 7, tipoReporte: "mensual" }), "reporte=7");
  assert.equal(consultaDeReporte({ id: 7, tipoReporte: "global" }), "reporte=7&tipo=global");
});

test("destacadoDeConsulta: id + tipo de la URL (sin tipo, mensual); sin un id válido, null", () => {
  assert.deepEqual(destacadoDeConsulta("5", null), { id: 5, tipo: "mensual" });
  assert.deepEqual(destacadoDeConsulta("5", "global"), { id: 5, tipo: "global" });
  assert.deepEqual(destacadoDeConsulta("5", "otro"), { id: 5, tipo: "mensual" });
  for (const malo of [null, undefined, "", "abc", "-1", "0.5"]) assert.equal(destacadoDeConsulta(malo, "global"), null, String(malo));
});

test("esNotificacionDeReporte: solo la ruta de Mis reportes con el MISMO id y tipo; ni el otro tipo, ni otro id, ni otras pantallas", () => {
  const mensual = { id: 5, tipoReporte: "mensual" };
  const global = { id: 5, tipoReporte: "global" };
  assert.equal(esNotificacionDeReporte("/alumno/reportes?destacar=5", mensual), true);
  assert.equal(esNotificacionDeReporte("/alumno/reportes?destacar=5", global), false, "el id 5 mensual no es el global 5");
  assert.equal(esNotificacionDeReporte("/alumno/reportes?destacar=5&tipo=global", global), true);
  assert.equal(esNotificacionDeReporte("/alumno/reportes?destacar=5&tipo=global", mensual), false);
  assert.equal(esNotificacionDeReporte("/alumno/reportes?destacar=6", mensual), false);
  for (const otra of ["/profesor/reportes?destacar=5", "/coordinacion/reportes?destacar=5", "/alumno/reportes/estatus?destacar=5", "/alumno/reportes", "/alumno/reportes?otra=5", "", null, undefined, 7]) {
    assert.equal(esNotificacionDeReporte(otra, mensual), false, String(otra));
  }
});
