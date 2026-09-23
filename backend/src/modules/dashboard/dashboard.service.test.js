// Resumen del dashboard: la parte de reportes del alumno y la característica vigente del
// profesor. Prisma falso (el servicio usa el prisma global).

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');
const consultasReporte = [];
const consultasProfesor = [];
let reportes = [];
let alumno = null;
let profesor = null;

// Cualquier consulta ajena a esta prueba responde vacía; reporte_mensual.count aplica el filtro recibido.
const modelo = (nombre) => new Proxy({}, {
  get: (_, operacion) => async (args = {}) => {
    if (nombre === 'alumno' && operacion === 'findUnique') return alumno;
    if (nombre === 'profesor' && operacion === 'findUnique') {
      consultasProfesor.push(args);
      return profesor;
    }
    if (nombre === 'reporte_mensual' && operacion === 'count') {
      consultasReporte.push(args.where);
      return reportes.filter((r) => Object.entries(args.where).every(([campo, valor]) => r[campo] === valor)).length;
    }
    if (operacion === 'count') return 0;
    if (operacion === 'findMany') return [];
    return null;
  },
});
require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, nombreModelo) => (typeof nombreModelo === 'string' ? modelo(nombreModelo) : undefined) }),
};

const { resumenAlumno, resumenProfesor } = require('./dashboard.service');

const reporte = (id, numero, estado, solicitud = 42) => ({ id, num_reporte: numero, solicitud_registro_id: solicitud, estado_reporte: estado });

const perfilProfesor = (caracteristica) => ({
  id: 10, departamento: 'Sistemas Computacionales', cubiculo: 'A-1', cupos_totales: 3, caracteristica,
});

test.beforeEach(() => {
  consultasReporte.length = 0;
  consultasProfesor.length = 0;
  profesor = null;
  alumno = {
    boleta: '2022630001',
    cumulo_horas_y_faltas: { horas_acumuladas: 8, horas_rechazadas: 0, faltas_acumuladas: 0, faltas_consecutivas: 0 },
    solicitud_registro: { id: 42, oferta: { nombre_proyecto: 'Proyecto X' }, periodo_registro: null },
  };
});

test('reportesAprobados cuenta SOLO los aprobados por coordinación (aprobado_coordinador)', async () => {
  reportes = [
    reporte(1, 1, 'aprobado_coordinador'),
    reporte(2, 2, 'aprobado_coordinador'),
    reporte(3, 3, 'pendiente_revision_profesor'),
    reporte(4, 4, 'rechazado_profesor'),
    reporte(5, 5, 'pendiente_revision_coordinador'),
    reporte(6, 6, 'rechazado_coordinador'),
    reporte(7, 1, 'aprobado_coordinador', 99), // de otra solicitud: no cuenta
  ];
  const resumen = await resumenAlumno(7);

  assert.equal(resumen.reportesAprobados, 2);
  assert.deepEqual(consultasReporte, [{ solicitud_registro_id: 42, estado_reporte: 'aprobado_coordinador' }]);
});

test('un reporte recién enviado (pendiente de revisión del profesor) no cuenta como aprobado', async () => {
  reportes = [reporte(1, 1, 'pendiente_revision_profesor')];
  assert.equal((await resumenAlumno(7)).reportesAprobados, 0);
});

test('el nombre anterior desaparece: la respuesta ya no trae reportesEnviados', async () => {
  reportes = [reporte(1, 1, 'aprobado_coordinador')];
  const resumen = await resumenAlumno(7);
  assert.equal('reportesEnviados' in resumen, false);
  assert.equal(resumen.reportesAprobados, 1);
});

test('sin solicitud: reportesAprobados en 0 (y sin reportesEnviados)', async () => {
  alumno = null;
  const resumen = await resumenAlumno(7);
  assert.equal(resumen.reportesAprobados, 0);
  assert.equal('reportesEnviados' in resumen, false);
});

// ── Característica vigente del profesor ───────────────────────────────────
// Sale de profesor.caracteristica (0..1), no del historial de solicitud_caracteristica.
// El contrato de salida sigue siendo un arreglo para no romper al frontend.

test('profesor con característica: arreglo de un elemento, con el nombre legible', async () => {
  profesor = perfilProfesor({ id: 4, nombre: 'Jefe_de_departamento', incremento_cupos: 3 });

  const resumen = await resumenProfesor(7);

  assert.deepEqual(resumen.caracteristicas, ['Jefe de departamento']);
  // Ya no se consulta el historial de solicitudes.
  assert.deepEqual(consultasProfesor[0].include, { caracteristica: true });
});

test('profesor de base: arreglo vacío, no null', async () => {
  profesor = perfilProfesor(null);

  const resumen = await resumenProfesor(7);

  assert.deepEqual(resumen.caracteristicas, []);
});

test('sin perfil de profesor: arreglo vacío', async () => {
  profesor = null;
  assert.deepEqual((await resumenProfesor(7)).caracteristicas, []);
});
