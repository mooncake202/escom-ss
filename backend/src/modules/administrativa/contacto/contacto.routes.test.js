// CU-ADM-06 — Autorización por rol de las rutas de contacto institucional.
//
// Los tests de servicio comprueban la segunda barrera (perfil de coordinador); estos comprueban la
// PRIMERA: qué roles declara cada ruta en `requireRole`. Se lee la configuración REAL del router,
// no una copia de la lista, así que falla si alguien cambia los permisos sin querer.

const test = require('node:test');
const assert = require('node:assert/strict');

// El router arrastra controlador y servicio, y ese llega hasta lib/prisma: se neutraliza para que
// la prueba no necesite base de datos. Aquí no se ejecuta ninguna consulta.
const rutaPrisma = require.resolve('../../../lib/prisma');
require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: {},
};

const rutaAuth = require.resolve('../../../middleware/auth.middleware');
require.cache[rutaAuth] = {
  id: rutaAuth, filename: rutaAuth, loaded: true,
  exports: {
    requireAuth: (_req, _res, next) => next(),
    requireRole: (...roles) => {
      const middleware = (_req, _res, next) => next();
      middleware.__roles = roles; // marca que el test lee más abajo
      return middleware;
    },
  },
};

const router = require('./contacto.routes');

/** Roles declarados para un método y ruta concretos del router. */
function rolesDe(metodo, path) {
  const capa = router.stack.find(
    (c) => c.route && c.route.path === path && c.route.methods[metodo.toLowerCase()],
  );
  assert.ok(capa, `no existe ${metodo} ${path}`);

  const conRoles = capa.route.stack.map((s) => s.handle).find((h) => h.__roles);
  assert.ok(conRoles, `${metodo} ${path} no exige ningún rol`);
  return [...conRoles.__roles].sort();
}

test('ADM-06: la LECTURA la comparten alumno asignado, profesor y coordinación', () => {
  assert.deepEqual(rolesDe('GET', '/'), ['alumno_asignado', 'coordinador', 'profesor']);
});

test('ADM-06: el profesor SÍ puede consultar los contactos', () => {
  assert.ok(rolesDe('GET', '/').includes('profesor'));
});

test('ADM-06: un alumno sin asignar NO alcanza esta pantalla', () => {
  // A diferencia de ADM-05 (recursos del trámite), el contacto institucional es para quien ya
  // está prestando el servicio.
  assert.equal(rolesDe('GET', '/').includes('alumno_sin_asignar'), false);
});

test('ADM-06: la ESCRITURA es exclusiva de coordinación', () => {
  for (const [metodo, path] of [['POST', '/'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    assert.deepEqual(rolesDe(metodo, path), ['coordinador'], `${metodo} ${path}`);
  }
});

test('ADM-06: ni el alumno ni el profesor pueden crear, editar o eliminar', () => {
  for (const [metodo, path] of [['POST', '/'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    const roles = rolesDe(metodo, path);
    for (const rol of ['alumno_asignado', 'alumno_sin_asignar', 'profesor']) {
      assert.equal(roles.includes(rol), false, `${rol} no debe poder ${metodo} ${path}`);
    }
  }
});

test('ADM-06: no existe ninguna ruta sin control de rol', () => {
  for (const capa of router.stack.filter((c) => c.route)) {
    const tieneRoles = capa.route.stack.some((s) => s.handle.__roles);
    assert.ok(tieneRoles, `${capa.route.path} quedó sin requireRole`);
  }
});
