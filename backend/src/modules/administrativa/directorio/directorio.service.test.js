// CU-ADM-01 (profesor asignado) y CU-ADM-03 (equipo de proyecto).
//
// El foco es el aislamiento: que cada alumno vea SOLO su profesor y SOLO a los compañeros de su
// misma oferta, que nunca se vea a sí mismo en la lista, y que el celular de un tercero no salga
// jamás en la respuesta.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./directorio.service');

// Dos ofertas de dos profesores distintos, para poder comprobar que no se cruzan.
const U_ANA = 10, U_BETO = 11, U_CARLA = 12, U_SOLO = 13, U_SIN_ASIGNAR = 14, U_HUERFANO = 15;
const U_PROF_A = 20, U_PROF_B = 21;

function montar() {
  const usuario = (id, nombre, apellidos, correo) => ({ id, nombre, apellidos, correo_institucional: correo });

  bd = {
    usuarios: [
      usuario(U_ANA, 'Ana', 'García López', 'ana@alumno.ipn.mx'),
      usuario(U_BETO, 'Beto', 'Hernández Ruiz', 'beto@alumno.ipn.mx'),
      usuario(U_CARLA, 'Carla', 'Martínez Soto', 'carla@alumno.ipn.mx'),
      usuario(U_SOLO, 'Solo', 'Individual Pérez', 'solo@alumno.ipn.mx'),
      usuario(U_SIN_ASIGNAR, 'Sin', 'Asignar Díaz', 'sin@alumno.ipn.mx'),
      usuario(U_HUERFANO, 'Nadie', 'Sin Perfil', 'nadie@ipn.mx'),
      usuario(U_PROF_A, 'Rafael', 'Torres Vega', 'torres@ipn.mx'),
      usuario(U_PROF_B, 'Otra', 'Profesora Ruiz', 'otra@ipn.mx'),
    ],
    profesores: [
      { id: 1, usuario_id: U_PROF_A, departamento: 'Sistemas Computacionales', telefono_personal: '5511112222', horario_atencion: 'L-V 10:00-12:00', cubiculo: 'CB-03' },
      { id: 2, usuario_id: U_PROF_B, departamento: 'Inteligencia Artificial', telefono_personal: '5533334444', horario_atencion: 'M-J 8:00-10:00', cubiculo: 'CB-07' },
    ],
    ofertas: [
      { id: 1, profesor_id: 1, nombre_proyecto: 'Proyecto A', descripcion_actividades: 'Desc A', tipo_oferta: 'proyecto' },
      { id: 2, profesor_id: 2, nombre_proyecto: 'Proyecto B', descripcion_actividades: 'Desc B', tipo_oferta: 'proyecto' },
      { id: 3, profesor_id: 1, nombre_proyecto: 'Individual A', descripcion_actividades: 'Desc I', tipo_oferta: 'individual' },
    ],
    // El celular está en los datos a propósito: el test comprueba que NO sale en la respuesta.
    alumnos: [
      { boleta: '2022630001', usuario_id: U_ANA, carrera: 'ISC', celular: '5500000001', correo_personal: 'ana@gmail.com' },
      { boleta: '2022630002', usuario_id: U_BETO, carrera: 'LCD', celular: '5500000002', correo_personal: 'beto@gmail.com' },
      { boleta: '2022630003', usuario_id: U_CARLA, carrera: 'IIA', celular: '5500000003', correo_personal: null },
      { boleta: '2022630004', usuario_id: U_SOLO, carrera: 'ISC', celular: '5500000004', correo_personal: 'solo@gmail.com' },
      { boleta: '2022630005', usuario_id: U_SIN_ASIGNAR, carrera: 'ISC', celular: '5500000005', correo_personal: null },
    ],
    solicitudes: [
      // Oferta 1 (proyecto, profesor A): Ana + Beto
      { id: 1, alumno_id: '2022630001', oferta_id: 1, estado_solicitud: 'alumno_asignado' },
      { id: 2, alumno_id: '2022630002', oferta_id: 1, estado_solicitud: 'alumno_asignado' },
      // Oferta 2 (proyecto, profesor B): Carla — NO debe aparecer en el equipo de Ana
      { id: 3, alumno_id: '2022630003', oferta_id: 2, estado_solicitud: 'alumno_asignado' },
      // Oferta 3 (individual, profesor A): Solo
      { id: 4, alumno_id: '2022630004', oferta_id: 3, estado_solicitud: 'alumno_asignado' },
      // Sin asignación vigente
      { id: 5, alumno_id: '2022630005', oferta_id: 1, estado_solicitud: 'espera_respuesta_de_profesor' },
    ],
  };

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const ofertaDe = (id) => bd.ofertas.find((o) => o.id === id) ?? null;
  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;

  const alumnoConRelaciones = (a, include = {}) => {
    if (!a) return null;
    const salida = { ...a };
    if (include.usuario) salida.usuario = usuarioDe(a.usuario_id);
    if (include.solicitud_registro) {
      const sr = bd.solicitudes.find((s) => s.alumno_id === a.boleta) ?? null;
      const incSr = include.solicitud_registro.include ?? {};
      salida.solicitud_registro = sr ? { ...sr, ...(incSr.oferta ? { oferta: ofertaConProfesor(ofertaDe(sr.oferta_id), incSr.oferta.include ?? {}) } : {}) } : null;
    }
    return salida;
  };

  const ofertaConProfesor = (o, include = {}) => {
    if (!o) return null;
    if (!include.profesor) return { ...o };
    const p = profesorDe(o.profesor_id);
    const incP = include.profesor.include ?? {};
    return { ...o, profesor: { ...p, ...(incP.usuario ? { usuario: usuarioDe(p.usuario_id) } : {}) } };
  };

  prismaActual = {
    alumno: {
      findUnique: async ({ where, include }) => alumnoConRelaciones(
        bd.alumnos.find((a) => a.usuario_id === where.usuario_id) ?? null, include),
    },
    solicitud_registro: {
      findMany: async ({ where, include }) => bd.solicitudes
        .filter((s) => s.oferta_id === where.oferta_id
          && s.estado_solicitud === where.estado_solicitud
          && s.alumno_id !== where.alumno_id.not)
        .map((s) => ({
          ...s,
          ...(include?.alumno ? { alumno: alumnoConRelaciones(bd.alumnos.find((a) => a.boleta === s.alumno_id), include.alumno.include ?? {}) } : {}),
        })),
    },
  };
  return bd;
}

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-01 — profesor asignado
// ════════════════════════════════════════════════════════════════════════════

test('ADM-01: el alumno obtiene SU profesor con todos los datos de contacto', async () => {
  const r = await servicio.obtenerMiProfesor({ usuarioId: U_ANA });

  assert.deepEqual(r.profesor, {
    nombreCompleto: 'Rafael Torres Vega',
    nombre: 'Rafael',
    apellidos: 'Torres Vega',
    correoInstitucional: 'torres@ipn.mx',
    cubiculo: 'CB-03',
    departamento: 'Sistemas Computacionales',
    horarioAtencion: 'L-V 10:00-12:00',
    telefonoPersonal: '5511112222',
  });
  assert.equal(r.oferta.nombre, 'Proyecto A');
  assert.equal(r.oferta.esProyecto, true);
});

test('ADM-01: cada alumno recibe el profesor de SU oferta, no el de otra', async () => {
  const deAna = await servicio.obtenerMiProfesor({ usuarioId: U_ANA });
  const deCarla = await servicio.obtenerMiProfesor({ usuarioId: U_CARLA });

  assert.equal(deAna.profesor.correoInstitucional, 'torres@ipn.mx');
  assert.equal(deCarla.profesor.correoInstitucional, 'otra@ipn.mx');
  assert.notEqual(deAna.profesor.cubiculo, deCarla.profesor.cubiculo);
});

test('ADM-01: no hay forma de pedir otro profesor por id — solo se acepta el usuario del token', async () => {
  // La firma solo recibe usuarioId: cualquier otra clave se ignora por completo.
  const r = await servicio.obtenerMiProfesor({
    usuarioId: U_ANA, profesorId: 2, profesor_id: 2, oferta_id: 2, boleta: '2022630003',
  });
  assert.equal(r.profesor.correoInstitucional, 'torres@ipn.mx', 'sigue siendo el suyo');
  assert.equal(r.oferta.id, 1);
});

test('ADM-01: un alumno sin asignación vigente recibe 404 SIN_ASIGNACION', async () => {
  await assert.rejects(
    servicio.obtenerMiProfesor({ usuarioId: U_SIN_ASIGNAR }),
    (err) => err.status === 404 && err.code === 'SIN_ASIGNACION',
  );
});

test('ADM-01: un usuario sin perfil de alumno recibe 404 SIN_PERFIL_ALUMNO', async () => {
  await assert.rejects(
    servicio.obtenerMiProfesor({ usuarioId: U_HUERFANO }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_ALUMNO',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-03 — equipo de proyecto
// ════════════════════════════════════════════════════════════════════════════

test('ADM-03: en una oferta de proyecto devuelve a los compañeros de ESA oferta', async () => {
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_ANA });

  assert.equal(r.oferta.esProyecto, true);
  assert.equal(r.oferta.id, 1);
  assert.deepEqual(r.companeros.map((c) => c.boleta), ['2022630002'], 'solo Beto');
  assert.equal(r.companeros[0].nombreCompleto, 'Beto Hernández Ruiz');
});

test('ADM-03: el alumno autenticado queda EXCLUIDO de la lista y viaja en `yo`', async () => {
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_ANA });

  assert.equal(r.companeros.some((c) => c.boleta === '2022630001'), false, 'no se ve a sí mismo');
  assert.equal(r.yo.boleta, '2022630001');
  assert.equal(r.yo.nombreCompleto, 'Ana García López');
  assert.equal(r.yo.correoPersonal, 'ana@gmail.com');
});

test('ADM-03: NO aparecen alumnos de otras ofertas', async () => {
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_ANA });
  // Carla está en la oferta 2, con otro profesor.
  assert.equal(r.companeros.some((c) => c.boleta === '2022630003'), false);
});

test('ADM-03: los compañeros NO exponen el celular', async () => {
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_ANA });

  for (const c of [...r.companeros, r.yo]) {
    assert.equal('celular' in c, false, `${c.boleta} no debe traer celular`);
    assert.deepEqual(Object.keys(c).sort(), [
      'apellidos', 'boleta', 'carrera', 'correoInstitucional', 'correoPersonal', 'nombre', 'nombreCompleto',
    ]);
  }
  // Y el dato sí existe en la BD: la ausencia es de la proyección, no del origen.
  assert.equal(bd.alumnos.find((a) => a.boleta === '2022630002').celular, '5500000002');
});

test('ADM-03: una oferta individual no devuelve compañeros', async () => {
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_SOLO });

  assert.equal(r.oferta.esProyecto, false);
  assert.equal(r.oferta.tipo, 'individual');
  assert.deepEqual(r.companeros, [], 'la pantalla oculta la sección');
  assert.equal(r.yo.boleta, '2022630004', 'sus propios datos sí llegan');
});

test('ADM-03: un compañero sin correo personal lo expone como null, no rompe', async () => {
  // Carla (oferta 2) no tiene correo personal; se consulta desde su propia sesión.
  const r = await servicio.obtenerMiEquipo({ usuarioId: U_CARLA });
  assert.equal(r.yo.correoPersonal, null);
});

test('ADM-03: sin asignación vigente o sin perfil, mismos errores que ADM-01', async () => {
  await assert.rejects(
    servicio.obtenerMiEquipo({ usuarioId: U_SIN_ASIGNAR }),
    (err) => err.status === 404 && err.code === 'SIN_ASIGNACION',
  );
  await assert.rejects(
    servicio.obtenerMiEquipo({ usuarioId: U_HUERFANO }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_ALUMNO',
  );
});

test('ADM-03: tampoco acepta una oferta o boleta del cliente', async () => {
  const r = await servicio.obtenerMiEquipo({
    usuarioId: U_ANA, oferta_id: 2, ofertaId: 2, boleta: '2022630003',
  });
  assert.equal(r.oferta.id, 1, 'sigue siendo su propia oferta');
  assert.deepEqual(r.companeros.map((c) => c.boleta), ['2022630002']);
});
