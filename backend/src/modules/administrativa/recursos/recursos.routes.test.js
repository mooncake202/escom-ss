// CU-ADM-05 — Autorización por rol de las rutas de recursos.
//
// Los tests de servicio comprueban la segunda barrera (perfil de coordinador); estos comprueban la
// PRIMERA: qué roles declara cada ruta en `requireRole`. Se verifica la configuración real del
// router, no una copia de la lista.
//
// Para leerla se sustituye el middleware de auth por uno que recuerda los roles con que fue
// construido; así el test falla si alguien cambia los permisos sin querer.

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

const router = require('./recursos.routes');

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

test('ADM-05: la LECTURA la comparten alumno asignado, profesor y coordinación', () => {
  assert.deepEqual(rolesDe('GET', '/'), ['alumno_asignado', 'coordinador', 'profesor']);
});

test('ADM-05: el profesor SÍ puede consultar los recursos', () => {
  assert.ok(rolesDe('GET', '/').includes('profesor'));
});

test('ADM-05: alumno_sin_asignar NO puede consultar los recursos', () => {
  // Decisión de alcance: los recursos son del servicio en curso, no del trámite de registro.
  assert.equal(rolesDe('GET', '/').includes('alumno_sin_asignar'), false);
});

test('ADM-05: alumno_sin_asignar no aparece en NINGÚN método', () => {
  for (const [metodo, path] of [['GET', '/'], ['POST', '/'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    assert.equal(
      rolesDe(metodo, path).includes('alumno_sin_asignar'), false,
      `alumno_sin_asignar no debe poder ${metodo} ${path}`,
    );
  }
});

test('ADM-05: la ESCRITURA es exclusiva de coordinación', () => {
  for (const [metodo, path] of [['POST', '/'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    assert.deepEqual(rolesDe(metodo, path), ['coordinador'], `${metodo} ${path}`);
  }
});

test('ADM-05: ningún alumno ni profesor puede escribir', () => {
  for (const [metodo, path] of [['POST', '/'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    const roles = rolesDe(metodo, path);
    for (const rol of ['alumno_sin_asignar', 'alumno_asignado', 'profesor']) {
      assert.equal(roles.includes(rol), false, `${rol} no debe poder ${metodo} ${path}`);
    }
  }
});

test('ADM-05: no existe ninguna ruta sin control de rol', () => {
  for (const capa of router.stack.filter((c) => c.route)) {
    const tieneRoles = capa.route.stack.some((s) => s.handle.__roles);
    assert.ok(tieneRoles, `${capa.route.path} quedó sin requireRole`);
  }
});
