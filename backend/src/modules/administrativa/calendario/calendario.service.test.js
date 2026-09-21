// Prisma y Redis falsos: sin BD ni Redis reales.
const test = require('node:test');
const assert = require('node:assert/strict');

const service = require('./calendario.service');
const { CODIGOS_ERROR } = require('./calendario.shared');
const { CLAVE_ULTIMA_MODIFICACION, CLAVE_CACHE_PERIODOS } = require('./calendario.redis');
const { crearPrismaFalso, crearRedisFalso, evento, utc, horaUtc } = require('./calendario.fakes');

// Viernes 2026-09-18, 13:30 en México.
const AHORA = new Date('2026-09-18T19:30:00.000Z');
const AHORA_ISO = AHORA.toISOString();
const USUARIO_COORDINADOR = 10;

const deps = (prisma, redis, extra = {}) => ({ prisma, redis, ahora: AHORA, timeoutRedisMs: 30, ...extra });

const rechazaCon = (promesa, status, code) => assert.rejects(
  promesa,
  (err) => {
    assert.equal(err.status, status, err.message);
    assert.equal(err.code, code);
    return true;
  },
);

const inhabilNuevo = (extra) => ({ tipo: 'Inhabil', nombre: 'Fumigación', fechaInicio: '2026-09-22', hora: null, ...extra });
const vacacionalNuevo = (extra) => ({
  tipo: 'Vacacional', nombre: 'Receso', fechaInicio: '2026-10-05', fechaFin: '2026-10-09', confirmacionPublicacion: true, ...extra,
});
const periodoNuevo = (extra) => ({
  tipo: 'Periodo', nombre: 'Periodo 2027-01', anio: '2027', semestre: '01', fechaMaxExpediente: '2026-09-25',
  fechaInicio: '2026-10-16', fechaFin: '2027-05-17', confirmacionPublicacion: true, ...extra,
});

const crear = (entrada, prisma, redis, extra) => service.crearEvento({ usuarioId: USUARIO_COORDINADOR, entrada }, deps(prisma, redis, extra));

// Datos de lectura: un Inhabil, un Vacacional y un Periodo (con su periodo_registro).
function escenarioLectura() {
  return crearPrismaFalso({
    eventos: [
      evento(3, 'Periodo', '2026-10-16', { fecha_fin: utc('2027-05-17'), nombre: 'Periodo 2026-02' }),
      evento(1, 'Inhabil', '2026-09-22', { nombre: 'Fumigación' }),
      evento(2, 'Vacacional', '2026-10-05', { fecha_fin: utc('2026-10-09'), nombre: 'Receso' }),
    ],
    periodos: [{ id: 1, evento_calendario_id: 3, anio: '2026', semestre: 's02', fecha_max_expediente: utc('2026-09-25') }],
  });
}

const listar = (rol, filtros, prisma, redis) => service.listarEventos({ rol, filtros }, deps(prisma, redis));
const tipos = (resultado) => resultado.eventos.map((e) => e.tipo);

// ── Lectura y visibilidad por rol ────────────────────────────

test('lectura: coordinador y profesor ven Inhabil, Vacacional y Periodo, ordenados por fecha', async () => {
  for (const rol of ['coordinador', 'profesor']) {
    const r = await listar(rol, {}, escenarioLectura(), crearRedisFalso());
    assert.deepEqual(tipos(r), ['Inhabil', 'Vacacional', 'Periodo'], rol);
  }
});

test('lectura: alumno_asignado solo ve Inhabil y Vacacional (nunca Periodo)', async () => {
  const r = await listar('alumno_asignado', {}, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(tipos(r), ['Inhabil', 'Vacacional']);
  assert.equal(r.eventos.some((e) => e.periodo !== null), false);
});

test('lectura: alumno_sin_asignar no tiene acceso → 403 ROL_SIN_ACCESO (no lista vacía) y no toca BD ni Redis', async () => {
  const redis = crearRedisFalso();
  for (const filtros of [{}, { tipo: 'Inhabil' }, { tipo: 'Periodo' }, { desde: '2026-09-01', hasta: '2026-12-31' }]) {
    await assert.rejects(
      listar('alumno_sin_asignar', filtros, escenarioLectura(), redis),
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'ROL_SIN_ACCESO');
        assert.equal(err.message, 'No tienes acceso al calendario institucional.');
        return true;
      },
    );
  }
  assert.deepEqual(redis.llamadas, []);
});

test('lectura: solo tienen acceso coordinador, profesor y alumno_asignado', () => {
  assert.deepEqual(Object.keys(service.TIPOS_VISIBLES_POR_ROL).sort(), ['alumno_asignado', 'coordinador', 'profesor']);
});

test('lectura: un alumno que pide tipo=Periodo obtiene lista vacía, no el Periodo', async () => {
  const r = await listar('alumno_asignado', { tipo: 'Periodo' }, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(r.eventos, []);
});

test('lectura: rol desconocido → 403', async () => {
  await rechazaCon(listar('visitante', {}, escenarioLectura(), crearRedisFalso()), 403, 'ROL_SIN_ACCESO');
});

test('lectura: filtro por tipo', async () => {
  const r = await listar('coordinador', { tipo: 'Vacacional' }, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(tipos(r), ['Vacacional']);
});

test('lectura: filtro por rango incluye eventos que solo tocan el rango', async () => {
  const solapa = await listar('coordinador', { desde: '2026-10-08', hasta: '2026-10-20' }, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(tipos(solapa), ['Vacacional', 'Periodo']); // el Vacacional termina el 9; el Periodo empieza el 16

  const puntual = await listar('coordinador', { desde: '2026-09-22', hasta: '2026-09-22' }, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(tipos(puntual), ['Inhabil']); // sin fecha_fin: cubre solo su día

  const fuera = await listar('coordinador', { desde: '2026-09-23', hasta: '2026-10-04' }, escenarioLectura(), crearRedisFalso());
  assert.deepEqual(fuera.eventos, []);
});

test('lectura: filtros inválidos → 400 VALIDACION con errores por campo', async () => {
  await assert.rejects(
    listar('coordinador', { tipo: 'Otro', desde: '2026-13-01', hasta: 'x' }, escenarioLectura(), crearRedisFalso()),
    (err) => err.status === 400 && err.code === 'VALIDACION' && ['desde', 'hasta', 'tipo'].every((c) => c in err.errores),
  );
  await rechazaCon(listar('coordinador', { desde: '2026-10-10', hasta: '2026-10-01' }, escenarioLectura(), crearRedisFalso()), 400, 'VALIDACION');
});

test('lectura: serialización (hora, todoElDia, periodo con semestre "02")', async () => {
  const prisma = crearPrismaFalso({
    eventos: [
      evento(1, 'Inhabil', '2026-09-22', { hora: horaUtc('14:00') }),
      evento(2, 'Inhabil', '2026-09-23'),
      evento(3, 'Periodo', '2026-10-16', { fecha_fin: utc('2027-05-17') }),
    ],
    periodos: [{ id: 7, evento_calendario_id: 3, anio: '2026', semestre: 's02', fecha_max_expediente: utc('2026-09-25') }],
  });
  const { eventos } = await listar('profesor', {}, prisma, crearRedisFalso());

  assert.deepEqual([eventos[0].hora, eventos[0].todoElDia], ['14:00', false]);
  assert.deepEqual([eventos[1].hora, eventos[1].todoElDia], [null, true]);
  assert.deepEqual(eventos[2].periodo, { id: 7, anio: '2026', semestre: '02', fechaMaxExpediente: '2026-09-25' });
  assert.equal(eventos[2].todoElDia, null);
  assert.equal(eventos[2].fechaFin, '2027-05-17');
});

test('lectura: solo el coordinador recibe banderas de edición', async () => {
  const prisma = () => crearPrismaFalso({
    eventos: [evento(1, 'Inhabil', '2026-09-22'), evento(2, 'Vacacional', '2026-10-05', { fecha_fin: utc('2026-10-09') })],
  });
  const coord = await listar('coordinador', {}, prisma(), crearRedisFalso());
  assert.deepEqual([coord.eventos[0].editable, coord.eventos[0].eliminable, coord.eventos[0].motivoNoEditable], [true, true, null]);
  assert.deepEqual([coord.eventos[1].editable, coord.eventos[1].motivoNoEditable], [false, CODIGOS_ERROR.EVENTO_INMUTABLE]);

  for (const rol of ['profesor', 'alumno_asignado']) {
    const r = await listar(rol, {}, prisma(), crearRedisFalso());
    assert.equal('editable' in r.eventos[0], false, rol);
    assert.equal('motivoNoEditable' in r.eventos[0], false, rol);
  }
});

test('lectura: contexto con día y hora actuales de México', async () => {
  const r = await listar('coordinador', {}, crearPrismaFalso(), crearRedisFalso());
  assert.deepEqual(r.contexto, { hoy: '2026-09-18', horaActual: '13:30' });
});

test('lectura: ultimaModificacion sale de Redis; sin clave es null', async () => {
  const redis = crearRedisFalso();
  assert.equal((await listar('coordinador', {}, crearPrismaFalso(), redis)).ultimaModificacion, null);

  redis.datos.set(CLAVE_ULTIMA_MODIFICACION, '2026-09-18T20:37:00.000Z');
  assert.equal((await listar('coordinador', {}, crearPrismaFalso(), redis)).ultimaModificacion, '2026-09-18T20:37:00.000Z');

  redis.datos.set(CLAVE_ULTIMA_MODIFICACION, 'basura');
  assert.equal((await listar('coordinador', {}, crearPrismaFalso(), redis)).ultimaModificacion, null);
});

test('lectura sin Redis (caído o colgado): el calendario se devuelve con ultimaModificacion null', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const modo of ['error', 'colgado']) {
    const r = await listar('coordinador', {}, escenarioLectura(), crearRedisFalso({ modo }));
    assert.equal(r.ultimaModificacion, null, modo);
    assert.equal(r.eventos.length, 3, modo);
  }
});

// ── Crear ────────────────────────────────────────────────────

test('crear Inhabil todo el día: persiste hora nula y devuelve el evento', async () => {
  const prisma = crearPrismaFalso();
  const { evento: creado } = await crear(inhabilNuevo(), prisma, crearRedisFalso());

  assert.equal(prisma.estado.eventos.length, 1);
  assert.equal(prisma.estado.eventos[0].hora, null);
  assert.equal(prisma.estado.eventos[0].coordinador_id, 1);
  assert.deepEqual(
    [creado.tipo, creado.fechaInicio, creado.hora, creado.todoElDia, creado.editable],
    ['Inhabil', '2026-09-22', null, true, true],
  );
});

test('crear Inhabil con hora: guarda el reloj de México como TIME (1970-01-01THH:mm)', async () => {
  const prisma = crearPrismaFalso();
  const { evento: creado } = await crear(inhabilNuevo({ hora: '14:00' }), prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos[0].hora.toISOString(), '1970-01-01T14:00:00.000Z');
  assert.deepEqual([creado.hora, creado.todoElDia], ['14:00', false]);
});

test('crear Inhabil: si ya existe uno en esa fecha (cualquier hora) → 409 INHABIL_DUPLICADO y no escribe', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22', { hora: horaUtc('16:00') })] });
  const redis = crearRedisFalso();
  await rechazaCon(crear(inhabilNuevo(), prisma, redis), 409, CODIGOS_ERROR.INHABIL_DUPLICADO);
  await rechazaCon(crear(inhabilNuevo({ hora: '10:00' }), prisma, redis), 409, CODIGOS_ERROR.INHABIL_DUPLICADO);
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('crear Inhabil: otro tipo de evento en la misma fecha no cuenta como duplicado', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Vacacional', '2026-09-21', { fecha_fin: utc('2026-09-25') })] });
  await crear(inhabilNuevo(), prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos.length, 2);
});

// Vacacional existente: 28/09/2026 – 16/10/2026.
const conVacacionalExistente = (inicio = '2026-09-28', fin = '2026-10-16') => crearPrismaFalso({
  eventos: [evento(1, 'Vacacional', inicio, { fecha_fin: utc(fin), nombre: 'Existente' })],
});

test('crear Vacacional: rechaza cualquier cruce con otro Vacacional → 409 VACACIONAL_CRUZADO sin escribir ni tocar Redis', async () => {
  const casos = {
    'completamente dentro': ['2026-10-05', '2026-10-09'],
    'empieza dentro y termina después': ['2026-10-12', '2026-10-23'],
    'empieza antes y termina dentro': ['2026-09-21', '2026-10-02'],
    'rango idéntico': ['2026-09-28', '2026-10-16'],
    'contiene completamente al existente': ['2026-09-21', '2026-10-23'],
    'comparte solo el último día': ['2026-10-16', '2026-10-23'],
    'comparte solo el primer día': ['2026-09-21', '2026-09-28'],
  };
  for (const [caso, [fechaInicio, fechaFin]] of Object.entries(casos)) {
    const prisma = conVacacionalExistente();
    const redis = crearRedisFalso();
    await assert.rejects(
      crear(vacacionalNuevo({ fechaInicio, fechaFin }), prisma, redis),
      (err) => {
        assert.equal(err.status, 409, caso);
        assert.equal(err.code, CODIGOS_ERROR.VACACIONAL_CRUZADO, caso);
        assert.equal(err.message, 'Ya existe un periodo vacacional que se cruza con las fechas seleccionadas.');
        return true;
      },
      caso,
    );
    assert.equal(prisma.estado.eventos.length, 1, caso);
    assert.equal(prisma.estado.escrituras, 0, caso);
    assert.deepEqual(redis.llamadas, [], caso);
  }
});

test('crear Vacacional: caso observado en prueba real (28/09–02/10 dentro de 21/09–09/10) → 409', async () => {
  const prisma = conVacacionalExistente('2026-09-21', '2026-10-09');
  await rechazaCon(crear(vacacionalNuevo({ fechaInicio: '2026-09-28', fechaFin: '2026-10-02' }), prisma, crearRedisFalso()), 409, CODIGOS_ERROR.VACACIONAL_CRUZADO);
});

test('crear Vacacional: rangos que no se tocan (antes, entre o después de dos existentes) sí se crean', async () => {
  const prisma = crearPrismaFalso({
    eventos: [
      evento(1, 'Vacacional', '2026-09-28', { fecha_fin: utc('2026-10-02') }),
      evento(2, 'Vacacional', '2026-10-12', { fecha_fin: utc('2026-10-16') }),
    ],
  });
  await crear(vacacionalNuevo({ fechaInicio: '2026-09-21', fechaFin: '2026-09-25' }), prisma, crearRedisFalso()); // antes
  await crear(vacacionalNuevo({ fechaInicio: '2026-10-05', fechaFin: '2026-10-09' }), prisma, crearRedisFalso()); // entre
  await crear(vacacionalNuevo({ fechaInicio: '2026-10-19', fechaFin: '2026-10-23' }), prisma, crearRedisFalso()); // después
  assert.equal(prisma.estado.eventos.length, 5);
});

test('crear Vacacional: solo se compara con otros Vacacionales (Periodo e Inhabil con fechas cruzadas no cuentan)', async () => {
  const prisma = crearPrismaFalso({
    eventos: [
      evento(1, 'Periodo', '2026-09-21', { fecha_fin: utc('2026-10-09') }),
      evento(2, 'Inhabil', '2026-09-28'),
    ],
  });
  await crear(vacacionalNuevo({ fechaInicio: '2026-09-28', fechaFin: '2026-10-02' }), prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos.length, 3);
});

test('crear Vacacional: una vez rechazado por cruce, el mismo rango sin cruce después de borrar el existente sí entra', async () => {
  const prisma = conVacacionalExistente();
  await rechazaCon(crear(vacacionalNuevo({ fechaInicio: '2026-09-28', fechaFin: '2026-10-02' }), prisma, crearRedisFalso()), 409, CODIGOS_ERROR.VACACIONAL_CRUZADO);
  prisma.estado.eventos = [];
  await crear(vacacionalNuevo({ fechaInicio: '2026-09-28', fechaFin: '2026-10-02' }), prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos.length, 1);
});

test('crear Vacacional: guarda el rango sin hora ni periodo_registro y no invalida cache:periodos', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();
  const { evento: creado } = await crear(vacacionalNuevo(), prisma, redis);

  const fila = prisma.estado.eventos[0];
  assert.deepEqual([fila.tipo, fila.hora, fila.fecha_fin.toISOString()], ['Vacacional', null, '2026-10-09T00:00:00.000Z']);
  assert.equal(prisma.estado.periodos.length, 0);
  assert.deepEqual([creado.editable, creado.eliminable, creado.motivoNoEditable], [false, false, CODIGOS_ERROR.EVENTO_INMUTABLE]);
  assert.equal(redis.llamadas.some(([op, clave]) => op === 'del' && clave === CLAVE_CACHE_PERIODOS), false);
});

test('crear Vacacional sin confirmacionPublicacion → 400 CONFIRMACION_REQUERIDA y no escribe', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();
  await rechazaCon(crear(vacacionalNuevo({ confirmacionPublicacion: false }), prisma, redis), 400, CODIGOS_ERROR.CONFIRMACION_REQUERIDA);
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('crear: datos inválidos → 400 VALIDACION con errores por campo, sin tocar BD ni Redis', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();
  await assert.rejects(
    crear(inhabilNuevo({ fechaInicio: '2026-09-19', hora: '13:30' }), prisma, redis),
    (err) => err.status === 400 && err.code === 'VALIDACION' && 'fechaInicio' in err.errores && 'hora' in err.errores,
  );
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('crear Periodo: crea evento_calendario y periodo_registro; semestre "01" → s01', async () => {
  const prisma = crearPrismaFalso();
  const { evento: creado } = await crear(periodoNuevo(), prisma, crearRedisFalso());

  assert.equal(prisma.estado.eventos.length, 1);
  assert.equal(prisma.estado.periodos.length, 1);
  const periodo = prisma.estado.periodos[0];
  assert.equal(periodo.evento_calendario_id, prisma.estado.eventos[0].id);
  assert.deepEqual(
    [periodo.anio, periodo.semestre, periodo.fecha_max_expediente.toISOString()],
    ['2027', 's01', '2026-09-25T00:00:00.000Z'],
  );
  assert.deepEqual(creado.periodo, { id: periodo.id, anio: '2027', semestre: '01', fechaMaxExpediente: '2026-09-25' });
  assert.equal(creado.editable, false);
});

test('crear Periodo: semestre "02" → s02', async () => {
  const prisma = crearPrismaFalso();
  await crear(periodoNuevo({ semestre: '02', fechaInicio: '2027-01-18', fechaMaxExpediente: '2027-01-15' }), prisma, crearRedisFalso());
  assert.equal(prisma.estado.periodos[0].semestre, 's02');
});

test('crear Periodo: inicio o fin en sábado/domingo → 400 VALIDACION por campo, sin escribir en BD ni Redis', async () => {
  const casos = [
    [{ fechaInicio: '2026-10-17' }, ['fechaInicio']],                          // sábado
    [{ fechaInicio: '2026-10-18' }, ['fechaInicio']],                          // domingo
    [{ fechaFin: '2027-05-15' }, ['fechaFin']],                                // sábado
    [{ fechaFin: '2027-05-16' }, ['fechaFin']],                                // domingo
    [{ fechaInicio: '2026-10-17', fechaFin: '2027-05-16' }, ['fechaFin', 'fechaInicio']],
  ];
  for (const [cambios, campos] of casos) {
    const prisma = crearPrismaFalso();
    const redis = crearRedisFalso();
    await assert.rejects(
      () => crear(periodoNuevo(cambios), prisma, redis),
      (err) => err.status === 400 && err.code === 'VALIDACION' && JSON.stringify(Object.keys(err.errores).sort()) === JSON.stringify(campos)
        && Object.values(err.errores).every((m) => /sábado ni domingo/.test(m)),
      JSON.stringify(cambios),
    );
    assert.equal(prisma.estado.eventos.length, 0);
    assert.equal(prisma.estado.periodos.length, 0);
    assert.equal(prisma.estado.escrituras, 0);
    assert.deepEqual(redis.llamadas, []);
  }
});

test('crear Periodo: lunes-viernes en ambos extremos sí se crea (aunque el rango contenga fines de semana)', async () => {
  const prisma = crearPrismaFalso();
  await crear(periodoNuevo({ fechaInicio: '2026-10-19', fechaFin: '2027-05-14' }), prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos.length, 1);
  assert.equal(prisma.estado.eventos[0].fecha_inicio.toISOString().slice(0, 10), '2026-10-19');
  assert.equal(prisma.estado.eventos[0].fecha_fin.toISOString().slice(0, 10), '2027-05-14');
});

test('crear Periodo: fechaInicio fuera del ciclo/semestre → 400 VALIDACION sin escribir en BD ni Redis', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();
  await assert.rejects(
    () => crear(periodoNuevo({ semestre: '02' }), prisma, redis),
    (err) => err.status === 400 && err.code === 'VALIDACION' && /no corresponde al ciclo 2027\/02/.test(err.errores.fechaInicio),
  );
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('crear Periodo es atómico: si falla periodo_registro no queda evento_calendario ni se toca Redis', async () => {
  const prisma = crearPrismaFalso();
  prisma.estado.fallarAlCrearPeriodo = true;
  const redis = crearRedisFalso();

  await assert.rejects(crear(periodoNuevo(), prisma, redis), /Fallo simulado/);
  assert.equal(prisma.estado.eventos.length, 0);
  assert.equal(prisma.estado.periodos.length, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('crear: coordinador sin perfil → 404 PERFIL_NO_ENCONTRADO', async () => {
  await rechazaCon(
    service.crearEvento({ usuarioId: 999, entrada: inhabilNuevo() }, deps(crearPrismaFalso(), crearRedisFalso())),
    404,
    'PERFIL_NO_ENCONTRADO',
  );
});

// ── Actualizar Inhabil ───────────────────────────────────────

const actualizar = (id, entrada, prisma, redis) => service.actualizarInhabil({ id, entrada }, deps(prisma, redis));

test('actualizar Inhabil futuro: cambia nombre, fecha y hora', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22')] });
  const { evento: editado } = await actualizar('1', { nombre: 'Corte de luz', fechaInicio: '2026-09-23', hora: '12:00' }, prisma, crearRedisFalso());

  const fila = prisma.estado.eventos[0];
  assert.deepEqual([fila.nombre, fila.fecha_inicio.toISOString(), fila.hora.toISOString()], ['Corte de luz', '2026-09-23T00:00:00.000Z', '1970-01-01T12:00:00.000Z']);
  assert.deepEqual([editado.fechaInicio, editado.hora, editado.todoElDia], ['2026-09-23', '12:00', false]);
});

test('actualizar Inhabil: mover a una fecha con otro Inhabil → 409 INHABIL_DUPLICADO y no cambia nada', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22'), evento(2, 'Inhabil', '2026-09-23')] });
  const redis = crearRedisFalso();
  await rechazaCon(actualizar(1, { nombre: 'X', fechaInicio: '2026-09-23', hora: null }, prisma, redis), 409, CODIGOS_ERROR.INHABIL_DUPLICADO);
  assert.equal(prisma.estado.eventos[0].fecha_inicio.toISOString(), '2026-09-22T00:00:00.000Z');
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('actualizar Inhabil: conservar su propia fecha no es duplicado', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22')] });
  await actualizar(1, { nombre: 'Solo cambia el nombre', fechaInicio: '2026-09-22', hora: null }, prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos[0].nombre, 'Solo cambia el nombre');
});

test('actualizar: Periodo y Vacacional son inmutables (409 EVENTO_INMUTABLE) aunque el cuerpo sea inválido', async () => {
  const prisma = crearPrismaFalso({
    eventos: [evento(1, 'Vacacional', '2026-10-05', { fecha_fin: utc('2026-10-09') }), evento(2, 'Periodo', '2026-10-16', { fecha_fin: utc('2027-05-17') })],
    periodos: [{ id: 1, evento_calendario_id: 2, anio: '2026', semestre: 's02', fecha_max_expediente: utc('2026-09-25') }],
  });
  const redis = crearRedisFalso();
  for (const id of [1, 2]) {
    await rechazaCon(actualizar(id, {}, prisma, redis), 409, CODIGOS_ERROR.EVENTO_INMUTABLE);
    await rechazaCon(actualizar(id, { nombre: 'X', fechaInicio: '2026-09-23', hora: null }, prisma, redis), 409, CODIGOS_ERROR.EVENTO_INMUTABLE);
  }
  assert.equal(prisma.estado.escrituras, 0);
  assert.deepEqual(redis.llamadas, []);
});

test('actualizar: un Inhabil ya en vigor o pasado → 409 EVENTO_YA_EN_VIGOR', async () => {
  const casos = [
    evento(1, 'Inhabil', '2026-09-18'), // hoy, todo el día
    evento(1, 'Inhabil', '2026-09-18', { hora: horaUtc('13:00') }), // hoy, hora ya pasada (ahora 13:30)
    evento(1, 'Inhabil', '2026-09-17', { hora: horaUtc('18:00') }), // ayer
  ];
  for (const caso of casos) {
    const prisma = crearPrismaFalso({ eventos: [caso] });
    await rechazaCon(actualizar(1, { nombre: 'X', fechaInicio: '2026-09-22', hora: null }, prisma, crearRedisFalso()), 409, CODIGOS_ERROR.EVENTO_YA_EN_VIGOR);
    assert.equal(prisma.estado.escrituras, 0);
  }
});

test('actualizar: un Inhabil de hoy con hora futura todavía se puede modificar', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-18', { hora: horaUtc('16:00') })] });
  await actualizar(1, { nombre: 'X', fechaInicio: '2026-09-18', hora: '17:00' }, prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos[0].hora.toISOString(), '1970-01-01T17:00:00.000Z');
});

test('actualizar: no se puede cambiar el tipo, y las reglas de Inhabil se vuelven a validar', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22')] });
  await assert.rejects(
    actualizar(1, { tipo: 'Vacacional', nombre: 'X', fechaInicio: '2026-09-22', hora: null }, prisma, crearRedisFalso()),
    (err) => err.status === 400 && err.code === 'VALIDACION' && 'tipo' in err.errores,
  );
  await rechazaCon(actualizar(1, { nombre: 'X', fechaInicio: '2026-09-18', hora: null }, prisma, crearRedisFalso()), 400, 'VALIDACION'); // hoy todo el día
  assert.equal(prisma.estado.escrituras, 0);
});

test('actualizar: id inexistente o no numérico → 404 EVENTO_NO_ENCONTRADO', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22')] });
  for (const id of [99, 'abc', '0', '-1', '1.5']) {
    await rechazaCon(actualizar(id, { nombre: 'X', fechaInicio: '2026-09-23', hora: null }, prisma, crearRedisFalso()), 404, 'EVENTO_NO_ENCONTRADO');
  }
});

// ── Eliminar Inhabil ─────────────────────────────────────────

const eliminar = (id, prisma, redis) => service.eliminarInhabil({ id }, deps(prisma, redis));

test('eliminar Inhabil futuro: lo borra', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22'), evento(2, 'Inhabil', '2026-09-23')] });
  const r = await eliminar('1', prisma, crearRedisFalso());
  assert.deepEqual([r.eliminado, r.id], [true, 1]);
  assert.deepEqual(prisma.estado.eventos.map((e) => e.id), [2]);
});

test('eliminar: Periodo y Vacacional → 409 EVENTO_INMUTABLE y no se borran', async () => {
  const prisma = crearPrismaFalso({
    eventos: [evento(1, 'Vacacional', '2026-10-05', { fecha_fin: utc('2026-10-09') }), evento(2, 'Periodo', '2026-10-16', { fecha_fin: utc('2027-05-17') })],
    periodos: [{ id: 1, evento_calendario_id: 2, anio: '2026', semestre: 's02', fecha_max_expediente: utc('2026-09-25') }],
  });
  for (const id of [1, 2]) await rechazaCon(eliminar(id, prisma, crearRedisFalso()), 409, CODIGOS_ERROR.EVENTO_INMUTABLE);
  assert.equal(prisma.estado.eventos.length, 2);
  assert.equal(prisma.estado.periodos.length, 1);
});

test('eliminar: un Inhabil en vigor (hoy todo el día, hora pasada, o pasado) → 409 EVENTO_YA_EN_VIGOR', async () => {
  const casos = [
    evento(1, 'Inhabil', '2026-09-18'),
    evento(1, 'Inhabil', '2026-09-18', { hora: horaUtc('13:00') }),
    evento(1, 'Inhabil', '2026-09-17'),
  ];
  for (const caso of casos) {
    const prisma = crearPrismaFalso({ eventos: [caso] });
    await rechazaCon(eliminar(1, prisma, crearRedisFalso()), 409, CODIGOS_ERROR.EVENTO_YA_EN_VIGOR);
    assert.equal(prisma.estado.eventos.length, 1);
  }
});

test('eliminar: un Inhabil de hoy con hora futura se puede borrar; id inexistente → 404', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-18', { hora: horaUtc('16:00') })] });
  await eliminar(1, prisma, crearRedisFalso());
  assert.equal(prisma.estado.eventos.length, 0);
  await rechazaCon(eliminar(1, prisma, crearRedisFalso()), 404, 'EVENTO_NO_ENCONTRADO');
  await rechazaCon(eliminar('x', prisma, crearRedisFalso()), 404, 'EVENTO_NO_ENCONTRADO');
});

// ── Redis: última modificación y caché de periodos ───────────

test('Redis: crear, actualizar y eliminar guardan calendario:ultima_modificacion (ISO de ahora) sin TTL', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();

  const { evento: creado, ultimaModificacion } = await crear(inhabilNuevo(), prisma, redis);
  assert.equal(ultimaModificacion, AHORA_ISO);
  assert.equal(redis.datos.get(CLAVE_ULTIMA_MODIFICACION), AHORA_ISO);

  redis.datos.delete(CLAVE_ULTIMA_MODIFICACION);
  const editado = await actualizar(creado.id, { nombre: 'Nuevo', fechaInicio: '2026-09-23', hora: null }, prisma, redis);
  assert.equal(editado.ultimaModificacion, AHORA_ISO);
  assert.equal(redis.datos.get(CLAVE_ULTIMA_MODIFICACION), AHORA_ISO);

  redis.datos.delete(CLAVE_ULTIMA_MODIFICACION);
  const borrado = await eliminar(creado.id, prisma, redis);
  assert.equal(borrado.ultimaModificacion, AHORA_ISO);
  assert.equal(redis.datos.get(CLAVE_ULTIMA_MODIFICACION), AHORA_ISO);

  // Sin TTL: cada SET lleva exactamente (clave, valor), sin 'EX'.
  const sets = redis.llamadas.filter(([op]) => op === 'set');
  assert.equal(sets.length, 3);
  for (const set of sets) assert.deepEqual(set, ['set', CLAVE_ULTIMA_MODIFICACION, AHORA_ISO]);
});

test('Redis: la lectura posterior a una escritura ve la marca nueva', async () => {
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso();
  await crear(vacacionalNuevo(), prisma, redis);
  const r = await listar('alumno_asignado', {}, prisma, redis);
  assert.equal(r.ultimaModificacion, AHORA_ISO);
  assert.equal(r.eventos.length, 1); // visible de inmediato, sin caché intermedio
});

test('Redis: crear un Periodo invalida cache:periodos; Inhabil y Vacacional no', async () => {
  const redis = crearRedisFalso();
  await crear(periodoNuevo(), crearPrismaFalso(), redis);
  assert.ok(redis.llamadas.some(([op, clave]) => op === 'del' && clave === CLAVE_CACHE_PERIODOS));

  const otro = crearRedisFalso();
  await crear(inhabilNuevo(), crearPrismaFalso(), otro);
  await crear(vacacionalNuevo(), crearPrismaFalso(), otro);
  assert.equal(otro.llamadas.some(([op]) => op === 'del'), false);
});

test('Redis: el DEL de cache:periodos borra el catálogo cacheado', async () => {
  const redis = crearRedisFalso();
  redis.datos.set(CLAVE_CACHE_PERIODOS, '[{"id":1}]');
  await crear(periodoNuevo(), crearPrismaFalso(), redis);
  assert.equal(redis.datos.has(CLAVE_CACHE_PERIODOS), false);
});

test('Redis caído: create, update y delete siguen funcionando y ultimaModificacion es null', async (t) => {
  t.mock.method(console, 'error', () => {});
  const prisma = crearPrismaFalso();
  const redis = crearRedisFalso({ modo: 'error' });

  const creado = await crear(periodoNuevo(), prisma, redis); // incluye DEL de cache:periodos
  assert.equal(creado.ultimaModificacion, null);
  assert.equal(prisma.estado.periodos.length, 1);

  const inhabil = await crear(inhabilNuevo(), prisma, redis);
  const editado = await actualizar(inhabil.evento.id, { nombre: 'Nuevo', fechaInicio: '2026-09-23', hora: null }, prisma, redis);
  assert.equal(editado.ultimaModificacion, null);
  assert.equal(prisma.estado.eventos.find((e) => e.id === inhabil.evento.id).nombre, 'Nuevo');

  const borrado = await eliminar(inhabil.evento.id, prisma, redis);
  assert.deepEqual([borrado.eliminado, borrado.ultimaModificacion], [true, null]);
});

test('Redis colgado: no bloquea el CRUD (se agota el tiempo y se continúa)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const prisma = crearPrismaFalso();
  const inicio = Date.now();
  const r = await crear(periodoNuevo(), prisma, crearRedisFalso({ modo: 'colgado' }));
  assert.equal(r.ultimaModificacion, null);
  assert.equal(prisma.estado.periodos.length, 1);
  assert.ok(Date.now() - inicio < 1000);
});

test('Redis: una operación rechazada (409) no modifica la marca', async () => {
  const prisma = crearPrismaFalso({ eventos: [evento(1, 'Inhabil', '2026-09-22')] });
  const redis = crearRedisFalso();
  await rechazaCon(crear(inhabilNuevo(), prisma, redis), 409, CODIGOS_ERROR.INHABIL_DUPLICADO);
  assert.equal(redis.datos.has(CLAVE_ULTIMA_MODIFICACION), false);
});
