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
const fs = require('fs');
const path = require('path');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let bd = null;
const notificaciones = [];
const cacheInvalidada = [];
// Eventos de socket emitidos, en orden: { usuarioId, evento, datos }.
const emisiones = [];
// Gancho para simular una escritura concurrente: se dispara dentro del updateMany del cron.
let antesDeEscribir = null;
// Gancho para simular una escritura concurrente en el CAS del cierre MANUAL (`update` no se usa ya).
let antesDeCerrar = null;
// Interruptores de fallo: los avisos del proyecto son fail-open y hay que poder comprobarlo.
let notificacionFalla = false;
let socketFalla = false;
// `redis.del` revienta en las llamadas cuyo número 1-indexado esté en esta lista; 'todas' falla
// siempre. Permite distinguir "falló la caché de la primera oferta" de "falla la de todas".
let cacheFallaEnLlamadas = [];
let llamadasACache = 0;

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, {
  del: async (clave) => {
    llamadasACache += 1;
    if (cacheFallaEnLlamadas === 'todas' || cacheFallaEnLlamadas.includes(llamadasACache)) {
      throw new Error('fallo simulado de Redis');
    }
    cacheInvalidada.push(clave);
  },
});
fingir(rutaNotificaciones, {
  crearNotificacion: async (n) => {
    if (notificacionFalla) throw new Error('fallo simulado al notificar');
    notificaciones.push(n);
  },
});
fingir(rutaSocket, {
  emitirAUsuario: (usuarioId, evento, datos) => {
    if (socketFalla) throw new Error('fallo simulado al emitir');
    emisiones.push({ usuarioId, evento, datos });
  },
});

// Prisma falso: solo los dos modelos que tocan estas dos funciones.
fingir(rutaPrisma, {
  oferta_servicio: {
    findMany: async ({ where }) => bd.ofertas
      .filter((o) => o.estado_oferta === where.estado_oferta)
      .map(expandirOferta),
    findUnique: async ({ where, include }) => {
      const o = bd.ofertas.find((x) => x.id === where.id);
      if (!o) return null;
      // Honra el `include` igual que Prisma: sin él no se devuelven relaciones. Así se puede
      // comprobar que la relectura posterior al CAS del cierre manual no arrastra solicitudes.
      return include ? expandirOferta(o) : { ...o };
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
      if (antesDeCerrar && data.estado_oferta === 'cerrada') antesDeCerrar();
      const afectadas = bd.ofertas.filter((o) => (
        o.id === where.id
        && (where.estado_oferta === undefined || o.estado_oferta === where.estado_oferta)
      ));
      for (const o of afectadas) Object.assign(o, data);
      return { count: afectadas.length };
    },
  },
  // El cierre manual avisa a Coordinación con el mismo helper que el registro y la decisión.
  coordinador: { findMany: async () => bd.coordinadores },
  // El controller resuelve el perfil del profesor por usuario_id antes de llamar al servicio.
  profesor: {
    findUnique: async ({ where }) => (
      where.usuario_id === USUARIO_PROFESOR ? { id: PROFESOR_ID, usuario_id: USUARIO_PROFESOR } : null
    ),
  },
});

const { revisarConclusionAutomatica, cerrarOfertaManual } = require('./ofertas.service');
const { postCerrarOferta } = require('./ofertas.controller');
const { HITO_LSS_LIBERA_CUPO, ESTADOS_LSS_LIBERAN_CUPO } = require('../../lib/cupos');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../gr/gr.shared');

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

const oferta = ({ id = 1, tipo = 'individual', estado = 'aprobada', disponibles = 0, profesorId = PROFESOR_ID } = {}) => ({
  id,
  profesor_id: profesorId,
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

const COORDINADOR = { id: 7, usuario_id: 70 };

function montar({ ofertas = [oferta()], solicitudes = [], coordinadores = [COORDINADOR] } = {}) {
  bd = { ofertas, solicitudes, coordinadores };
  notificaciones.length = 0;
  cacheInvalidada.length = 0;
  emisiones.length = 0;
  antesDeEscribir = null;
  antesDeCerrar = null;
  notificacionFalla = false;
  socketFalla = false;
  cacheFallaEnLlamadas = [];
  llamadasACache = 0;
}

// `res` mínimo de Express, igual que en ofertas.campos-obligatorios.test.js.
function resFalso() {
  const r = { statusCode: null, body: null };
  r.status = (codigo) => { r.statusCode = codigo; return r; };
  r.json = (cuerpo) => { r.body = cuerpo; return r; };
  return r;
}

const pedirCierre = (id, usuarioId = USUARIO_PROFESOR) => {
  const res = resFalso();
  return postCerrarOferta({ usuario: { sub: usuarioId }, params: { id } }, res).then(() => res);
};

const eventos = (nombre) => emisiones.filter((e) => e.evento === nombre);

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

// ════════════════════════════════════════════════════════════════════════════
// Cierre MANUAL — criterio de "alumno activo"
//
// El criterio pasó de una lista NEGRA de los tres estados de rechazo a la lista BLANCA
// ESTADOS_QUE_OCUPAN_CUPO_PROFESOR, que es la que ya usaban el conteo de cupos, la conclusión
// automática de arriba y el `alumnosActivos` que recibe el frontend. La lista negra contaba como
// alumno activo a cualquier solicitud que no fuera ni rechazo ni ocupante, y esos estados existen.
// ════════════════════════════════════════════════════════════════════════════

test('el criterio de alumno activo es la MISMA lista que usa la conclusión automática', () => {
  // Ancla de regresión: si alguien vuelve a introducir una lista local de estados en el cierre
  // manual, esta prueba no lo detecta sola — pero sí fija cuáles son los dos grupos relevantes.
  assert.ok(ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes('aceptada_por_profesor'));
  assert.ok(ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes('alumno_asignado'));
  assert.ok(!ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes('modificar_reenviar'),
    'modificar_reenviar NO ocupa lugar: por eso no debe impedir el cierre');
  assert.ok(!ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes('rechazada_definitivamente'));
});

// `modificar_reenviar` existe en datos reales y era el caso que rompía: el frontend mostraba el
// botón (usa la lista blanca) y el backend respondía 400.
test('manual: modificar_reenviar ya NO cuenta como alumno activo', async () => {
  montar({
    ofertas: [oferta({ disponibles: 1 })],
    solicitudes: [solicitud({ estado: 'modificar_reenviar' })],
  });

  const r = await cerrarOfertaManual(1, PROFESOR_ID);

  assert.equal(r.estado_oferta, 'cerrada');
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
});

test('manual: tampoco lo impide una solicitud en un estado previo a la aceptación', async () => {
  // Cualquier estado fuera de la lista blanca y fuera de los rechazos: el alumno no ocupa lugar.
  for (const estado of ['enviada', 'pendiente_revision_profesor', 'modificar_reenviar']) {
    montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [solicitud({ estado })] });

    await cerrarOfertaManual(1, PROFESOR_ID);
    assert.equal(ofertaEnBd().estado_oferta, 'cerrada', estado);
  }
});

// La otra mitad de la regla: lo que sí ocupa lugar sigue bloqueando.
test('manual: TODOS los estados que ocupan cupo siguen impidiendo el cierre', async () => {
  for (const estado of ESTADOS_QUE_OCUPAN_CUPO_PROFESOR) {
    montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [solicitud({ estado })] });

    await assert.rejects(
      () => cerrarOfertaManual(1, PROFESOR_ID),
      (err) => err.status === 400 && /solicitudes o alumnos activos/.test(err.message),
      estado,
    );
    assert.equal(ofertaEnBd().estado_oferta, 'aprobada', estado);
  }
});

test('manual: los tres estados de rechazo siguen sin impedir el cierre', async () => {
  for (const estado of ['rechazada_definitivamente', 'rechazada_por_cupos', 'rechazada_por_profesor']) {
    montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [solicitud({ estado })] });

    await cerrarOfertaManual(1, PROFESOR_ID);
    assert.equal(ofertaEnBd().estado_oferta, 'cerrada', estado);
  }
});

// El filtro de liberación se mantiene: un alumno que ocupa lugar pero ya concluyó no bloquea.
test('manual: un alumno que ocupa lugar pero ya se liberó sigue permitiendo el cierre', async () => {
  for (const liberacion of ESTADOS_LSS_LIBERAN_CUPO) {
    montar({
      ofertas: [oferta({ disponibles: 1 })],
      solicitudes: [solicitud({ estado: 'alumno_asignado', liberacion })],
    });

    await cerrarOfertaManual(1, PROFESOR_ID);
    assert.equal(ofertaEnBd().estado_oferta, 'cerrada', liberacion);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Cierre MANUAL — CAS
//
// Antes era un `update` por id, sin condición de estado: si el cron concluía la oferta entre la
// lectura y la escritura, el cierre manual pisaba 'concluida' con 'cerrada'. Los dos valores NO son
// equivalentes: LSS exige 'concluida' para liberar al alumno de una oferta individual.
// ════════════════════════════════════════════════════════════════════════════

test('CAS manual: si el cron la concluye entre la validación y la escritura, gana concluida', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });
  antesDeCerrar = () => { ofertaEnBd().estado_oferta = 'concluida'; };

  await assert.rejects(
    () => cerrarOfertaManual(1, PROFESOR_ID),
    (err) => err.status === 409 && /cambió mientras la consultabas/.test(err.message),
  );

  assert.equal(ofertaEnBd().estado_oferta, 'concluida', 'el cierre manual NO pisa la conclusión');
});

test('CAS manual: tampoco pisa un cierre concurrente de otra sesión del mismo profesor', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });
  antesDeCerrar = () => { ofertaEnBd().estado_oferta = 'cerrada'; };

  await assert.rejects(
    () => cerrarOfertaManual(1, PROFESOR_ID),
    (err) => err.status === 409,
  );
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
});

test('CAS manual: perdida la carrera, no se avisa a Coordinación ni se invalida la caché', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });
  antesDeCerrar = () => { ofertaEnBd().estado_oferta = 'concluida'; };

  await assert.rejects(() => cerrarOfertaManual(1, PROFESOR_ID), (err) => err.status === 409);

  assert.deepEqual(eventos('oferta:actualizada'), []);
  assert.deepEqual(cacheInvalidada, []);
});

test('CAS manual: si nadie interfiere, la transición aprobada → cerrada sí se aplica', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  const r = await cerrarOfertaManual(1, PROFESOR_ID);

  assert.equal(r.estado_oferta, 'cerrada');
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
  assert.deepEqual(cacheInvalidada, ['cache:ofertas']);
});

// ════════════════════════════════════════════════════════════════════════════
// Cierre MANUAL — aviso a Coordinación
// Mismo evento y mismo helper que el registro, el reenvío y la decisión (CU-PRO-03).
// ════════════════════════════════════════════════════════════════════════════

test('manual: un cierre exitoso emite oferta:actualizada a Coordinación', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  await cerrarOfertaManual(1, PROFESOR_ID);

  const avisos = eventos('oferta:actualizada');
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].usuarioId, COORDINADOR.usuario_id);
  assert.deepEqual(avisos[0].datos, { ofertaId: 1 });
});

test('manual: avisa a TODOS los coordinadores, sin excluir a ninguno', async () => {
  const otro = { id: 8, usuario_id: 80 };
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [], coordinadores: [COORDINADOR, otro] });

  await cerrarOfertaManual(1, PROFESOR_ID);

  assert.deepEqual(
    eventos('oferta:actualizada').map((e) => e.usuarioId).sort(),
    [COORDINADOR.usuario_id, otro.usuario_id],
  );
});

test('manual: NO crea ninguna notificación (el cierre lo provoca el propio profesor)', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  await cerrarOfertaManual(1, PROFESOR_ID);

  assert.deepEqual(notificaciones, []);
});

// Fail-open: el cierre ya está confirmado en BD, así que un fallo del aviso no puede revertirlo.
test('manual: un fallo del socket NO revierte el cierre ni hace fallar la operación', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });
  socketFalla = true;

  const r = await cerrarOfertaManual(1, PROFESOR_ID);

  assert.equal(r.estado_oferta, 'cerrada');
  assert.equal(ofertaEnBd().estado_oferta, 'cerrada');
});

// ════════════════════════════════════════════════════════════════════════════
// Conclusión automática — fail-open de la notificación
//
// Sin el try/catch, un fallo al notificar la primera oferta salía de la función y abortaba la
// pasada: las ofertas restantes se quedaban sin revisar hasta el día siguiente.
// ════════════════════════════════════════════════════════════════════════════

const dosConcluibles = () => montar({
  ofertas: [oferta({ id: 1 }), oferta({ id: 2 })],
  solicitudes: [
    solicitud({ id: 1, ofertaId: 1, liberacion: HITO_LSS_LIBERA_CUPO }),
    solicitud({ id: 2, ofertaId: 2, liberacion: HITO_LSS_LIBERA_CUPO }),
  ],
});

test('automática: un fallo al notificar NO impide procesar las ofertas siguientes', async () => {
  dosConcluibles();
  notificacionFalla = true;

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 2, 'las dos se cuentan: la conclusión ocurrió');
  assert.equal(ofertaEnBd(1).estado_oferta, 'concluida');
  assert.equal(ofertaEnBd(2).estado_oferta, 'concluida', 'antes se quedaba en aprobada');
});

test('automática: un fallo al notificar NO revierte la conclusión ya persistida', async () => {
  montar({
    ofertas: [oferta({ id: 1 })],
    solicitudes: [solicitud({ id: 1, ofertaId: 1, liberacion: HITO_LSS_LIBERA_CUPO })],
  });
  notificacionFalla = true;

  await revisarConclusionAutomatica();

  assert.equal(ofertaEnBd(1).estado_oferta, 'concluida');
  assert.deepEqual(notificaciones, [], 'la notificación efectivamente falló');
});

test('automática: con las notificaciones sanas sigue notificando una vez por oferta', async () => {
  dosConcluibles();

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 2);
  assert.equal(notificaciones.length, 2);
  assert.equal(eventos('oferta:concluida').length, 2);
});

test('automática: un fallo del socket tampoco revierte la conclusión', async () => {
  dosConcluibles();
  socketFalla = true;

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 2);
  assert.equal(ofertaEnBd(1).estado_oferta, 'concluida');
  assert.equal(ofertaEnBd(2).estado_oferta, 'concluida');
});

// ════════════════════════════════════════════════════════════════════════════
// POST /ofertas/:id/cerrar — códigos del controller
// ════════════════════════════════════════════════════════════════════════════

test('controller: un id no numérico responde 400, no 404', async () => {
  for (const id of ['abc', '', 'NaN', 'null', 'undefined', '  ', 'id']) {
    montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

    const res = await pedirCierre(id);

    assert.equal(res.statusCode, 400, JSON.stringify(id));
    assert.equal(res.body.message, 'El identificador de la oferta no es válido.');
    assert.equal(ofertaEnBd().estado_oferta, 'aprobada', 'no se tocó nada');
  }
});

test('controller: una oferta inexistente sigue respondiendo 404', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  const res = await pedirCierre('999');

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Oferta no encontrada.');
});

test('controller: una oferta ajena sigue oculta como 404', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  // Usuario sin perfil de profesor: el controller corta antes, con su propio 404.
  const sinPerfil = await pedirCierre('1', 999);
  assert.equal(sinPerfil.statusCode, 404);
  assert.equal(sinPerfil.body.message, 'Perfil de profesor no encontrado.');

  // Y la oferta de otro profesor: 404 sin revelar que existe.
  montar({ ofertas: [oferta({ disponibles: 1, profesorId: 999 })], solicitudes: [] });
  const ajena = await pedirCierre('1');
  assert.equal(ajena.statusCode, 404);
  assert.equal(ajena.body.message, 'Oferta no encontrada.');
});

test('controller: un cierre válido responde 200 con la oferta ya cerrada', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });

  const res = await pedirCierre('1');

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Oferta cerrada exitosamente.');
  assert.equal(res.body.oferta.estado_oferta, 'cerrada');
  // La fila que sale al HTTP no arrastra el `include` de solicitudes.
  assert.equal(res.body.oferta.solicitud_registro, undefined);
});

test('controller: perdida la carrera del CAS, responde 409 con el mensaje del servicio', async () => {
  montar({ ofertas: [oferta({ disponibles: 1 })], solicitudes: [] });
  antesDeCerrar = () => { ofertaEnBd().estado_oferta = 'concluida'; };

  const res = await pedirCierre('1');

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /cambió mientras la consultabas/);
});

// ════════════════════════════════════════════════════════════════════════════
// Conclusión automática — fallo de caché
//
// `invalidarCacheOfertas` ya absorbe sus propios errores (el try/catch vive dentro del helper, no en
// el bucle), así que un Redis caído NO puede abortar la pasada. Estas pruebas FIJAN esa garantía:
// si alguien quitara ese try/catch, la excepción saldría del bucle y las ofertas restantes se
// quedarían sin revisar — exactamente el defecto que tenía la notificación.
// ════════════════════════════════════════════════════════════════════════════

test('automática: si falla la invalidación de caché, la oferta queda concluida', async () => {
  montar({
    ofertas: [oferta({ id: 1 })],
    solicitudes: [solicitud({ id: 1, ofertaId: 1, liberacion: HITO_LSS_LIBERA_CUPO })],
  });
  cacheFallaEnLlamadas = 'todas';

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 1, 'la conclusión se cuenta: el CAS ya la persistió');
  assert.equal(ofertaEnBd(1).estado_oferta, 'concluida');
  assert.deepEqual(cacheInvalidada, [], 'la invalidación efectivamente falló');
});

test('automática: aunque falle la caché de una oferta, se procesan las siguientes', async () => {
  dosConcluibles();
  cacheFallaEnLlamadas = [1]; // solo la primera oferta de la pasada

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 2);
  assert.equal(ofertaEnBd(1).estado_oferta, 'concluida');
  assert.equal(ofertaEnBd(2).estado_oferta, 'concluida', 'la segunda no se queda sin revisar');
  assert.deepEqual(cacheInvalidada, ['cache:ofertas'], 'la segunda sí invalidó');
});

test('automática: fallando TODAS las cachés, las dos ofertas igual concluyen', async () => {
  dosConcluibles();
  cacheFallaEnLlamadas = 'todas';

  assert.equal(await revisarConclusionAutomatica(), 2);
  assert.deepEqual(bd.ofertas.map((o) => o.estado_oferta), ['concluida', 'concluida']);
});

test('automática: cuando la caché funciona, se invalida una vez por oferta concluida', async () => {
  dosConcluibles();

  await revisarConclusionAutomatica();

  assert.deepEqual(cacheInvalidada, ['cache:ofertas', 'cache:ofertas']);
});

// Los tres efectos posteriores son independientes: que falle uno no debe arrastrar a los otros.
test('automática: un fallo de caché NO altera notificaciones ni sockets', async () => {
  dosConcluibles();
  cacheFallaEnLlamadas = 'todas';

  await revisarConclusionAutomatica();

  assert.equal(notificaciones.length, 2, 'se notifica igual');
  assert.equal(eventos('oferta:concluida').length, 2, 'se emite igual');
});

test('automática: fallando caché, notificación y socket a la vez, la conclusión persiste', async () => {
  dosConcluibles();
  cacheFallaEnLlamadas = 'todas';
  notificacionFalla = true;
  socketFalla = true;

  const concluidas = await revisarConclusionAutomatica();

  assert.equal(concluidas, 2, 'los tres avisos son fail-open; el CAS es lo único crítico');
  assert.deepEqual(bd.ofertas.map((o) => o.estado_oferta), ['concluida', 'concluida']);
  assert.deepEqual(cacheInvalidada, []);
  assert.deepEqual(notificaciones, []);
  assert.deepEqual(eventos('oferta:concluida'), []);
});

// ════════════════════════════════════════════════════════════════════════════
// ESTADOS_RECHAZO_SOLICITUD — conservada como referencia, NO como criterio
// ════════════════════════════════════════════════════════════════════════════

test('ESTADOS_RECHAZO_SOLICITUD está declarada pero NO se usa en ninguna parte', () => {
  const fuente = fs.readFileSync(path.join(__dirname, 'ofertas.service.js'), 'utf8');

  const apariciones = fuente.match(/ESTADOS_RECHAZO_SOLICITUD/g) || [];
  assert.equal(apariciones.length, 1, 'debe aparecer SOLO en su declaración, sin ningún uso');
  assert.match(fuente, /const ESTADOS_RECHAZO_SOLICITUD = \[/);

  // Y el criterio vigente de alumno activo es la lista blanca, en los dos sitios que lo evalúan.
  const usosListaBlanca = fuente.match(/ESTADOS_QUE_OCUPAN_CUPO_PROFESOR\.includes/g) || [];
  assert.equal(usosListaBlanca.length, 2, 'cierre manual y conclusión automática');
});

// La regla de negocio que la constante documenta sigue valiendo, pero ahora por omisión de la lista
// blanca, no por pertenencia a la lista negra.
test('los tres estados de rechazo no están en la lista blanca de ocupación', () => {
  for (const estado of ['rechazada_definitivamente', 'rechazada_por_cupos', 'rechazada_por_profesor']) {
    assert.ok(!ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(estado), estado);
  }
});
