// CU-ADM-15 / CU-ADM-16 — reglas de negocio del flujo de características.
//
// El prisma global se sustituye por la BD falsa de caracteristicas.fakes.js ANTES de cargar el
// servicio, para que lib/cupos.js (que también hace require('./prisma')) use el mismo falso: así el
// conteo de ocupados pasa por contarCuposOcupados REAL, no por una copia del criterio.

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearBd, profesor, solicitud, ocupantes } = require('./caracteristicas.fakes');

const rutaPrisma = require.resolve('../../../lib/prisma');
const rutaSocket = require.resolve('../../../sockets/socket.server');

let prismaActual = null;
let bd = null;
const emitidos = [];

// El módulo cacheado delega en la BD del test en curso.
require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, {
    get: (_, propiedad) => prismaActual[propiedad],
  }),
};
require.cache[rutaSocket] = {
  id: rutaSocket, filename: rutaSocket, loaded: true,
  exports: { emitirAUsuario: (usuarioId, evento, datos) => { emitidos.push({ usuarioId, evento, datos }); } },
};

const servicio = require('./caracteristicas.service');

const INVESTIGADOR = 1;   // +1 → capacidad 4
const COORDINADOR_C = 2;  // +2 → capacidad 5
const JEFE = 4;           // +3 → capacidad 6

const USUARIO_PROFESOR = 10;

function montar({ profesores = [profesor()], solicitudes = [], ocupados = [] } = {}) {
  const creada = crearBd({ profesores, solicitudes, ocupantes: ocupados });
  bd = creada.bd;
  prismaActual = creada.prisma;
  emitidos.length = 0;
  return bd;
}

const profesorEnBd = (id = 1) => bd.profesores.find((p) => p.id === id);
const escriturasA = (modelo) => bd.escrituras.filter((e) => e.modelo === modelo);

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-15 — el profesor solicita
// ════════════════════════════════════════════════════════════════════════════

test('ADM-15: Profesor base → característica', async () => {
  montar({ profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })] });

  const creada = await servicio.crearSolicitud({
    usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'Soy jefe de departamento.',
  });

  assert.equal(creada.estado, 'pendiente');
  assert.equal(creada.caracteristicaSolicitada.id, JEFE);
  assert.equal(creada.capacidadResultante, 6);
});

test('ADM-15: característica A → característica B', async () => {
  montar({ profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })] });

  const creada = await servicio.crearSolicitud({
    usuarioId: USUARIO_PROFESOR, caracteristicaId: COORDINADOR_C, justificacion: 'Cambié de encargo.',
  });

  assert.equal(creada.caracteristicaSolicitada.id, COORDINADOR_C);
  assert.equal(creada.capacidadResultante, 5);
});

test('ADM-15: característica → Profesor base (caracteristicaId null)', async () => {
  montar({ profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })] });

  const creada = await servicio.crearSolicitud({
    usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'Ya no dirijo el proyecto.',
  });

  assert.equal(creada.caracteristicaSolicitada, null);
  assert.equal(creada.capacidadResultante, 3);
});

test('ADM-15: no se puede solicitar la característica que ya está vigente', async () => {
  montar({ profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })] });

  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: INVESTIGADOR, justificacion: 'x' }),
    (err) => err.status === 400 && err.code === 'CARACTERISTICA_YA_VIGENTE',
  );
  assert.deepEqual(escriturasA('solicitud_caracteristica'), []);
});

test('ADM-15: un Profesor base tampoco puede solicitar volver a Profesor base', async () => {
  montar({ profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })] });

  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'x' }),
    (err) => err.status === 400 && err.code === 'CARACTERISTICA_YA_VIGENTE',
  );
});

test('ADM-15: característica inexistente se rechaza', async () => {
  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: 999, justificacion: 'x' }),
    (err) => err.status === 400 && /no es válida/.test(err.message),
  );
  assert.deepEqual(escriturasA('solicitud_caracteristica'), []);
});

test('ADM-15: justificación vacía o solo espacios se rechaza', async () => {
  for (const justificacion of ['', '   ', undefined]) {
    montar();
    await assert.rejects(
      servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion }),
      (err) => err.status === 400 && /justificación es obligatoria/i.test(err.message),
    );
    assert.deepEqual(escriturasA('solicitud_caracteristica'), []);
  }
});

test('ADM-15: no elegir nada (caracteristicaId ausente) se rechaza', async () => {
  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, justificacion: 'x' }),
    (err) => err.status === 400 && /Selecciona la característica/.test(err.message),
  );
});

test('ADM-15: una segunda solicitud pendiente se rechaza', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'pendiente' })] });

  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: COORDINADOR_C, justificacion: 'otra' }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_PENDIENTE_EXISTENTE',
  );
  assert.equal(bd.solicitudes.length, 1);
});

test('ADM-15: con una solicitud ya resuelta SÍ se puede enviar otra (el historial no bloquea)', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'rechazada' })] });

  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: COORDINADOR_C, justificacion: 'reintento' });

  // Fila NUEVA: la anterior nunca se reutiliza ni se sobrescribe.
  assert.equal(bd.solicitudes.length, 2);
  assert.equal(bd.solicitudes[0].estado, 'rechazada');
  assert.equal(bd.solicitudes[1].estado, 'pendiente');
});

test('ADM-15: ocupados < nueva capacidad se permite', async () => {
  montar({ profesores: [profesor({ caracteristicaId: JEFE, cuposTotales: 6 })], ocupados: ocupantes(1, 2) });

  const creada = await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'x' });
  assert.equal(creada.capacidadResultante, 3);
});

test('ADM-15: ocupados == nueva capacidad se permite', async () => {
  montar({ profesores: [profesor({ caracteristicaId: JEFE, cuposTotales: 6 })], ocupados: ocupantes(1, 3) });

  const creada = await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'x' });
  assert.equal(creada.capacidadResultante, 3);
});

test('ADM-15: ocupados > nueva capacidad se rechaza (investigador 4/4 que quiere volver a base)', async () => {
  montar({ profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })], ocupados: ocupantes(1, 4) });

  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'x' }),
    (err) => err.status === 409
      && err.code === 'CAPACIDAD_INSUFICIENTE'
      && err.datos.capacidadResultante === 3
      && err.datos.ocupados === 4
      && err.datos.cuposALiberar === 1,
  );
  assert.equal(bd.solicitudes.length, 0);
});

test('ADM-15: crear la solicitud NO modifica todavía al profesor', async () => {
  montar({ profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })] });

  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });

  assert.equal(profesorEnBd().caracteristica_id, null);
  assert.equal(profesorEnBd().cupos_totales, 3);
  assert.deepEqual(escriturasA('profesor'), []);
});

test('ADM-15: la solicitud nace pendiente, sin comentario y sin fecha de respuesta', async () => {
  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: '  con espacios  ' });

  const fila = bd.solicitudes[0];
  assert.equal(fila.estado, 'pendiente');
  assert.equal(fila.comentario, null);
  assert.equal(fila.fecha_respuesta, null);
  assert.ok(fila.fecha instanceof Date);
  assert.equal(fila.justificacion, 'con espacios'); // se guarda recortada
});

// ── Contexto de la pantalla ──

test('ADM-15 contexto: un Profesor base ve las 6 opciones y ninguna de "volver a base"', async () => {
  montar({ profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })], ocupados: ocupantes(1, 2) });

  const ctx = await servicio.obtenerContexto({ usuarioId: USUARIO_PROFESOR });

  assert.equal(ctx.profesor.caracteristicaVigente, null);
  assert.equal(ctx.profesor.cuposTotales, 3);
  assert.equal(ctx.profesor.ocupados, 2);
  assert.equal(ctx.opciones.length, 6);
  assert.equal(ctx.opciones.some((o) => o.caracteristicaId === null), false);
});

test('ADM-15 contexto: con característica vigente, esa no se ofrece y sí aparece "Profesor base"', async () => {
  montar({ profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })], ocupados: ocupantes(1, 4) });

  const ctx = await servicio.obtenerContexto({ usuarioId: USUARIO_PROFESOR });

  assert.equal(ctx.opciones.some((o) => o.caracteristicaId === INVESTIGADOR), false);
  const base = ctx.opciones.find((o) => o.caracteristicaId === null);
  assert.equal(base.capacidadResultante, 3);
  // 4 ocupados no caben en 3: el front debe advertirlo y bloquear el envío.
  assert.equal(base.viable, false);
  assert.equal(base.cuposALiberar, 1);
  // Subir de categoría sí es viable.
  assert.equal(ctx.opciones.find((o) => o.caracteristicaId === JEFE).viable, true);
});

test('ADM-15 contexto: expone la solicitud pendiente y el historial completo', async () => {
  montar({
    solicitudes: [
      solicitud({ id: 1, caracteristicaId: JEFE, estado: 'rechazada', comentario: 'No procede.' }),
      solicitud({ id: 2, caracteristicaId: COORDINADOR_C, estado: 'pendiente' }),
    ],
  });

  const ctx = await servicio.obtenerContexto({ usuarioId: USUARIO_PROFESOR });

  assert.equal(ctx.solicitudPendiente.id, 2);
  assert.deepEqual(ctx.historial.map((h) => h.id), [2, 1]); // más reciente primero
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-16 — coordinación resuelve
// ════════════════════════════════════════════════════════════════════════════

test('ADM-16: aprobación válida cambia caracteristica_id y cupos_totales', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })],
    ocupados: ocupantes(1, 2),
  });

  const resultado = await servicio.aprobarSolicitud({ solicitudId: 1 });

  assert.equal(resultado.estado, 'aprobada');
  assert.equal(profesorEnBd().caracteristica_id, JEFE);
  assert.equal(profesorEnBd().cupos_totales, 6);
  assert.ok(bd.solicitudes[0].fecha_respuesta instanceof Date);
});

test('ADM-16: aprobar una vuelta a Profesor base deja caracteristica_id NULL y 3 cupos', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: null })],
    ocupados: ocupantes(1, 3),
  });

  await servicio.aprobarSolicitud({ solicitudId: 1 });

  assert.equal(profesorEnBd().caracteristica_id, null);
  assert.equal(profesorEnBd().cupos_totales, 3);
});

test('ADM-16: la aprobación guarda el comentario del coordinador si lo hay', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, comentario: '  Validado con el acta.  ' });

  assert.equal(bd.solicitudes[0].comentario, 'Validado con el acta.');
});

test('ADM-16: rechazo marca rechazada, guarda motivo y NO modifica al profesor', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })],
  });

  const resultado = await servicio.rechazarSolicitud({ solicitudId: 1, comentario: 'Falta el nombramiento.' });

  assert.equal(resultado.estado, 'rechazada');
  assert.equal(bd.solicitudes[0].comentario, 'Falta el nombramiento.');
  assert.ok(bd.solicitudes[0].fecha_respuesta instanceof Date);
  assert.equal(profesorEnBd().caracteristica_id, INVESTIGADOR);
  assert.equal(profesorEnBd().cupos_totales, 4);
  assert.deepEqual(escriturasA('profesor'), []);
});

test('ADM-16: el comentario es obligatorio al rechazar', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })] });

  for (const comentario of ['', '   ', undefined]) {
    await assert.rejects(
      servicio.rechazarSolicitud({ solicitudId: 1, comentario }),
      (err) => err.status === 400 && /motivo del rechazo/i.test(err.message),
    );
  }
  assert.equal(bd.solicitudes[0].estado, 'pendiente');
});

test('ADM-16: una solicitud ya aprobada no puede volver a resolverse', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'aprobada' })] });

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
  await assert.rejects(
    servicio.rechazarSolicitud({ solicitudId: 1, comentario: 'tarde' }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
});

test('ADM-16: una solicitud ya rechazada no puede aprobarse después', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'rechazada' })] });

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
  assert.deepEqual(escriturasA('profesor'), []);
});

test('ADM-16: era válida al enviarse pero dejó de serlo — no se aprueba y sigue pendiente', async () => {
  // Al enviar: investigador 4 cupos, 3 ocupados, pide volver a base (3) → válido.
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    ocupados: ocupantes(1, 3),
  });
  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: null, justificacion: 'x' });

  // Mientras tanto le asignan un cuarto alumno.
  bd.ocupantes.push(...ocupantes(1, 1));

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1 }),
    (err) => err.status === 409
      && err.code === 'CAPACIDAD_INSUFICIENTE'
      && err.datos.ocupados === 4
      && err.datos.capacidadResultante === 3
      && err.datos.cuposALiberar === 1,
  );

  // Nada cambió: ni profesor, ni estado de la solicitud.
  assert.equal(profesorEnBd().caracteristica_id, INVESTIGADOR);
  assert.equal(profesorEnBd().cupos_totales, 4);
  assert.equal(bd.solicitudes[0].estado, 'pendiente');
  assert.equal(bd.solicitudes[0].fecha_respuesta, null);
});

test('ADM-16: tras fallar la aprobación, el rechazo sigue disponible', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: null })],
    ocupados: ocupantes(1, 4),
  });

  await assert.rejects(servicio.aprobarSolicitud({ solicitudId: 1 }), (err) => err.code === 'CAPACIDAD_INSUFICIENTE');
  const resultado = await servicio.rechazarSolicitud({ solicitudId: 1, comentario: 'Ya no cabe; libera cupos primero.' });

  assert.equal(resultado.estado, 'rechazada');
});

test('ADM-16: ninguna decisión toca ofertas ni alumnos', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE }), solicitud({ id: 2, profesorId: 1, caracteristicaId: COORDINADOR_C, estado: 'pendiente' })],
    ocupados: ocupantes(1, 2),
  });
  const ocupantesAntes = JSON.stringify(bd.ocupantes);

  await servicio.aprobarSolicitud({ solicitudId: 1 });
  await servicio.rechazarSolicitud({ solicitudId: 2, comentario: 'No procede.' });

  assert.deepEqual(escriturasA('oferta_servicio'), []);
  assert.equal(JSON.stringify(bd.ocupantes), ocupantesAntes);
  // Solo se escribieron: profesor (1 update) y solicitudes.
  assert.deepEqual([...new Set(bd.escrituras.map((e) => e.modelo))], ['profesor', 'solicitud_caracteristica']);
});

test('ADM-16: la aprobación bloquea la fila del profesor ANTES de cualquier escritura', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })] });

  await servicio.aprobarSolicitud({ solicitudId: 1 });

  assert.equal(bd.locks.length, 1, 'debe tomarse exactamente un SELECT ... FOR UPDATE');
  assert.equal(bd.locks[0].profesorId, 1);
  assert.equal(bd.locks[0].escriturasPrevias, 0, 'el lock debe ser la primera sentencia de la transacción');
});

test('ADM-16: crear la solicitud también se serializa con el lock del profesor', async () => {
  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });

  assert.equal(bd.locks.length, 1);
  assert.equal(bd.locks[0].escriturasPrevias, 0);
});

// ── Vista de coordinación ──

test('ADM-16: el detalle trae capacidad actual, resultante y ocupados reales', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })],
    ocupados: ocupantes(1, 3),
  });

  const detalle = await servicio.obtenerSolicitud({ solicitudId: 1 });

  assert.equal(detalle.profesor.caracteristicaVigente.nombre, 'Investigador');
  assert.equal(detalle.profesor.capacidadActual, 4);
  assert.equal(detalle.profesor.ocupados, 3);
  assert.equal(detalle.capacidadResultante, 6);
  assert.equal(detalle.puedeAprobarse, true);
  assert.equal(detalle.caracteristicaSolicitada.nombre, 'Jefe de departamento'); // guiones bajos fuera
});

test('ADM-16: el listado marca puedeAprobarse=false cuando ya no cabe', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: INVESTIGADOR, cuposTotales: 4 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: null })],
    ocupados: ocupantes(1, 4),
  });

  const { pendientes } = await servicio.listarSolicitudes();

  assert.equal(pendientes.length, 1);
  assert.equal(pendientes[0].puedeAprobarse, false);
  assert.equal(pendientes[0].cuposALiberar, 1);
  assert.equal(pendientes[0].caracteristicaSolicitada, null); // vuelta a Profesor base
});

// ── Bandeja compartida: pendientes + historial ──

test('ADM-16: pendientes sigue trayendo SOLO las pendientes', async () => {
  montar({
    solicitudes: [
      solicitud({ id: 1, caracteristicaId: JEFE, estado: 'aprobada', fechaRespuesta: new Date('2026-09-21T10:00:00Z') }),
      solicitud({ id: 2, caracteristicaId: COORDINADOR_C, estado: 'pendiente' }),
      solicitud({ id: 3, caracteristicaId: INVESTIGADOR, estado: 'rechazada', fechaRespuesta: new Date('2026-09-22T10:00:00Z') }),
    ],
  });

  const { pendientes, totales } = await servicio.listarSolicitudes();

  assert.deepEqual(pendientes.map((s) => s.id), [2]);
  assert.equal(totales.pendientes, 1);
});

test('ADM-16: resueltas trae aprobadas Y rechazadas, de la más reciente hacia atrás', async () => {
  montar({
    solicitudes: [
      solicitud({ id: 1, caracteristicaId: JEFE, estado: 'aprobada', fechaRespuesta: new Date('2026-09-21T10:00:00Z') }),
      solicitud({ id: 2, caracteristicaId: COORDINADOR_C, estado: 'pendiente' }),
      solicitud({ id: 3, caracteristicaId: INVESTIGADOR, estado: 'rechazada', comentario: 'Falta el acta.', fechaRespuesta: new Date('2026-09-22T10:00:00Z') }),
    ],
  });

  const { resueltas, totales } = await servicio.listarSolicitudes();

  assert.deepEqual(resueltas.map((s) => s.id), [3, 1]);
  assert.deepEqual(resueltas.map((s) => s.estado), ['rechazada', 'aprobada']);
  assert.equal(totales.resueltas, 2);
  // El historial trae lo que la pantalla necesita mostrar de una resuelta.
  const rechazada = resueltas[0];
  assert.equal(rechazada.comentario, 'Falta el acta.');
  assert.ok(rechazada.fechaRespuesta);
  assert.ok(rechazada.profesor.nombre);
  assert.ok(rechazada.fecha);
});

test('ADM-16: ninguna resuelta se ofrece como aprobable, aunque hoy sí cupiera', async () => {
  montar({
    profesores: [profesor({ caracteristicaId: null, cuposTotales: 3 })],
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'aprobada', fechaRespuesta: new Date() })],
    ocupados: [], // 0 ocupados: cabría de sobra, pero está resuelta
  });

  const { resueltas } = await servicio.listarSolicitudes();
  assert.equal(resueltas[0].puedeAprobarse, false);
});

test('ADM-16: una solicitud resuelta sigue siendo consultable por id', async () => {
  montar({
    solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'rechazada', comentario: 'No procede.', fechaRespuesta: new Date('2026-09-22T10:00:00Z') })],
  });

  const detalle = await servicio.obtenerSolicitud({ solicitudId: 1 });

  assert.equal(detalle.estado, 'rechazada');
  assert.equal(detalle.comentario, 'No procede.');
  assert.equal(detalle.puedeAprobarse, false);
  assert.equal(detalle.caracteristicaSolicitada.nombre, 'Jefe de departamento');
});

test('ADM-16: una resuelta no puede resolverse otra vez desde el historial', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE, estado: 'aprobada', fechaRespuesta: new Date() })] });

  await assert.rejects(servicio.aprobarSolicitud({ solicitudId: 1 }), (err) => err.code === 'SOLICITUD_YA_RESUELTA');
  await assert.rejects(servicio.rechazarSolicitud({ solicitudId: 1, comentario: 'x' }), (err) => err.code === 'SOLICITUD_YA_RESUELTA');
  assert.deepEqual(escriturasA('profesor'), []);
});

test('ADM-16: una solicitud inexistente da 404', async () => {
  await assert.rejects(servicio.obtenerSolicitud({ solicitudId: 77 }), (err) => err.status === 404);
  await assert.rejects(servicio.aprobarSolicitud({ solicitudId: 77 }), (err) => err.status === 404);
  await assert.rejects(servicio.rechazarSolicitud({ solicitudId: 77, comentario: 'x' }), (err) => err.status === 404);
});

// ════════════════════════════════════════════════════════════════════════════
// Autorización
// ════════════════════════════════════════════════════════════════════════════

test('ADM-15: un usuario sin perfil de profesor (p. ej. coordinador) no puede solicitar', async () => {
  montar({ profesores: [profesor({ usuarioId: 10 })] });

  // usuario 900 es el coordinador: no tiene fila en profesor.
  await assert.rejects(
    servicio.crearSolicitud({ usuarioId: 900, caracteristicaId: JEFE, justificacion: 'x' }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_PROFESOR',
  );
  await assert.rejects(
    servicio.obtenerContexto({ usuarioId: 900 }),
    (err) => err.code === 'SIN_PERFIL_PROFESOR',
  );
  assert.equal(bd.solicitudes.length, 0);
});

test('ADM-15: un profesor solo opera sobre sí mismo, aunque mande otro profesor_id', async () => {
  montar({
    profesores: [
      profesor({ id: 1, usuarioId: 10 }),
      profesor({ id: 2, usuarioId: 20, caracteristicaId: null, cuposTotales: 3 }),
    ],
  });

  // El servicio no acepta profesor_id: el campo extra se ignora y la solicitud queda a nombre
  // del profesor del token (usuario 20 → profesor 2).
  await servicio.crearSolicitud({
    usuarioId: 20, caracteristicaId: JEFE, justificacion: 'x', profesorId: 1, profesor_id: 1,
  });

  assert.equal(bd.solicitudes[0].profesor_id, 2);
});

test('ADM-15: el contexto de cada profesor es el suyo', async () => {
  montar({
    profesores: [
      profesor({ id: 1, usuarioId: 10, caracteristicaId: INVESTIGADOR, cuposTotales: 4 }),
      profesor({ id: 2, usuarioId: 20, caracteristicaId: null, cuposTotales: 3 }),
    ],
    solicitudes: [solicitud({ id: 1, profesorId: 1, caracteristicaId: JEFE, estado: 'pendiente' })],
  });

  const suyo = await servicio.obtenerContexto({ usuarioId: 20 });
  assert.equal(suyo.profesor.caracteristicaVigente, null);
  assert.equal(suyo.solicitudPendiente, null, 'la pendiente del otro profesor no lo bloquea');
  assert.deepEqual(suyo.historial, []);
});

// ════════════════════════════════════════════════════════════════════════════
// Notificaciones
// ════════════════════════════════════════════════════════════════════════════

// La bandeja de Coordinación es compartida: el listado no filtra por coordinador, así que TODOS
// deben enterarse. Un solo destinatario dejaría a los demás viendo la solicitud sin haber sido avisados.
test('crear la solicitud avisa a TODOS los coordinadores, no solo al primero', async () => {
  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });

  assert.equal(bd.notificaciones.length, 2);
  assert.deepEqual(bd.notificaciones.map((n) => n.usuario_id).sort(), [900, 901]);
  for (const n of bd.notificaciones) {
    assert.equal(n.tipo, 'info');
    assert.match(n.ruta_relacionada, /^\/coordinacion\/solicitudes-caracteristicas\?destacar=/);
  }
  assert.deepEqual(emitidos.map((e) => e.usuarioId).sort(), [900, 901]);
  assert.equal(emitidos[0].evento, 'caracteristica:solicitada');
});

test('con un solo coordinador se avisa solo a ese', async () => {
  montar();
  bd.coordinadores = [{ id: 1, usuario_id: 900 }];

  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });

  assert.deepEqual(bd.notificaciones.map((n) => n.usuario_id), [900]);
});

test('si falla el aviso a un coordinador, los demás igual se enteran y la solicitud queda creada', async () => {
  montar();
  let intentos = 0;
  prismaActual = new Proxy(prismaActual, {
    get: (destino, propiedad) => (propiedad === 'notificacion'
      ? {
          create: async (args) => {
            intentos += 1;
            if (intentos === 1) throw new Error('fallo al notificar al primero');
            return destino.notificacion.create(args);
          },
        }
      : destino[propiedad]),
  });

  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });

  assert.equal(intentos, 2, 'el fallo de uno no corta el bucle');
  assert.deepEqual(bd.notificaciones.map((n) => n.usuario_id), [901]);
  assert.equal(bd.solicitudes.length, 1);
});

// Cada notificación es una fila propia de su destinatario y nada en el sistema escribe las ajenas.
test('resolver la solicitud NO borra ni modifica la notificación del otro coordinador', async () => {
  montar();
  await servicio.crearSolicitud({ usuarioId: USUARIO_PROFESOR, caracteristicaId: JEFE, justificacion: 'x' });
  const avisosCoordinacion = bd.notificaciones.map((n) => ({ ...n }));
  assert.equal(avisosCoordinacion.length, 2);

  await servicio.aprobarSolicitud({ solicitudId: 1 });

  // Las dos filas de coordinación siguen intactas (sin leer, mismo mensaje y misma ruta).
  for (const previa of avisosCoordinacion) {
    const actual = bd.notificaciones.find((n) => n.id === previa.id);
    assert.deepEqual(actual, previa);
  }
  // Y el módulo nunca intentó tocarlas.
  assert.deepEqual(bd.escrituras.filter((e) => e.modelo === 'notificacion'), []);
});

test('aprobar y rechazar avisan al profesor', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE }), solicitud({ id: 2, caracteristicaId: COORDINADOR_C })] });

  await servicio.aprobarSolicitud({ solicitudId: 1 });
  assert.equal(bd.notificaciones.at(-1).usuario_id, USUARIO_PROFESOR);
  assert.equal(bd.notificaciones.at(-1).tipo, 'success');

  await servicio.rechazarSolicitud({ solicitudId: 2, comentario: 'Falta el acta.' });
  assert.equal(bd.notificaciones.at(-1).usuario_id, USUARIO_PROFESOR);
  assert.equal(bd.notificaciones.at(-1).tipo, 'urgente');
  assert.match(bd.notificaciones.at(-1).mensaje, /Falta el acta\./);
});

test('si las notificaciones fallan, la decisión ya escrita no se revierte', async () => {
  montar({ solicitudes: [solicitud({ id: 1, caracteristicaId: JEFE })] });
  prismaActual = new Proxy(prismaActual, {
    get: (destino, propiedad) => (propiedad === 'notificacion'
      ? { create: async () => { throw new Error('BD de notificaciones caída'); } }
      : destino[propiedad]),
  });

  const resultado = await servicio.aprobarSolicitud({ solicitudId: 1 });

  assert.equal(resultado.estado, 'aprobada');
  assert.equal(profesorEnBd().cupos_totales, 6);
});
