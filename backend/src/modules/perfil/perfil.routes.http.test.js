// Autorización por rol de /perfil, de punta a punta: Express y el auth middleware REALES, BD falsa.
//
// Los tests de servicio cubren la segunda barrera (que el perfil exista y que los campos
// institucionales sean inmutables); estos cubren la PRIMERA, que hasta ahora no tenía ninguna:
// quién puede siquiera llegar al controlador.
//
// Lo que fija este archivo es la decisión de CU-ADM-04: los datos personales del alumno son del
// alumno ASIGNADO. 'alumno_sin_asignar' estaba aceptado en la ruta aunque ninguna pantalla se lo
// ofrecía (el frontend lo desvía a su paso del registro de GR), así que era permiso sin consumidor.
//
// Se comprueba también el cruce entre sub-recursos: un alumno no entra a /perfil/profesor ni al
// revés, que es lo que hace que cada rol toque solo sus propios datos.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

// La blacklist de tokens de requireAuth consulta Redis: se sustituye para no abrir conexiones.
const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = {
  id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null },
};

// El router arrastra controlador y servicio, y ese llega a lib/prisma. Se sustituye por una BD falsa
// mínima: lo que se prueba aquí es quién PASA el middleware, no la lógica de perfil.
const USUARIO_ALUMNO = 50;
const USUARIO_PROFESOR = 20;

const filaAlumno = {
  boleta: '2020630001', usuario_id: USUARIO_ALUMNO, celular: '5512345678', carrera: 'ISC',
  creditos: 78.5, semestre: 8, correo_personal: 'luis@gmail.com',
  usuario: { id: USUARIO_ALUMNO, nombre: 'Luis', apellidos: 'Pérez Díaz', correo_institucional: 'luipere1234@alumno.ipn.mx' },
};
const filaProfesor = {
  id: 1, usuario_id: USUARIO_PROFESOR, departamento: 'Sistemas Computacionales',
  telefono_personal: '5512345678', horario_atencion: 'Lunes 10:00-12:00', cubiculo: 'Ed. 1, cub. 14',
  cupos_totales: 3, caracteristica_id: null,
  usuario: { id: USUARIO_PROFESOR, nombre: 'Ana', apellidos: 'Torres Vega', correo_institucional: 'ana.torres@ipn.mx' },
};

const rutaPrisma = require.resolve('../../lib/prisma');
require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: {
    alumno: {
      findUnique: async ({ where }) => (where.usuario_id === USUARIO_ALUMNO ? { ...filaAlumno } : null),
      update: async ({ data }) => ({ ...filaAlumno, ...data }),
    },
    profesor: {
      findUnique: async ({ where }) => (where.usuario_id === USUARIO_PROFESOR ? { ...filaProfesor } : null),
      update: async ({ data }) => ({ ...filaProfesor, ...data }),
    },
  },
};

const { generarToken } = require('../../lib/jwt');
const router = require('./perfil.routes');

// Cuerpos válidos: así un 400 no se confunde con un 403 de autorización.
const CUERPO_ALUMNO = { correo_personal: 'nuevo@gmail.com', celular: '5599887766' };
const CUERPO_PROFESOR = { telefono_personal: '5599887766', horario_atencion: 'Martes 9:00-11:00' };

const ROLES_RECHAZADOS_ALUMNO = ['alumno_sin_asignar', 'profesor', 'coordinador'];

async function levantar(t) {
  const app = express();
  app.use(express.json());
  app.use('/perfil', router);

  const servidor = await new Promise((resolver) => {
    const s = app.listen(0, '127.0.0.1', () => resolver(s));
  });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const base = `http://127.0.0.1:${servidor.address().port}`;

  // `rol = null` manda la petición SIN cabecera Authorization.
  async function pedir(ruta, { metodo = 'GET', rol = 'alumno_asignado', sub, cuerpo, token } = {}) {
    const jwt = token !== undefined
      ? token
      : (rol === null ? null : generarToken({ sub: sub ?? USUARIO_ALUMNO, rol }));

    const respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    });

    let json = null;
    try { json = JSON.parse(await respuesta.text()); } catch { /* el 400 del body-parser es HTML */ }
    return { status: respuesta.status, mensaje: json?.message };
  }

  return { pedir };
}

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-04 — /perfil/alumno: solo el alumno ASIGNADO
// ════════════════════════════════════════════════════════════════════════════

test('ADM-04: el alumno asignado consulta su perfil (200)', async (t) => {
  const { pedir } = await levantar(t);

  const r = await pedir('/perfil/alumno');

  assert.equal(r.status, 200);
});

test('ADM-04: el alumno asignado actualiza su perfil (200)', async (t) => {
  const { pedir } = await levantar(t);

  const r = await pedir('/perfil/alumno', { metodo: 'PUT', cuerpo: CUERPO_ALUMNO });

  assert.equal(r.status, 200);
  assert.equal(r.mensaje, 'Tus datos fueron actualizados correctamente.');
});

// El caso que motivó este archivo.
test('ADM-04: un alumno SIN ASIGNAR recibe 403 en GET y en PUT', async (t) => {
  const { pedir } = await levantar(t);

  for (const metodo of ['GET', 'PUT']) {
    const r = await pedir('/perfil/alumno', { metodo, rol: 'alumno_sin_asignar', cuerpo: metodo === 'PUT' ? CUERPO_ALUMNO : undefined });

    assert.equal(r.status, 403, metodo);
    assert.equal(r.mensaje, 'No tienes permiso para realizar esta acción.', metodo);
  }
});

test('ADM-04: profesor y coordinador también reciben 403 en GET y en PUT', async (t) => {
  const { pedir } = await levantar(t);

  for (const rol of ['profesor', 'coordinador']) {
    for (const metodo of ['GET', 'PUT']) {
      const r = await pedir('/perfil/alumno', { metodo, rol, cuerpo: metodo === 'PUT' ? CUERPO_ALUMNO : undefined });

      assert.equal(r.status, 403, `${rol} ${metodo}`);
    }
  }
});

test('ADM-04: los tres roles rechazados dan 403, nunca 200 ni 404', async (t) => {
  const { pedir } = await levantar(t);

  for (const rol of ROLES_RECHAZADOS_ALUMNO) {
    for (const metodo of ['GET', 'PUT']) {
      const r = await pedir('/perfil/alumno', { metodo, rol, cuerpo: metodo === 'PUT' ? CUERPO_ALUMNO : undefined });

      assert.equal(r.status, 403, `${rol} ${metodo} debe ser 403 y fue ${r.status}`);
    }
  }
});

test('ADM-04: sin sesión responde 401 en GET y en PUT', async (t) => {
  const { pedir } = await levantar(t);

  for (const metodo of ['GET', 'PUT']) {
    const r = await pedir('/perfil/alumno', { metodo, rol: null, cuerpo: metodo === 'PUT' ? CUERPO_ALUMNO : undefined });

    assert.equal(r.status, 401, metodo);
    assert.equal(r.mensaje, 'No se proporcionó un token de autenticación.', metodo);
  }
});

test('ADM-04: un token inválido responde 401, no 403', async (t) => {
  const { pedir } = await levantar(t);

  const r = await pedir('/perfil/alumno', { token: 'no-es-un-jwt' });

  assert.equal(r.status, 401);
  assert.equal(r.mensaje, 'Token inválido o expirado.');
});

// El 403 debe ganar ANTES de que el controlador consulte la BD: un rol ajeno no debe poder
// distinguir "no tengo permiso" de "no existe ese perfil".
test('ADM-04: el 403 se resuelve antes de tocar la BD', async (t) => {
  const { pedir } = await levantar(t);

  // `sub` sin fila de alumno: si el middleware dejara pasar, el servicio daría 404.
  const r = await pedir('/perfil/alumno', { rol: 'profesor', sub: 999 });

  assert.equal(r.status, 403, 'no debe filtrarse un 404');
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-10 — /perfil/profesor: sin cambios, y el cruce entre sub-recursos
// ════════════════════════════════════════════════════════════════════════════

test('ADM-10: el profesor sigue entrando a su propio perfil (200)', async (t) => {
  const { pedir } = await levantar(t);

  assert.equal((await pedir('/perfil/profesor', { rol: 'profesor', sub: USUARIO_PROFESOR })).status, 200);
  assert.equal(
    (await pedir('/perfil/profesor', { metodo: 'PUT', rol: 'profesor', sub: USUARIO_PROFESOR, cuerpo: CUERPO_PROFESOR })).status,
    200,
  );
});

test('cruce de sub-recursos: ningún alumno entra a /perfil/profesor', async (t) => {
  const { pedir } = await levantar(t);

  for (const rol of ['alumno_asignado', 'alumno_sin_asignar']) {
    for (const metodo of ['GET', 'PUT']) {
      const r = await pedir('/perfil/profesor', { metodo, rol, cuerpo: metodo === 'PUT' ? CUERPO_PROFESOR : undefined });

      assert.equal(r.status, 403, `${rol} ${metodo}`);
    }
  }
});

test('cruce de sub-recursos: el profesor no entra a /perfil/alumno y el coordinador a ninguno', async (t) => {
  const { pedir } = await levantar(t);

  assert.equal((await pedir('/perfil/alumno', { rol: 'profesor' })).status, 403);
  assert.equal((await pedir('/perfil/alumno', { rol: 'coordinador' })).status, 403);
  assert.equal((await pedir('/perfil/profesor', { rol: 'coordinador' })).status, 403);
});

test('no existe ninguna ruta de /perfil sin control de rol', () => {
  for (const capa of router.stack.filter((c) => c.route)) {
    // requireAuth + requireRole + handler: tres capas. Con menos, falta una guarda.
    assert.equal(
      capa.route.stack.length, 3,
      `${capa.route.path} tiene ${capa.route.stack.length} capas; se esperan requireAuth, requireRole y el controlador`,
    );
  }
});
