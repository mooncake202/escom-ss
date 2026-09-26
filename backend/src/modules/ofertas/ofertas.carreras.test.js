// Alias legado de carrera en Ofertas: el cliente puede mandar el código viejo "IA" y la tabla
// `carrera` guarda "IIA". El alias traduce la ENTRADA antes de buscar en el catálogo.
//
// Alcance deliberadamente estrecho: estas pruebas cubren SOLO el alias y los dos puntos donde se
// aplica (el findMany de creación y el de reenvío). CU-PRO-01 y CU-PRO-05 siguen sin cobertura
// general; ese hueco es anterior y más amplio.
//
// Lo que se afirma en los dos puntos es el `nombre.in` que LLEGÓ a carrera.findMany, porque es el
// único lugar observable donde el alias actúa: si alguien quitara el .map(), el valor buscado
// volvería a ser "IA" y estas pruebas fallarían.

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

const { normalizarNombreCarrera } = require('./ofertas.carreras');
const { reenviarOferta } = require('./ofertas.service');
const { solicitarRegistroOferta } = require('./ofertas.controller');
const { CARRERAS_ALIAS_LEGADO } = require('../reportes/reportes.shared');

const USUARIO_PROFESOR = 10;

function montar({ profesores = [profesor()], ofertas = [], ocupados = [] } = {}) {
  const creada = crearBd({ profesores, ofertas, ocupantes: ocupados });
  bd = creada.bd;
  prismaActual = creada.prisma;
  return bd;
}

// Respuesta de Express mínima: guarda status y cuerpo para poder afirmarlos.
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

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// El normalizador, aislado
// ════════════════════════════════════════════════════════════════════════════

test('alias: "IA" (código legado) se traduce al "IIA" del catálogo', () => {
  assert.equal(normalizarNombreCarrera('IA'), 'IIA');
});

test('alias: es idempotente — "IIA" ya normalizado no se vuelve a tocar', () => {
  assert.equal(normalizarNombreCarrera('IIA'), 'IIA');
  assert.equal(normalizarNombreCarrera(normalizarNombreCarrera('IA')), 'IIA');
});

test('alias: los demás códigos pasan intactos, y uno desconocido NO se inventa', () => {
  assert.equal(normalizarNombreCarrera('ISC'), 'ISC');
  assert.equal(normalizarNombreCarrera('LCD'), 'LCD');
  // Sin entrada en el mapa se devuelve tal cual: el 400 de "carrera no válida" lo decide la BD,
  // no este helper.
  for (const desconocido of ['XYZ', 'ia', 'IIAA', '', '__proto__', 'constructor']) {
    assert.equal(normalizarNombreCarrera(desconocido), desconocido);
  }
});

// Ofertas traduce de "lo que manda el cliente" a "lo que existe en catálogo"; Reportes traduce de
// "el código guardado" a "su nombre institucional". Direcciones distintas, pero AMBOS coinciden en
// que el código correcto es IIA. Si alguien invirtiera uno de los dos, esta prueba lo caza.
test('alias: misma dirección que CARRERAS_ALIAS_LEGADO de Reportes (IIA es el código correcto)', () => {
  assert.deepEqual({ ...CARRERAS_ALIAS_LEGADO }, { IA: 'IIA' });
  assert.equal(normalizarNombreCarrera('IA'), CARRERAS_ALIAS_LEGADO.IA);
});

// ════════════════════════════════════════════════════════════════════════════
// Punto de aplicación 1 — creación (CU-PRO-01)
// ════════════════════════════════════════════════════════════════════════════

test('creación: mandar "IA" busca "IIA" en el catálogo y la oferta se registra', async () => {
  const res = resFalso();
  await solicitarRegistroOferta(
    { usuario: { sub: USUARIO_PROFESOR }, body: datosOferta(['ISC', 'IA']) },
    res,
  );

  assert.deepEqual(bd.consultasCarrera, [['ISC', 'IIA']], 'el findMany recibió el código normalizado');
  assert.equal(res.statusCode, 201);
  assert.equal(bd.ofertas.length, 1);
  assert.equal(bd.ofertas[0].estado_oferta, 'pendiente_revision');
});

test('creación: un código inexistente sigue dando 400 y no crea nada', async () => {
  const res = resFalso();
  await solicitarRegistroOferta(
    { usuario: { sub: USUARIO_PROFESOR }, body: datosOferta(['XYZ']) },
    res,
  );

  assert.deepEqual(bd.consultasCarrera, [['XYZ']], 'un desconocido no se traduce');
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /no son válidas/);
  assert.equal(bd.ofertas.length, 0);
});

// ════════════════════════════════════════════════════════════════════════════
// Punto de aplicación 2 — reenvío (CU-PRO-05 Flujo A)
// ════════════════════════════════════════════════════════════════════════════

test('reenvío: mandar "IA" busca "IIA" y conecta la fila real del catálogo', async () => {
  montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })] });

  const actualizada = await reenviarOferta(1, 1, datosOferta(['IA']));

  assert.deepEqual(bd.consultasCarrera, [['IIA']], 'el findMany recibió el código normalizado');
  assert.equal(actualizada.estado_oferta, 'pendiente_revision');

  // Se conecta el id de la fila IIA del catálogo, no un id inventado.
  const idIIA = CATALOGO_CARRERAS.find((c) => c.nombre === 'IIA').id;
  const update = bd.escrituras.find((e) => e.operacion === 'update');
  assert.deepEqual(
    update.data.deseo_de_carrera.create,
    [{ carrera: { connect: { id: idIIA } } }],
  );
});

test('reenvío: "IIA" directo sigue funcionando igual — el alias no introduce regresión', async () => {
  montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })] });

  const actualizada = await reenviarOferta(1, 1, datosOferta(['ISC', 'IIA']));

  assert.deepEqual(bd.consultasCarrera, [['ISC', 'IIA']]);
  assert.equal(actualizada.estado_oferta, 'pendiente_revision');
});
