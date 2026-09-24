// CU-ADM-06 — Contacto institucional.
//
// El foco: que el enum de tipos sea cerrado, que la agrupación devuelva siempre las cuatro claves,
// que varios registros del mismo tipo convivan, y que la escritura exija perfil de coordinador.
//
// Las etiquetas del diseño original ("Coordinación general", "Oficina principal") NO se persisten:
// el modelo es tipo + valor y aquí se comprueba que no se cuele ningún campo extra.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./contacto.service');

const U_COORD = 30, U_COORD_2 = 31, U_ALUMNO = 10;

function montar() {
  bd = {
    coordinadores: [{ id: 1, usuario_id: U_COORD }, { id: 2, usuario_id: U_COORD_2 }],
    contactos: [
      { id: 1, coordinador_id: 1, tipo: 'correo', valor: 'ext_ae_escom@ipn.mx', fecha_actualizacion: new Date('2026-01-10T10:00:00Z') },
      { id: 2, coordinador_id: 1, tipo: 'telefono', valor: '55 5729 6000 ext. 52053', fecha_actualizacion: new Date('2026-01-10T10:00:00Z') },
      // Dos del mismo tipo: es un caso válido y esperado.
      { id: 3, coordinador_id: 1, tipo: 'telefono', valor: '55 5729 6000 ext. 52056', fecha_actualizacion: new Date('2026-01-11T10:00:00Z') },
      { id: 4, coordinador_id: 1, tipo: 'horario', valor: 'Lunes a viernes de 9:00 a 15:00 y de 17:00 a 20:00', fecha_actualizacion: new Date('2026-01-12T10:00:00Z') },
    ],
    secuencia: 100,
  };

  prismaActual = {
    coordinador: {
      findUnique: async ({ where }) => bd.coordinadores.find((c) => c.usuario_id === where.usuario_id) ?? null,
    },
    contacto_institucional: {
      findMany: async () => [...bd.contactos].sort((a, b) => a.id - b.id),
      findUnique: async ({ where }) => bd.contactos.find((c) => c.id === where.id) ?? null,
      create: async ({ data }) => { const f = { id: ++bd.secuencia, ...data }; bd.contactos.push(f); return f; },
      update: async ({ where, data }) => {
        const f = bd.contactos.find((c) => c.id === where.id);
        Object.assign(f, data);
        return f;
      },
      delete: async ({ where }) => {
        const i = bd.contactos.findIndex((c) => c.id === where.id);
        return bd.contactos.splice(i, 1)[0];
      },
    },
  };
  return bd;
}

test.beforeEach(() => { montar(); });

// ── Lectura y agrupación ────────────────────────────────────────────────────

test('ADM-06: agrupa por tipo y devuelve SIEMPRE las cuatro claves', async () => {
  const r = await servicio.listar();

  assert.deepEqual(Object.keys(r.porTipo).sort(), ['correo', 'horario', 'telefono', 'ubicacion']);
  assert.deepEqual(r.porTipo.correo.map((c) => c.id), [1]);
  assert.deepEqual(r.porTipo.telefono.map((c) => c.id), [2, 3]);
  assert.deepEqual(r.porTipo.horario.map((c) => c.id), [4]);
  assert.deepEqual(r.porTipo.ubicacion, [], 'sin registros, pero la clave existe');
  assert.equal(r.total, 4);
});

test('ADM-06: admite VARIOS registros del mismo tipo', async () => {
  await servicio.crear({ usuarioId: U_COORD, tipo: 'correo', valor: 'otro@ipn.mx' });
  const r = await servicio.listar();

  assert.equal(r.porTipo.correo.length, 2);
  assert.equal(r.porTipo.telefono.length, 2);
});

test('ADM-06: el orden de los tipos es el de la pantalla', async () => {
  const r = await servicio.listar();
  assert.deepEqual(r.tipos, ['correo', 'telefono', 'ubicacion', 'horario']);
});

test('ADM-06: el DTO expone SOLO tipo y valor — ninguna etiqueta', async () => {
  const r = await servicio.listar();
  for (const c of r.contactos) {
    assert.deepEqual(Object.keys(c).sort(), ['fechaActualizacion', 'id', 'tipo', 'valor']);
    for (const prohibido of ['label', 'etiqueta', 'nombre', 'descripcion']) {
      assert.equal(prohibido in c, false, `${prohibido} no se persiste en este CU`);
    }
    assert.equal('coordinador_id' in c, false);
  }
});

// ── Crear ───────────────────────────────────────────────────────────────────

test('ADM-06: el coordinador crea un contacto con fecha_actualizacion automática', async () => {
  const { contacto } = await servicio.crear({
    usuarioId: U_COORD, tipo: 'ubicacion', valor: '  Edificio de Gobierno, Planta Alta  ',
  });

  assert.equal(contacto.tipo, 'ubicacion');
  assert.equal(contacto.valor, 'Edificio de Gobierno, Planta Alta', 'se recorta el sobrante');
  assert.ok(contacto.fechaActualizacion, 'la fecha la pone el servidor');

  const fila = bd.contactos.find((c) => c.id === contacto.id);
  assert.equal(fila.coordinador_id, 1, 'el coordinador sale del token');
});

test('ADM-06: ubicación y horario admiten texto largo y multilínea dentro de 255', async () => {
  const multilinea = 'Edificio de Gobierno, Planta Alta\nESCOM — Unidad Profesional Adolfo López Mateos\nCiudad de México, CDMX';
  const { contacto } = await servicio.crear({ usuarioId: U_COORD, tipo: 'ubicacion', valor: multilinea });
  assert.equal(contacto.valor, multilinea);
  assert.ok(contacto.valor.includes('\n'));
});

test('ADM-06: el coordinador_id NO se acepta del cuerpo', async () => {
  const { contacto } = await servicio.crear({
    usuarioId: U_COORD, tipo: 'correo', valor: 'a@ipn.mx',
    coordinador_id: 2, fecha_actualizacion: new Date('2000-01-01'),
  });
  const fila = bd.contactos.find((c) => c.id === contacto.id);
  assert.equal(fila.coordinador_id, 1);
  assert.ok(fila.fecha_actualizacion > new Date('2020-01-01'));
});

test('ADM-06: un usuario sin perfil de coordinador no escribe nada', async () => {
  const antes = bd.contactos.length;
  for (const fn of [
    () => servicio.crear({ usuarioId: U_ALUMNO, tipo: 'correo', valor: 'a@ipn.mx' }),
    () => servicio.actualizar({ usuarioId: U_ALUMNO, id: 1, tipo: 'correo', valor: 'a@ipn.mx' }),
    () => servicio.eliminar({ usuarioId: U_ALUMNO, id: 1 }),
  ]) {
    await assert.rejects(fn, (err) => err.status === 404 && err.code === 'SIN_PERFIL_COORDINADOR');
  }
  assert.equal(bd.contactos.length, antes);
});

// ── Validaciones ────────────────────────────────────────────────────────────

test('ADM-06: el enum de tipos es CERRADO', async () => {
  for (const tipo of ['whatsapp', 'departamento', 'nota', 'CORREO', '', null, undefined, 1]) {
    await assert.rejects(
      servicio.crear({ usuarioId: U_COORD, tipo, valor: 'x' }),
      (err) => err.status === 400 && err.code === 'TIPO_INVALIDO',
      `${tipo} no pertenece al enum`,
    );
  }

  for (const tipo of servicio.TIPOS) {
    const { contacto } = await servicio.crear({ usuarioId: U_COORD, tipo, valor: 'valor válido' });
    assert.equal(contacto.tipo, tipo);
  }
});

test('ADM-06: el valor es obligatorio', async () => {
  for (const valor of ['', '   ', null, undefined, {}]) {
    await assert.rejects(
      servicio.crear({ usuarioId: U_COORD, tipo: 'correo', valor }),
      (err) => err.status === 400 && err.code === 'VALOR_VACIO',
    );
  }
});

test('ADM-06: el valor respeta el límite de 255, medido tras el trim', async () => {
  await assert.rejects(
    servicio.crear({ usuarioId: U_COORD, tipo: 'ubicacion', valor: 'x'.repeat(256) }),
    (err) => err.status === 400 && err.code === 'VALOR_MUY_LARGO',
  );

  const { contacto } = await servicio.crear({
    usuarioId: U_COORD, tipo: 'ubicacion', valor: `  ${'x'.repeat(255)}  `,
  });
  assert.equal(contacto.valor.length, servicio.MAX_VALOR, '255 exactos se aceptan');
});

// ── Editar ──────────────────────────────────────────────────────────────────

test('ADM-06: editar actualiza valor, tipo y refresca fecha_actualizacion', async () => {
  const antes = bd.contactos.find((c) => c.id === 1).fecha_actualizacion;

  const { contacto } = await servicio.actualizar({
    usuarioId: U_COORD, id: 1, tipo: 'correo', valor: 'nuevo@ipn.mx',
  });

  assert.equal(contacto.valor, 'nuevo@ipn.mx');
  assert.ok(new Date(contacto.fechaActualizacion) > antes, 'la fecha se refrescó');
});

test('ADM-06: se puede cambiar el tipo de un registro existente', async () => {
  const { contacto } = await servicio.actualizar({
    usuarioId: U_COORD, id: 1, tipo: 'horario', valor: 'Lunes a viernes de 9:00 a 15:00',
  });
  assert.equal(contacto.tipo, 'horario');

  const r = await servicio.listar();
  assert.equal(r.porTipo.correo.length, 0, 'ya no está entre los correos');
  assert.equal(r.porTipo.horario.length, 2);
});

test('ADM-06: cualquier coordinador puede editar un contacto institucional ajeno', async () => {
  const { contacto } = await servicio.actualizar({
    usuarioId: U_COORD_2, id: 1, tipo: 'correo', valor: 'editado@ipn.mx',
  });
  assert.equal(contacto.valor, 'editado@ipn.mx');
  assert.equal(bd.contactos.find((c) => c.id === 1).coordinador_id, 2, 'queda como último autor');
});

test('ADM-06: editar valida igual que crear y no deja el registro a medias', async () => {
  await assert.rejects(
    servicio.actualizar({ usuarioId: U_COORD, id: 1, tipo: 'correo', valor: '' }),
    (err) => err.code === 'VALOR_VACIO',
  );
  await assert.rejects(
    servicio.actualizar({ usuarioId: U_COORD, id: 1, tipo: 'nota', valor: 'x' }),
    (err) => err.code === 'TIPO_INVALIDO',
  );
  assert.equal(bd.contactos.find((c) => c.id === 1).valor, 'ext_ae_escom@ipn.mx', 'intacto');
});

// ── Eliminar ────────────────────────────────────────────────────────────────

test('ADM-06: eliminar quita solo esa fila', async () => {
  const r = await servicio.eliminar({ usuarioId: U_COORD, id: 2 });

  assert.deepEqual(r, { id: 2 });
  const lista = await servicio.listar();
  assert.deepEqual(lista.porTipo.telefono.map((c) => c.id), [3], 'el otro teléfono sigue');
  assert.equal(lista.total, 3);
});

test('ADM-06: un id inexistente o inválido se distinguen y no borran nada', async () => {
  await assert.rejects(
    servicio.eliminar({ usuarioId: U_COORD, id: 9999 }),
    (err) => err.status === 404 && err.code === 'CONTACTO_NO_ENCONTRADO',
  );
  await assert.rejects(
    servicio.eliminar({ usuarioId: U_COORD, id: 'abc' }),
    (err) => err.status === 400 && err.code === 'CONTACTO_INVALIDO',
  );
  assert.equal(bd.contactos.length, 4);
});

test('ADM-06: sin registros, la agrupación sigue teniendo las cuatro claves vacías', async () => {
  bd.contactos = [];
  const r = await servicio.listar();

  assert.equal(r.total, 0);
  assert.deepEqual(r.contactos, []);
  for (const tipo of servicio.TIPOS) assert.deepEqual(r.porTipo[tipo], []);
});
