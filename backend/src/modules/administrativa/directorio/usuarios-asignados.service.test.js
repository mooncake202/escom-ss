// CU-ADM-17 — consultar información de usuarios asignados.
//
// El foco es el aislamiento por rol (un profesor nunca ve alumnos de otro, ni siquiera pidiéndolos
// por boleta) y la fidelidad de los datos: `creditos` es porcentaje de avance académico y debe
// llegar como número, sin convertirse en horas ni quedarse como Decimal.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./usuarios-asignados.service');

const U_PROF_A = 20, U_PROF_B = 21, U_PROF_VACIO = 22, U_COORD = 30, U_HUERFANO = 31;

// Imita lo que Prisma devuelve para Decimal(5,2): un objeto, NO un número. Si el servicio no lo
// convirtiera, el JSON saldría como string y este fixture lo delataría.
const decimal = (valor) => ({ toString: () => valor });

function montar() {
  const usuario = (id, nombre, apellidos, correo) => ({ id, nombre, apellidos, correo_institucional: correo });

  bd = {
    usuarios: [
      usuario(U_PROF_A, 'Rafael', 'Torres Vega', 'torres@ipn.mx'),
      usuario(U_PROF_B, 'Elena', 'Ramírez Flores', 'ramirez@ipn.mx'),
      usuario(U_PROF_VACIO, 'Mario', 'Gutiérrez Peña', 'gutierrez@ipn.mx'),
      usuario(U_COORD, 'Lucía', 'Morales Vega', 'morales@ipn.mx'),
      usuario(100, 'Ana', 'García López', 'ana@alumno.ipn.mx'),
      usuario(101, 'Beto', 'Hernández Ruiz', 'beto@alumno.ipn.mx'),
      usuario(102, 'Carla', 'Martínez Soto', 'carla@alumno.ipn.mx'),
      usuario(103, 'Dani', 'Sin Asignar Díaz', 'dani@alumno.ipn.mx'),
    ],
    profesores: [
      { id: 1, usuario_id: U_PROF_A, departamento: 'Sistemas Computacionales' },
      { id: 2, usuario_id: U_PROF_B, departamento: 'Inteligencia Artificial' },
      { id: 3, usuario_id: U_PROF_VACIO, departamento: 'Ciencia de Datos' },
    ],
    ofertas: [
      { id: 1, profesor_id: 1, nombre_proyecto: 'Proyecto A', tipo_oferta: 'proyecto' },
      { id: 2, profesor_id: 2, nombre_proyecto: 'Proyecto B', tipo_oferta: 'proyecto' },
      { id: 3, profesor_id: 1, nombre_proyecto: 'Individual A', tipo_oferta: 'individual' },
    ],
    alumnos: [
      { boleta: '2022630001', usuario_id: 100, carrera: 'ISC', celular: '5500000001', correo_personal: 'ana@gmail.com', creditos: decimal('85.00'), semestre: 8 },
      { boleta: '2022630002', usuario_id: 101, carrera: 'LCD', celular: '5500000002', correo_personal: null, creditos: decimal('80.00'), semestre: 6 },
      { boleta: '2022630003', usuario_id: 102, carrera: 'IA', celular: '5500000003', correo_personal: 'carla@gmail.com', creditos: decimal('100.00'), semestre: 9 },
      { boleta: '2022630004', usuario_id: 103, carrera: 'ISC', celular: '5500000004', correo_personal: null, creditos: decimal('60.00'), semestre: 5 },
    ],
    solicitudes: [
      // Profesor 1: Ana (oferta 1) y Carla (oferta 3, individual)
      { id: 1, alumno_id: '2022630001', oferta_id: 1, estado_solicitud: 'alumno_asignado' },
      { id: 3, alumno_id: '2022630003', oferta_id: 3, estado_solicitud: 'alumno_asignado' },
      // Profesor 2: Beto
      { id: 2, alumno_id: '2022630002', oferta_id: 2, estado_solicitud: 'alumno_asignado' },
      // Dani NO está asignado: está a media tubería de GR, con una oferta del profesor 1.
      { id: 4, alumno_id: '2022630004', oferta_id: 1, estado_solicitud: 'espera_respuesta_de_profesor' },
    ],
  };

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const ofertaDe = (id) => bd.ofertas.find((o) => o.id === id) ?? null;
  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;
  const alumnoDe = (boleta) => bd.alumnos.find((a) => a.boleta === boleta) ?? null;

  const conUsuario = (fila) => (fila ? { ...fila, usuario: usuarioDe(fila.usuario_id) } : null);

  const ofertaExpandida = (o, include = {}) => {
    if (!o) return null;
    if (!include.profesor) return { ...o };
    return { ...o, profesor: conUsuario(profesorDe(o.profesor_id)) };
  };

  // Aplica el `where` tal como lo arma el servicio, incluido el filtro anidado por profesor.
  const coincide = (s, where) => {
    if (where.estado_solicitud && s.estado_solicitud !== where.estado_solicitud) return false;
    if (where.alumno_id && s.alumno_id !== where.alumno_id) return false;
    if (where.oferta?.profesor_id !== undefined) {
      const o = ofertaDe(s.oferta_id);
      if (!o || o.profesor_id !== where.oferta.profesor_id) return false;
    }
    return true;
  };

  const expandir = (s, include = {}) => ({
    ...s,
    ...(include.alumno ? { alumno: conUsuario(alumnoDe(s.alumno_id)) } : {}),
    ...(include.oferta ? { oferta: ofertaExpandida(ofertaDe(s.oferta_id), include.oferta.include ?? {}) } : {}),
  });

  prismaActual = {
    profesor: {
      findUnique: async ({ where }) => conUsuario(
        where.usuario_id !== undefined
          ? bd.profesores.find((p) => p.usuario_id === where.usuario_id) ?? null
          : bd.profesores.find((p) => p.id === where.id) ?? null,
      ),
      findMany: async () => bd.profesores.map(conUsuario),
    },
    solicitud_registro: {
      findMany: async ({ where, include, select }) => {
        const filas = bd.solicitudes.filter((s) => coincide(s, where));
        // El conteo de coordinación usa `select`, no `include`.
        if (select?.oferta) {
          return filas.map((s) => {
            const o = ofertaDe(s.oferta_id);
            return { oferta: o ? { profesor_id: o.profesor_id } : null };
          });
        }
        return filas
          .map((s) => expandir(s, include ?? {}))
          .sort((a, b) => a.alumno_id.localeCompare(b.alumno_id));
      },
      findFirst: async ({ where, include }) => {
        const s = bd.solicitudes.find((f) => coincide(f, where));
        return s ? expandir(s, include ?? {}) : null;
      },
    },
  };
  return bd;
}

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// Profesor
// ════════════════════════════════════════════════════════════════════════════

test('ADM-17 profesor: obtiene únicamente los alumnos asignados a SUS ofertas', async () => {
  const r = await servicio.listarMisAlumnos({ usuarioId: U_PROF_A });

  assert.deepEqual(r.alumnos.map((a) => a.boleta), ['2022630001', '2022630003']);
  assert.equal(r.profesor.nombreCompleto, 'Rafael Torres Vega');
  // La oferta viaja para dar contexto, incluida la individual.
  assert.deepEqual(r.alumnos.map((a) => a.oferta), ['Proyecto A', 'Individual A']);
});

test('ADM-17 profesor: NO aparecen alumnos de otro profesor', async () => {
  const r = await servicio.listarMisAlumnos({ usuarioId: U_PROF_A });
  // Beto está asignado al profesor 2.
  assert.equal(r.alumnos.some((a) => a.boleta === '2022630002'), false);
});

test('ADM-17 profesor: NO aparecen solicitudes que no estén en alumno_asignado', async () => {
  const r = await servicio.listarMisAlumnos({ usuarioId: U_PROF_A });
  // Dani tiene una oferta de este profesor, pero sigue en 'espera_respuesta_de_profesor'.
  assert.equal(r.alumnos.some((a) => a.boleta === '2022630004'), false);
  assert.equal(bd.solicitudes.find((s) => s.alumno_id === '2022630004').oferta_id, 1, 'sí es una oferta suya');
});

test('ADM-17 profesor: la identidad sale del token — mandar otro profesor no cambia nada', async () => {
  const r = await servicio.listarMisAlumnos({
    usuarioId: U_PROF_A, profesorId: 2, profesor_id: 2, usuario_id: U_PROF_B,
  });
  assert.deepEqual(r.alumnos.map((a) => a.boleta), ['2022630001', '2022630003']);
  assert.equal(r.profesor.id, 1);
});

test('ADM-17 profesor: uno sin alumnos devuelve la lista vacía, no un error', async () => {
  const r = await servicio.listarMisAlumnos({ usuarioId: U_PROF_VACIO });

  assert.deepEqual(r.alumnos, []);
  assert.equal(r.profesor.nombreCompleto, 'Mario Gutiérrez Peña');
});

test('ADM-17 profesor: un usuario sin perfil de profesor recibe 404 SIN_PERFIL_PROFESOR', async () => {
  await assert.rejects(
    servicio.listarMisAlumnos({ usuarioId: U_HUERFANO }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_PROFESOR',
  );
});

test('ADM-17 profesor: no puede abrir el detalle de un alumno de OTRO profesor', async () => {
  // Beto existe y está asignado, pero al profesor 2.
  await assert.rejects(
    servicio.obtenerAlumnoAsignado({ usuarioId: U_PROF_A, rol: 'profesor', boleta: '2022630002' }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
  // Y una boleta inexistente da EXACTAMENTE el mismo error: no se puede sondear quién existe.
  await assert.rejects(
    servicio.obtenerAlumnoAsignado({ usuarioId: U_PROF_A, rol: 'profesor', boleta: '9999999999' }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
});

test('ADM-17 profesor: sí abre el detalle de un alumno suyo, con contacto completo', async () => {
  const r = await servicio.obtenerAlumnoAsignado({ usuarioId: U_PROF_A, rol: 'profesor', boleta: '2022630001' });

  assert.equal(r.alumno.nombreCompleto, 'Ana García López');
  assert.equal(r.alumno.celular, '5500000001');
  assert.equal(r.alumno.correoPersonal, 'ana@gmail.com');
  assert.equal(r.oferta.nombre, 'Proyecto A');
});

// ════════════════════════════════════════════════════════════════════════════
// Coordinación
// ════════════════════════════════════════════════════════════════════════════

test('ADM-17 coordinación: obtiene los profesores reales del sistema con su conteo de asignados', async () => {
  const r = await servicio.listarProfesores();

  assert.deepEqual(r.profesores.map((p) => [p.id, p.totalAlumnos]), [[1, 2], [2, 1], [3, 0]]);
  assert.equal(r.profesores[0].nombreCompleto, 'Rafael Torres Vega');
  assert.equal(r.profesores[0].departamento, 'Sistemas Computacionales');
});

test('ADM-17 coordinación: el conteo ignora las solicitudes que no están asignadas', async () => {
  // Dani cuelga de una oferta del profesor 1 pero no está asignado: el profesor 1 tiene 2, no 3.
  const r = await servicio.listarProfesores();
  assert.equal(r.profesores.find((p) => p.id === 1).totalAlumnos, 2);
});

test('ADM-17 coordinación: consulta los alumnos asignados de un profesor concreto', async () => {
  const r = await servicio.listarAlumnosDeProfesor({ profesorId: 2 });

  assert.equal(r.profesor.nombreCompleto, 'Elena Ramírez Flores');
  assert.deepEqual(r.alumnos.map((a) => a.boleta), ['2022630002']);
});

test('ADM-17 coordinación: un profesor sin alumnos devuelve lista vacía', async () => {
  const r = await servicio.listarAlumnosDeProfesor({ profesorId: 3 });

  assert.deepEqual(r.alumnos, []);
  assert.equal(r.profesor.id, 3);
});

test('ADM-17 coordinación: un profesor inexistente o un id inválido no se confunden con "sin alumnos"', async () => {
  await assert.rejects(
    servicio.listarAlumnosDeProfesor({ profesorId: 999 }),
    (err) => err.status === 404 && err.code === 'PROFESOR_NO_ENCONTRADO',
  );
  await assert.rejects(
    servicio.listarAlumnosDeProfesor({ profesorId: 'abc' }),
    (err) => err.status === 400 && err.code === 'PROFESOR_INVALIDO',
  );
});

test('ADM-17 coordinación: abre el detalle de cualquier alumno de esa navegación', async () => {
  const r = await servicio.obtenerAlumnoAsignado({ usuarioId: U_COORD, rol: 'coordinador', boleta: '2022630002' });

  assert.equal(r.alumno.nombreCompleto, 'Beto Hernández Ruiz');
  assert.equal(r.alumno.celular, '5500000002');
  // El detalle dice de quién es alumno, que es justo el contexto de la navegación.
  assert.equal(r.profesor.nombreCompleto, 'Elena Ramírez Flores');
  assert.equal(r.oferta.nombre, 'Proyecto B');
});

test('ADM-17 coordinación: NO puede abrir a un alumno que no está asignado', async () => {
  await assert.rejects(
    servicio.obtenerAlumnoAsignado({ usuarioId: U_COORD, rol: 'coordinador', boleta: '2022630004' }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
});

test('ADM-17: una boleta vacía se rechaza antes de tocar la base', async () => {
  await assert.rejects(
    servicio.obtenerAlumnoAsignado({ usuarioId: U_COORD, rol: 'coordinador', boleta: '   ' }),
    (err) => err.status === 400 && err.code === 'BOLETA_INVALIDA',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Datos
// ════════════════════════════════════════════════════════════════════════════

test('ADM-17: creditos llega como número y es el porcentaje académico, no horas', async () => {
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROF_A });
  const ana = alumnos.find((a) => a.boleta === '2022630001');

  assert.equal(typeof ana.creditos, 'number', 'Decimal convertido, no string ni objeto');
  assert.equal(ana.creditos, 85, 'el mismo valor de la BD, sin escalar a horas');

  const carla = alumnos.find((a) => a.boleta === '2022630003');
  assert.equal(carla.creditos, 100, '100 = 100% de avance, no 100 horas');

  // Ningún campo de horas de servicio social se cuela en ADM-17.
  for (const a of alumnos) {
    for (const clave of Object.keys(a)) {
      assert.equal(/hora/i.test(clave), false, `${clave} no pertenece a este CU`);
    }
  }
});

test('ADM-17: correoPersonal nullable llega como null y no rompe el detalle', async () => {
  const r = await servicio.obtenerAlumnoAsignado({ usuarioId: U_COORD, rol: 'coordinador', boleta: '2022630002' });
  assert.equal(r.alumno.correoPersonal, null);
  assert.equal('correoPersonal' in r.alumno, true, 'la clave existe aunque el valor sea null');
});

test('ADM-17: el listado expone identificación y avance, sin datos de contacto personal', async () => {
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROF_A });

  for (const a of alumnos) {
    assert.deepEqual(Object.keys(a).sort(), [
      'apellidos', 'boleta', 'carrera', 'correoInstitucional', 'creditos',
      'nombreCompleto', 'nombre', 'oferta', 'semestre',
    ].sort());
  }
});

test('ADM-17: el detalle añade exactamente el contacto personal que pide el CU', async () => {
  const r = await servicio.obtenerAlumnoAsignado({ usuarioId: U_PROF_A, rol: 'profesor', boleta: '2022630001' });

  assert.deepEqual(Object.keys(r.alumno).sort(), [
    'apellidos', 'boleta', 'carrera', 'celular', 'correoInstitucional', 'correoPersonal',
    'creditos', 'nombreCompleto', 'nombre', 'oferta', 'semestre',
  ].sort());
  assert.deepEqual(Object.keys(r).sort(), ['alumno', 'oferta', 'profesor']);
});

test('ADM-17: el profesor expuesto no inventa campos que el esquema no tiene', async () => {
  const { profesores } = await servicio.listarProfesores();

  assert.deepEqual(Object.keys(profesores[0]).sort(), [
    'correoInstitucional', 'departamento', 'id', 'nombreCompleto', 'totalAlumnos',
  ]);
  // No existe "id de empleado" ni "última actualización" en el esquema: no deben aparecer.
  assert.equal('idEmpleado' in profesores[0], false);
  assert.equal('ultimaActualizacion' in profesores[0], false);
});
