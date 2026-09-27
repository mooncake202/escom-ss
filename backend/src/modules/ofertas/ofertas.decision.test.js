// CU-PRO-02 — decisión de Coordinación sobre una oferta, con foco en UNA invariante:
//
//   cupos_ofertados <= cupos_totales VIGENTES en el instante de aprobar.
//
// El tope de la oferta se fija al crearla (ofertas.controller.js) o al reenviarla (reenviarOferta)
// contra la capacidad de ESE momento. Entre ese momento y la aprobación, ADM puede aprobar un
// cambio de característica que baje `profesor.cupos_totales`; Características, por diseño, jamás
// toca oferta_servicio. Sin revalidar aquí, una oferta de proyecto se publicaría prometiendo más
// lugares de los que podrán llenarse.
//
// Dos reglas que estas pruebas blindan y que conviene no confundir:
//   · La validación de capacidad existente (ocupados vs cupos_totales) compara OTRAS magnitudes y
//     sigue intacta: la de aquí es ADICIONAL.
//   · El RECHAZO nunca queda bloqueado por esta guarda — rechazar es precisamente la salida correcta
//     cuando la oferta ya no cabe.
//
// Prisma, redis, notificaciones y sockets se sustituyen ANTES de cargar el servicio, para que la
// regla que se ejercita sea la REAL (incluida la de lib/cupos.js), no una copia.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  crearBd, profesor, ofertaProyecto, ofertaIndividual, ocupantes, ESTADOS_LSS_LIBERAN_CUPO,
} = require('./ofertas.fakes');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let prismaActual = null;
let bd = null;
const notificaciones = [];
const emitidos = [];

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, { del: async () => {} });

// Gancho para simular que la notificación persistente falla DESPUÉS de que la decisión ya se
// confirmó: se asigna desde el test y se limpia en `montar`. Mismo recurso que `bd.antesDelLock`
// del fake de prisma.
let fallaNotificacion = null;
fingir(rutaNotificaciones, {
  crearNotificacion: async (n) => {
    if (fallaNotificacion) throw fallaNotificacion;
    notificaciones.push(n);
  },
});
fingir(rutaSocket, {
  emitirAUsuario: (usuarioId, evento, datos) => { emitidos.push({ usuarioId, evento, datos }); },
  emitirATodosLosCoordinadores: () => {},
});

// El módulo cacheado delega en la BD del test en curso.
fingir(rutaPrisma, new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }));

const servicio = require('./ofertas.service');
const cupos = require('../../lib/cupos');

const COORDINADOR_ID = 7;
const DATOS_APROBACION = { programaSISS: 'Programa de apoyo académico', actividadSISS: 'Desarrollo de software' };

function montar({ profesores = [profesor()], ofertas = [], ocupados = [] } = {}) {
  const creada = crearBd({ profesores, ofertas, ocupantes: ocupados });
  bd = creada.bd;
  prismaActual = creada.prisma;
  notificaciones.length = 0;
  emitidos.length = 0;
  fallaNotificacion = null;
  return bd;
}

const ofertaEnBd = (id = 1) => bd.ofertas.find((o) => o.id === id);

test.beforeEach(() => { montar(); });

// El fake copia esta lista a mano porque se carga antes de sustituir prisma; si lib/cupos.js
// cambiara el hito, esta prueba avisa en vez de dejar el fake mintiendo en silencio.
test('PRO-02: el fake usa los mismos estados de liberación que lib/cupos.js', () => {
  assert.deepEqual(ESTADOS_LSS_LIBERAN_CUPO, cupos.ESTADOS_LSS_LIBERAN_CUPO);
});

// ════════════════════════════════════════════════════════════════════════════
// La invariante cupos_ofertados <= cupos_totales al APROBAR
// ════════════════════════════════════════════════════════════════════════════

test('PRO-02: proyecto que excede la capacidad vigente → 409 y sigue pendiente_revision', async () => {
  // Al crearla el profesor tenía 8 cupos y la oferta fue válida; luego ADM le bajó la capacidad a 5
  // (sin tocar la oferta, por diseño de Características) y nadie ocupa cupo todavía.
  montar({
    profesores: [profesor({ cuposTotales: 5 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 8 })],
  });

  await assert.rejects(
    servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID),
    (err) => err.status === 409 && /8 cupos/.test(err.message) && /capacidad actual/.test(err.message),
  );

  // Nada cambió: la oferta sigue esperando decisión, sin SISS y sin coordinador asignado.
  assert.equal(ofertaEnBd().estado_oferta, 'pendiente_revision');
  assert.equal(ofertaEnBd().programa_SISS, null);
  assert.equal(ofertaEnBd().nombre_SISS, null);
  assert.equal(ofertaEnBd().coordinador_id, null);
  assert.equal(ofertaEnBd().cupos_ofertados, 8, 'la guarda no reescribe el tope de la oferta');

  // Ni se notificó al profesor ni se emitió nada: no hubo aprobación.
  assert.deepEqual(notificaciones, []);
  assert.deepEqual(emitidos, []);
});

test('PRO-02: proyecto que cabe en la capacidad vigente → aprueba con normalidad', async () => {
  montar({
    profesores: [profesor({ cuposTotales: 5 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 5 })],
  });

  const resultado = await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID);

  // El límite es `>`: ofertados == capacidad SÍ se aprueba.
  assert.equal(resultado.estado_oferta, 'aprobada');
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
  assert.equal(ofertaEnBd().programa_SISS, DATOS_APROBACION.programaSISS);
  assert.equal(ofertaEnBd().nombre_SISS, DATOS_APROBACION.actividadSISS);
  assert.equal(ofertaEnBd().coordinador_id, COORDINADOR_ID);
  assert.equal(ofertaEnBd().motivo_rechazo, null);

  // El resto del flujo de aprobación sigue ocurriendo igual que antes del cambio.
  assert.equal(notificaciones.length, 1);
  assert.equal(notificaciones[0].usuarioId, 10);
  assert.equal(notificaciones[0].tipo, 'success');
  assert.equal(emitidos.length, 1);
  assert.deepEqual(emitidos[0].datos, { ofertaId: 1, resultado: 'aprobada' });
});

test('PRO-02: individual se aprueba aunque la capacidad sea la mínima — cupos_ofertados NULL no entra a la comparación', async () => {
  // Doble garantía de la exclusión: tipo 'individual' Y cupos_ofertados NULL. Si la guarda comparara
  // el NULL (o lo tratara como 0 o como NaN) esta aprobación fallaría o pasaría por accidente.
  montar({
    profesores: [profesor({ cuposTotales: 3 })],
    ofertas: [ofertaIndividual()],
    ocupados: ocupantes(1, 2),
  });

  const resultado = await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID);

  assert.equal(resultado.estado_oferta, 'aprobada');
  assert.equal(ofertaEnBd().cupos_ofertados, null, 'la aprobación no inventa un tope para la individual');
  assert.equal(ofertaEnBd().cupos_disponibles, 1);
});

test('PRO-02: una oferta sobredimensionada SÍ puede rechazarse — la guarda no bloquea el rechazo', async () => {
  montar({
    profesores: [profesor({ cuposTotales: 5 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 8 })],
  });

  // Primero falla la aprobación...
  await assert.rejects(
    servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID),
    (err) => err.status === 409,
  );

  // ...y el coordinador puede resolverla rechazándola, con su propio motivo.
  const resultado = await servicio.decidirOferta(
    1, 'rechazar', 'Excede tu capacidad actual: redúcela a 5 cupos y reenvíala.', null, COORDINADOR_ID,
  );

  assert.equal(resultado.estado_oferta, 'rechazada');
  assert.equal(ofertaEnBd().motivo_rechazo, 'Excede tu capacidad actual: redúcela a 5 cupos y reenvíala.');
  assert.equal(ofertaEnBd().coordinador_id, COORDINADOR_ID);
  // El rechazo en sí no toma el lock del profesor: no lee capacidad. El único lock registrado es el
  // de la aprobación que falló antes.
  assert.equal(bd.locks.length, 1);
});

// ════════════════════════════════════════════════════════════════════════════
// Concurrencia: el lock cubre la lectura de cupos_totales
// ════════════════════════════════════════════════════════════════════════════

test('PRO-02: la aprobación bloquea la fila del profesor ANTES de cualquier escritura', async () => {
  montar({
    profesores: [profesor({ cuposTotales: 5 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 5 })],
  });

  await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID);

  assert.equal(bd.locks.length, 1, 'se tomó exactamente un SELECT ... FOR UPDATE');
  assert.equal(bd.locks[0].profesorId, 1, 'se bloqueó la fila del profesor dueño de la oferta');
  assert.equal(bd.locks[0].escriturasPrevias, 0, 'el lock fue la PRIMERA sentencia: ninguna escritura lo precedió');
  // Y la escritura de la aprobación ocurrió después, dentro de la misma transacción.
  assert.equal(bd.escrituras.length, 1);
  assert.equal(bd.escrituras[0].modelo, 'oferta_servicio');
  assert.equal(bd.escrituras[0].operacion, 'updateMany');
});

test('PRO-02: la guarda compara contra el cupos_totales leído BAJO el lock, no contra otra lectura', async () => {
  montar({
    profesores: [profesor({ cuposTotales: 8 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 8 })],
  });

  // ADM aprueba un cambio de característica que baja la capacidad justo antes de que la transacción
  // tome el lock: lo que la guarda debe ver es 5, no el 8 que ya se había leído con la oferta.
  bd.antesDelLock = () => { bd.profesores[0].cupos_totales = 5; };

  await assert.rejects(
    servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID),
    (err) => err.status === 409 && /es de 5/.test(err.message),
  );

  assert.equal(ofertaEnBd().estado_oferta, 'pendiente_revision');
});

// ════════════════════════════════════════════════════════════════════════════
// La validación preexistente (ocupados vs capacidad) no cambió
// ════════════════════════════════════════════════════════════════════════════

test('PRO-02: profesor con la capacidad llena sigue siendo rechazado por la validación existente', async () => {
  montar({
    profesores: [profesor({ cuposTotales: 3 })],
    ofertas: [ofertaProyecto({ cuposOfertados: 3 })],
    ocupados: ocupantes(1, 3),
  });

  await assert.rejects(
    servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID),
    (err) => err.status === 409 && /capacidad máxima/.test(err.message),
  );

  assert.equal(ofertaEnBd().estado_oferta, 'pendiente_revision');
  // Falla antes de la transacción: no llega a tomar el lock.
  assert.deepEqual(bd.locks, []);
});

// ════════════════════════════════════════════════════════════════════════════
// La notificación es un efecto secundario FAIL-OPEN
// ════════════════════════════════════════════════════════════════════════════
//
// La decisión se confirma dentro de la transacción; la notificación persistente y el socket vienen
// después. Si la notificación falla, la decisión YA está escrita: no puede revertirse ni reportarse
// como fallida. Mismo criterio que REP (`avisarUsuario`), ADM/Bajas (`avisarAlAlumno`) y
// ADM/Características (`avisarAlProfesor`).

test('PRO-02: aprobar con notificación exitosa → se aprueba, se notifica y se emite', async () => {
  montar({ profesores: [profesor({ cuposTotales: 5 })], ofertas: [ofertaProyecto({ cuposOfertados: 5 })] });

  const resultado = await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID);

  assert.equal(resultado.estado_oferta, 'aprobada');
  assert.equal(notificaciones.length, 1);
  assert.equal(notificaciones[0].usuarioId, 10);
  assert.equal(notificaciones[0].tipo, 'success');
  assert.equal(emitidos.length, 1);
  assert.deepEqual(emitidos[0].datos, { ofertaId: 1, resultado: 'aprobada' });
});

test('PRO-02: aprobar con la notificación caída → la aprobación SIGUE siendo exitosa', async () => {
  montar({ profesores: [profesor({ cuposTotales: 5 })], ofertas: [ofertaProyecto({ cuposOfertados: 5 })] });
  fallaNotificacion = new Error('la tabla notificacion no responde');

  const resultado = await servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID);

  // No lanza: antes de la corrección, esta llamada rechazaba y el coordinador veía un 500.
  assert.equal(resultado.estado_oferta, 'aprobada');
  assert.deepEqual(notificaciones, [], 'la notificación no se persistió');

  // La decisión ya confirmada NO se revierte ni cambia.
  assert.equal(ofertaEnBd().estado_oferta, 'aprobada');
  assert.equal(ofertaEnBd().programa_SISS, DATOS_APROBACION.programaSISS);
  assert.equal(ofertaEnBd().nombre_SISS, DATOS_APROBACION.actividadSISS);
  assert.equal(ofertaEnBd().coordinador_id, COORDINADOR_ID);
  assert.equal(ofertaEnBd().motivo_rechazo, null);

  // El resto de los efectos secundarios continúa: el socket sí se emite.
  assert.equal(emitidos.length, 1);
  assert.deepEqual(emitidos[0].datos, { ofertaId: 1, resultado: 'aprobada' });
});

test('PRO-02: rechazar con notificación exitosa → se rechaza, se notifica y se emite', async () => {
  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })] });

  const resultado = await servicio.decidirOferta(1, 'rechazar', 'Faltan actividades concretas.', null, COORDINADOR_ID);

  assert.equal(resultado.estado_oferta, 'rechazada');
  assert.equal(notificaciones.length, 1);
  assert.equal(notificaciones[0].tipo, 'urgente');
  assert.match(notificaciones[0].mensaje, /fue rechazada/);
  assert.equal(emitidos.length, 1);
  assert.deepEqual(emitidos[0].datos, { ofertaId: 1, resultado: 'rechazada' });
});

test('PRO-02: rechazar con la notificación caída → el rechazo SIGUE siendo exitoso', async () => {
  montar({ ofertas: [ofertaProyecto({ cuposOfertados: 3 })] });
  fallaNotificacion = new Error('la tabla notificacion no responde');

  const resultado = await servicio.decidirOferta(1, 'rechazar', 'Faltan actividades concretas.', null, COORDINADOR_ID);

  assert.equal(resultado.estado_oferta, 'rechazada');
  assert.deepEqual(notificaciones, []);

  // La decisión ya confirmada NO se revierte ni cambia.
  assert.equal(ofertaEnBd().estado_oferta, 'rechazada');
  assert.equal(ofertaEnBd().motivo_rechazo, 'Faltan actividades concretas.');
  assert.equal(ofertaEnBd().coordinador_id, COORDINADOR_ID);

  assert.equal(emitidos.length, 1);
  assert.deepEqual(emitidos[0].datos, { ofertaId: 1, resultado: 'rechazada' });
});

// El fail-open es POSTERIOR a las validaciones: lo que debe fallar antes de escribir sigue
// fallando, y en ese caso no se notifica nada porque no hubo decisión.
test('PRO-02: una notificación caída no convierte en éxito una decisión que debe fallar', async () => {
  montar({ profesores: [profesor({ cuposTotales: 5 })], ofertas: [ofertaProyecto({ cuposOfertados: 8 })] });
  fallaNotificacion = new Error('la tabla notificacion no responde');

  await assert.rejects(
    servicio.decidirOferta(1, 'aprobar', null, DATOS_APROBACION, COORDINADOR_ID),
    (err) => err.status === 409,
    'la guarda de capacidad sigue rechazando',
  );

  assert.equal(ofertaEnBd().estado_oferta, 'pendiente_revision');
  assert.deepEqual(notificaciones, []);
  assert.deepEqual(emitidos, [], 'sin decisión no hay aviso');
});
