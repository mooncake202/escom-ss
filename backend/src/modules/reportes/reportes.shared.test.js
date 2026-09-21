const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CARRERAS_NOMBRE_INSTITUCIONAL,
  CARRERAS_ALIAS_LEGADO,
  PRESTATARIO,
  TEXTO_RESPONSABLE_DIRECTO,
  nombreCompleto,
  aNumero,
  formatearPorcentajeCreditos,
  nombreInstitucionalCarrera,
  ESTADOS_REPORTE,
  ESTADO_REPORTE_APROBACION_FINAL,
  ESTADOS_REPORTE_RECHAZADOS,
  TIPOS_EVENTO_NO_LABORABLE,
  MOTIVOS_BLOQUEO,
  MENSAJES_BLOQUEO,
  TIPOS_NOTIFICACION,
} = require('./reportes.shared');

test('catálogo de carreras: nombre institucional de ISC, LCD e IIA', () => {
  assert.equal(nombreInstitucionalCarrera('ISC'), 'Ingeniería en Sistemas Computacionales');
  assert.equal(nombreInstitucionalCarrera('LCD'), 'Licenciatura en Ciencia de Datos');
  assert.equal(nombreInstitucionalCarrera('IIA'), 'Ingeniería en Inteligencia Artificial');
});

test('catálogo de carreras: IA es un alias legado de IIA (el código correcto), no una carrera distinta', () => {
  assert.equal(nombreInstitucionalCarrera('IA'), 'Ingeniería en Inteligencia Artificial');
  assert.equal(nombreInstitucionalCarrera('IA'), nombreInstitucionalCarrera('IIA'));
  assert.deepEqual({ ...CARRERAS_ALIAS_LEGADO }, { IA: 'IIA' });
  assert.ok(Object.isFrozen(CARRERAS_ALIAS_LEGADO));
});

test('catálogo de carreras: código desconocido o vacío devuelve null (no se inventa)', () => {
  for (const codigo of ['XYZ', 'isc', 'ia', 'IIAA', '', null, undefined, '__proto__', 'constructor']) {
    assert.equal(nombreInstitucionalCarrera(codigo), null, String(codigo));
  }
});

test('catálogo de carreras: cubre exactamente los códigos de la tabla carrera y es inmutable', () => {
  assert.deepEqual(Object.keys(CARRERAS_NOMBRE_INSTITUCIONAL).sort(), ['IIA', 'ISC', 'LCD']);
  assert.ok(Object.isFrozen(CARRERAS_NOMBRE_INSTITUCIONAL));
});

test('estados oficiales del reporte: cinco, sin aprobado_profesor', () => {
  assert.deepEqual(Object.values(ESTADOS_REPORTE).sort(), [
    'aprobado_coordinador',
    'pendiente_revision_coordinador',
    'pendiente_revision_profesor',
    'rechazado_coordinador',
    'rechazado_profesor',
  ]);
  assert.equal(Object.values(ESTADOS_REPORTE).includes('aprobado_profesor'), false);
  assert.equal(ESTADO_REPORTE_APROBACION_FINAL, 'aprobado_coordinador');
  assert.deepEqual([...ESTADOS_REPORTE_RECHAZADOS].sort(), ['rechazado_coordinador', 'rechazado_profesor']);
});

test('todos los estados caben en estado_reporte VARCHAR(35)', () => {
  for (const estado of Object.values(ESTADOS_REPORTE)) assert.ok(estado.length <= 35, estado);
});

test('tipos de evento no laborable: valores exactos del enum TipoEventoCalendario', () => {
  assert.deepEqual([...TIPOS_EVENTO_NO_LABORABLE], ['Inhabil', 'Vacacional']);
});

test('textos fijos del reporte mensual', () => {
  assert.equal(PRESTATARIO, 'Escuela Superior de Cómputo');
  assert.equal(TEXTO_RESPONSABLE_DIRECTO, 'Responsable Directo');
});

test('nombreCompleto: "Nombre Apellidos" sin cambiar mayúsculas y sin espacios sobrantes', () => {
  assert.equal(nombreCompleto('ANA', 'GARCIA LOPEZ'), 'ANA GARCIA LOPEZ');
  assert.equal(nombreCompleto('  Ana  María ', ' García   López '), 'Ana María García López');
  assert.equal(nombreCompleto('Ana', null), 'Ana');
  assert.equal(nombreCompleto(undefined, undefined), '');
});

test('aNumero: number, string y Decimal; lo demás es null', () => {
  assert.equal(aNumero(85), 85);
  assert.equal(aNumero('85.50'), 85.5);
  assert.equal(aNumero({ toString: () => '70.25' }), 70.25);
  for (const malo of [null, undefined, '', '  ', 'abc', NaN, Infinity]) assert.equal(aNumero(malo), null, String(malo));
});

test('formatearPorcentajeCreditos: sin ceros decimales innecesarios', () => {
  assert.equal(formatearPorcentajeCreditos(85), '85 %');
  assert.equal(formatearPorcentajeCreditos(85.5), '85.5 %');
  assert.equal(formatearPorcentajeCreditos('85.50'), '85.5 %');
  assert.equal(formatearPorcentajeCreditos('85.00'), '85 %');
  assert.equal(formatearPorcentajeCreditos('96.01'), '96.01 %');
  assert.equal(formatearPorcentajeCreditos(100), '100 %');
  assert.equal(formatearPorcentajeCreditos(0), '0 %');
  assert.equal(formatearPorcentajeCreditos(null), null);
  assert.equal(formatearPorcentajeCreditos('abc'), null);
});

test('nuevos motivos de bloqueo de datos', () => {
  for (const codigo of ['SIN_CORREO_PERSONAL', 'SIN_PROGRAMA_SISS', 'SIN_PROFESOR_RESPONSABLE', 'CARRERA_NO_RECONOCIDA']) {
    assert.equal(MOTIVOS_BLOQUEO[codigo], codigo);
  }
});

test('cada motivo de bloqueo tiene mensaje', () => {
  for (const codigo of Object.values(MOTIVOS_BLOQUEO)) {
    assert.ok(MENSAJES_BLOQUEO[codigo]?.length > 0, codigo);
  }
});

test('convenciones de documento y firma del envío (fase 6): estado técnico del documento, flujo solo en estado_reporte', () => {
  const shared = require('./reportes.shared');
  assert.equal(shared.TIPO_DOCUMENTO_REPORTE_MENSUAL, 'reporte_mensual');
  assert.equal(shared.ESTADO_DOCUMENTO_VIGENTE, 'vigente');        // técnico: no es revisión ni aprobación
  assert.equal(shared.ESTADO_DOCUMENTO_EN_REVISION, undefined);    // 'en_revision' pertenece a otros flujos, no a Reportes
  assert.equal(shared.TIPO_REVISOR_ALUMNO, 'alumno');              // enum TipoRevisor
  assert.equal(shared.ESTADO_REVISION_FIRMADA, 'aprobado');        // enum EstadoRevision (solo aprobado | rechazado)
  assert.equal(shared.ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, 'pendiente_revision_profesor');
});

test('Reportes solo escribe estado_documento al crear el documento del envío (nunca lo cambia con la revisión)', () => {
  const fs = require('fs');
  const path = require('path');
  const fuentes = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && !/\.test\.js$/.test(f));
  const usan = fuentes.filter((f) => /estado_documento/.test(fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\/\/.*$/gm, '')));
  // Solo los dos envíos crean documentos: el mensual y el global (CU-REP-07).
  assert.deepEqual(usan, ['reportes-envio.service.js', 'reportes-global.service.js']);
  for (const archivo of usan) {
    const codigo = fs.readFileSync(path.join(__dirname, archivo), 'utf8');
    assert.equal(/documento\.update/.test(codigo), false, archivo);
    assert.equal((codigo.match(/estado_documento/g) ?? []).length, 1, archivo);
  }
});

test('el snapshot dias_laborados / horas_reportadas solo se escribe al crear el reporte (primer envío); nada lo recalcula', () => {
  const fs = require('fs');
  const path = require('path');
  const fuentes = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && !/\.(test|fixtures)\.js$/.test(f));
  const escriben = fuentes.filter((f) => /(dias_laborados|horas_reportadas)\s*:/.test(fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\/\/.*$/gm, '')));
  // reportes.tipos.js solo las LEE (`select: { dias_laborados: true }` y el snapshot del mensual); ahí no se escribe ningún valor.
  assert.deepEqual(escriben, ['reportes-envio.service.js', 'reportes.tipos.js']);
  const tipos = fs.readFileSync(path.join(__dirname, 'reportes.tipos.js'), 'utf8').replace(/\/\/.*$/gm, '');
  for (const columna of ['dias_laborados', 'horas_reportadas']) {
    assert.deepEqual([...tipos.matchAll(new RegExp(`${columna}\\s*:\\s*([^,}\\s]+)`, 'g'))].map((m) => m[1]), ['true'], columna);
  }
  const envio = fs.readFileSync(path.join(__dirname, 'reportes-envio.service.js'), 'utf8');
  assert.equal(/reporte_mensual\.update/.test(envio), false);
});

test('colores de las notificaciones de Reportes: rechazo rojo, pendiente amarillo, aprobación final verde, informativa azul', () => {
  assert.deepEqual({ ...TIPOS_NOTIFICACION }, { RECHAZO: 'urgente', PENDIENTE: 'warning', APROBACION_FINAL: 'success', INFORMATIVA: 'info' });
  // Son los tipos que el dashboard pinta (AlertBanner) y que acepta crearNotificacion.
  assert.deepEqual(Object.values(TIPOS_NOTIFICACION).sort(), ['info', 'success', 'urgente', 'warning']);
});

test('todo aviso de Reportes (alumno, profesor, coordinación; mensual y global) usa la tabla de colores y ningún tipo suelto', () => {
  const fs = require('fs');
  const path = require('path');
  const fuentes = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && !/\.(test|fixtures)\.js$/.test(f) && f !== 'reportes.shared.js');
  for (const archivo of fuentes) {
    const codigo = fs.readFileSync(path.join(__dirname, archivo), 'utf8').replace(/\/\/.*$/gm, '');
    assert.equal(/\btipo:\s*(exito\s*\?\s*)?'(info|warning|success|urgente)'/.test(codigo), false, `${archivo}: usa TIPOS_NOTIFICACION en vez de un tipo escrito a mano`);
  }
  // Quien avisa lo hace con la constante (los cuatro servicios que crean avisos).
  const avisan = ['reportes-envio.service.js', 'reportes-correccion.service.js', 'reportes-revision.service.js', 'reportes-validacion.service.js'];
  for (const archivo of avisan) assert.match(fs.readFileSync(path.join(__dirname, archivo), 'utf8'), /TIPOS_NOTIFICACION\./, archivo);
});
