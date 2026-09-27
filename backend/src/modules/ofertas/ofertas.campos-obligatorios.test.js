// Campos obligatorios de texto en Ofertas: `nombre_proyecto` y `descripcion_actividades` se
// validan RECORTADOS y se persisten recortados, en los dos caminos de escritura (crear CU-PRO-01 y
// reenviar CU-PRO-05 Flujo A).
//
// Por qué: la validación anterior era una negación simple, así que `"   "` pasaba y creaba la
// oferta. El frontend recorta antes de enviar, pero una llamada directa a POST /ofertas no, y el
// backend no puede confiar en el cliente.
//
// Alcance: SOLO estos dos campos. No se toca tipo_oferta, carreras, cupos ni el orden de las demás
// validaciones — en particular, la de capacidad sigue corriendo primero, y una de estas pruebas lo
// afirma explícitamente para que nadie lo reordene por accidente.

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearBd, profesor, ofertaProyecto, ocupantes } = require('./ofertas.fakes');

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

const { reenviarOferta, textoObligatorioRecortado } = require('./ofertas.service');
const { solicitarRegistroOferta } = require('./ofertas.controller');

const USUARIO_PROFESOR = 10;

function montar({ ofertas = [], cuposTotales = 3, ocupados = 0 } = {}) {
  const creada = crearBd({
    profesores: [profesor({ cuposTotales })],
    ofertas,
    ocupantes: ocupantes(1, ocupados),
  });
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

const datos = (extra = {}) => ({
  nombre_proyecto: 'Sistema de seguimiento académico',
  descripcion_actividades: 'Desarrollo y pruebas del módulo.',
  tipo_oferta: 'proyecto',
  cupos_ofertados: 3,
  carreras: ['ISC'],
  ...extra,
});

const crear = (extra) => {
  const res = resFalso();
  return solicitarRegistroOferta(
    { usuario: { sub: USUARIO_PROFESOR }, body: datos(extra) },
    res,
  ).then(() => res);
};

// Valores que deben considerarse "vacío" tras recortar, y los no-cadena que tampoco son texto.
const VACIOS = ['', '   ', '\t', '\n', '  \t\n  ', undefined, null, 123, true, {}, []];

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// El helper, aislado
// ════════════════════════════════════════════════════════════════════════════

test('helper: recorta los espacios de alrededor y conserva los de dentro', () => {
  assert.equal(textoObligatorioRecortado('  Proyecto X  '), 'Proyecto X');
  assert.equal(textoObligatorioRecortado('\n\tProyecto X\t\n'), 'Proyecto X');
  assert.equal(textoObligatorioRecortado('Proyecto  con  dobles'), 'Proyecto  con  dobles');
});

test('helper: todo lo que queda vacío tras recortar, y lo que no es cadena, da null', () => {
  for (const valor of VACIOS) {
    assert.equal(textoObligatorioRecortado(valor), null, JSON.stringify(valor));
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Crear (CU-PRO-01)
// ════════════════════════════════════════════════════════════════════════════

test('crear: nombre que queda vacío tras recortar → 400 y NO se crea nada', async () => {
  for (const valor of VACIOS) {
    montar();
    const res = await crear({ nombre_proyecto: valor });
    assert.equal(res.statusCode, 400, `nombre_proyecto=${JSON.stringify(valor)}`);
    assert.equal(res.body.message, 'Faltan campos obligatorios.');
    assert.equal(bd.ofertas.length, 0, 'no debe quedar ninguna oferta');
  }
});

test('crear: descripción que queda vacía tras recortar → 400 y NO se crea nada', async () => {
  for (const valor of VACIOS) {
    montar();
    const res = await crear({ descripcion_actividades: valor });
    assert.equal(res.statusCode, 400, `descripcion_actividades=${JSON.stringify(valor)}`);
    assert.equal(bd.ofertas.length, 0);
  }
});

test('crear: los valores se PERSISTEN recortados, no con los espacios del cliente', async () => {
  const res = await crear({
    nombre_proyecto: '   Sistema de inventario   ',
    descripcion_actividades: '\n  Desarrollo y pruebas.  \n',
  });

  assert.equal(res.statusCode, 201);
  assert.equal(bd.ofertas[0].nombre_proyecto, 'Sistema de inventario');
  assert.equal(bd.ofertas[0].descripcion_actividades, 'Desarrollo y pruebas.');
});

test('crear: la oferta individual pasa por la misma validación (mismo endpoint)', async () => {
  montar();
  const sinNombre = await crear({ tipo_oferta: 'individual', cupos_ofertados: undefined, nombre_proyecto: '   ' });
  assert.equal(sinNombre.statusCode, 400);
  assert.equal(bd.ofertas.length, 0);

  montar();
  const valida = await crear({ tipo_oferta: 'individual', cupos_ofertados: undefined, nombre_proyecto: '  Apoyo en laboratorio  ' });
  assert.equal(valida.statusCode, 201);
  assert.equal(bd.ofertas[0].nombre_proyecto, 'Apoyo en laboratorio');
  // Sin tocar las reglas de individual.
  assert.equal(bd.ofertas[0].cupos_ofertados, null);
  assert.equal(bd.ofertas[0].cupos_disponibles, 1);
});

// El orden importa y no debe alterarse: capacidad primero, campos después.
test('crear: la validación de capacidad sigue corriendo ANTES que la de campos', async () => {
  montar({ cuposTotales: 3, ocupados: 3 });

  const res = await crear({ nombre_proyecto: '   ', descripcion_actividades: '   ' });

  assert.equal(res.statusCode, 409, 'debe ganar el 409 de capacidad, no el 400 de campos');
  assert.match(res.body.message, /capacidad máxima/);
  assert.equal(bd.ofertas.length, 0);
});

// Lo que esta corrección NO debe cambiar.
test('crear: tipo_oferta y carreras conservan su comportamiento', async () => {
  montar();
  const tipoMalo = await crear({ tipo_oferta: 'otro' });
  assert.equal(tipoMalo.statusCode, 400);
  assert.match(tipoMalo.body.message, /tipo_oferta debe ser/);

  montar();
  const sinCarreras = await crear({ carreras: [] });
  assert.equal(sinCarreras.statusCode, 400);
  assert.match(sinCarreras.body.message, /al menos un perfil/);

  montar();
  const cuposMalos = await crear({ cupos_ofertados: 1 });
  assert.equal(cuposMalos.statusCode, 400);
  assert.match(cuposMalos.body.message, /entero mayor o igual a 2/);
});

// ════════════════════════════════════════════════════════════════════════════
// Reenviar (CU-PRO-05 Flujo A)
// ════════════════════════════════════════════════════════════════════════════

const montarRechazada = () => montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })] });

test('reenviar: nombre que queda vacío tras recortar → 400 y la oferta NO se modifica', async () => {
  for (const valor of VACIOS) {
    montarRechazada();
    await assert.rejects(
      reenviarOferta(1, 1, datos({ nombre_proyecto: valor })),
      (err) => err.status === 400 && err.message === 'Faltan campos obligatorios.',
      `nombre_proyecto=${JSON.stringify(valor)}`,
    );
    assert.equal(bd.ofertas[0].estado_oferta, 'rechazada', 'sigue rechazada');
    assert.deepEqual(bd.escrituras, [], 'no hubo ninguna escritura');
  }
});

test('reenviar: descripción que queda vacía tras recortar → 400 y la oferta NO se modifica', async () => {
  for (const valor of VACIOS) {
    montarRechazada();
    await assert.rejects(
      reenviarOferta(1, 1, datos({ descripcion_actividades: valor })),
      (err) => err.status === 400,
      `descripcion_actividades=${JSON.stringify(valor)}`,
    );
    assert.equal(bd.ofertas[0].estado_oferta, 'rechazada');
    assert.deepEqual(bd.escrituras, []);
  }
});

test('reenviar: los valores se PERSISTEN recortados', async () => {
  montarRechazada();

  const actualizada = await reenviarOferta(1, 1, datos({
    nombre_proyecto: '   Sistema corregido   ',
    descripcion_actividades: '  Nueva descripción.  ',
  }));

  assert.equal(actualizada.estado_oferta, 'pendiente_revision');
  assert.equal(bd.ofertas[0].nombre_proyecto, 'Sistema corregido');
  assert.equal(bd.ofertas[0].descripcion_actividades, 'Nueva descripción.');
});

test('reenviar: la oferta individual pasa por la misma validación', async () => {
  montar({ ofertas: [ofertaProyecto({ estado: 'rechazada' })] });
  await assert.rejects(
    reenviarOferta(1, 1, datos({ tipo_oferta: 'individual', cupos_ofertados: undefined, descripcion_actividades: '\t' })),
    (err) => err.status === 400,
  );
  assert.equal(bd.ofertas[0].estado_oferta, 'rechazada');
});
