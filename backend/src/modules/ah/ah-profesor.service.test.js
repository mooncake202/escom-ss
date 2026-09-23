// Prisma falso: no hay BD ni escrituras. Mismo patrón que ah-alumno.service.test.js: se reemplaza la entrada de
// require.cache de lib/prisma por un Proxy ANTES de requerir el servicio, así que todo módulo que haga
// require('../../lib/prisma') (ah-profesor.service.js y notificaciones.service.js) recibe la misma base falsa.
// Cero cambios de producción para poder probar esto.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');
let bd = null;
require.cache[rutaPrisma] = {
  id: rutaPrisma,
  filename: rutaPrisma,
  loaded: true,
  exports: new Proxy({}, { get: (_target, prop) => bd[prop] }),
};

const ahProfesorService = require('./ah-profesor.service');
const { LIMITE_HORAS_SERVICIO } = require('./ah.shared');

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);

/**
 * Escenario base: bitácora `rechazada` de un alumno. La recuperación rechazada → aprobada NO depende de reportes
 * mensuales (no hay condición de periodo/envío) — comportamiento restaurado tras revertir Bloque 5.
 */
function crearEscenario(opciones = {}) {
  const {
    estadoBitacora = 'rechazada',
    horasContabilizadas = 3,
    cumulo = { alumno_id: '2022630001', horas_acumuladas: 40, horas_rechazadas: 4 },
  } = opciones;

  const profesor = { id: 60, usuario_id: 99 };
  const bitacoraFila = {
    id: 500,
    estado: estadoBitacora,
    fecha_registro: utc('2025-10-20'),
    horas_contabilizadas: horasContabilizadas,
    motivo_rechazo: 'Evidencia incompleta',
    solicitud_registro_id: 42,
    solicitud_registro: {
      id: 42,
      alumno_id: '2022630001',
      oferta: { profesor_id: 60 },
      alumno: { usuario_id: 7, usuario: { nombre: 'ANA', apellidos: 'GARCIA LOPEZ' } },
    },
  };

  let notifExistente = null;

  bd = {
    profesor: { findUnique: async () => profesor },
    bitacora: {
      findUnique: async () => bitacoraFila,
      update: async ({ data }) => { Object.assign(bitacoraFila, data); return bitacoraFila; },
    },
    cumulo_horas_y_faltas: {
      findUnique: async () => cumulo,
      update: async ({ data }) => {
        if (data.horas_rechazadas?.decrement !== undefined) cumulo.horas_rechazadas -= data.horas_rechazadas.decrement;
        return cumulo;
      },
    },
    notificacion: {
      findFirst: async () => notifExistente,
      create: async ({ data }) => { notifExistente = { id: 1, leida: false, ...data }; return notifExistente; },
      update: async ({ data }) => { Object.assign(notifExistente, data); return notifExistente; },
    },
    $transaction: async (ops) => Promise.all(ops),
  };

  return { bitacoraFila, cumulo };
}

test('rechazada: permite recuperar a aprobada', async () => {
  const { bitacoraFila } = crearEscenario();
  const r = await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500);
  assert.deepEqual(r, { estado: 'aprobada', requiereConfirmacion: false });
  assert.equal(bitacoraFila.estado, 'aprobada');
});

test('la recuperación conserva horas_contabilizadas', async () => {
  const { bitacoraFila } = crearEscenario({ horasContabilizadas: 3 });
  await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500);
  assert.equal(bitacoraFila.horas_contabilizadas, 3, 'no se toca: ni se recalcula ni se pone a HORAS_POR_JORNADA');
});

test('actualiza correctamente estado y cúmulo: limpia motivo_rechazo, registra revisor/fecha, decrementa horas_rechazadas (horas_acumuladas NO cambia)', async () => {
  const { bitacoraFila, cumulo } = crearEscenario({ horasContabilizadas: 3, cumulo: { alumno_id: '2022630001', horas_acumuladas: 40, horas_rechazadas: 4 } });
  await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500);
  assert.equal(bitacoraFila.motivo_rechazo, null);
  assert.equal(bitacoraFila.revisado_por_id, 60);
  assert.ok(bitacoraFila.fecha_revision instanceof Date);
  // horas_acumuladas ya sumó esta jornada en confirmarBitacora y nunca se restó al rechazar: aquí no se toca.
  assert.equal(cumulo.horas_acumuladas, 40);
  assert.equal(cumulo.horas_rechazadas, 1, '4 - 3 (las horas de esta bitácora) = 1');
});

test('estados distintos de rechazada no adquieren esta transición', async () => {
  for (const estado of ['aprobada', 'en_curso', 'pendiente_datos', 'pendiente_revision']) {
    crearEscenario({ estadoBitacora: estado });
    await assert.rejects(
      () => ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500),
      (err) => err.status === 409 && /no está en estado rechazada/.test(err.message),
      estado,
    );
  }
});

test('si las horas netas del alumno ya estaban en el límite, pide confirmación en vez de bloquear (comportamiento previo, sin cambios)', async () => {
  const { bitacoraFila } = crearEscenario({
    cumulo: { alumno_id: '2022630001', horas_acumuladas: LIMITE_HORAS_SERVICIO, horas_rechazadas: 0 },
  });
  const sinConfirmar = await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500);
  assert.deepEqual(sinConfirmar, {
    requiereConfirmacion: true,
    mensaje: 'Este alumno ya había completado sus 480 horas de servicio antes de esta aprobación. ¿Deseas continuar de todos modos?',
  });
  assert.equal(bitacoraFila.estado, 'rechazada', 'no se aplicó el cambio todavía');

  const confirmado = await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(99, 500, true);
  assert.deepEqual(confirmado, { estado: 'aprobada', requiereConfirmacion: false });
  assert.equal(bitacoraFila.estado, 'aprobada');
});
