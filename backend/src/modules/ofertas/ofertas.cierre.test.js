// CU-PRO-04 — cierre de ofertas: conclusión AUTOMÁTICA (individual y proyecto) y cierre MANUAL.
//
// El foco de estas pruebas es UNO: cuál es el hito de LSS a partir del cual el alumno ya concluyó y
// deja de sostener la oferta. Ese hito es `solicitud_constancia_termino` — el punto en que
// Coordinación ya aprobó su expediente de liberación (CU-LSS-09) y el alumno pidió su constancia.
//
// Y son DOS estados, no uno: el proceso de LSS sigue a `constancia_disponible` cuando Coordinación
// emite la constancia (CU-LSS-11). Varias pruebas de aquí existen específicamente para cazar la
// regresión de tratar el hito como un único valor, que haría que un alumno liberara su lugar al
// pedir la constancia y lo RE-OCUPARA al recibirla.
//
// Prisma, redis y las notificaciones se sustituyen ANTES de cargar el servicio, para que la regla
// que se ejercita sea la REAL (incluida la de lib/cupos.js), no una copia.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let bd = null;
const notificaciones = [];
const cacheInvalidada = [];
// Gancho para simular una escritura concurrente: se dispara dentro del updateMany del cron.
let antesDeEscribir = null;

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, { del: async (clave) => { cacheInvalidada.push(clave); } });
fingir(rutaNotificaciones, { crearNotificacion: async (n) => { notificaciones.push(n); } });
fingir(rutaSocket, { emitirAUsuario: () => {} });

// Prisma falso: solo los dos modelos que tocan estas dos funciones.
fingir(rutaPrisma, {
  oferta_servicio: {
    findMany: async ({ where }) => bd.ofertas
      .filter((o) => o.estado_oferta === where.estado_oferta)
      .map(expandirOferta),
    findUnique: async ({ where }) => {
      const o = bd.ofertas.find((x) => x.id === where.id);
      return o ? expandirOferta(o) : null;
    },
    update: async ({ where, data }) => {
      const o = bd.ofertas.find((x) => x.id === where.id);
      Object.assign(o, data);
      return { ...o };
    },
    // Aplica el `where` COMPLETO, incluido el estado de origen: así el test ejercita la guarda CAS
    // real y no una versión permisiva. `antesDeEscribir` permite simular que otro actor cambió la
    // oferta justo entre la lectura del cron y su escritura.
    updateMany: async ({ where, data }) => {
      if (antesDeEscribir) antesDeEscribir();
      const afectadas = bd.ofertas.filter((o) => (
        o.id === where.id
        && (where.estado_oferta === undefined || o.estado_oferta === where.estado_oferta)
      ));
      for (const o of afectadas) Object.assign(o, data);
      return { count: afectadas.length };
    },
  },
});

const { revisarConclusionAutomatica, cerrarOfertaManual } = require('./ofertas.service');
const { HITO_LSS_LIBERA_CUPO, ESTADOS_LSS_LIBERAN_CUPO } = require('../../lib/cupos');

const PROFESOR_ID = 1;
const USUARIO_PROFESOR = 10;

// Une la oferta con sus solicitudes y el liberacion_proceso de cada una, como hace el `include` real.
function expandirOferta(oferta) {
  return {
    ...oferta,
    profesor: { id: PROFESOR_ID, usuario_id: USUARIO_PROFESOR, usuario: { id: USUARIO_PROFESOR } },
    solicitud_registro: bd.solicitudes
      .filter((s) => s.oferta_id === oferta.id)
      .map((s) => ({
        ...s,
        // `liberacion` en el fixture es el ESTADO; null significa "el alumno nunca inició LSS", que
        // en Prisma llega como relación ausente.
        liberacion_proceso: s.liberacion === null ? null : { estado: s.liberacion },
      })),
  };
}

const oferta = ({ id = 1, tipo = 'individual', estado = 'aprobada', disponibles = 0 } = {}) => ({
  id,
  profesor_id: PROFESOR_ID,
  tipo_oferta: tipo,
  estado_oferta: estado,
  cupos_disponibles: disponibles,
  nombre_proyecto: `Proyecto ${id}`,
});

// `estado` por omisión es 'alumno_asignado': está en ESTADOS_QUE_OCUPAN_CUPO_PROFESOR, así que la
// solicitud cuenta como alumno activo de la oferta.
const solicitud = ({ id = 1, ofertaId = 1, estado = 'alumno_asignado', liberacion = null } = {}) => ({
  id, oferta_id: ofertaId, estado_solicitud: estado, liberacion,
});

function montar({ ofertas = [oferta()], solicitudes = [] } = {}) {
  bd = { ofertas, solicitudes };
  notificaciones.length = 0;
  cacheInvalidada.length = 0;
  antesDeEscribir = null;
}

const ofertaEnBd = (id = 1) => bd.ofertas.find((o) => o.id === id);

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// El hito compartido
// ════════════════════════════════════════════════════════════════════════════

test('hay UN solo hito de liberación: solicitud_constancia_termino', () => {
  assert.equal(HITO_LSS_LIBERA_CUPO, 'solicitud_constancia_termino');
});

// El segundo valor de la lista NO es un hito: es el estado al que LSS avanza después (CU-LSS-11) y
// que solo conserva la condición de "ya liberado", para que el alumno no vuelva a contarse.
test('la lista añade al hito el estado posterior que conserva la liberación', () => {
  assert.deepEqual(ESTADOS_LSS_LIBERAN_CUPO, [HITO_LSS_LIBERA_CUPO, 'constancia_disponible']);
  assert.equal(ESTADOS_LSS_LIBERAN_CUPO[0], HITO_LSS_LIBERA_CUPO, 'el hito va primero');
});

// Los fakes de Bajas y Características REPLICAN el criterio de lib/cupos.js porque se cargan antes
// de que su test sustituya el prisma global. Si algún día se desincronizan, falla aquí.
test('los fakes de Bajas y Características replican EXACTAMENTE el criterio real', () => {
  const bajas = require('../administrativa/bajas/bajas.fakes');
  const caracteristicas = require('../administrativa/caracteristicas/caracteristicas.fakes');
  assert.deepEqual(bajas.ESTADOS_LSS_LIBERAN_CUPO, ESTADOS_LSS_LIBERAN_CUPO);
  assert.deepEqual(caracteristicas.ESTADOS_LSS_LIBERAN_CUPO, ESTADOS_LSS_LIBERAN_CUPO);
});

// ════════════════════════════════════════════════════════════════════════════
// Conclusión automática — oferta INDIVIDUAL
// ════════════════════════════════════════════════════════════════════════════

test('automática individual: concluye cuando su único alumno está en solicitud_constancia_termino', async () => {
  montar({ solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })] });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
  assert.equal(notificaciones.length, 1, 'se avisa al profesor');
  assert.equal(notificaciones[0].usuarioId, USUARIO_PROFESOR);
  assert.ok(cacheInvalidada.length > 0, 'se invalida la caché de ofertas');
});

// Regresión: con un hito de un solo valor, este alumno volvería a ocupar y la oferta ya no concluiría.
test('automática individual: SIGUE concluyendo con el alumno ya en constancia_disponible', async () => {
  montar({ solicitudes: [solicitud({ liberacion: 'constancia_disponible' })] });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
});

test('automática individual: NO concluye si el expediente todavía está en revisión', async () => {
  montar({ solicitudes: [solicitud({ liberacion: 'expediente_en_revision' })] });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
  assert.equal(notificaciones.length, 0);
});

test('automática individual: NO concluye si el alumno nunca inició su liberación', async () => {
  montar({ solicitudes: [solicitud({ liberacion: null })] });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

test('automática individual: NO concluye si la oferta todavía tiene lugares disponibles', async () => {
  montar({
    ofertas: [oferta({ disponibles: 1 })],
    solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })],
  });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

test('automática individual: NO concluye sin alumnos activos', async () => {
  montar({ solicitudes: [] });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

test('automática individual: NO concluye con DOS alumnos activos (exige exactamente uno)', async () => {
  montar({
    solicitudes: [
      solicitud({ id: 1, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 2, liberacion: 'solicitud_constancia_termino' }),
    ],
  });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

// ════════════════════════════════════════════════════════════════════════════
// Conclusión automática — oferta DE PROYECTO
// ════════════════════════════════════════════════════════════════════════════

test('automática proyecto: concluye cuando TODOS sus alumnos activos están liberados', async () => {
  montar({
    ofertas: [oferta({ tipo: 'proyecto' })],
    solicitudes: [
      solicitud({ id: 1, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 2, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 3, liberacion: 'solicitud_constancia_termino' }),
    ],
  });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
});

// Regresión: el caso más realista de un proyecto — cada alumno avanza a su ritmo, así que unos ya
// tienen su constancia y otros solo la pidieron. Con un hito de un solo valor esto NUNCA concluiría.
test('automática proyecto: concluye con alumnos repartidos entre los DOS estados liberadores', async () => {
  montar({
    ofertas: [oferta({ tipo: 'proyecto' })],
    solicitudes: [
      solicitud({ id: 1, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 2, liberacion: 'constancia_disponible' }),
    ],
  });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
});

test('automática proyecto: NO concluye si UNO solo sigue sin liberar', async () => {
  montar({
    ofertas: [oferta({ tipo: 'proyecto' })],
    solicitudes: [
      solicitud({ id: 1, liberacion: 'constancia_disponible' }),
      solicitud({ id: 2, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 3, liberacion: 'expediente_en_revision' }),
    ],
  });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

test('automática proyecto: NO concluye una oferta llena pero sin ningún alumno activo', async () => {
  montar({ ofertas: [oferta({ tipo: 'proyecto' })], solicitudes: [] });

  assert.equal(await revisarConclusionAutomatica(), 0);
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});

// Una solicitud rechazada no está en ESTADOS_QUE_OCUPAN_CUPO_PROFESOR: no es alumno activo y por lo
// tanto no impide concluir.
test('automática proyecto: las solicitudes rechazadas no cuentan como alumnos activos', async () => {
  montar({
    ofertas: [oferta({ tipo: 'proyecto' })],
    solicitudes: [
      solicitud({ id: 1, liberacion: 'solicitud_constancia_termino' }),
      solicitud({ id: 2, estado: 'rechazada_por_cupos', liberacion: null }),
    ],
  });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
});

// ════════════════════════════════════════════════════════════════════════════
// Conclusión automática — alcance
// ════════════════════════════════════════════════════════════════════════════

test('automática: solo revisa ofertas aprobadas', async () => {
  for (const estado of ['pendiente_revision', 'rechazada', 'cerrada', 'concluida']) {
    montar({
      ofertas: [oferta({ estado })],
      solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })],
    });

    assert.equal(await revisarConclusionAutomatica(), 0, `no debe tocar una oferta ${estado}`);
    assert.equal(ofertaEnBd().estado_oferta, estado, 'la oferta conserva su estado');
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Concurrencia — guarda CAS del cron
//
// Entre el findMany del inicio y el update pueden pasar minutos. El cron solo puede aplicar la
// transición 'aprobada' → 'concluida', y solo si la oferta SIGUE en 'aprobada' al escribir.
// ════════════════════════════════════════════════════════════════════════════

test('CAS: si el profesor la cierra a mano mientras el cron revisa, gana el cierre manual', async () => {
  montar({ solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })] });

  // El profesor cierra la oferta justo antes de que el cron escriba.
  antesDeEscribir = () => { ofertaEnBd().estado_oferta = 'cerrada'; };

  assert.equal(await revisarConclusionAutomatica(), 0, 'no cuenta una conclusión que no ocurrió');
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada', 'NO se pisa la decisión del profesor');
  assert.equal(notificaciones.length, 0, 'no se avisa de una conclusión que no pasó');
  assert.equal(cacheInvalidada.length, 0);
});

test('CAS: tampoco pisa un estado concurrente distinto de cerrada', async () => {
  for (const estadoConcurrente of ['rechazada', 'pendiente_revision', 'concluida']) {
    montar({ solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })] });
    antesDeEscribir = () => { ofertaEnBd().estado_oferta = estadoConcurrente; };

    assert.equal(await revisarConclusionAutomatica(), 0);
    assert.equal(ofertaEnBd().estado_oferta, estadoConcurrente, `no debe pisar ${estadoConcurrente}`);
  }
});

test('CAS: si nadie interfiere, la transición aprobada → concluida sí se aplica', async () => {
  montar({ solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })] });

  assert.equal(await revisarConclusionAutomatica(), 1);
  assert.equal(ofertaEnBd().estado_oferta, 'concluida');
  assert.equal(notificaciones.length, 1);
});

// ════════════════════════════════════════════════════════════════════════════
// Cierre MANUAL (mismo camino para individual y proyecto: no hay rama por tipo_oferta)
// ════════════════════════════════════════════════════════════════════════════

for (const tipo of ['individual', 'proyecto']) {
  test(`manual ${tipo}: se puede cerrar si el único alumno ya está liberado`, async () => {
    montar({
      ofertas: [oferta({ tipo, disponibles: 1 })],
      solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })],
    });

    const r = await cerrarOfertaManual(1, PROFESOR_ID);

    assert.equal(r.estado_oferta, 'cerrada');
    assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
  });

  test(`manual ${tipo}: tampoco lo impide un alumno ya en constancia_disponible`, async () => {
    montar({
      ofertas: [oferta({ tipo, disponibles: 1 })],
      solicitudes: [solicitud({ liberacion: 'constancia_disponible' })],
    });

    await cerrarOfertaManual(1, PROFESOR_ID);
    assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
  });

  test(`manual ${tipo}: NO se puede cerrar con un alumno todavía en curso`, async () => {
    montar({
      ofertas: [oferta({ tipo, disponibles: 1 })],
      solicitudes: [solicitud({ liberacion: 'expediente_en_revision' })],
    });

    await assert.rejects(
      () => cerrarOfertaManual(1, PROFESOR_ID),
      (err) => err.status === 400 && /solicitudes o alumnos activos/.test(err.message),
    );
    assert.equal(ofertaEnBd().estado_oferta, 'aprobada', 'la oferta no cambia');
  });
}

test('manual: un alumno sin proceso de liberación sigue impidiendo el cierre', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [solicitud({ liberacion: null })] });

  await assert.rejects(
    () => cerrarOfertaManual(1, PROFESOR_ID),
    (err) => err.status === 400,
  );
});

test('manual: las solicitudes rechazadas no impiden el cierre', async () => {
  montar({
    ofertas: [oferta({ disponibles: 1 })],
    solicitudes: [
      solicitud({ id: 1, estado: 'rechazada_definitivamente' }),
      solicitud({ id: 2, estado: 'rechazada_por_cupos' }),
      solicitud({ id: 3, estado: 'rechazada_por_profesor' }),
    ],
  });

  await cerrarOfertaManual(1, PROFESOR_ID);
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
});

// Condición inversa a la de la conclusión automática: una oferta LLENA no se cierra a mano, se
// concluye. Las dos vías son mutuamente excluyentes por diseño.
test('manual: una oferta llena NO se puede cerrar a mano', async () => {
  montar({
    ofertas: [oferta({ disponibles: 0 })],
    solicitudes: [solicitud({ liberacion: 'solicitud_constancia_termino' })],
  });

  await assert.rejects(
    () => cerrarOfertaManual(1, PROFESOR_ID),
    (err) => err.status === 400 && /todos sus cupos ocupados/.test(err.message),
  );
});

test('manual: solo se cierran ofertas aprobadas', async () => {
  for (const estado of ['pendiente_revision', 'rechazada', 'cerrada', 'concluida']) {
    montar({ ofertas: [oferta({ estado, disponibles: 1 })], solicitudes: [] });

    await assert.rejects(
      () => cerrarOfertaManual(1, PROFESOR_ID),
      (err) => err.status === 400 && /Aprobadas/.test(err.message),
    );
  }
});

test('manual: un profesor ajeno recibe 404, no 403 (no se revela que la oferta existe)', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  await assert.rejects(
    () => cerrarOfertaManual(1, 999),
    (err) => err.status === 404,
  );
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
});
