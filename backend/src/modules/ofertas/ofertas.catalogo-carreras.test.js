// Ofertas y el catálogo de carreras: el valor que el cliente manda llega al lookup SIN
// transformarse, en los dos caminos de escritura (crear CU-PRO-01 y reenviar CU-PRO-05 Flujo A).
//
// Por qué importa: el selector obtiene sus opciones de GET /ofertas/perfiles, que devuelve las filas
// reales de `carrera`. Cualquier traducción en el camino de escritura solo puede alejar el valor de
// lo que la tabla contiene, y ya rompió el flujo dos veces en direcciones opuestas:
//   · IIA → IA  rompía las bases con 'IIA'
//   · IA  → IIA rompía las bases con 'IA'
// De ahí la prueba de DOBLE CATÁLOGO: el mismo flujo debe funcionar con una base en 'IA' y con una
// en 'IIA', que es la demostración de que el código no depende de una traducción en NINGUNA
// dirección. La sigla de presentación (IIA) vive en el frontend y no debe contaminar el payload.
//
// Alcance: solo el manejo del código de carrera. No se cubre CU-PRO-01/05 en general.

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearBd, profesor, ofertaProyecto, CATALOGO_CARRERAS } = require('./ofertas.fakes');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaRedis = require.resolve('../../lib/redis');
const rutaNotificaciones = require.resolve('../notificaciones/notificaciones.service');
const rutaSocket = require.resolve('../../sockets/socket.server');

let prismaActual = null;
let bd = null;

const fingir = (ruta, exports) => {
  require.cache[ruta] = { id: ruta, filename: ruta, loaded: true, exports };
};

fingir(rutaRedis, { del: async () => {} });
fingir(rutaNotificaciones, { crearNotificacion: async () => {} });
fingir(rutaSocket, { emitirAUsuario: () => {}, emitirATodosLosCoordinadores: () => {} });
fingir(rutaPrisma, new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }));

const { reenviarOferta, listarPerfilesDisponibles } = require('./ofertas.service');
const { solicitarRegistroOferta } = require('./ofertas.controller');

const USUARIO_PROFESOR = 10;

// Los dos catálogos que existen hoy entre las bases del equipo. El código lógico es 'IA'; 'IIA' es
// la base que todavía no recibió el UPDATE.
const CATALOGO_IA = [{ id: 1, nombre: 'ISC' }, { id: 2, nombre: 'LCD' }, { id: 3, nombre: 'IA' }];
const CATALOGO_IIA = [{ id: 1, nombre: 'ISC' }, { id: 2, nombre: 'LCD' }, { id: 3, nombre: 'IIA' }];

function montar({ ofertas = [], carreras = CATALOGO_IA } = {}) {
  const creada = crearBd({ profesores: [profesor()], ofertas, ocupantes: [], carreras });
  bd = creada.bd;
  prismaActual = creada.prisma;
  return bd;
}

function resFalso() {
  const r = { statusCode: null, body: null };
  r.status = (codigo) => { r.statusCode = codigo; return r; };
  r.json = (cuerpo) => { r.body = cuerpo; return r; };
  return r;
}

const datosOferta = (carreras) => ({
  nombre_proyecto: 'Sistema de seguimiento académico',
  descripcion_actividades: 'Desarrollo y pruebas del módulo de seguimiento.',
  tipo_oferta: 'proyecto',
  cupos_ofertados: 3,
  carreras,
});

const crear = (carreras) => {
  const res = resFalso();
  return solicitarRegistroOferta(
    { usuario: { sub: USUARIO_PROFESOR }, body: datosOferta(carreras) },
    res,
  ).then(() => res);
};

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// Doble catálogo: el flujo no depende de ninguna traducción
// ════════════════════════════════════════════════════════════════════════════

for (const { etiqueta, catalogo, codigoIA } of [
  { etiqueta: "base en 'IA' (código lógico)", catalogo: CATALOGO_IA, codigoIA: 'IA' },
  { etiqueta: "base en 'IIA' (legado, sin UPDATE aún)", catalogo: CATALOGO_IIA, codigoIA: 'IIA' },
]) {
  test(`crear — ${etiqueta}: el valor del catálogo llega al lookup sin transformarse`, async () => {
    montar({ carreras: catalogo });

    const res = await crear(['ISC', codigoIA]);

    assert.deepEqual(bd.consultasCarrera, [['ISC', codigoIA]], 'se buscó el valor LITERAL recibido');
    assert.equal(res.statusCode, 201);
    assert.equal(bd.ofertas.length, 1);
  });

  test(`reenviar — ${etiqueta}: el valor del catálogo llega al lookup sin transformarse`, async () => {
    montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })], carreras: catalogo });

    const actualizada = await reenviarOferta(1, 1, datosOferta([codigoIA]));

    assert.deepEqual(bd.consultasCarrera, [[codigoIA]], 'se buscó el valor LITERAL recibido');
    assert.equal(actualizada.estado_oferta, 'pendiente_revision');

    // Se conecta el id de la fila real del catálogo, no un id inventado.
    const idEsperado = catalogo.find((c) => c.nombre === codigoIA).id;
    const update = bd.escrituras.find((e) => e.operacion === 'update');
    assert.deepEqual(update.data.deseo_de_carrera.create, [{ carrera: { connect: { id: idEsperado } } }]);
  });

  test(`perfiles — ${etiqueta}: el endpoint del selector devuelve el catálogo tal cual`, async () => {
    montar({ carreras: catalogo });

    const perfiles = await listarPerfilesDisponibles();

    assert.deepEqual(perfiles.map((p) => p.nombre).sort(), catalogo.map((c) => c.nombre).sort());
  });
}

// ════════════════════════════════════════════════════════════════════════════
// La regresión concreta: 'IA' no se convierte en 'IIA' antes de buscar
// ════════════════════════════════════════════════════════════════════════════

test("crear: con catálogo 'IA', mandar 'IA' NO busca 'IIA' — la oferta se registra", async () => {
  montar({ carreras: CATALOGO_IA });

  const res = await crear(['IA']);

  assert.deepEqual(bd.consultasCarrera, [['IA']]);
  assert.ok(!JSON.stringify(bd.consultasCarrera).includes('IIA'), 'la sigla de presentación no llegó al lookup');
  assert.equal(res.statusCode, 201, 'si alguien reintrodujera la conversión, esto sería 400');
});

test("reenviar: con catálogo 'IA', mandar 'IA' NO busca 'IIA' — el reenvío pasa", async () => {
  montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })], carreras: CATALOGO_IA });

  const actualizada = await reenviarOferta(1, 1, datosOferta(['IA']));

  assert.deepEqual(bd.consultasCarrera, [['IA']]);
  assert.equal(actualizada.estado_oferta, 'pendiente_revision');
});

// La sigla de presentación es exclusiva del frontend: si llegara en el payload, el backend NO debe
// inventarse una traducción para salvarla — tiene que fallar, porque no es un código del catálogo.
test("crear: con catálogo 'IA', mandar la sigla de presentación 'IIA' da 400 y no crea nada", async () => {
  montar({ carreras: CATALOGO_IA });

  const res = await crear(['IIA']);

  assert.deepEqual(bd.consultasCarrera, [['IIA']], 'ni siquiera se intenta traducir');
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /no son válidas/);
  assert.equal(bd.ofertas.length, 0);
});

test('crear: un código inexistente sigue dando 400 y no crea nada', async () => {
  const res = await crear(['XYZ']);

  assert.deepEqual(bd.consultasCarrera, [['XYZ']]);
  assert.equal(res.statusCode, 400);
  assert.equal(bd.ofertas.length, 0);
});

// El catálogo por defecto del fake debe ser el código LÓGICO: si volviera a 'IIA', las pruebas de
// arriba seguirían pasando por casualidad y dejarían de proteger nada.
test("el catálogo por defecto del fake usa el código lógico 'IA'", () => {
  assert.deepEqual(CATALOGO_CARRERAS.map((c) => c.nombre).sort(), ['IA', 'ISC', 'LCD']);
});
