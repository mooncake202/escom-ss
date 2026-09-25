// CU-ADM-05 — Recursos del proceso de registro.
//
// El foco: que la escritura exija perfil de coordinador, que las validaciones de nombre/URL se
// midan después del trim, que solo se acepten enlaces http/https, y que las fechas se comporten
// como pide la ficha (fecha_registro al crear, fecha_actualizacion al editar).
//
// La autorización por rol vive en las rutas (requireRole); aquí se comprueba la segunda barrera:
// quien no tiene perfil de coordinador no escribe aunque llegue al servicio.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./recursos.service');

const U_COORD = 30, U_COORD_2 = 31, U_ALUMNO = 10;

function montar() {
  bd = {
    coordinadores: [{ id: 1, usuario_id: U_COORD }, { id: 2, usuario_id: U_COORD_2 }],
    recursos: [
      { id: 1, coordinador_id: 1, nombre: 'Reglamento de servicio social', url: 'https://escom.ipn.mx/reglamento.pdf', fecha_registro: new Date('2026-01-10T10:00:00Z'), fecha_actualizacion: null },
      { id: 2, coordinador_id: 1, nombre: 'Formato de solicitud', url: 'https://escom.ipn.mx/solicitud.pdf', fecha_registro: new Date('2026-01-05T10:00:00Z'), fecha_actualizacion: new Date('2026-02-01T10:00:00Z') },
    ],
    secuencia: 100,
  };

  prismaActual = {
    coordinador: {
      findUnique: async ({ where }) => bd.coordinadores.find((c) => c.usuario_id === where.usuario_id) ?? null,
    },
    recurso: {
      findMany: async () => [...bd.recursos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      findUnique: async ({ where }) => bd.recursos.find((r) => r.id === where.id) ?? null,
      create: async ({ data }) => { const f = { id: ++bd.secuencia, ...data }; bd.recursos.push(f); return f; },
      update: async ({ where, data }) => {
        const f = bd.recursos.find((r) => r.id === where.id);
        Object.assign(f, data);
        return f;
      },
      delete: async ({ where }) => {
        const i = bd.recursos.findIndex((r) => r.id === where.id);
        return bd.recursos.splice(i, 1)[0];
      },
    },
  };
  return bd;
}

test.beforeEach(() => { montar(); });

// ── Lectura ─────────────────────────────────────────────────────────────────

test('ADM-05: la lista es la MISMA para alumnos, profesor y coordinación', async () => {
  // `listar` no recibe rol ni usuario: no hay NADA que filtrar, así que por construcción los
  // cuatro roles que pueden leer ven exactamente lo mismo. Los roles se validan en las rutas
  // (recursos.routes.test.js).
  const r = await servicio.listar();
  assert.equal(r.recursos.length, 2);
  assert.deepEqual(r.recursos.map((x) => x.nombre), ['Formato de solicitud', 'Reglamento de servicio social']);
});

test('ADM-05: ultimaActualizacion cae en fecha_registro cuando nunca se ha editado', async () => {
  const { recursos } = await servicio.listar();

  const nuevo = recursos.find((r) => r.id === 1);
  assert.equal(nuevo.fechaActualizacion, null);
  assert.equal(nuevo.ultimaActualizacion, nuevo.fechaRegistro, 'sin edición usa la fecha de alta');

  const editado = recursos.find((r) => r.id === 2);
  assert.equal(editado.ultimaActualizacion, editado.fechaActualizacion, 'con edición usa la de edición');
});

// `tipo` sí forma parte del DTO desde que existe el enum TipoRecurso: es el código con el que el
// sistema ubica un recurso puntual (el link de constancia de créditos de CU-GR-01) sin depender de
// su nombre libre. `categoria` sigue sin existir, y `coordinador_id` sigue sin exponerse.
test('ADM-05: el DTO expone `tipo` pero no coordinador_id ni una categoría inventada', async () => {
  const { recursos } = await servicio.listar();
  for (const r of recursos) {
    assert.deepEqual(Object.keys(r).sort(), [
      'fechaActualizacion', 'fechaRegistro', 'id', 'nombre', 'tipo', 'ultimaActualizacion', 'url',
    ]);
    assert.equal('categoria' in r, false, 'el modelo no tiene categoría');
    assert.equal('coordinador_id' in r, false, 'no se expone quién lo registró');
  }
});

// ── Crear ───────────────────────────────────────────────────────────────────

test('ADM-05: el coordinador crea un recurso con fecha_registro y sin fecha_actualizacion', async () => {
  const { recurso } = await servicio.crear({
    usuarioId: U_COORD, nombre: '  Guía SISS  ', url: '  https://escom.ipn.mx/guia.pdf  ',
  });

  assert.equal(recurso.nombre, 'Guía SISS', 'se recorta el espacio sobrante');
  assert.equal(recurso.url, 'https://escom.ipn.mx/guia.pdf');
  assert.equal(recurso.fechaActualizacion, null, 'recién creado no está editado');

  const fila = bd.recursos.find((r) => r.id === recurso.id);
  assert.equal(fila.coordinador_id, 1, 'el coordinador sale del token');
  assert.ok(fila.fecha_registro instanceof Date);
});

test('ADM-05: el coordinador_id NO se acepta del cuerpo', async () => {
  const { recurso } = await servicio.crear({
    usuarioId: U_COORD, nombre: 'T', url: 'https://a.mx',
    coordinador_id: 2, coordinadorId: 2, fecha_registro: new Date('2000-01-01'),
  });
  const fila = bd.recursos.find((r) => r.id === recurso.id);
  assert.equal(fila.coordinador_id, 1);
  assert.ok(fila.fecha_registro > new Date('2020-01-01'), 'la fecha la pone el servidor');
});

test('ADM-05: un usuario sin perfil de coordinador no escribe nada', async () => {
  const antes = bd.recursos.length;
  for (const fn of [
    () => servicio.crear({ usuarioId: U_ALUMNO, nombre: 'T', url: 'https://a.mx' }),
    () => servicio.actualizar({ usuarioId: U_ALUMNO, id: 1, nombre: 'T', url: 'https://a.mx' }),
    () => servicio.eliminar({ usuarioId: U_ALUMNO, id: 1 }),
  ]) {
    await assert.rejects(fn, (err) => err.status === 404 && err.code === 'SIN_PERFIL_COORDINADOR');
  }
  assert.equal(bd.recursos.length, antes, 'nada se creó ni se borró');
});

// ── Validaciones ────────────────────────────────────────────────────────────

test('ADM-05: el nombre es obligatorio', async () => {
  for (const nombre of ['', '   ', null, undefined, 42]) {
    await assert.rejects(
      servicio.crear({ usuarioId: U_COORD, nombre, url: 'https://a.mx' }),
      (err) => err.status === 400 && err.code === 'NOMBRE_VACIO',
    );
  }
});

test('ADM-05: la URL es obligatoria', async () => {
  for (const url of ['', '   ', null, undefined, {}]) {
    await assert.rejects(
      servicio.crear({ usuarioId: U_COORD, nombre: 'T', url }),
      (err) => err.status === 400 && err.code === 'URL_VACIA',
    );
  }
});

test('ADM-05: el nombre respeta el límite de 150, medido tras el trim', async () => {
  await assert.rejects(
    servicio.crear({ usuarioId: U_COORD, nombre: 'x'.repeat(151), url: 'https://a.mx' }),
    (err) => err.status === 400 && err.code === 'NOMBRE_MUY_LARGO',
  );

  const { recurso } = await servicio.crear({
    usuarioId: U_COORD, nombre: `  ${'x'.repeat(150)}  `, url: 'https://a.mx',
  });
  assert.equal(recurso.nombre.length, servicio.MAX_NOMBRE, '150 exactos se aceptan');
});

test('ADM-05: la URL respeta el límite de 500, medido tras el trim', async () => {
  const larga = `https://escom.ipn.mx/${'x'.repeat(500)}`;
  await assert.rejects(
    servicio.crear({ usuarioId: U_COORD, nombre: 'T', url: larga }),
    (err) => err.status === 400 && err.code === 'URL_MUY_LARGA',
  );

  const justa = `https://escom.ipn.mx/${'x'.repeat(500 - 21)}`;
  const { recurso } = await servicio.crear({ usuarioId: U_COORD, nombre: 'T', url: justa });
  assert.equal(recurso.url.length, servicio.MAX_URL);
});

test('ADM-05: solo se aceptan URLs http y https', async () => {
  for (const url of ['escom.ipn.mx/a.pdf', 'ftp://escom.ipn.mx/a.pdf', 'javascript:alert(1)',
    'file:///etc/passwd', 'data:text/html,<h1>x', 'no es una url']) {
    await assert.rejects(
      servicio.crear({ usuarioId: U_COORD, nombre: 'T', url }),
      (err) => err.status === 400 && err.code === 'URL_INVALIDA',
      `${url} debe rechazarse`,
    );
  }

  for (const url of ['http://escom.ipn.mx/a.pdf', 'https://escom.ipn.mx/a.pdf']) {
    const { recurso } = await servicio.crear({ usuarioId: U_COORD, nombre: 'T', url });
    assert.equal(recurso.url, url);
  }
});

// ── Editar ──────────────────────────────────────────────────────────────────

test('ADM-05: editar fija fecha_actualizacion y CONSERVA fecha_registro', async () => {
  const original = bd.recursos.find((r) => r.id === 1);
  const registroOriginal = original.fecha_registro;

  const { recurso } = await servicio.actualizar({
    usuarioId: U_COORD, id: 1, nombre: 'Reglamento 2026', url: 'https://escom.ipn.mx/nuevo.pdf',
  });

  assert.equal(recurso.nombre, 'Reglamento 2026');
  assert.equal(recurso.fechaRegistro, registroOriginal.toISOString(), 'la fecha de alta no cambia');
  assert.ok(recurso.fechaActualizacion, 'ahora sí tiene fecha de edición');
  assert.equal(recurso.ultimaActualizacion, recurso.fechaActualizacion);
});

test('ADM-05: cualquier coordinador puede editar un recurso institucional ajeno', async () => {
  // El recurso 1 lo creó el coordinador 1; lo edita el 2.
  const { recurso } = await servicio.actualizar({
    usuarioId: U_COORD_2, id: 1, nombre: 'Editado por otro', url: 'https://a.mx',
  });
  assert.equal(recurso.nombre, 'Editado por otro');
  assert.equal(bd.recursos.find((r) => r.id === 1).coordinador_id, 2, 'queda como último autor');
});

test('ADM-05: editar valida igual que crear', async () => {
  await assert.rejects(
    servicio.actualizar({ usuarioId: U_COORD, id: 1, nombre: '', url: 'https://a.mx' }),
    (err) => err.code === 'NOMBRE_VACIO',
  );
  await assert.rejects(
    servicio.actualizar({ usuarioId: U_COORD, id: 1, nombre: 'T', url: 'ftp://a.mx' }),
    (err) => err.code === 'URL_INVALIDA',
  );
  assert.equal(bd.recursos.find((r) => r.id === 1).nombre, 'Reglamento de servicio social', 'intacto');
});

// ── Eliminar ────────────────────────────────────────────────────────────────

test('ADM-05: eliminar quita la fila y no toca las demás', async () => {
  const r = await servicio.eliminar({ usuarioId: U_COORD, id: 1 });

  assert.deepEqual(r, { id: 1 });
  assert.equal(bd.recursos.some((x) => x.id === 1), false);
  assert.equal(bd.recursos.length, 1);
});

test('ADM-05: un id inexistente o inválido se distinguen y no borran nada', async () => {
  await assert.rejects(
    servicio.eliminar({ usuarioId: U_COORD, id: 9999 }),
    (err) => err.status === 404 && err.code === 'RECURSO_NO_ENCONTRADO',
  );
  await assert.rejects(
    servicio.eliminar({ usuarioId: U_COORD, id: 'abc' }),
    (err) => err.status === 400 && err.code === 'RECURSO_INVALIDO',
  );
  await assert.rejects(
    servicio.actualizar({ usuarioId: U_COORD, id: 9999, nombre: 'T', url: 'https://a.mx' }),
    (err) => err.status === 404 && err.code === 'RECURSO_NO_ENCONTRADO',
  );
  assert.equal(bd.recursos.length, 2);
});
