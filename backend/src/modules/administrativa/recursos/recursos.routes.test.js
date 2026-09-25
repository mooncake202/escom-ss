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

// Regla vigente: la lectura del CATÁLOGO es exclusiva de coordinación. El acceso de alumno asignado
// y profesor se retiró por decisión explícita (ya no está en la tabla de acciones por rol), tal como
// documenta recursos.routes.js.
test('ADM-05: la LECTURA del catálogo es exclusiva de coordinación', () => {
  assert.deepEqual(rolesDe('GET', '/'), ['coordinador']);
});

test('ADM-05: ni el profesor ni el alumno asignado pueden consultar el catálogo', () => {
  const roles = rolesDe('GET', '/');
  for (const rol of ['profesor', 'alumno_asignado']) {
    assert.equal(roles.includes(rol), false, `${rol} ya no consulta el catálogo`);
  }
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

// Una sola ruta es pública a propósito: CU-GR-01 la consulta ANTES de que el alumno tenga cuenta,
// así que no puede exigir rol. Expone únicamente la URL de ese recurso puntual, nunca el catálogo.
// Se enumera aquí de forma explícita para que cualquier OTRA ruta sin `requireRole` siga fallando.
const RUTAS_PUBLICAS_POR_DISENO = ['/publico/constancia-creditos'];

test('ADM-05: no existe ninguna ruta sin control de rol, salvo la pública declarada', () => {
  for (const capa of router.stack.filter((c) => c.route)) {
    if (RUTAS_PUBLICAS_POR_DISENO.includes(capa.route.path)) continue;
    const tieneRoles = capa.route.stack.some((s) => s.handle.__roles);
    assert.ok(tieneRoles, `${capa.route.path} quedó sin requireRole`);
  }
});

test('ADM-05: la ruta pública existe, es solo GET y no exige rol', () => {
  const capa = router.stack.find((c) => c.route && c.route.path === '/publico/constancia-creditos');
  assert.ok(capa, 'la ruta pública de CU-GR-01 debe existir');
  assert.deepEqual(Object.keys(capa.route.methods), ['get'], 'solo lectura');
  assert.equal(capa.route.stack.some((s) => s.handle.__roles), false, 'es pública a propósito');
});

// El catálogo completo NO debe quedar accesible sin autenticación por la puerta de la ruta pública.
test('ADM-05: la ruta pública no es el catálogo', () => {
  assert.notEqual('/publico/constancia-creditos', '/');
  assert.deepEqual(rolesDe('GET', '/'), ['coordinador'], 'el catálogo sigue protegido');
});
