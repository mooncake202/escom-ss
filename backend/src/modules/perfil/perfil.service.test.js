// CU-ADM-04 (alumno) y CU-ADM-10 (profesor) — consulta y actualización del perfil propio.
//
// El foco está en las tres cosas que importan: que nadie pueda tocar el perfil de otro, que las
// validaciones se apliquen de verdad, y sobre todo que los campos institucionales sean INMUTABLES
// aunque lleguen escritos a mano en el cuerpo de la petición.

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const servicio = require('./perfil.service');

const U_PROFESOR = 20;
const U_ALUMNO = 10;
const U_AJENO = 99;

function montar() {
  bd = {
    usuarios: [
      { id: U_PROFESOR, nombre: 'Rafael', apellidos: 'Torres Vega', correo_institucional: 'torres.vega@ipn.mx' },
      { id: U_ALUMNO, nombre: 'Ana', apellidos: 'García López', correo_institucional: 'agarcia@alumno.ipn.mx' },
      { id: U_AJENO, nombre: 'Otra', apellidos: 'Persona', correo_institucional: 'otra@ipn.mx' },
    ],
    profesores: [{
      id: 1, usuario_id: U_PROFESOR, departamento: 'Sistemas Computacionales',
      telefono_personal: '5511112222', horario_atencion: 'L-V 10:00-12:00',
      cubiculo: 'CB-03', cupos_totales: 3, caracteristica_id: null,
    }],
    alumnos: [{
      boleta: '2022630001', usuario_id: U_ALUMNO, celular: '5533334444',
      carrera: 'ISC', creditos: 78.5, semestre: 8, correo_personal: 'ana@gmail.com',
    }],
    escrituras: [],
  };

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const conUsuario = (fila, include) => (fila && include?.usuario ? { ...fila, usuario: usuarioDe(fila.usuario_id) } : fila);

  prismaActual = {
    profesor: {
      findUnique: async ({ where, include }) => conUsuario(bd.profesores.find((p) => p.usuario_id === where.usuario_id) ?? null, include),
      update: async ({ where, data, include }) => {
        bd.escrituras.push({ modelo: 'profesor', where, data });
        const p = bd.profesores.find((x) => x.usuario_id === where.usuario_id);
        Object.assign(p, data);
        return conUsuario(p, include);
      },
    },
    alumno: {
      findUnique: async ({ where, include }) => conUsuario(bd.alumnos.find((a) => a.usuario_id === where.usuario_id) ?? null, include),
      update: async ({ where, data, include }) => {
        bd.escrituras.push({ modelo: 'alumno', where, data });
        const a = bd.alumnos.find((x) => x.usuario_id === where.usuario_id);
        Object.assign(a, data);
        return conUsuario(a, include);
      },
    },
    usuario: {
      update: async (args) => { bd.escrituras.push({ modelo: 'usuario', ...args }); return null; },
    },
  };
  return bd;
}

const profesorEnBd = () => bd.profesores[0];
const alumnoEnBd = () => bd.alumnos[0];
const escriturasA = (modelo) => bd.escrituras.filter((e) => e.modelo === modelo);

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-10 — Profesor
// ════════════════════════════════════════════════════════════════════════════

test('ADM-10: consulta separa institucionales de editables', async () => {
  const p = await servicio.obtenerPerfilProfesor(U_PROFESOR);

  assert.deepEqual(p.institucionales, {
    nombre: 'Rafael', apellidos: 'Torres Vega', nombreCompleto: 'Rafael Torres Vega',
    correoInstitucional: 'torres.vega@ipn.mx', cubiculo: 'CB-03', departamento: 'Sistemas Computacionales',
  });
  assert.deepEqual(p.editables, { horarioAtencion: 'L-V 10:00-12:00', telefonoPersonal: '5511112222' });
});

test('ADM-10: actualiza horario y teléfono', async () => {
  const p = await servicio.actualizarPerfilProfesor(U_PROFESOR, {
    telefono_personal: '5599998888', horario_atencion: '  Martes y jueves 8:00-10:00  ',
  });

  assert.equal(p.editables.telefonoPersonal, '5599998888');
  assert.equal(p.editables.horarioAtencion, 'Martes y jueves 8:00-10:00', 'se guarda recortado');
  assert.equal(profesorEnBd().horario_atencion, 'Martes y jueves 8:00-10:00');
});

test('ADM-10: los campos institucionales son INMUTABLES aunque se manden en el cuerpo', async () => {
  await servicio.actualizarPerfilProfesor(U_PROFESOR, {
    telefono_personal: '5599998888',
    horario_atencion: 'nuevo horario',
    // Todo esto debe ignorarse por completo:
    cubiculo: 'HACKEADO', departamento: 'HACKEADO', cupos_totales: 99,
    caracteristica_id: 4, usuario_id: U_AJENO, id: 777,
    nombre: 'HACKEADO', apellidos: 'HACKEADO', correo_institucional: 'hack@ipn.mx',
  });

  const { data, where } = escriturasA('profesor')[0];
  assert.deepEqual(Object.keys(data).sort(), ['horario_atencion', 'telefono_personal'],
    'solo esos dos campos llegan al update');
  assert.equal(where.usuario_id, U_PROFESOR, 'el where usa el usuario del token, no el del cuerpo');

  const p = profesorEnBd();
  assert.equal(p.cubiculo, 'CB-03');
  assert.equal(p.departamento, 'Sistemas Computacionales');
  assert.equal(p.cupos_totales, 3);
  assert.equal(p.caracteristica_id, null);
  assert.equal(p.usuario_id, U_PROFESOR);
  assert.deepEqual(escriturasA('usuario'), [], 'nunca se toca la tabla usuario');
});

test('ADM-10: teléfono obligatorio y de exactamente 10 dígitos', async () => {
  for (const telefono of ['', undefined, null]) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: telefono, horario_atencion: 'x' }),
      (err) => err.status === 400 && /obligatorio/i.test(err.message),
    );
  }
  for (const telefono of ['123', '12345678901', '55 1234 5678', '551234567a']) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: telefono, horario_atencion: 'x' }),
      (err) => err.status === 400 && /10 dígitos/.test(err.message),
      `debería rechazar "${telefono}"`,
    );
    assert.deepEqual(escriturasA('profesor'), [], 'no escribe nada si falla la validación');
  }
});

test('ADM-10: un teléfono que no es texto (número) da 400 de formato, no 500', async () => {
  for (const telefono of [5512345678, true, { n: '5512345678' }, ['5512345678']]) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: telefono, horario_atencion: 'x' }),
      (err) => err.status === 400 && err.message === 'El teléfono personal debe tener exactamente 10 dígitos numéricos.',
      `debería rechazar ${JSON.stringify(telefono)}`,
    );
    assert.deepEqual(escriturasA('profesor'), [], 'no escribe nada si falla la validación');
    assert.equal(profesorEnBd().telefono_personal, '5511112222');
  }
});

test('ADM-10: el teléfono se recorta antes de validar y se guarda sin espacios', async () => {
  const perfil = await servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: ' 5512345678 ', horario_atencion: 'x' });

  assert.equal(profesorEnBd().telefono_personal, '5512345678');
  assert.equal(escriturasA('profesor')[0].data.telefono_personal, '5512345678');
  assert.equal(perfil.editables.telefonoPersonal, '5512345678');
});

test('ADM-10: horario obligatorio y con tope de 100 caracteres', async () => {
  for (const horario of ['', '   ', undefined]) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: '5511112222', horario_atencion: horario }),
      (err) => err.status === 400 && /horario de atención es obligatorio/i.test(err.message),
    );
  }
  montar();
  await assert.rejects(
    servicio.actualizarPerfilProfesor(U_PROFESOR, { telefono_personal: '5511112222', horario_atencion: 'x'.repeat(101) }),
    (err) => err.status === 400 && /100 caracteres/.test(err.message),
  );
  assert.deepEqual(escriturasA('profesor'), []);
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-04 — Alumno
// ════════════════════════════════════════════════════════════════════════════

test('ADM-04: consulta separa institucionales de editables', async () => {
  const p = await servicio.obtenerPerfilAlumno(U_ALUMNO);

  assert.deepEqual(p.institucionales, {
    nombre: 'Ana', apellidos: 'García López', nombreCompleto: 'Ana García López',
    boleta: '2022630001', carrera: 'ISC', correoInstitucional: 'agarcia@alumno.ipn.mx',
    creditos: 78.5, semestre: 8,
  });
  assert.deepEqual(p.editables, { correoPersonal: 'ana@gmail.com', celular: '5533334444' });
  assert.equal(typeof p.institucionales.creditos, 'number', 'Decimal se devuelve como número');
});

test('ADM-04: un correo personal nulo se expone como cadena vacía', async () => {
  montar();
  alumnoEnBd().correo_personal = null;
  const p = await servicio.obtenerPerfilAlumno(U_ALUMNO);
  assert.equal(p.editables.correoPersonal, '');
});

test('ADM-04: actualiza correo personal y celular', async () => {
  const p = await servicio.actualizarPerfilAlumno(U_ALUMNO, {
    correo_personal: '  nueva.ana@outlook.com  ', celular: '5577776666',
  });

  assert.equal(p.editables.correoPersonal, 'nueva.ana@outlook.com', 'se guarda recortado');
  assert.equal(p.editables.celular, '5577776666');
  assert.equal(alumnoEnBd().correo_personal, 'nueva.ana@outlook.com');
});

test('ADM-04: los campos institucionales son INMUTABLES aunque se manden en el cuerpo', async () => {
  await servicio.actualizarPerfilAlumno(U_ALUMNO, {
    correo_personal: 'ana@gmail.com', celular: '5577776666',
    // Todo esto debe ignorarse:
    boleta: '9999999999', carrera: 'LCD', creditos: 100, semestre: 12,
    usuario_id: U_AJENO, nombre: 'HACKEADO', correo_institucional: 'hack@alumno.ipn.mx',
  });

  const { data, where } = escriturasA('alumno')[0];
  assert.deepEqual(Object.keys(data).sort(), ['celular', 'correo_personal'],
    'solo esos dos campos llegan al update');
  assert.equal(where.usuario_id, U_ALUMNO, 'el where usa el usuario del token');

  const a = alumnoEnBd();
  assert.equal(a.boleta, '2022630001');
  assert.equal(a.carrera, 'ISC');
  assert.equal(a.creditos, 78.5);
  assert.equal(a.semestre, 8);
  assert.equal(a.usuario_id, U_ALUMNO);
  assert.deepEqual(escriturasA('usuario'), [], 'nunca se toca la tabla usuario');
});

test('ADM-04: correo personal obligatorio y con formato válido', async () => {
  for (const correo of ['', '   ', undefined, null]) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilAlumno(U_ALUMNO, { correo_personal: correo, celular: '5533334444' }),
      (err) => err.status === 400 && /correo personal es obligatorio/i.test(err.message),
    );
  }
  for (const correo of ['sin-arroba', 'sin@dominio', '@nada.com', 'espacio s@x.com']) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilAlumno(U_ALUMNO, { correo_personal: correo, celular: '5533334444' }),
      (err) => err.status === 400 && /formato válido/i.test(err.message),
      `debería rechazar "${correo}"`,
    );
    assert.deepEqual(escriturasA('alumno'), []);
  }
});

test('ADM-04: el correo personal no puede superar los 50 caracteres de la columna', async () => {
  const largo = 'a'.repeat(45) + '@gmail.com'; // 55
  await assert.rejects(
    servicio.actualizarPerfilAlumno(U_ALUMNO, { correo_personal: largo, celular: '5533334444' }),
    (err) => err.status === 400 && /50 caracteres/.test(err.message),
  );
  assert.deepEqual(escriturasA('alumno'), []);
});

test('ADM-04: celular obligatorio y de exactamente 10 dígitos', async () => {
  montar();
  await assert.rejects(
    servicio.actualizarPerfilAlumno(U_ALUMNO, { correo_personal: 'ana@gmail.com', celular: '' }),
    (err) => err.status === 400 && /obligatorio/i.test(err.message),
  );
  for (const celular of ['123', '12345678901', '55 3333 4444']) {
    montar();
    await assert.rejects(
      servicio.actualizarPerfilAlumno(U_ALUMNO, { correo_personal: 'ana@gmail.com', celular }),
      (err) => err.status === 400 && /10 dígitos/.test(err.message),
      `debería rechazar "${celular}"`,
    );
    assert.deepEqual(escriturasA('alumno'), []);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Autorización
// ════════════════════════════════════════════════════════════════════════════

test('un usuario sin perfil de profesor recibe 404 (no el perfil de otro)', async () => {
  for (const usuarioId of [U_ALUMNO, U_AJENO]) {
    montar();
    await assert.rejects(servicio.obtenerPerfilProfesor(usuarioId), (err) => err.status === 404);
    await assert.rejects(
      servicio.actualizarPerfilProfesor(usuarioId, { telefono_personal: '5599998888', horario_atencion: 'x' }),
      (err) => err.status === 404,
    );
    assert.deepEqual(escriturasA('profesor'), [], 'el perfil del profesor real queda intacto');
  }
});

test('un usuario sin perfil de alumno recibe 404', async () => {
  for (const usuarioId of [U_PROFESOR, U_AJENO]) {
    montar();
    await assert.rejects(servicio.obtenerPerfilAlumno(usuarioId), (err) => err.status === 404);
    await assert.rejects(
      servicio.actualizarPerfilAlumno(usuarioId, { correo_personal: 'x@y.com', celular: '5511112222' }),
      (err) => err.status === 404,
    );
    assert.deepEqual(escriturasA('alumno'), []);
  }
});

test('el perfil se resuelve por usuario_id, nunca por un id del cuerpo', async () => {
  // Aunque el cuerpo intente apuntar a otro usuario, el where siempre lleva el del token.
  await servicio.actualizarPerfilProfesor(U_PROFESOR, {
    telefono_personal: '5599998888', horario_atencion: 'x', usuario_id: U_AJENO, id: 999,
  });
  assert.deepEqual(escriturasA('profesor')[0].where, { usuario_id: U_PROFESOR });

  montar();
  await servicio.actualizarPerfilAlumno(U_ALUMNO, {
    correo_personal: 'a@b.com', celular: '5511112222', usuario_id: U_AJENO, boleta: '0000000000',
  });
  assert.deepEqual(escriturasA('alumno')[0].where, { usuario_id: U_ALUMNO });
});
