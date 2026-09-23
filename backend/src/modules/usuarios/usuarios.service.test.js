// CU-CRED-03 — características del profesor bajo el modelo de 0..1 característica VIGENTE.
//
// Lo que se fija aquí: el alta acepta 0 o 1 característica y la escribe en profesor.caracteristica_id
// (nunca en solicitud_caracteristica, que es el historial de CU-ADM-15/16), la edición no puede
// tocar ni la característica ni los cupos, y las lecturas salen de profesor.caracteristica.
//
// Prisma y el mailer son falsos (el servicio usa los singletons globales).

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');
const rutaMailer = require.resolve('../../lib/mailer');

// Registro de TODO lo que el servicio le pidió a Prisma: modelo, operación y argumentos.
const llamadas = [];
let catalogo = {};
let usuarioExistente = null;
let usuarioAEditar = null;
let usuariosListados = [];

const registrar = (modelo, operacion, args) => { llamadas.push({ modelo, operacion, args }); };
const hechas = (modelo, operacion) => llamadas.filter((l) => l.modelo === modelo && l.operacion === operacion);
const unica = (modelo, operacion) => {
  const encontradas = hechas(modelo, operacion);
  assert.equal(encontradas.length, 1, `se esperaba exactamente un ${modelo}.${operacion}`);
  return encontradas[0].args;
};

const modelo = (nombre) => new Proxy({}, {
  get: (_, operacion) => async (args = {}) => {
    registrar(nombre, operacion, args);
    if (nombre === 'caracteristica' && operacion === 'findUnique') return catalogo[args.where.nombre] ?? null;
    if (nombre === 'usuario' && operacion === 'findUnique') {
      // findUnique por id = el usuario que se va a editar; por correo = la validación de unicidad.
      return args.where.id !== undefined ? usuarioAEditar : usuarioExistente;
    }
    if (nombre === 'usuario' && operacion === 'findMany') return usuariosListados;
    if (operacion === 'create') return { id: 99, ...args.data };
    return null;
  },
});

const prismaFalso = new Proxy({}, {
  get: (_, propiedad) => {
    // $transaction(cb) ejecuta el callback con el MISMO proxy: las escrituras quedan registradas igual.
    if (propiedad === '$transaction') return (cb) => cb(prismaFalso);
    return typeof propiedad === 'string' ? modelo(propiedad) : undefined;
  },
});

require.cache[rutaPrisma] = { id: rutaPrisma, filename: rutaPrisma, loaded: true, exports: prismaFalso };
require.cache[rutaMailer] = {
  id: rutaMailer, filename: rutaMailer, loaded: true,
  exports: { enviarCorreoBienvenida: async () => {} },
};

const { crearUsuario, listarUsuarios, actualizarUsuario } = require('./usuarios.service');

const INVESTIGADOR = { id: 1, nombre: 'Investigador', incremento_cupos: 1 };
const JEFE = { id: 4, nombre: 'Jefe_de_departamento', incremento_cupos: 3 };

const datosProfesor = (caracteristicas) => ({
  nombre: 'Ana', apellidos: 'Torres Vega',
  correo_institucional: 'ana.torres@ipn.mx',
  rol: 'profesor',
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5511112222',
  caracteristicas,
});

test.beforeEach(() => {
  llamadas.length = 0;
  catalogo = { Investigador: INVESTIGADOR, Jefe_de_departamento: JEFE };
  usuarioExistente = null;
  usuarioAEditar = null;
  usuariosListados = [];
});

// ── Alta ──────────────────────────────────────────────────────────────────

test('alta sin característica: caracteristica_id null y 3 cupos base', async () => {
  await crearUsuario(datosProfesor([]), 7);

  const { data } = unica('profesor', 'create');
  assert.equal(data.caracteristica_id, null);
  assert.equal(data.cupos_totales, 3);
  // Sin característica no hay nada que consultar en el catálogo.
  assert.equal(hechas('caracteristica', 'findUnique').length, 0);
});

test('alta con una característica: la vigente queda en profesor y los cupos son 3 + incremento', async () => {
  await crearUsuario(datosProfesor(['Jefe_de_departamento']), 7);

  const { data } = unica('profesor', 'create');
  assert.equal(data.caracteristica_id, JEFE.id);
  assert.equal(data.cupos_totales, 6);
});

test('el alta NUNCA escribe en solicitud_caracteristica (es el historial de ADM-15/16)', async () => {
  await crearUsuario(datosProfesor(['Investigador']), 7);

  assert.deepEqual(hechas('solicitud_caracteristica', 'create'), []);
  assert.deepEqual(hechas('solicitud_caracteristica', 'createMany'), []);
  assert.deepEqual(hechas('solicitud_caracteristica', 'deleteMany'), []);
});

test('dos o más características: 400 y no se crea nada', async () => {
  await assert.rejects(
    crearUsuario(datosProfesor(['Investigador', 'Jefe_de_departamento']), 7),
    (err) => err.status === 400 && /una característica a la vez/.test(err.message),
  );
  assert.deepEqual(hechas('profesor', 'create'), []);
  assert.deepEqual(hechas('usuario', 'create'), []);
});

test('característica fuera del catálogo: 400', async () => {
  await assert.rejects(
    crearUsuario(datosProfesor(['Inventada']), 7),
    (err) => err.status === 400 && /no es válida/.test(err.message),
  );
  assert.deepEqual(hechas('profesor', 'create'), []);
});

test('un coordinador ignora el campo caracteristicas y no crea perfil de profesor', async () => {
  await crearUsuario({
    nombre: 'Luis', apellidos: 'Morales Vega',
    correo_institucional: 'luis.morales@ipn.mx',
    rol: 'coordinador',
    caracteristicas: ['Investigador', 'Jefe_de_departamento'],
  }, 7);

  assert.deepEqual(hechas('profesor', 'create'), []);
  assert.equal(hechas('coordinador', 'create').length, 1);
});

// ── Lectura ───────────────────────────────────────────────────────────────

test('listarUsuarios lee la vigente de profesor.caracteristica, no de las solicitudes', async () => {
  usuariosListados = [
    { id: 1, nombre: 'Ana', apellidos: 'Torres', correo_institucional: 'a@ipn.mx', rol: 'profesor',
      fecha_creacion: new Date(), creado_por_id: 7,
      profesor: { departamento: 'X', telefono_personal: '1', horario_atencion: '', cubiculo: '', cupos_totales: 4, caracteristica: INVESTIGADOR } },
    { id: 2, nombre: 'Beto', apellidos: 'Ruiz', correo_institucional: 'b@ipn.mx', rol: 'profesor',
      fecha_creacion: new Date(), creado_por_id: 7,
      profesor: { departamento: 'X', telefono_personal: '1', horario_atencion: '', cubiculo: '', cupos_totales: 3, caracteristica: null } },
  ];

  const [conCaracteristica, base] = await listarUsuarios();

  assert.deepEqual(conCaracteristica.caracteristicas, ['Investigador']);
  assert.deepEqual(base.caracteristicas, []);
  // La consulta ya no incluye el historial.
  assert.deepEqual(unica('usuario', 'findMany').include.profesor, { include: { caracteristica: true } });
});

// ── Edición ───────────────────────────────────────────────────────────────

const datosEdicion = (extra = {}) => ({
  nombre: 'Ana', apellidos: 'Torres Vega',
  correo_institucional: 'ana.torres@ipn.mx',
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5511112222',
  horario_atencion: 'L-V 10:00', cubiculo: 'A-1',
  ...extra,
});

test('editar no cambia la característica ni los cupos aunque se manden en el cuerpo', async () => {
  usuarioAEditar = {
    id: 1, rol: 'profesor', correo_institucional: 'ana.torres@ipn.mx',
    profesor: { id: 10, caracteristica_id: INVESTIGADOR.id, cupos_totales: 4 },
  };

  await actualizarUsuario(1, datosEdicion({ caracteristicas: ['Jefe_de_departamento'] }));

  const { data } = unica('profesor', 'update');
  assert.equal('caracteristica_id' in data, false, 'la edición no debe tocar la característica');
  assert.equal('cupos_totales' in data, false, 'la edición no debe recalcular cupos');
  assert.deepEqual(data, {
    departamento: 'Sistemas Computacionales',
    telefono_personal: '5511112222',
    horario_atencion: 'L-V 10:00',
    cubiculo: 'A-1',
  });
  // Ni siquiera consulta el catálogo: el campo se ignora por completo.
  assert.deepEqual(hechas('caracteristica', 'findUnique'), []);
});

test('editar ya no borra ni recrea el historial de solicitudes', async () => {
  usuarioAEditar = {
    id: 1, rol: 'profesor', correo_institucional: 'ana.torres@ipn.mx',
    profesor: { id: 10, caracteristica_id: null, cupos_totales: 3 },
  };

  await actualizarUsuario(1, datosEdicion({ caracteristicas: [] }));

  assert.deepEqual(hechas('solicitud_caracteristica', 'deleteMany'), []);
  assert.deepEqual(hechas('solicitud_caracteristica', 'createMany'), []);
});

test('editar un coordinador no toca la tabla profesor', async () => {
  usuarioAEditar = { id: 2, rol: 'coordinador', correo_institucional: 'luis.morales@ipn.mx', profesor: null };

  await actualizarUsuario(2, {
    nombre: 'Luis', apellidos: 'Morales Vega', correo_institucional: 'luis.morales@ipn.mx',
  });

  assert.deepEqual(hechas('profesor', 'update'), []);
  assert.equal(hechas('usuario', 'update').length, 1);
});
