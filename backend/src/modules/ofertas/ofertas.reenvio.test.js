// CU-PRO-05 — corregir y reenviar una oferta rechazada.
//
// Lo que fija este archivo, en orden de importancia:
//
//   1. El CAS. La escritura final estaba condicionada solo al id, y la comprobación de estado vivía
//      fuera de la transacción: si un coordinador aprobaba la oferta en esa ventana, el reenvío
//      pisaba 'aprobada' con 'pendiente_revision' y además le borraba el coordinador_id. Ahora la
//      transición es 'rechazada' → 'pendiente_revision' o nada.
//   2. Que al perder la carrera NO se toquen las carreras ni se emita el socket.
//   3. El entero estricto de cupos: `parseInt` truncaba, así que 2.9 se guardaba como 2.
//   4. La guarda de id del controller, igual que la de /cerrar.
//
// Prisma, redis, notificaciones y sockets se sustituyen ANTES de cargar el servicio, para ejercitar
// la regla real (incluida la de lib/cupos.js) y no una copia.

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearBd, profesor, ofertaProyecto, ofertaIndividual, ocupantes } = require('./ofertas.fakes');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let prismaActual = null;
let bd = null;
const emisiones = [];
const notificaciones = [];

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, { del: async () => {}, get: async () => null, set: async () => {} });
fingir(rutaNotificaciones, { crearNotificacion: async (n) => { notificaciones.push(n); } });
fingir(rutaSocket, {
  emitirAUsuario: (usuarioId, evento, datos) => emisiones.push({ usuarioId, evento, datos }),
});
fingir(rutaPrisma, new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }));

const { reenviarOferta, enteroEstricto } = require('./ofertas.service');
const { postReenviarOferta } = require('./ofertas.controller');

const PROFESOR_ID = 1;
const USUARIO_PROFESOR = 10;
const COORDINADOR = { id: 7, usuario_id: 70 };
const MENSAJE_CARRERA_PERDIDA = 'El estado de esta oferta cambió mientras la consultabas. Vuelve a cargar tus ofertas.';

// Una oferta rechazada y ya decidida por un coordinador: así se puede comprobar que el reenvío
// limpia `coordinador_id` cuando gana, y que NO lo borra cuando pierde la carrera.
const rechazada = (extra = {}) => ({
  ...ofertaProyecto({ estado: 'rechazada' }),
  motivo_rechazo: 'Falta detalle en las actividades.',
  coordinador_id: COORDINADOR.id,
  ...extra,
});

function montar({ ofertas = [rechazada()], cuposTotales = 5, ocupados = 0, deseos = { 1: ['ISC'] } } = {}) {
  const creada = crearBd({
    profesores: [profesor({ cuposTotales })],
    ofertas,
    ocupantes: ocupantes(PROFESOR_ID, ocupados),
    coordinadores: [COORDINADOR],
  });
  bd = creada.bd;
  bd.deseos = { ...deseos };
  prismaActual = creada.prisma;
  emisiones.length = 0;
  notificaciones.length = 0;
  return bd;
}

const datos = (extra = {}) => ({
  nombre_proyecto: 'Sistema corregido',
  descripcion_actividades: 'Nueva descripción de actividades.',
  tipo_oferta: 'proyecto',
  cupos_ofertados: 4,
  carreras: ['ISC', 'IA'],
  ...extra,
});

const ofertaEnBd = (id = 1) => bd.ofertas.find((o) => o.id === id);
const eventos = (nombre) => emisiones.filter((e) => e.evento === nombre);
const escriturasDe = (modelo) => bd.escrituras.filter((e) => e.modelo === modelo);

function resFalso() {
  const r = { statusCode: null, body: null };
  r.status = (codigo) => { r.statusCode = codigo; return r; };
  r.json = (cuerpo) => { r.body = cuerpo; return r; };
  return r;
}

const pedirReenvio = (id, cuerpo = datos(), usuarioId = USUARIO_PROFESOR) => {
  const res = resFalso();
  return postReenviarOferta(
    { usuario: { sub: usuarioId }, params: { id }, body: cuerpo },
    res,
  ).then(() => res);
};

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// 1. CAS: la transición solo aplica si la oferta SIGUE rechazada
// ════════════════════════════════════════════════════════════════════════════

test('CAS: sin interferencia, la transición rechazada → pendiente_revision se aplica', async () => {
  const actualizada = await reenviarOferta(1, PROFESOR_ID, datos());

  assert.equal(actualizada.id, 1, 'misma oferta, no se crea otra');
  assert.equal(actualizada.estado_oferta, 'pendiente_revision');
  assert.equal(ofertaEnBd().estado_oferta, 'pendiente_revision');
  assert.equal(ofertaEnBd().motivo_rechazo, null);
  assert.equal(ofertaEnBd().coordinador_id, null);
});

// El caso que motivó el cambio: Coordinación aprueba justo antes de la escritura.
test('CAS: si un coordinador la aprueba antes de escribir, el reenvío devuelve 409', async () => {
  bd.antesDeEscribir = () => {
    Object.assign(ofertaEnBd(), { estado_oferta: 'aprobada', coordinador_id: COORDINADOR.id, motivo_rechazo: null });
  };

  await assert.rejects(
    () => reenviarOferta(1, PROFESOR_ID, datos()),
    (err) => err.status === 409 && err.message === MENSAJE_CARRERA_PERDIDA,
  );

  const o = ofertaEnBd();
  assert.equal(o.estado_oferta, 'aprobada', 'la aprobación ajena NO se pisa');
  assert.equal(o.coordinador_id, COORDINADOR.id, 'conserva su coordinador');
});

test('CAS: perdida la carrera, NO se tocan las carreras ni se emite el socket', async () => {
  bd.antesDeEscribir = () => { ofertaEnBd().estado_oferta = 'aprobada'; };

  await assert.rejects(() => reenviarOferta(1, PROFESOR_ID, datos()), (err) => err.status === 409);

  assert.deepEqual(bd.deseos[1], ['ISC'], 'el perfil anterior queda intacto');
  assert.deepEqual(escriturasDe('deseo_de_carrera'), [], 'ni borrado ni recreación');
  assert.deepEqual(eventos('oferta:actualizada'), []);
});

test('CAS: perdida la carrera, tampoco se escriben los campos nuevos', async () => {
  bd.antesDeEscribir = () => { ofertaEnBd().estado_oferta = 'cerrada'; };

  await assert.rejects(() => reenviarOferta(1, PROFESOR_ID, datos()), (err) => err.status === 409);

  const o = ofertaEnBd();
  assert.equal(o.estado_oferta, 'cerrada');
  assert.notEqual(o.nombre_proyecto, 'Sistema corregido', 'no quedó el nombre nuevo');
  assert.equal(o.motivo_rechazo, 'Falta detalle en las actividades.', 'ni se limpió el motivo');
});

// Cualquier estado concurrente, no solo 'aprobada'.
test('CAS: ningún otro estado concurrente se pisa', async () => {
  for (const estado of ['aprobada', 'pendiente_revision', 'concluida', 'cerrada']) {
    montar();
    bd.antesDeEscribir = () => { ofertaEnBd().estado_oferta = estado; };

    await assert.rejects(
      () => reenviarOferta(1, PROFESOR_ID, datos()),
      (err) => err.status === 409,
      estado,
    );
    assert.equal(ofertaEnBd().estado_oferta, estado, estado);
  }
});

test('CAS: el where de la escritura exige el estado de origen', async () => {
  await reenviarOferta(1, PROFESOR_ID, datos());

  const cas = escriturasDe('oferta_servicio').find((e) => e.operacion === 'updateMany');
  assert.ok(cas, 'la escritura de estado pasa por updateMany, no por update');
  assert.equal(cas.where.estado_oferta, 'rechazada');
  assert.equal(cas.where.id, 1);
  assert.equal(cas.count, 1);
});

// El orden importa: validar antes de abrir la transacción, y reemplazar carreras solo si el CAS ganó.
test('CAS: el reemplazo de carreras ocurre DESPUÉS del CAS', async () => {
  await reenviarOferta(1, PROFESOR_ID, datos({ carreras: ['LCD'] }));

  const orden = bd.escrituras.map((e) => `${e.modelo}.${e.operacion}`);
  assert.deepEqual(orden, [
    'oferta_servicio.updateMany',
    'deseo_de_carrera.deleteMany',
    'oferta_servicio.update',
  ]);
  assert.deepEqual(bd.deseos[1], ['LCD'], 'el perfil se reemplaza por completo');
});

test('CAS: doble envío — el segundo pierde la carrera y no duplica el aviso', async () => {
  const primero = await reenviarOferta(1, PROFESOR_ID, datos({ nombre_proyecto: 'Envio A' }));
  assert.equal(primero.estado_oferta, 'pendiente_revision');

  await assert.rejects(
    () => reenviarOferta(1, PROFESOR_ID, datos({ nombre_proyecto: 'Envio B' })),
    (err) => err.status === 400 && /ofertas rechazadas/.test(err.message),
    'el segundo ya no la ve rechazada',
  );

  assert.equal(ofertaEnBd().nombre_proyecto, 'Envio A', 'gana el primero');
  assert.equal(eventos('oferta:actualizada').length, 1, 'un solo aviso a Coordinación');
});

// ════════════════════════════════════════════════════════════════════════════
// Lo que el CAS NO debía cambiar
// ════════════════════════════════════════════════════════════════════════════

test('las validaciones siguen corriendo ANTES de abrir la transacción', async () => {
  for (const [nombre, cuerpo, esperado] of [
    ['estado no rechazada', datos(), /ofertas rechazadas/],
    ['campos obligatorios', datos({ nombre_proyecto: '   ' }), /Faltan campos obligatorios/],
    ['tipo inválido', datos({ tipo_oferta: 'grupal' }), /tipo_oferta debe ser/],
    ['sin carreras', datos({ carreras: [] }), /al menos un perfil/],
    ['carrera inválida', datos({ carreras: ['XYZ'] }), /no son válidas/],
  ]) {
    montar({ ofertas: [rechazada({ estado_oferta: nombre === 'estado no rechazada' ? 'aprobada' : 'rechazada' })] });

    await assert.rejects(() => reenviarOferta(1, PROFESOR_ID, cuerpo), (err) => esperado.test(err.message), nombre);
    assert.deepEqual(bd.escrituras, [], `${nombre}: ninguna escritura`);
    assert.deepEqual(eventos('oferta:actualizada'), [], `${nombre}: ningún aviso`);
  }
});

test('el aviso a Coordinación sigue siendo socket, sin notificación persistida', async () => {
  await reenviarOferta(1, PROFESOR_ID, datos());

  const avisos = eventos('oferta:actualizada');
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].usuarioId, COORDINADOR.usuario_id);
  assert.deepEqual(avisos[0].datos, { ofertaId: 1 });
  assert.deepEqual(notificaciones, [], 'el reenvío no crea filas de notificación');
});

test('las reglas de cupos por modalidad no cambian', async () => {
  montar();
  await reenviarOferta(1, PROFESOR_ID, datos({ tipo_oferta: 'individual', cupos_ofertados: undefined }));
  assert.equal(ofertaEnBd().cupos_ofertados, null);
  assert.equal(ofertaEnBd().cupos_disponibles, 1);

  montar({ ofertas: [rechazada(ofertaIndividual({ estado: 'rechazada' }))] });
  await reenviarOferta(1, PROFESOR_ID, datos({ cupos_ofertados: 3 }));
  assert.equal(ofertaEnBd().cupos_ofertados, 3);
  assert.equal(ofertaEnBd().cupos_disponibles, 3);
});

test('la capacidad del profesor sigue bloqueando el reenvío con 409', async () => {
  montar({ cuposTotales: 2, ocupados: 2 });

  await assert.rejects(
    () => reenviarOferta(1, PROFESOR_ID, datos()),
    (err) => err.status === 409 && /Has alcanzado tu capacidad máxima/.test(err.message),
  );
  assert.equal(ofertaEnBd().estado_oferta, 'rechazada');
});

test('un profesor ajeno sigue recibiendo 404, no 403', async () => {
  await assert.rejects(() => reenviarOferta(1, 999, datos()), (err) => err.status === 404);
  assert.equal(ofertaEnBd().estado_oferta, 'rechazada');
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Cupos enteros: `parseInt` truncaba en silencio
// ════════════════════════════════════════════════════════════════════════════

test('enteroEstricto: acepta enteros y cadenas de dígitos', () => {
  assert.equal(enteroEstricto(3), 3);
  assert.equal(enteroEstricto('3'), 3);
  assert.equal(enteroEstricto('  3  '), 3);
  assert.equal(enteroEstricto(0), 0);
  assert.equal(enteroEstricto(-2), -2, 'el signo lo juzga quien llama, con su regla de rango');
});

test('enteroEstricto: rechaza todo lo que parseInt habría truncado', () => {
  for (const valor of [2.9, '2.9', '3abc', '3,5', ' 3 x', 'abc', '', '  ', null, undefined, {}, [], true, NaN, Infinity, '0x10', '1e3']) {
    assert.equal(enteroEstricto(valor), null, JSON.stringify(valor));
  }
});

test('reenviar: un cupos no entero se rechaza con 400 en vez de truncarse', async () => {
  for (const valor of [2.9, '2.9', '3abc', '4.0001']) {
    montar();

    await assert.rejects(
      () => reenviarOferta(1, PROFESOR_ID, datos({ cupos_ofertados: valor })),
      (err) => err.status === 400 && /entero mayor o igual a 2/.test(err.message),
      JSON.stringify(valor),
    );
    assert.equal(ofertaEnBd().estado_oferta, 'rechazada', JSON.stringify(valor));
    assert.deepEqual(bd.escrituras, []);
  }
});

test('reenviar: los mensajes de rango no cambiaron', async () => {
  montar();
  await assert.rejects(
    () => reenviarOferta(1, PROFESOR_ID, datos({ cupos_ofertados: 1 })),
    (err) => err.message === 'Para modalidad proyecto, cupos_ofertados debe ser un entero mayor o igual a 2.',
  );

  montar({ cuposTotales: 5 });
  await assert.rejects(
    () => reenviarOferta(1, PROFESOR_ID, datos({ cupos_ofertados: 99 })),
    (err) => err.message === 'La oferta no puede tener más de 5 cupos.',
  );
});

test('reenviar: un cupos entero válido como cadena sigue funcionando', async () => {
  await reenviarOferta(1, PROFESOR_ID, datos({ cupos_ofertados: '4' }));
  assert.equal(ofertaEnBd().cupos_ofertados, 4);
});

// ════════════════════════════════════════════════════════════════════════════
// 2 y 4. Controller: guarda de id y códigos
// ════════════════════════════════════════════════════════════════════════════

test('controller: un id no numérico responde 400, no 404', async () => {
  for (const id of ['abc', '', 'NaN', 'null', 'undefined', '  ', 'id']) {
    montar();

    const res = await pedirReenvio(id);

    assert.equal(res.statusCode, 400, JSON.stringify(id));
    assert.equal(res.body.message, 'El identificador de la oferta no es válido.');
    assert.equal(ofertaEnBd().estado_oferta, 'rechazada', 'no se tocó nada');
    assert.deepEqual(bd.escrituras, []);
  }
});

test('controller: una oferta inexistente sigue respondiendo 404', async () => {
  const res = await pedirReenvio('999');

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Oferta no encontrada.');
});

test('controller: sin perfil de profesor, 404 propio', async () => {
  const res = await pedirReenvio('1', datos(), 999);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Perfil de profesor no encontrado.');
});

test('controller: un reenvío válido responde 200 con la oferta pendiente', async () => {
  const res = await pedirReenvio('1');

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Oferta reenviada exitosamente.');
  assert.equal(res.body.oferta.id, 1);
  assert.equal(res.body.oferta.estado_oferta, 'pendiente_revision');
  assert.equal(res.body.oferta.deseo_de_carrera, undefined, 'la fila que sale al HTTP no lleva relaciones');
});

test('controller: perdida la carrera del CAS, responde 409 con el mensaje del servicio', async () => {
  bd.antesDeEscribir = () => { ofertaEnBd().estado_oferta = 'aprobada'; };

  const res = await pedirReenvio('1');

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, MENSAJE_CARRERA_PERDIDA);
});
