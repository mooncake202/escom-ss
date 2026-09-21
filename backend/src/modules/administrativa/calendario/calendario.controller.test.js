const test = require('node:test');
const assert = require('node:assert/strict');

// El router importa el middleware de auth, que exige JWT_SECRET al cargar (no se usa para firmar aquí).
process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas';

const calendarioService = require('./calendario.service');
const controlador = require('./calendario.controller');
const router = require('./calendario.routes');

function respuestaFalsa() {
  return {
    codigo: null,
    cuerpo: null,
    status(codigo) { this.codigo = codigo; return this; },
    json(cuerpo) { this.cuerpo = cuerpo; return this; },
  };
}

const solicitud = (extra) => ({ usuario: { sub: 10, rol: 'coordinador' }, query: {}, params: {}, body: {}, ...extra });

test('GET: pasa rol y filtros al servicio y responde 200', async (t) => {
  const listar = t.mock.method(calendarioService, 'listarEventos', async () => ({ eventos: [], ultimaModificacion: null }));
  const res = respuestaFalsa();
  await controlador.getEventos(solicitud({ usuario: { sub: 5, rol: 'alumno_asignado' }, query: { tipo: 'Inhabil', desde: '2026-09-01' } }), res);

  assert.equal(res.codigo, 200);
  assert.deepEqual(listar.mock.calls[0].arguments[0], { rol: 'alumno_asignado', filtros: { tipo: 'Inhabil', desde: '2026-09-01', hasta: undefined } });
});

test('POST: pasa el usuario y el cuerpo al servicio y responde 201', async (t) => {
  const crear = t.mock.method(calendarioService, 'crearEvento', async () => ({ evento: { id: 1 }, ultimaModificacion: null }));
  const res = respuestaFalsa();
  await controlador.postEvento(solicitud({ body: { tipo: 'Inhabil' } }), res);

  assert.equal(res.codigo, 201);
  assert.deepEqual(crear.mock.calls[0].arguments[0], { usuarioId: 10, entrada: { tipo: 'Inhabil' } });
});

test('PUT y DELETE: pasan el id de la ruta y responden 200', async (t) => {
  const actualizar = t.mock.method(calendarioService, 'actualizarInhabil', async () => ({ evento: { id: 4 } }));
  const eliminar = t.mock.method(calendarioService, 'eliminarInhabil', async () => ({ eliminado: true, id: 4 }));
  const put = respuestaFalsa();
  const del = respuestaFalsa();
  await controlador.putEvento(solicitud({ params: { id: '4' }, body: { nombre: 'X' } }), put);
  await controlador.deleteEvento(solicitud({ params: { id: '4' } }), del);

  assert.deepEqual([put.codigo, del.codigo], [200, 200]);
  assert.deepEqual(actualizar.mock.calls[0].arguments[0], { id: '4', entrada: { nombre: 'X' } });
  assert.deepEqual(eliminar.mock.calls[0].arguments[0], { id: '4' });
});

test('errores del servicio: reenvía status, message, code y errores por campo', async (t) => {
  t.mock.method(calendarioService, 'crearEvento', async () => {
    throw Object.assign(new Error('Revisa los campos marcados.'), { status: 400, code: 'VALIDACION', errores: { hora: 'mal' } });
  });
  const res = respuestaFalsa();
  await controlador.postEvento(solicitud(), res);
  assert.equal(res.codigo, 400);
  assert.deepEqual(res.cuerpo, { message: 'Revisa los campos marcados.', code: 'VALIDACION', errores: { hora: 'mal' } });
});

test('errores 409 conservan su código', async (t) => {
  t.mock.method(calendarioService, 'eliminarInhabil', async () => {
    throw Object.assign(new Error('inmutable'), { status: 409, code: 'EVENTO_INMUTABLE' });
  });
  const res = respuestaFalsa();
  await controlador.deleteEvento(solicitud({ params: { id: '1' } }), res);
  assert.equal(res.codigo, 409);
  assert.equal(res.cuerpo.code, 'EVENTO_INMUTABLE');
});

test('error inesperado: 500 con mensaje genérico, sin filtrar el detalle', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(calendarioService, 'listarEventos', async () => { throw new Error('detalle interno de BD'); });
  const res = respuestaFalsa();
  await controlador.getEventos(solicitud(), res);
  assert.equal(res.codigo, 500);
  assert.equal(res.cuerpo.message, 'Ocurrió un error. Intenta de nuevo más tarde.');
  assert.equal(JSON.stringify(res.cuerpo).includes('detalle interno'), false);
});

test('GET con alumno_sin_asignar (servicio real): 403 con code ROL_SIN_ACCESO', async () => {
  const res = respuestaFalsa();
  await controlador.getEventos(solicitud({ usuario: { sub: 5, rol: 'alumno_sin_asignar' } }), res);
  assert.equal(res.codigo, 403);
  assert.deepEqual(res.cuerpo, { message: 'No tienes acceso al calendario institucional.', code: 'ROL_SIN_ACCESO' });
});

test('rutas: lectura con sesión (el servicio decide por rol), escritura solo coordinador', () => {
  const capas = router.stack.filter((c) => c.route).map((c) => ({
    metodo: Object.keys(c.route.methods)[0].toUpperCase(),
    ruta: c.route.path,
    manejadores: c.route.stack.length,
  }));
  assert.deepEqual(capas.map((c) => `${c.metodo} ${c.ruta}`), [
    'GET /eventos', 'POST /eventos', 'PUT /eventos/:id', 'DELETE /eventos/:id',
  ]);
  // GET: requireAuth + controlador. Escritura: requireAuth + requireRole('coordinador') + controlador.
  const manejadores = Object.fromEntries(capas.map((c) => [`${c.metodo} ${c.ruta}`, c.manejadores]));
  assert.deepEqual(manejadores, {
    'GET /eventos': 2, 'POST /eventos': 3, 'PUT /eventos/:id': 3, 'DELETE /eventos/:id': 3,
  });
});
