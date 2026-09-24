// CU-ADM-02 (consultar anuncios) y CU-ADM-07 (publicar).
//
// El foco es el aislamiento: que un alumno vea los de Coordinación y los de SU profesor y de nadie
// más, que no pueda marcar como visto un anuncio ajeno conociendo el id, y que el autor y el origen
// salgan siempre del token y nunca del cuerpo.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./anuncios.service');

const U_ANA = 10, U_BETO = 11, U_SIN_ASIGNAR = 12, U_HUERFANO = 13;
const U_PROF_A = 20, U_PROF_B = 21, U_PROF_VACIO = 22;
const U_COORD = 30, U_COORD_2 = 31;

function montar() {
  const usuario = (id, nombre, apellidos) => ({ id, nombre, apellidos, correo_institucional: `u${id}@ipn.mx` });

  bd = {
    usuarios: [
      usuario(U_ANA, 'Ana', 'García López'),
      usuario(U_BETO, 'Beto', 'Hernández Ruiz'),
      usuario(U_SIN_ASIGNAR, 'Sin', 'Asignar Díaz'),
      usuario(U_PROF_A, 'Rafael', 'Torres Vega'),
      usuario(U_PROF_B, 'Elena', 'Ramírez Flores'),
      usuario(U_PROF_VACIO, 'Mario', 'Gutiérrez Peña'),
      usuario(U_COORD, 'Lucía', 'Morales Vega'),
      usuario(U_COORD_2, 'Otro', 'Coordinador Ruiz'),
    ],
    profesores: [
      { id: 1, usuario_id: U_PROF_A, departamento: 'Sistemas' },
      { id: 2, usuario_id: U_PROF_B, departamento: 'IA' },
      { id: 3, usuario_id: U_PROF_VACIO, departamento: 'Datos' },
    ],
    ofertas: [
      { id: 1, profesor_id: 1, nombre_proyecto: 'Proyecto A', descripcion_actividades: 'A', tipo_oferta: 'proyecto' },
      { id: 2, profesor_id: 2, nombre_proyecto: 'Proyecto B', descripcion_actividades: 'B', tipo_oferta: 'proyecto' },
    ],
    alumnos: [
      { boleta: '2022630001', usuario_id: U_ANA, carrera: 'ISC', celular: '5500000001', correo_personal: null },
      { boleta: '2022630002', usuario_id: U_BETO, carrera: 'LCD', celular: '5500000002', correo_personal: null },
      { boleta: '2022630003', usuario_id: U_SIN_ASIGNAR, carrera: 'ISC', celular: '5500000003', correo_personal: null },
    ],
    solicitudes: [
      { id: 1, alumno_id: '2022630001', oferta_id: 1, estado_solicitud: 'alumno_asignado' }, // Ana → profesor A
      { id: 2, alumno_id: '2022630002', oferta_id: 2, estado_solicitud: 'alumno_asignado' }, // Beto → profesor B
      { id: 3, alumno_id: '2022630003', oferta_id: 1, estado_solicitud: 'espera_respuesta_de_profesor' },
    ],
    anuncios: [
      { id: 1, usuario_id: U_COORD, titulo: 'Coord antiguo', contenido: 'C1', origen: 'coordinador', fecha_publicacion: new Date('2026-01-10T10:00:00Z') },
      { id: 2, usuario_id: U_PROF_A, titulo: 'De su profesor', contenido: 'P1', origen: 'profesor', fecha_publicacion: new Date('2026-03-01T10:00:00Z') },
      { id: 3, usuario_id: U_PROF_B, titulo: 'De OTRO profesor', contenido: 'P2', origen: 'profesor', fecha_publicacion: new Date('2026-04-01T10:00:00Z') },
      { id: 4, usuario_id: U_COORD, titulo: 'Coord reciente', contenido: 'C2', origen: 'coordinador', fecha_publicacion: new Date('2026-05-01T10:00:00Z') },
      { id: 5, usuario_id: U_COORD_2, titulo: 'De otro coordinador', contenido: 'C3', origen: 'coordinador', fecha_publicacion: new Date('2026-02-01T10:00:00Z') },
    ],
    vistos: [],
    secuencia: 100,
  };

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const ofertaDe = (id) => bd.ofertas.find((o) => o.id === id) ?? null;
  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;
  const conUsuario = (fila) => (fila ? { ...fila, usuario: usuarioDe(fila.usuario_id) } : null);

  // Reproduce el OR de visibilidad tal cual lo arma el servicio.
  const visible = (a, where) => {
    if (where.id !== undefined && a.id !== where.id) return false;
    if (!where.OR) return true;
    return where.OR.some((cond) => {
      if (cond.origen !== a.origen) return false;
      if (cond.usuario_id !== undefined && cond.usuario_id !== a.usuario_id) return false;
      return true;
    });
  };

  const ordenar = (lista) => [...lista].sort(
    (x, y) => y.fecha_publicacion - x.fecha_publicacion || y.id - x.id,
  );

  prismaActual = {
    // directorio.service.resolverAsignacion
    alumno: {
      findUnique: async ({ where, include }) => {
        const a = bd.alumnos.find((x) => x.usuario_id === where.usuario_id) ?? null;
        if (!a) return null;
        const salida = { ...a };
        if (include?.usuario) salida.usuario = usuarioDe(a.usuario_id);
        if (include?.solicitud_registro) {
          const sr = bd.solicitudes.find((s) => s.alumno_id === a.boleta) ?? null;
          if (!sr) salida.solicitud_registro = null;
          else {
            const o = ofertaDe(sr.oferta_id);
            salida.solicitud_registro = {
              ...sr,
              oferta: o ? { ...o, profesor: conUsuario(profesorDe(o.profesor_id)) } : null,
            };
          }
        }
        return salida;
      },
    },
    profesor: {
      findUnique: async ({ where }) => bd.profesores.find((p) => p.usuario_id === where.usuario_id) ?? null,
    },
    solicitud_registro: {
      count: async ({ where }) => bd.solicitudes.filter((s) => {
        if (s.estado_solicitud !== where.estado_solicitud) return false;
        const o = ofertaDe(s.oferta_id);
        return o && o.profesor_id === where.oferta.profesor_id;
      }).length,
    },
    anuncio: {
      findMany: async ({ where, take }) => {
        const filas = where.usuario_id !== undefined && !where.OR
          ? bd.anuncios.filter((a) => a.usuario_id === where.usuario_id)
          : bd.anuncios.filter((a) => visible(a, where));
        const ordenadas = ordenar(filas).map((a) => ({ ...a, usuario: usuarioDe(a.usuario_id) }));
        return take ? ordenadas.slice(0, take) : ordenadas;
      },
      findFirst: async ({ where }) => bd.anuncios.find((a) => visible(a, where)) ?? null,
      create: async ({ data }) => {
        const fila = { id: ++bd.secuencia, ...data };
        bd.anuncios.push(fila);
        return { ...fila, usuario: usuarioDe(fila.usuario_id) };
      },
    },
    registro_anuncio_visto: {
      findMany: async ({ where }) => bd.vistos.filter(
        (v) => v.alumno_id === where.alumno_id && where.anuncio_id.in.includes(v.anuncio_id),
      ),
      create: async ({ data }) => {
        const choca = bd.vistos.some((v) => v.alumno_id === data.alumno_id && v.anuncio_id === data.anuncio_id);
        if (choca) {
          // Igual que el @@unique([alumno_id, anuncio_id]) real.
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          throw err;
        }
        bd.vistos.push({ ...data });
        return data;
      },
    },
  };
  return bd;
}

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-02 — el alumno consulta
// ════════════════════════════════════════════════════════════════════════════

test('ADM-02: el alumno ve los anuncios de Coordinación', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  const coord = anuncios.filter((a) => a.origen === 'coordinador').map((a) => a.id);
  // Los de CUALQUIER coordinador, no solo los de uno.
  assert.deepEqual(coord.sort(), [1, 4, 5]);
});

test('ADM-02: el alumno ve los anuncios de SU profesor asignado', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  const deProfesor = anuncios.filter((a) => a.origen === 'profesor');

  assert.deepEqual(deProfesor.map((a) => a.id), [2]);
  assert.equal(deProfesor[0].autor, 'Rafael Torres Vega');
});

test('ADM-02: NO ve los anuncios de otro profesor', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.equal(anuncios.some((a) => a.id === 3), false, 'el 3 es del profesor B');

  // Y el de al lado ve justo el contrario.
  const deBeto = await servicio.listarParaAlumno({ usuarioId: U_BETO });
  assert.equal(deBeto.anuncios.some((a) => a.id === 3), true);
  assert.equal(deBeto.anuncios.some((a) => a.id === 2), false);
});

test('ADM-02: el orden es por fecha de publicación descendente', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.deepEqual(anuncios.map((a) => a.id), [4, 2, 5, 1]);

  const fechas = anuncios.map((a) => a.fechaPublicacion);
  assert.deepEqual(fechas, [...fechas].sort().reverse());
});

test('ADM-02: ?limite recorta el resultado sin cambiar la regla de visibilidad', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA, limite: 3 });

  assert.deepEqual(anuncios.map((a) => a.id), [4, 2, 5], 'los 3 más recientes de los suyos');
  assert.equal(anuncios.some((a) => a.id === 3), false, 'sigue sin colarse el de otro profesor');
});

test('ADM-02: todos llegan como no vistos al principio', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.equal(anuncios.every((a) => a.visto === false), true);
});

test('ADM-02: marcar visto se refleja en el listado, y solo para ese alumno', async () => {
  await servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 4 });

  const deAna = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.equal(deAna.anuncios.find((a) => a.id === 4).visto, true);
  assert.equal(deAna.anuncios.find((a) => a.id === 1).visto, false, 'los demás no se tocan');

  const deBeto = await servicio.listarParaAlumno({ usuarioId: U_BETO });
  assert.equal(deBeto.anuncios.find((a) => a.id === 4).visto, false, 'el acuse es por alumno');
});

test('ADM-02: marcar visto dos veces es idempotente y no duplica filas', async () => {
  await servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 4 });
  await servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 4 });
  const tercero = await servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 4 });

  assert.deepEqual(tercero, { id: 4, visto: true });
  assert.equal(bd.vistos.filter((v) => v.anuncio_id === 4).length, 1);
});

test('ADM-02: NO puede marcar como visto el anuncio de otro profesor aunque sepa el id', async () => {
  await assert.rejects(
    servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 3 }),
    (err) => err.status === 404 && err.code === 'ANUNCIO_NO_VISIBLE',
  );
  assert.deepEqual(bd.vistos, [], 'no se escribió nada');

  // Un id inexistente da el MISMO error: no se puede sondear qué anuncios existen.
  await assert.rejects(
    servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 9999 }),
    (err) => err.status === 404 && err.code === 'ANUNCIO_NO_VISIBLE',
  );
});

test('ADM-02: un id inválido se rechaza antes de tocar la base', async () => {
  await assert.rejects(
    servicio.marcarVisto({ usuarioId: U_ANA, anuncioId: 'abc' }),
    (err) => err.status === 400 && err.code === 'ANUNCIO_INVALIDO',
  );
});

test('ADM-02: sin asignación vigente no hay anuncios que mostrar', async () => {
  // Es el caso de quien aún no está asignado: la ruta ya exige el rol, esto es la segunda barrera.
  await assert.rejects(
    servicio.listarParaAlumno({ usuarioId: U_SIN_ASIGNAR }),
    (err) => err.status === 404 && err.code === 'SIN_ASIGNACION',
  );
  await assert.rejects(
    servicio.marcarVisto({ usuarioId: U_SIN_ASIGNAR, anuncioId: 1 }),
    (err) => err.status === 404 && err.code === 'SIN_ASIGNACION',
  );
  await assert.rejects(
    servicio.listarParaAlumno({ usuarioId: U_HUERFANO }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_ALUMNO',
  );
});

test('ADM-02: la visibilidad sigue al profesor ACTUAL, no al que tenía antes', async () => {
  const antes = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.deepEqual(antes.anuncios.filter((a) => a.origen === 'profesor').map((a) => a.id), [2]);

  // Se reasigna a Ana a la oferta del profesor B.
  bd.solicitudes.find((s) => s.alumno_id === '2022630001').oferta_id = 2;

  const despues = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.deepEqual(despues.anuncios.filter((a) => a.origen === 'profesor').map((a) => a.id), [3]);
  assert.equal(despues.anuncios.some((a) => a.id === 2), false, 'deja de ver los del anterior');
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-07 — profesor
// ════════════════════════════════════════════════════════════════════════════

test('ADM-07 profesor: publica y el anuncio queda visible para SUS alumnos', async () => {
  const { anuncio, alcance } = await servicio.publicar({
    usuarioId: U_PROF_A, rol: 'profesor', titulo: '  Junta del viernes  ', contenido: '  A las 10.  ',
  });

  assert.equal(anuncio.origen, 'profesor');
  assert.equal(anuncio.titulo, 'Junta del viernes', 'se recorta el espacio sobrante');
  assert.equal(anuncio.contenido, 'A las 10.');
  assert.equal(alcance, 1, 'un alumno asignado');

  const deAna = await servicio.listarParaAlumno({ usuarioId: U_ANA });
  assert.equal(deAna.anuncios[0].id, anuncio.id, 'el más reciente');
  const deBeto = await servicio.listarParaAlumno({ usuarioId: U_BETO });
  assert.equal(deBeto.anuncios.some((a) => a.id === anuncio.id), false, 'no llega a los de otro');
});

test('ADM-07 profesor: el autor y el origen salen del token, no del cuerpo', async () => {
  const { anuncio } = await servicio.publicar({
    usuarioId: U_PROF_A,
    rol: 'profesor',
    titulo: 'T', contenido: 'C',
    // Todo esto se ignora por completo:
    usuario_id: U_COORD, usuarioId2: U_COORD, origen: 'coordinador', autor: 'Otro', fecha_publicacion: new Date('2000-01-01'),
  });

  const fila = bd.anuncios.find((a) => a.id === anuncio.id);
  assert.equal(fila.usuario_id, U_PROF_A, 'el autor es quien tiene el token');
  assert.equal(fila.origen, 'profesor', 'el origen lo decide el rol');
  assert.equal(anuncio.autor, 'Rafael Torres Vega');
  assert.ok(fila.fecha_publicacion > new Date('2020-01-01'), 'la fecha la pone el servidor');
});

test('ADM-07 profesor: sin alumnos asignados NO puede publicar', async () => {
  await assert.rejects(
    servicio.publicar({ usuarioId: U_PROF_VACIO, rol: 'profesor', titulo: 'T', contenido: 'C' }),
    (err) => err.status === 409 && err.code === 'SIN_ALUMNOS_ASIGNADOS',
  );
  assert.equal(bd.anuncios.length, 5, 'no se creó nada');
});

test('ADM-07 profesor: un usuario sin perfil de profesor no publica', async () => {
  await assert.rejects(
    servicio.publicar({ usuarioId: U_HUERFANO, rol: 'profesor', titulo: 'T', contenido: 'C' }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_PROFESOR',
  );
});

test('ADM-07 profesor: el historial es SOLO el suyo', async () => {
  const { anuncios, alcance } = await servicio.listarMios({ usuarioId: U_PROF_A, rol: 'profesor' });

  assert.deepEqual(anuncios.map((a) => a.id), [2]);
  assert.equal(anuncios.some((a) => a.id === 3), false, 'no ve los del profesor B');
  assert.equal(anuncios.some((a) => a.origen === 'coordinador'), false);
  assert.equal(alcance, 1, 'el profesor sí recibe su alcance');
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-07 — coordinación
// ════════════════════════════════════════════════════════════════════════════

test('ADM-07 coordinación: publica un anuncio global visible para todo alumno asignado', async () => {
  const { anuncio, alcance } = await servicio.publicar({
    usuarioId: U_COORD, rol: 'coordinador', titulo: 'Aviso general', contenido: 'Para todos.',
  });

  assert.equal(anuncio.origen, 'coordinador');
  assert.equal(alcance, null, 'el alcance global no se cuenta por profesor');

  for (const alumno of [U_ANA, U_BETO]) {
    const r = await servicio.listarParaAlumno({ usuarioId: alumno });
    assert.equal(r.anuncios[0].id, anuncio.id, 'lo ven todos, y es el más reciente');
  }
});

test('ADM-07 coordinación: no necesita alumnos asignados para publicar', async () => {
  const { anuncio } = await servicio.publicar({ usuarioId: U_COORD_2, rol: 'coordinador', titulo: 'T', contenido: 'C' });
  assert.equal(anuncio.origen, 'coordinador');
});

test('ADM-07 coordinación: el historial es SOLO el suyo, no el de otro coordinador', async () => {
  const { anuncios, alcance } = await servicio.listarMios({ usuarioId: U_COORD, rol: 'coordinador' });

  assert.deepEqual(anuncios.map((a) => a.id), [4, 1], 'suyos y en orden descendente');
  assert.equal(anuncios.some((a) => a.id === 5), false, 'el 5 es de otro coordinador');
  assert.equal(alcance, null);
});

// ════════════════════════════════════════════════════════════════════════════
// Validaciones y roles
// ════════════════════════════════════════════════════════════════════════════

test('ADM-07: título vacío o solo espacios → 400', async () => {
  for (const titulo of ['', '   ', null, undefined, 42]) {
    await assert.rejects(
      servicio.publicar({ usuarioId: U_COORD, rol: 'coordinador', titulo, contenido: 'C' }),
      (err) => err.status === 400 && err.code === 'TITULO_VACIO',
    );
  }
});

test('ADM-07: contenido vacío o solo espacios → 400', async () => {
  for (const contenido of ['', '   ', null, undefined, {}]) {
    await assert.rejects(
      servicio.publicar({ usuarioId: U_COORD, rol: 'coordinador', titulo: 'T', contenido }),
      (err) => err.status === 400 && err.code === 'CONTENIDO_VACIO',
    );
  }
});

test('ADM-07: un título de más de 150 caracteres se rechaza; exactamente 150 se acepta', async () => {
  await assert.rejects(
    servicio.publicar({ usuarioId: U_COORD, rol: 'coordinador', titulo: 'x'.repeat(151), contenido: 'C' }),
    (err) => err.status === 400 && err.code === 'TITULO_MUY_LARGO',
  );

  const { anuncio } = await servicio.publicar({
    usuarioId: U_COORD, rol: 'coordinador', titulo: 'x'.repeat(150), contenido: 'C',
  });
  assert.equal(anuncio.titulo.length, servicio.MAX_TITULO);
});

test('ADM-07: el límite de 150 se mide DESPUÉS del trim', async () => {
  const { anuncio } = await servicio.publicar({
    usuarioId: U_COORD, rol: 'coordinador', titulo: `   ${'x'.repeat(150)}   `, contenido: 'C',
  });
  assert.equal(anuncio.titulo.length, 150);
});

test('ADM-07: ningún otro rol puede publicar ni consultar historial', async () => {
  for (const rol of ['alumno_asignado', 'alumno_sin_asignar', undefined, 'admin']) {
    await assert.rejects(
      servicio.publicar({ usuarioId: U_ANA, rol, titulo: 'T', contenido: 'C' }),
      (err) => err.status === 403 && err.code === 'ROL_NO_AUTORIZADO',
    );
    await assert.rejects(
      servicio.listarMios({ usuarioId: U_ANA, rol }),
      (err) => err.status === 403 && err.code === 'ROL_NO_AUTORIZADO',
    );
  }
  assert.equal(bd.anuncios.length, 5, 'no se creó nada');
});

test('ADM-07: publicar NO escribe en notificacion — son conceptos distintos', async () => {
  // El fake no expone `notificacion`: si el servicio intentara usarlo, esto reventaría.
  assert.equal('notificacion' in prismaActual, false);
  const { anuncio } = await servicio.publicar({ usuarioId: U_COORD, rol: 'coordinador', titulo: 'T', contenido: 'C' });
  assert.ok(anuncio.id);
});

test('ADM-02/07: el DTO expone solo lo necesario, sin filtrar el id del autor', async () => {
  const { anuncios } = await servicio.listarParaAlumno({ usuarioId: U_ANA });

  for (const a of anuncios) {
    assert.deepEqual(Object.keys(a).sort(), [
      'autor', 'contenido', 'fechaPublicacion', 'id', 'origen', 'titulo', 'visto',
    ]);
    assert.equal('usuario_id' in a, false, 'el id interno del autor no sale');
  }
});
