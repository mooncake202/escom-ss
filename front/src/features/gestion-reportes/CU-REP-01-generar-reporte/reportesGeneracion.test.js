// Ejecutar: node --test src/features/gestion-reportes/CU-REP-01-generar-reporte/
import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITE_FIRMA_BYTES, agruparDiasPorMes, nombreMes, etiquetaEstadoReporte, validarArchivoFirma, describirError, formatearFechaHoraMexico,
} from "./reportesGeneracion.js";

const dia = (fecha, extra = {}) => ({ fecha, tipo: "laborable_sin_bitacora", ...extra });

test("agruparDiasPorMes: agrupa por mes conservando el orden del backend (periodo de mediados de mes)", () => {
  const dias = [dia("2026-07-30"), dia("2026-07-31"), dia("2026-08-01"), dia("2026-08-02")];
  const meses = agruparDiasPorMes(dias);
  assert.deepEqual(meses.map((m) => [m.anio, m.mes, m.dias.length]), [[2026, 6, 2], [2026, 7, 2]]);
  assert.equal(nombreMes(meses[0].mes), "Julio");
  assert.equal(meses[1].dias[0].fecha, "2026-08-01");
});

test("agruparDiasPorMes: un solo mes, cruce de año y sin días", () => {
  assert.equal(agruparDiasPorMes([dia("2026-11-03"), dia("2026-11-30")]).length, 1);
  assert.deepEqual(agruparDiasPorMes([dia("2026-12-31"), dia("2027-01-01")]).map((m) => [m.anio, m.mes]), [[2026, 11], [2027, 0]]);
  assert.deepEqual(agruparDiasPorMes([]), []);
  assert.deepEqual(agruparDiasPorMes(undefined), []);
});

test("agruparDiasPorMes no altera los días (la clasificación es del backend)", () => {
  const original = dia("2026-07-16", { tipo: "laborado", horas: 3, bitacoraAprobada: true });
  const [mes] = agruparDiasPorMes([original]);
  assert.equal(mes.dias[0], original);
});

test("etiquetaEstadoReporte: texto para los 5 estados reales; uno desconocido se muestra tal cual", () => {
  assert.equal(etiquetaEstadoReporte("pendiente_revision_profesor"), "Pendiente de revisión por profesor");
  assert.equal(etiquetaEstadoReporte("rechazado_profesor"), "Rechazado por profesor");
  assert.equal(etiquetaEstadoReporte("pendiente_revision_coordinador"), "Pendiente de revisión por coordinación");
  assert.equal(etiquetaEstadoReporte("rechazado_coordinador"), "Rechazado por coordinación");
  assert.equal(etiquetaEstadoReporte("aprobado_coordinador"), "Aprobado por coordinación");
  assert.equal(etiquetaEstadoReporte("otro"), "otro");
});

test("validarArchivoFirma: PNG o JPG de hasta 3 MB; el servidor hace la validación real", () => {
  assert.equal(validarArchivoFirma({ type: "image/png", size: 1000 }), null);
  assert.equal(validarArchivoFirma({ type: "image/jpeg", size: LIMITE_FIRMA_BYTES }), null);
  assert.match(validarArchivoFirma(null), /obligatoria/);
  assert.match(validarArchivoFirma({ type: "application/pdf", size: 10 }), /PNG o JPG/);
  assert.match(validarArchivoFirma({ type: "image/gif", size: 10 }), /PNG o JPG/);
  assert.match(validarArchivoFirma({ type: "image/png", size: LIMITE_FIRMA_BYTES + 1 }), /3 MB/);
});

test("describirError: acción según el código del backend", () => {
  const casos = {
    ACTIVIDADES_VACIAS: "actividades",
    TEXTO_INVALIDO: "actividades",
    CARACTERES_NO_SOPORTADOS: "actividades",
    ACTIVIDADES_EXCEDEN_ESPACIO: "actividades",
    ACTIVIDADES_PALABRA_DEMASIADO_LARGA: "actividades",
    REPORTE_NO_GENERABLE: "recargar",
    RUBRICA_NO_REGISTRADA: "recargar",
    DATOS_DEL_REPORTE_CAMBIARON: "recargar",
    SELLO_TIEMPO_NO_DISPONIBLE: "reintentar",
    REPORTE_YA_EXISTE: "lista",
    SIN_CAMBIOS_EN_ACTIVIDADES: "actividades",
    REPORTE_NO_CORREGIBLE: "lista",
    DATOS_NO_IMPRIMIBLES: "ninguna",
    DATO_EXCEDE_ANCHO: "ninguna",
    IMAGEN_INVALIDA: "ninguna",
  };
  for (const [code, accion] of Object.entries(casos)) {
    const r = describirError(Object.assign(new Error(`mensaje ${code}`), { code }));
    assert.equal(r.accion, accion, code);
    assert.equal(r.mensaje, `mensaje ${code}`, 'se muestra el mensaje del backend');
    assert.equal(r.codigo, code);
  }
});

test("describirError: sin código usa el mensaje del error; sin nada, un mensaje genérico", () => {
  assert.deepEqual(describirError(new Error("El servicio no está disponible temporalmente.")), {
    mensaje: "El servicio no está disponible temporalmente.", accion: "ninguna", codigo: null,
  });
  assert.match(describirError(undefined).mensaje, /Ocurrió un error/);
  assert.equal(describirError(null).accion, "ninguna");
});

test("formatearFechaHoraMexico: convierte el instante UTC de fechaEnvio a America/Mexico_City (UTC-6)", () => {
  // Un envío a las 15:50 hora de México llega del backend como 21:50 UTC.
  assert.deepEqual(formatearFechaHoraMexico("2026-09-20T21:50:00.000Z"), { fecha: "20 de septiembre de 2026", hora: "15:50" });
  // El día también cambia con la zona: 02:32 UTC del 21 es todavía el 20 en México.
  assert.deepEqual(formatearFechaHoraMexico("2026-09-21T02:32:40.000Z"), { fecha: "20 de septiembre de 2026", hora: "20:32" });
});

test("formatearFechaHoraMexico: medianoche y cambio de día en México, sin '24:00'", () => {
  assert.deepEqual(formatearFechaHoraMexico("2026-09-21T06:00:00.000Z"), { fecha: "21 de septiembre de 2026", hora: "00:00" });
  assert.deepEqual(formatearFechaHoraMexico("2026-09-21T05:59:59.000Z"), { fecha: "20 de septiembre de 2026", hora: "23:59" });
  assert.deepEqual(formatearFechaHoraMexico("2026-01-01T06:05:00.000Z"), { fecha: "1 de enero de 2026", hora: "00:05" });
});

test("formatearFechaHoraMexico: sin horario de verano en México (mismo -6 en verano e invierno) y valores inválidos → null", () => {
  assert.equal(formatearFechaHoraMexico("2026-07-15T18:00:00.000Z").hora, "12:00");
  assert.equal(formatearFechaHoraMexico("2026-01-15T18:00:00.000Z").hora, "12:00");
  for (const invalido of [null, undefined, "", "no es fecha"]) assert.equal(formatearFechaHoraMexico(invalido), null);
});
