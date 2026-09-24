// CU-ADM-09 / CU-ADM-11 / CU-ADM-12 — reglas de negocio del bloque de bajas.
//
// El prisma global se sustituye ANTES de cargar el servicio, para que lib/cupos.js y gr.service.js
// (que también hacen require('./prisma')) usen el mismo falso: así el conteo de ocupados y
// liberarLugarOferta son los REALES, no copias del criterio.
//
// El filesystem y el mailer también se falsean: ningún test escribe en disco ni manda correo.

// Llave de prueba ANTES de cargar nada: lib/fileEncryption la exige al cifrar. Se usa el cifrado
// REAL (no un doble), para que el test pueda comprobar que lo escrito en disco no es el PDF en claro.
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { crearBd, usuario, alumno, profesor, oferta, solicitudRegistro, baja, documento, cumulo, carrera, periodo } = require('./bajas.fakes');

const rutaPrisma = require.resolve('../../../lib/prisma');
const rutaSocket = require.resolve('../../../sockets/socket.server');
const rutaMailer = require.resolve('../../../lib/mailer');
const rutaJwt = require.resolve('../../../lib/jwt');

// El servicio importa `liberarLugarOferta` de gr.service.js (reutilizar la lógica real de cupos es
// intencional), y gr.service arrastra lib/jwt, que EXIGE JWT_SECRET al cargarse. Aquí no se firma
// ningún token, así que se sustituye para no atar la prueba a una variable de entorno.
require.cache[rutaJwt] = {
  id: rutaJwt, filename: rutaJwt, loaded: true,
  exports: { generarToken: () => 'token-de-prueba', verificarToken: () => ({}) },
};

let prismaActual = null;
let bd = null;
const correos = [];
const fsFalso = { borradas: [], escritos: [], fallarBorrado: false, fallarEscritura: false };

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};
// Los eventos de socket se REGISTRAN: son parte del contrato del módulo (el frontend depende de
// `baja:en_revision`, `baja:solicitada_por_profesor` y `baja:aplicada`), así que se comprueban.
const emitidos = [];
require.cache[rutaSocket] = {
  id: rutaSocket, filename: rutaSocket, loaded: true,
  exports: { emitirAUsuario: (usuarioId, evento, datos) => emitidos.push({ usuarioId, evento, datos }) },
};
// El mailer se sustituye por un doble que REGISTRA cualquier envío y no expone ninguna función de
// bajas: si este flujo volviera a mandar correo, el test fallaría por TypeError en vez de pasar en
// silencio. Ver la prueba "ya NO se manda correo".
require.cache[rutaMailer] = {
  id: rutaMailer, filename: rutaMailer, loaded: true,
  exports: new Proxy({}, {
    get: (_, nombre) => async (datos) => { correos.push({ funcion: String(nombre), datos }); },
  }),
};

// fs: se intercepta lo justo para no tocar disco.
const fs = require('fs');
const rmSyncReal = fs.rmSync;
const writeFileSyncReal = fs.writeFileSync;
const mkdirSyncReal = fs.mkdirSync;
fs.rmSync = (ruta, opciones) => {
  if (fsFalso.fallarBorrado) throw new Error('EACCES');
  fsFalso.borradas.push({ ruta, opciones });
};
fs.writeFileSync = (ruta, datos) => {
  if (fsFalso.fallarEscritura) throw new Error('ENOSPC');
  fsFalso.escritos.push({ ruta, bytes: datos?.length ?? 0 });
};
fs.mkdirSync = () => {};
fs.unlinkSync = (ruta) => { fsFalso.borradas.push({ ruta, unlink: true }); };
test.after(() => { fs.rmSync = rmSyncReal; fs.writeFileSync = writeFileSyncReal; fs.mkdirSync = mkdirSyncReal; });

const servicio = require('./bajas.service');

const U_ALUMNO = 10, U_PROFESOR = 20, U_COORD_1 = 900, U_COORD_2 = 901, U_OTRO_PROF = 30;
const BOLETA = '2022630001';

function montar(extra = {}) {
  const creada = crearBd({
    usuarios: [
      usuario({ id: U_ALUMNO }),
      usuario({ id: U_PROFESOR, nombre: 'Luis', apellidos: 'Torres Vega', correo: 'luis@ipn.mx', rol: 'profesor' }),
      usuario({ id: U_COORD_1, nombre: 'Coord', apellidos: 'Uno', correo: 'c1@ipn.mx', rol: 'coordinador' }),
      usuario({ id: U_COORD_2, nombre: 'Coord', apellidos: 'Dos', correo: 'c2@ipn.mx', rol: 'coordinador' }),
      usuario({ id: U_OTRO_PROF, nombre: 'Otra', apellidos: 'Profesora', correo: 'otra@ipn.mx', rol: 'profesor' }),
    ],
    alumnos: [alumno()],
    profesores: [profesor(), profesor({ id: 2, usuarioId: U_OTRO_PROF })],
    ofertas: [oferta()],
    solicitudesRegistro: [solicitudRegistro()],
    cumulos: [cumulo()],
    // Avance del servicio que una baja aprobada debe eliminar. Se declara COMPLETO aquí para que
    // cada prueba de aprobación pueda comprobar que no queda nada de él.
    bitacoras: [{ id: 1, solicitud_registro_id: 1 }, { id: 2, solicitud_registro_id: 1 }],
    actividades: [{ id: 1, solicitud_registro_id: 1 }],
    registrosBitacora: [{ id: 1, bitacora_id: 1, actividad_id: 1 }, { id: 2, bitacora_id: 2, actividad_id: 1 }],
    reportes: [{ id: 1, solicitud_registro_id: 1 }],
    reportesGlobales: [{ id: 1, solicitud_registro_id: 1 }],
    revisionesMensuales: [{ id: 1, reporte_mensual_id: 1 }, { id: 2, reporte_mensual_id: 1 }],
    revisionesGlobales: [{ id: 1, reporte_global_id: 1 }],
    liberaciones: [{ id: 1, solicitud_registro_id: 1 }],
    evaluaciones: [{ id: 1, liberacion_proceso_id: 1 }],
    revisionesDesempeno: [{ id: 1, evaluacion_desempeno_id: 1 }],
    cartasTermino: [{ id: 1, liberacion_proceso_id: 1 }],
    // Catálogos que CU-GR-13 consulta al reenviar la solicitud modificada.
    carreras: [carrera()],
    periodos: [periodo()],
    ...extra,
  });
  bd = creada.bd;
  prismaActual = creada.prisma;
  correos.length = 0;
  emitidos.length = 0;
  fsFalso.borradas.length = 0;
  fsFalso.escritos.length = 0;
  fsFalso.fallarBorrado = false;
  fsFalso.fallarEscritura = false;
  return bd;
}

const escriturasA = (modelo) => bd.escrituras.filter((e) => e.modelo === modelo);
const ofertaEnBd = (id = 1) => bd.ofertas.find((o) => o.id === id);
const srEnBd = (id = 1) => bd.solicitudesRegistro.find((s) => s.id === id);
const bajaEnBd = (id = 1) => bd.bajas.find((b) => b.id === id);
// Aprobar SOLO se puede desde 'en_revision', y ese estado exige expediente. Este constructor deja la
// baja lista para el único punto donde se ejecuta la baja definitiva.
const bajaEnRevision = (extra = {}) => baja({ id: 1, estado: 'en_revision', documentoId: 1, ...extra });
const usuarioEnBd = (id = U_ALUMNO) => bd.usuarios.find((u) => u.id === id);
// Documentos del servicio anterior + el expediente de la propia baja, con rutas reales.
const DOCS_DEL_SERVICIO = [
  documento({ id: 1, tipo: 'expediente_baja', ruta: `${BOLETA}/baja.enc` }),
  documento({ id: 2, tipo: 'carta_creditos', estado: 'aprobado', ruta: `${BOLETA}/creditos.enc` }),
  documento({ id: 3, tipo: 'reporte_mensual', estado: 'vigente', ruta: `${BOLETA}/Reportes/rm1.enc` }),
  documento({ id: 4, tipo: 'carta_compromiso_firmada', estado: 'aprobado', ruta: `${BOLETA}/CartaCompromisoFirmada/c.enc` }),
];

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-09 — el profesor solicita
// ════════════════════════════════════════════════════════════════════════════

test('ADM-09: lista solo los alumnos asignados a ESE profesor, con sus faltas', async () => {
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });

  assert.equal(alumnos.length, 1);
  assert.equal(alumnos[0].boleta, BOLETA);
  assert.equal(alumnos[0].faltasAcumuladas, 3);
  assert.equal(alumnos[0].faltasConsecutivas, 2);
  assert.equal(alumnos[0].horasNetas, 40);
  assert.equal(alumnos[0].tieneBajaPendiente, false);
});

test('ADM-09: otro profesor no ve a ese alumno', async () => {
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_OTRO_PROF });
  assert.deepEqual(alumnos, []);
});

test('ADM-09: crea la solicitud pendiente sin expediente', async () => {
  const creada = await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: '  Abandono reiterado.  ' });

  assert.equal(creada.estado, 'pendiente');
  assert.equal(creada.origen, 'profesor');
  assert.equal(creada.tieneExpediente, false);
  const fila = bd.bajas[0];
  assert.equal(fila.documento_id, null);
  assert.equal(fila.coordinador_id, null);
  assert.equal(fila.fecha_respuesta, null);
  assert.equal(fila.motivo, 'Abandono reiterado.'); // recortado
});

test('ADM-09: motivo obligatorio', async () => {
  for (const motivo of ['', '   ', undefined]) {
    montar();
    await assert.rejects(
      servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo }),
      (err) => err.status === 400 && /motivo/i.test(err.message),
    );
    assert.equal(bd.bajas.length, 0);
  }
});

test('ADM-09: un profesor no puede dar de baja a un alumno ajeno', async () => {
  await assert.rejects(
    servicio.solicitarBajaProfesor({ usuarioId: U_OTRO_PROF, alumnoBoleta: BOLETA, motivo: 'x' }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
  assert.equal(bd.bajas.length, 0);
});

test('ADM-09: las faltas NO son requisito — alumno sin faltas se puede dar de baja', async () => {
  montar({ cumulos: [cumulo({ faltas: 0, consecutivas: 0 })] });

  const creada = await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'Cambio de proyecto.' });
  assert.equal(creada.estado, 'pendiente');
});

test('ADM-09: sin cúmulo de faltas tampoco falla', async () => {
  montar({ cumulos: [] });
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });
  assert.equal(alumnos[0].faltasAcumuladas, 0);
  assert.equal(alumnos[0].horasNetas, 0);
});

test('ADM-09: no se permiten dos bajas pendientes del mismo alumno', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await assert.rejects(
    servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'otra' }),
    (err) => err.status === 409 && err.code === 'BAJA_PENDIENTE_EXISTENTE',
  );
  assert.equal(bd.bajas.length, 1);
});

test('ADM-09: crear la solicitud NO toca al alumno, ni la oferta, ni los cupos', async () => {
  await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'x' });

  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO) !== undefined, true);
  assert.equal(ofertaEnBd().cupos_disponibles, 1);
  assert.deepEqual(escriturasA('oferta_servicio'), []);
  assert.deepEqual(escriturasA('usuario'), []);
});

// ── Amonestación ──

test('amonestación: crea UNA notificación al alumno y nada más', async () => {
  await servicio.amonestarAlumno({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, observaciones: 'Registra tu bitácora a diario.' });

  assert.equal(bd.notificaciones.length, 1);
  assert.equal(bd.notificaciones[0].usuario_id, U_ALUMNO);
  assert.equal(bd.notificaciones[0].tipo, 'urgente');
  assert.match(bd.notificaciones[0].mensaje, /Registra tu bitácora a diario\./);
  assert.equal(bd.bajas.length, 0);
});

test('amonestación: NO modifica los contadores de faltas de AH', async () => {
  await servicio.amonestarAlumno({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, observaciones: 'aviso' });

  const c = bd.cumulos[0];
  assert.equal(c.faltas_acumuladas, 3, 'las faltas acumuladas no se tocan');
  assert.equal(c.faltas_consecutivas, 2, 'las faltas consecutivas no se reinician');
  assert.deepEqual(escriturasA('cumulo_horas_y_faltas'), []);
});

test('amonestación: observaciones obligatorias y solo sobre alumnos propios', async () => {
  await assert.rejects(
    servicio.amonestarAlumno({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, observaciones: '  ' }),
    (err) => err.status === 400,
  );
  await assert.rejects(
    servicio.amonestarAlumno({ usuarioId: U_OTRO_PROF, alumnoBoleta: BOLETA, observaciones: 'x' }),
    (err) => err.code === 'ALUMNO_NO_ASIGNADO',
  );
  assert.equal(bd.notificaciones.length, 0);
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-11 — el alumno solicita
// ════════════════════════════════════════════════════════════════════════════

const pdf = () => ({ buffer: Buffer.from('%PDF-1.4 contenido') });

test('ADM-11: crea solicitud pendiente + documento en_revision cifrado en <boleta>/', async () => {
  const creada = await servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'Motivos personales.', archivoPdf: pdf() });

  assert.equal(creada.estado, 'pendiente');
  assert.equal(creada.origen, 'alumno');
  assert.equal(creada.tieneExpediente, true);

  const doc = bd.documentos[0];
  assert.equal(doc.tipo_documento, 'expediente_baja');
  assert.equal(doc.estado_documento, 'en_revision');
  assert.equal(doc.ruta_archivo.startsWith(`${BOLETA}${path.sep}`), true, 'va en la raíz de <boleta>/');
  assert.equal(doc.ruta_archivo.includes('Reportes'), false, 'NUNCA dentro de Reportes');

  // El archivo se escribió cifrado (el buffer guardado no es el original en claro).
  assert.equal(fsFalso.escritos.length, 1);
  assert.notEqual(fsFalso.escritos[0].bytes, pdf().buffer.length);
});

test('ADM-11: motivo y PDF obligatorios', async () => {
  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: '  ', archivoPdf: pdf() }),
    (err) => err.status === 400 && /motivo/i.test(err.message),
  );
  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'x', archivoPdf: null }),
    (err) => err.status === 400 && err.code === 'EXPEDIENTE_REQUERIDO',
  );
  assert.equal(bd.bajas.length, 0);
  assert.equal(fsFalso.escritos.length, 0, 'no se escribe nada si falla la validación');
});

test('ADM-11: una sola solicitud activa por alumno', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO })] });

  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'otra', archivoPdf: pdf() }),
    (err) => err.status === 409 && err.code === 'BAJA_PENDIENTE_EXISTENTE',
  );
});

test('ADM-11: si la transacción falla, el archivo cifrado no sobrevive', async () => {
  montar();
  // Se muta el modelo en sitio: `tx` dentro de $transaction resuelve el MISMO objeto, así que
  // envolver el prisma exterior en un Proxy no bastaría para llegar hasta él.
  prismaActual.documento.create = async () => { throw new Error('BD caída'); };

  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'x', archivoPdf: pdf() }),
    (err) => /BD caída/.test(err.message),
  );

  assert.equal(fsFalso.escritos.length, 1, 'el archivo llegó a escribirse');
  assert.equal(fsFalso.borradas.some((b) => b.unlink), true, 'y se borró al fallar la transacción');
  assert.equal(bd.bajas.length, 0);
  assert.equal(bd.documentos.length, 0);
});

test('ADM-11: el alumno consulta su solicitud y su historial', async () => {
  montar({
    bajas: [
      baja({ id: 1, solicitanteId: U_ALUMNO, estado: 'rechazada', comentario: 'Expediente incompleto.', fechaRespuesta: new Date() }),
      baja({ id: 2, solicitanteId: U_ALUMNO, estado: 'pendiente', documentoId: 1 }),
    ],
    documentos: [documento({ id: 1 })],
  });

  const r = await servicio.consultarMiSolicitud({ usuarioId: U_ALUMNO });
  assert.equal(r.solicitudPendiente.id, 2);
  assert.deepEqual(r.historial.map((h) => h.id), [2, 1]);
  assert.equal(r.historial[1].comentario, 'Expediente incompleto.');
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-12 — Coordinación resuelve
// ════════════════════════════════════════════════════════════════════════════

test('ADM-12: la bandeja mezcla ambos orígenes y los distingue', async () => {
  montar({
    alumnos: [alumno(), alumno({ boleta: '2022630002', usuarioId: 11 })],
    usuarios: [...bd.usuarios, usuario({ id: 11, correo: 'otro@alumno.ipn.mx' })],
    solicitudesRegistro: [solicitudRegistro(), solicitudRegistro({ id: 2, boleta: '2022630002', ofertaId: 1 })],
    bajas: [
      baja({ id: 1, solicitanteId: U_PROFESOR }),
      baja({ id: 2, boleta: '2022630002', solicitanteId: 11, documentoId: 1 }),
    ],
    documentos: [documento({ id: 1, boleta: '2022630002', creadorId: 11 })],
  });

  const { pendientes, totales } = await servicio.listarSolicitudes();

  assert.equal(totales.pendientes, 2);
  assert.equal(pendientes.find((s) => s.id === 1).origen, 'profesor');
  assert.equal(pendientes.find((s) => s.id === 2).origen, 'alumno');
  assert.equal(pendientes.find((s) => s.id === 1).tieneExpediente, false);
  assert.equal(pendientes.find((s) => s.id === 2).tieneExpediente, true);
  // `enRevisionInstitucional` ya NO se deriva del estado del documento: ahora refleja el estado REAL
  // de la solicitud, así que dos 'pendiente' son ambas false.
  assert.equal(pendientes.find((s) => s.id === 2).enRevisionInstitucional, false);
  assert.equal(pendientes.find((s) => s.id === 1).enRevisionInstitucional, false);
  // Y las acciones que Coordinación puede ofrecer salen del backend, no de la pantalla.
  assert.equal(pendientes.find((s) => s.id === 1).puedeEnviarARevision, false, 'sin expediente no se turna');
  assert.equal(pendientes.find((s) => s.id === 2).puedeEnviarARevision, true);
  assert.equal(pendientes.find((s) => s.id === 2).puedeAprobarse, false, 'aprobar exige en_revision');
});

test('ADM-12: pendientes y resueltas se separan', async () => {
  montar({
    bajas: [
      baja({ id: 1, solicitanteId: U_PROFESOR, estado: 'rechazada', fechaRespuesta: new Date('2026-09-21') }),
      baja({ id: 2, solicitanteId: U_PROFESOR, estado: 'pendiente' }),
    ],
  });

  const { pendientes, resueltas } = await servicio.listarSolicitudes();
  assert.deepEqual(pendientes.map((s) => s.id), [2]);
  assert.deepEqual(resueltas.map((s) => s.id), [1]);
  assert.equal(resueltas[0].puedeResolverse, false);
});

// ── ADM-11: una baja EN REVISIÓN sigue siendo la solicitud activa ───────────
//
// Mirar solo 'pendiente' dejaba una baja ya turnada fuera de `solicitudPendiente`, y la pantalla
// volvía a ofrecer el formulario para solicitar OTRA baja.

test('ADM-11: una baja en_revision se devuelve como solicitud ACTIVA', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });

  const r = await servicio.consultarMiSolicitud({ usuarioId: U_ALUMNO });

  assert.ok(r.solicitudPendiente, 'sin esto la pantalla mostraría el formulario de nuevo');
  assert.equal(r.solicitudPendiente.estado, 'en_revision');
  assert.equal(r.solicitudPendiente.etapa, 'en_revision_autoridades', 'la etapa la deriva el backend');
  assert.equal(r.solicitudPendiente.requiereExpedienteDelAlumno, false, 'no hay nada que hacer');
});

test('ADM-11: la vista del alumno trae la ETAPA en cada estado activo', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });
  let r = await servicio.consultarMiSolicitud({ usuarioId: U_ALUMNO });
  assert.equal(r.solicitudPendiente.etapa, 'pendiente_coordinacion');

  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  r = await servicio.consultarMiSolicitud({ usuarioId: U_ALUMNO });
  assert.equal(r.solicitudPendiente.etapa, 'pendiente_expediente');
  assert.equal(r.solicitudPendiente.requiereExpedienteDelAlumno, true, 'este caso SÍ pide acción');
});

test('ADM-11: una baja ya resuelta NO es la solicitud activa, solo historial', async () => {
  montar({
    bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1, estado: 'rechazada', fechaRespuesta: new Date() })],
    documentos: [documento({ id: 1 })],
  });

  const r = await servicio.consultarMiSolicitud({ usuarioId: U_ALUMNO });

  assert.equal(r.solicitudPendiente, null, 'puede volver a solicitar la baja');
  assert.deepEqual(r.historial.map((h) => h.estado), ['rechazada']);
  assert.equal(r.historial[0].etapa, 'rechazada');
});

test('ADM-11: con una baja en revisión NO se puede abrir otra', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });

  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'otra', archivoPdf: pdf() }),
    (err) => err.status === 409 && err.code === 'BAJA_PENDIENTE_EXISTENTE',
  );
});

// ── Máquina de estados: pendiente → en_revision → aprobada|rechazada ────────
//
// 'pendiente → aprobada' NO existe: Coordinación primero revisa el expediente a mano y lo turna a
// las autoridades. Estas pruebas vigilan exactamente eso.

test('en revisión: pendiente CON expediente se turna a las autoridades', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const r = await servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'en_revision');
  assert.equal(bajaEnBd().estado, 'en_revision');
  assert.equal(bajaEnBd().coordinador_id, 1, 'queda quién la turnó');
  assert.equal(r.puedeAprobarse, true, 'ahora sí puede aprobarse');
  assert.equal(r.puedeEnviarARevision, false, 'y ya no puede volver a turnarse');
  assert.equal(r.enRevisionInstitucional, true);
});

test('en revisión: pendiente SIN expediente NO se puede turnar', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await assert.rejects(
    servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
    (err) => err.status === 409 && err.code === 'EXPEDIENTE_REQUERIDO',
  );
  assert.equal(bajaEnBd().estado, 'pendiente', 'sigue pendiente');
  assert.equal(bd.notificaciones.length, 0, 'y no se avisó a nadie');
});

test('en revisión: crea notificación PERSISTENTE al alumno y emite por WebSocket', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  await servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const suya = bd.notificaciones.filter((n) => n.usuario_id === U_ALUMNO);
  assert.equal(suya.length, 1);
  assert.equal(suya[0].mensaje, 'Tu solicitud de baja está en revisión por las autoridades correspondientes.');
  assert.equal(suya[0].tipo, 'info');
  assert.equal(suya[0].ruta_relacionada, '/alumno/solicitar-baja');
  assert.deepEqual(
    emitidos.filter((e) => e.evento === 'baja:en_revision'),
    [{ usuarioId: U_ALUMNO, evento: 'baja:en_revision', datos: { solicitudId: 1 } }],
  );
});

test('en revisión: repetir la operación no duplica la notificación', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  await servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  await assert.rejects(
    servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_2 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );

  assert.equal(bd.notificaciones.filter((n) => n.usuario_id === U_ALUMNO).length, 1);
});

test('máquina de estados: pendiente NO se puede aprobar directamente', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
    (err) => err.status === 409 && err.code === 'REQUIERE_EN_REVISION',
  );

  // Nada de la baja definitiva se ejecutó.
  assert.equal(bajaEnBd().estado, 'pendiente');
  assert.equal(srEnBd().estado_solicitud, 'alumno_asignado');
  assert.equal(usuarioEnBd().rol, 'alumno_asignado');
  assert.equal(ofertaEnBd().cupos_disponibles, 1, 'no se liberó cupo');
  assert.equal(bd.bitacoras.length, 2, 'no se borró avance');
});

test('máquina de estados: pendiente SÍ se puede rechazar', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const r = await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'PDF ilegible.' });

  assert.equal(r.estado, 'rechazada');
  assert.equal(bd.documentos[0].estado_documento, 'rechazada');
  assert.equal(srEnBd().estado_solicitud, 'alumno_asignado', 'su servicio sigue intacto');
});

test('máquina de estados: en_revision SÍ se puede rechazar', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });

  const r = await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Las autoridades lo negaron.' });

  assert.equal(r.estado, 'rechazada');
  assert.equal(srEnBd().estado_solicitud, 'alumno_asignado', 'no se ejecuta ninguna baja');
  assert.equal(usuarioEnBd().rol, 'alumno_asignado');
});

test('máquina de estados: los estados finales son terminales', async () => {
  for (const estado of ['aprobada', 'rechazada']) {
    montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1, estado, fechaRespuesta: new Date() })], documentos: [documento({ id: 1 })] });

    for (const operacion of [
      () => servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
      () => servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
      () => servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'x' }),
    ]) {
      await assert.rejects(operacion, (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
        `${estado} no debe aceptar más transiciones`);
    }
    assert.equal(bajaEnBd().estado, estado, `${estado} no cambió`);
  }
});

// ── El alumno completa la baja que pidió su profesor ────────────────────────

test('ADM-09: el ALUMNO es notificado cuando su profesor solicita su baja', async () => {
  await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'Faltas reiteradas.' });

  const suya = bd.notificaciones.filter((n) => n.usuario_id === U_ALUMNO);
  assert.equal(suya.length, 1);
  assert.equal(suya[0].tipo, 'urgente');
  assert.match(suya[0].mensaje, /solicitó tu baja/i);
  assert.match(suya[0].mensaje, /completar el expediente/i);
  assert.equal(suya[0].ruta_relacionada, '/alumno/solicitar-baja', 'lo lleva a su pantalla de baja');
  assert.ok(emitidos.some((e) => e.evento === 'baja:solicitada_por_profesor' && e.usuarioId === U_ALUMNO));
});

test('ADM-09: la solicitud del profesor nace pendiente y SIN expediente', async () => {
  const creada = await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'Faltas reiteradas.' });

  assert.equal(creada.estado, 'pendiente');
  assert.equal(creada.origen, 'profesor');
  assert.equal(creada.tieneExpediente, false);
  assert.equal(creada.requiereExpedienteDelAlumno, true, 'el alumno debe completarla');
  assert.equal(bd.documentos.length, 0);
});

test('completar: el alumno adjunta su expediente a LA MISMA solicitud del profesor', async () => {
  montar({ bajas: [baja({ id: 7, solicitanteId: U_PROFESOR, motivo: 'Faltas reiteradas.', fecha: new Date('2026-09-01T10:00:00Z') })] });

  const r = await servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() });

  assert.equal(bd.bajas.length, 1, 'NO se creó una segunda solicitud');
  const fila = bajaEnBd(7);
  assert.equal(fila.id, 7, 'se conserva el id');
  assert.equal(fila.solicitante_id, U_PROFESOR, 'se conserva el origen');
  assert.equal(fila.motivo, 'Faltas reiteradas.', 'se conserva el motivo del profesor');
  assert.equal(fila.fecha.toISOString(), '2026-09-01T10:00:00.000Z', 'se conserva la trazabilidad');
  assert.equal(fila.estado, 'pendiente', 'sigue pendiente: turnarla es decisión de Coordinación');
  assert.equal(fila.documento_id, bd.documentos[0].id);

  assert.equal(r.tieneExpediente, true);
  assert.equal(r.origen, 'profesor');
  assert.equal(r.requiereExpedienteDelAlumno, false, 'ya no falta nada de su parte');

  const doc = bd.documentos[0];
  assert.equal(doc.tipo_documento, 'expediente_baja');
  assert.equal(doc.estado_documento, 'en_revision');
  assert.equal(doc.creador_id, U_ALUMNO, 'lo aportó el alumno');
  assert.equal(doc.ruta_archivo.startsWith(`${BOLETA}${path.sep}`), true);
  assert.equal(fsFalso.escritos.length, 1, 'se escribió cifrado');
});

test('completar: una vez adjunto, Coordinación ya puede turnarla', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() });
  const r = await servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'en_revision');
  assert.equal(r.origen, 'profesor', 'el origen sobrevive a todo el recorrido');
});

test('completar: el alumno NO puede crear una segunda solicitud, se le dirige a completar', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'la mía', archivoPdf: pdf() }),
    (err) => err.status === 409 && err.code === 'COMPLETA_LA_BAJA_DEL_PROFESOR',
  );
  assert.equal(bd.bajas.length, 1);
  assert.equal(fsFalso.escritos.length, 0, 'no se escribió ningún archivo');
});

test('completar: otro alumno no puede adjuntar el expediente de esta solicitud', async () => {
  montar({
    usuarios: [...bd.usuarios, usuario({ id: 11, correo: 'otro@alumno.ipn.mx' })],
    alumnos: [alumno(), alumno({ boleta: '2022630002', usuarioId: 11 })],
    bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })],
  });

  // La solicitud se deriva del TOKEN: el otro alumno no tiene ninguna pendiente y no puede nombrarla.
  await assert.rejects(
    servicio.completarExpedienteDeBaja({ usuarioId: 11, archivoPdf: pdf() }),
    (err) => err.status === 404 && err.code === 'SIN_BAJA_PENDIENTE',
  );
  assert.equal(bajaEnBd().documento_id, null, 'la solicitud ajena queda intacta');
  assert.equal(bd.documentos.length, 0);
});

test('completar: no se puede adjuntar cuando la solicitud salió de pendiente', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, estado: 'en_revision', documentoId: null })] });

  await assert.rejects(
    servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() }),
    (err) => err.status === 404 && err.code === 'SIN_BAJA_PENDIENTE',
  );
  assert.equal(fsFalso.escritos.length, 0);
});

test('completar: un expediente ya asociado NO se sustituye', async () => {
  montar({
    bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, documentoId: 1 })],
    documentos: [documento({ id: 1, ruta: `${BOLETA}/original.enc` })],
  });

  await assert.rejects(
    servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() }),
    (err) => err.status === 409 && err.code === 'EXPEDIENTE_YA_ADJUNTO',
  );
  assert.equal(bajaEnBd().documento_id, 1, 'sigue apuntando al original');
  assert.equal(bd.documentos.length, 1);
  assert.equal(fsFalso.escritos.length, 0);
});

test('completar: su propia solicitud no se "completa" (ya trae expediente)', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: null })] });

  await assert.rejects(
    servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() }),
    (err) => err.status === 409 && err.code === 'BAJA_PROPIA',
  );
});

test('completar: sin PDF no se toca nada', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await assert.rejects(
    servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: null }),
    (err) => err.status === 400 && err.code === 'EXPEDIENTE_REQUERIDO',
  );
  assert.equal(bajaEnBd().documento_id, null);
});

// ── Aprobación ──
//
// Una baja aprobada CANCELA el servicio social y devuelve al alumno al flujo de CU-GR-13.
// Ya NO borra su cuenta: eso es justo lo que estas pruebas vigilan.

test('ADM-12 aprobar: conserva usuario, alumno y la MISMA solicitud_registro', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  const idSolicitudAntes = srEnBd().id;

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.ok(usuarioEnBd(), 'el usuario sobrevive');
  assert.equal(bd.alumnos.length, 1, 'el alumno sobrevive');
  assert.equal(bd.alumnos[0].boleta, BOLETA, 'con su misma boleta');
  assert.equal(bd.solicitudesRegistro.length, 1, 'la solicitud_registro sobrevive');
  assert.equal(srEnBd().id, idSolicitudAntes, 'es la MISMA fila, no una nueva');
  assert.equal(escriturasA('usuario').some((e) => e.operacion === 'delete'), false, 'nadie borró al usuario');
});

test('ADM-12 aprobar: el rol vuelve a alumno_sin_asignar', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  assert.equal(usuarioEnBd().rol, 'alumno_asignado');

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(usuarioEnBd().rol, 'alumno_sin_asignar', 'sin esto no puede entrar a CU-GR-13');
});

test('ADM-12 aprobar: la solicitud queda en el estado REAL de CU-GR-13, sin simular un rechazo', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR, motivo: 'Cambio de residencia.' })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const sr = srEnBd();
  assert.equal(sr.estado_solicitud, 'modificar_reenviar',
    'entra DIRECTO a GR-13: no pasa por rechazada_definitivamente');
  assert.equal(sr.estado_anterior, 'alumno_asignado', 'marcador de origen del que GR-13 deriva origenBaja');
  // Una baja NO es un rechazo del proceso de registro.
  assert.equal(sr.tipo_rechazo, null);
  assert.equal(sr.motivo_rechazo, null);
});

test('ADM-12 aprobar: el motivo de la baja vive SOLO en solicitud_baja', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR, motivo: 'Cambio de residencia.' })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Procede.' });

  // Fuente de verdad histórica: la solicitud de baja.
  assert.equal(bajaEnBd().motivo, 'Cambio de residencia.');
  assert.equal(bajaEnBd().comentario, 'Procede.');
  // Y NO se copia ni se reinterpreta como motivo de rechazo del registro.
  assert.equal(srEnBd().motivo_rechazo, null);
  assert.equal(srEnBd().tipo_rechazo, null);
});

test('ADM-12 aprobar: la oferta anterior queda desligada y sin rastros de su avance previo', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const sr = srEnBd();
  assert.equal(sr.oferta_id, null, 'desligada de la oferta abandonada');
  assert.equal(sr.motivacion_oferta, null);
  assert.equal(sr.periodo_registro_id, null, 'y fuera del alcance de los relojes de vencimiento');
  assert.equal(sr.registro_siss, false);
  assert.equal(sr.docs_iniciales, false);
  assert.equal(sr.carta_compromiso, false);
  assert.equal(sr.fecha_carta_compromiso, null);
  assert.equal(sr.expediente, false);
});

test('ADM-12 aprobar: elimina TODO el avance del servicio anterior', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(bd.bitacoras.length, 0, 'bitácoras');
  assert.equal(bd.actividades.length, 0, 'actividades');
  assert.equal(bd.registrosBitacora.length, 0, 'registro_bitacora_actividades');
  assert.equal(bd.reportes.length, 0, 'reportes mensuales');
  assert.equal(bd.reportesGlobales.length, 0, 'reporte global');
  assert.equal(bd.revisionesMensuales.length, 0, 'revisiones de los reportes mensuales');
  assert.equal(bd.revisionesGlobales.length, 0, 'revisiones del reporte global');
  assert.equal(bd.liberaciones.length, 0, 'liberacion_proceso');
  assert.equal(bd.evaluaciones.length, 0, 'evaluacion_desempeno');
  assert.equal(bd.revisionesDesempeno.length, 0, 'revision_desempeno');
  assert.equal(bd.cartasTermino.length, 0, 'carta_termino');
});

test('ADM-12 aprobar: borra las revisiones ANTES que sus reportes', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const orden = bd.escrituras.filter((e) => e.operacion === 'deleteMany').map((e) => e.modelo);
  assert.ok(orden.indexOf('revision_reporte_mensual') < orden.indexOf('reporte_mensual'));
  assert.ok(orden.indexOf('revision_reporte_global') < orden.indexOf('reporte_global'));
  // Y los reportes antes que los documentos: reporte_*.documento_id tiene cascada hacia documento,
  // así que borrar documentos primero se llevaría los reportes en silencio.
  assert.ok(orden.indexOf('reporte_mensual') < orden.indexOf('documento'));
});

test('ADM-12 aprobar: reinicia el cúmulo de horas y faltas sin borrar la fila', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  assert.equal(bd.cumulos[0].horas_acumuladas, 40);

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(bd.cumulos.length, 1, 'la fila se conserva (AH la crea con upsert perezoso)');
  assert.deepEqual(
    {
      horas_acumuladas: bd.cumulos[0].horas_acumuladas,
      horas_rechazadas: bd.cumulos[0].horas_rechazadas,
      faltas_acumuladas: bd.cumulos[0].faltas_acumuladas,
      faltas_consecutivas: bd.cumulos[0].faltas_consecutivas,
      fecha_ultima_evaluacion_faltas: bd.cumulos[0].fecha_ultima_evaluacion_faltas,
    },
    { horas_acumuladas: 0, horas_rechazadas: 0, faltas_acumuladas: 0, faltas_consecutivas: 0, fecha_ultima_evaluacion_faltas: null },
  );
});

test('ADM-12 aprobar: la solicitud_baja aprobada SOBREVIVE como historial', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Procede.' });

  assert.equal(bd.bajas.length, 1, 'ya no desaparece con el usuario');
  assert.equal(bd.bajas[0].estado, 'aprobada');
  assert.equal(bd.bajas[0].comentario, 'Procede.');
  assert.equal(bd.bajas[0].coordinador_id, 1, 'queda registrado quién resolvió');
  assert.ok(bd.bajas[0].fecha_respuesta instanceof Date);
});

test('ADM-12 aprobar: el expediente_baja sobrevive en BD y en disco, aprobado', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: DOCS_DEL_SERVICIO });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.deepEqual(bd.documentos.map((d) => d.id), [1], 'solo queda el expediente de la baja');
  assert.equal(bd.documentos[0].tipo_documento, 'expediente_baja');
  assert.equal(bd.documentos[0].estado_documento, 'aprobada');
  assert.equal(bd.bajas[0].documento_id, 1, 'la baja conserva su evidencia');

  const rutas = fsFalso.borradas.map((b) => b.ruta);
  assert.equal(rutas.some((r) => r.includes('baja.enc')), false, 'su archivo NO se borra');
});

test('ADM-12 aprobar: borra selectivamente los archivos del servicio, nunca la carpeta completa', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: DOCS_DEL_SERVICIO });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const carpetaAlumno = path.join(servicio.RUTA_BASE_DOCUMENTOS, BOLETA);
  const recursivos = fsFalso.borradas.filter((b) => b.opciones?.recursive).map((b) => b.ruta);

  assert.equal(recursivos.includes(carpetaAlumno), false, 'la carpeta <boleta>/ NUNCA se borra');
  for (const sub of ['Reportes', 'Rubrica', 'CartaCompromisoFirmada']) {
    assert.ok(recursivos.includes(path.join(carpetaAlumno, sub)), `se borra la subcarpeta ${sub}`);
  }
  // Y los archivos sueltos de los documentos eliminados (los de GR viven en la raíz de <boleta>/).
  const unlinks = fsFalso.borradas.filter((b) => b.unlink).map((b) => b.ruta);
  assert.ok(unlinks.some((u) => u.endsWith('creditos.enc')));
  assert.equal(unlinks.some((u) => u.endsWith('baja.enc')), false);
  assert.ok(r.archivosEliminados > 0);
  // Nunca se sale de la carpeta del alumno.
  for (const ruta of fsFalso.borradas.map((b) => b.ruta)) {
    assert.equal(ruta.includes('profesores'), false);
    assert.equal(ruta.includes('coordinador'), false);
  }
});

test('ADM-12 aprobar: limpia la rúbrica junto con su archivo', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  usuarioEnBd().rubrica_imagen = `${BOLETA}/Rubrica/rubrica.enc`;
  usuarioEnBd().rubrica_ip = '10.0.0.1';
  usuarioEnBd().rubrica_fecha_registro = new Date();

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  // Si la ruta sobreviviera al borrado del archivo, obtenerRubricaAlumno daría un 500 en el
  // servicio siguiente en vez de pedirla otra vez.
  assert.equal(usuarioEnBd().rubrica_imagen, null);
  assert.equal(usuarioEnBd().rubrica_ip, null);
  assert.equal(usuarioEnBd().rubrica_fecha_registro, null);
});

test('ADM-12 aprobar: devuelve exactamente 1 cupo si la oferta está aprobada', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  assert.equal(ofertaEnBd().cupos_disponibles, 1);

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.cupoLiberado, true);
  assert.equal(ofertaEnBd().cupos_disponibles, 2, 'exactamente +1');
  assert.equal(bd.profesores[0].cupos_totales, 3, 'cupos_totales del profesor INTACTO');
});

test('ADM-12 aprobar: el alumno deja de ocupar cupo del PROFESOR por su nuevo estado', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  const { contarCuposOcupados } = require('../../../lib/cupos');
  assert.equal(await contarCuposOcupados(1), 1);

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  // 'rechazada_definitivamente' no está en ESTADOS_QUE_OCUPAN_CUPO_PROFESOR: se libera sin tocar nada.
  assert.equal(await contarCuposOcupados(1), 0);
});

for (const estado of ['cerrada', 'concluida', 'rechazada', 'pendiente_revision']) {
  test(`ADM-12 aprobar: NO devuelve cupo si la oferta está ${estado}`, async () => {
    montar({ ofertas: [oferta({ estado })], bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

    const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

    assert.equal(r.cupoLiberado, false);
    assert.equal(ofertaEnBd().cupos_disponibles, 1, 'cupos_disponibles sin cambio');
    assert.equal(ofertaEnBd().estado_oferta, estado, 'la oferta no cambia de estado');
    assert.equal(srEnBd().estado_solicitud, 'modificar_reenviar', 'la baja sí se ejecuta');
  });
}

test('ADM-12 aprobar: el expediente de la baja pasa a aprobada dentro de la transacción', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const update = escriturasA('documento').find((e) => e.operacion === 'update');
  assert.equal(update.data.estado_documento, 'aprobada');
  assert.equal(bd.documentos.length, 1, 'y la fila permanece consultable');
});

test('ADM-12 aprobar: un fallo del filesystem NO revierte la baja', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });
  fsFalso.fallarBorrado = true;

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.equal(srEnBd().estado_solicitud, 'modificar_reenviar', 'la baja quedó hecha');
});

test('ADM-12 aprobar: ya NO se manda ningún correo en el proceso de baja', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  // La comunicación del proceso vive en estados y notificaciones persistentes, no en el correo.
  assert.deepEqual(correos, [], 'el flujo de bajas no toca el mailer');
  assert.ok(bd.notificaciones.some((n) => n.usuario_id === U_ALUMNO), 'se le avisa dentro del sistema');
});

test('los demás mecanismos de correo siguen intactos', async () => {
  // Se carga el mailer REAL (el doble solo vive en el require.cache de este proceso de prueba).
  const real = require.cache[rutaMailer];
  delete require.cache[rutaMailer];
  try {
    const mailer = require('../../../lib/mailer');
    assert.equal(typeof mailer.enviarCorreoBienvenida, 'function', 'bienvenida intacto');
    assert.equal(typeof mailer.enviarCorreoRecuperacion, 'function', 'recuperación intacto');
    assert.equal('enviarCorreoBajaAprobada' in mailer, false, 'el de bajas ya no existe');
  } finally {
    require.cache[rutaMailer] = real;
  }
});

test('ADM-12 aprobar: el ALUMNO sí recibe notificación, además del profesor y Coordinación', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const suya = bd.notificaciones.find((n) => n.usuario_id === U_ALUMNO);
  assert.ok(suya, 'su usuario ya no desaparece, así que ahora sí se le notifica');
  assert.match(suya.mensaje, /cuenta se conserva/i);

  const destinatarios = new Set(bd.notificaciones.map((n) => n.usuario_id));
  assert.equal(destinatarios.has(U_PROFESOR), true);
  assert.equal(destinatarios.has(U_COORD_1), true);
  assert.equal(destinatarios.has(U_COORD_2), true);
});

test('ADM-12 aprobar: toma el lock del profesor ANTES de cualquier escritura', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(bd.locks.length, 1);
  assert.equal(bd.locks[0].profesorId, 1);
  assert.equal(bd.locks[0].escriturasPrevias, 0, 'el lock es la primera sentencia de la transacción');
});

test('ADM-12 aprobar: doble aprobación → 409 y un solo incremento de cupo', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  assert.equal(ofertaEnBd().cupos_disponibles, 2);

  // La fila ahora SOBREVIVE, así que el segundo coordinador ve que ya está resuelta.
  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_2 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
  assert.equal(ofertaEnBd().cupos_disponibles, 2, 'no se liberó un segundo cupo');
  assert.equal(escriturasA('cumulo_horas_y_faltas').length, 1, 'ni se reinició dos veces el cúmulo');
});

test('ADM-12 aprobar: una solicitud ya resuelta no se aprueba otra vez', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, estado: 'rechazada', fechaRespuesta: new Date() })] });

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
  assert.equal(srEnBd().estado_solicitud, 'alumno_asignado', 'el servicio sigue intacto');
  assert.equal(bd.bitacoras.length, 2, 'y su avance también');
});

test('ADM-12 aprobar: si la solicitud ya no ocupaba cupo, no libera nada pero sí cancela', async () => {
  montar({
    solicitudesRegistro: [solicitudRegistro({ estado: 'espera_respuesta_de_profesor' })],
    bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })],
  });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.cupoLiberado, false);
  assert.equal(ofertaEnBd().cupos_disponibles, 1);
  assert.equal(srEnBd().estado_solicitud, 'modificar_reenviar');
  assert.equal(srEnBd().estado_anterior, 'espera_respuesta_de_profesor', 'el estado real del que venía');
  assert.equal(bd.bitacoras.length, 0, 'el avance se elimina igual');
});

test('ADM-12 aprobar: un alumno sin solicitud_registro no revienta ni libera cupo', async () => {
  montar({ solicitudesRegistro: [], bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })] });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.equal(r.cupoLiberado, false);
  assert.equal(usuarioEnBd().rol, 'alumno_sin_asignar', 'el rol se revierte igual');
});

// ── Integración con CU-GR-13 ────────────────────────────────────────────────
//
// El objetivo de toda la corrección: que tras la baja el alumno pueda volver al flujo de modificar
// solicitud. Se ejercita el CÓDIGO REAL de gr.service.js, no una imitación, para que la prueba falle
// si GR cambia el estado que exige para entrar.

const gr = require('../../gr/gr.service');

test('integración: baja aprobada → CU-GR-13 → nueva oferta → espera_respuesta_de_profesor', async () => {
  montar({
    bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO, motivo: 'Motivo suficiente.' })],
    documentos: DOCS_DEL_SERVICIO,
    // Una segunda oferta, de OTRO profesor, a la que postularse después de la baja.
    ofertas: [oferta(), oferta({ id: 2, profesorId: 2, disponibles: 3 })],
  });

  // 1) Coordinación aprueba la baja. La solicitud queda YA en el estado de GR-13: el alumno no tiene
  //    que pulsar "Modificar solicitud y reenviar" ni ver una pantalla de rechazo.
  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  assert.equal(srEnBd().estado_solicitud, 'modificar_reenviar');
  assert.equal(usuarioEnBd().rol, 'alumno_sin_asignar');

  // 2) GR-13 precarga sus datos base, que la baja conservó, y reconoce el ORIGEN de la baja.
  const info = await gr.obtenerInfoModificarSolicitud(U_ALUMNO);
  assert.equal(info.boleta, BOLETA);
  assert.equal(info.carrera, 'ISC');
  assert.equal(info.correoInst, 'ana.torres@alumno.ipn.mx');
  assert.equal(info.origenBaja, true, 'la pantalla explica la baja, no un rechazo');

  // 3) Reenvía eligiendo la oferta NUEVA.
  const reenvio = await gr.reenviarSolicitudModificada(U_ALUMNO, {
    nombres: 'Ana', apellidos: 'Torres Vega', telefono: '5512345678', boleta: BOLETA,
    correoPersonal: null, carrera: 'Ingeniería en Sistemas Computacionales',
    // `creditos` es un PORCENTAJE de avance, no horas: el dictamen por créditos exige 60-70%.
    creditos: 65, semestre: 8, tipoLiberacion: 'creditos',
    periodo: 1, oferta: 2, motivacion: 'Quiero participar en este nuevo proyecto de la escuela.',
  });

  assert.equal(reenvio.estado_solicitud, 'espera_respuesta_de_profesor');
  assert.equal(srEnBd().oferta_id, 2, 'quedó postulado a la oferta nueva');
  assert.equal(srEnBd().estado_anterior, 'modificar_reenviar');
  assert.equal(srEnBd().motivo_rechazo, null);
  assert.equal(srEnBd().tipo_rechazo, null);
  assert.equal(srEnBd().id, 1, 'siempre fue la MISMA solicitud_registro');
  // La baja aprobada sigue siendo la fuente de verdad histórica del proceso.
  assert.equal(bajaEnBd().estado, 'aprobada');
  assert.ok(bajaEnBd().motivo, 'con su motivo intacto');

  // 4) El cupo de la oferta nueva NO se consume aquí: lo consume el profesor al aceptar (CU-GR-02).
  assert.equal(ofertaEnBd(2).cupos_disponibles, 3);
  // Y el lugar devuelto a la oferta anterior sigue devuelto.
  assert.equal(ofertaEnBd(1).cupos_disponibles, 2);
});

test('integración: sin la baja, CU-GR-13 NO deja entrar a un alumno asignado', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO })] });

  // Control del test anterior: lo que abre la puerta de GR-13 es la baja, no el paso del tiempo.
  await assert.rejects(gr.obtenerInfoModificarSolicitud(U_ALUMNO), (err) => err.status === 409);
  await assert.rejects(gr.iniciarModificarSolicitud(U_ALUMNO), (err) => err.status === 409);
});

// ── REGRESIÓN: baja aprobada vs. rechazo definitivo de GR ───────────────────
//
// Los dos caminos terminan en 'modificar_reenviar', pero por rutas distintas y con semántica
// distinta. Estas pruebas existen para que no vuelvan a mezclarse: una baja NO debe presentarse como
// un rechazo del proceso de registro, y un rechazo real debe seguir comportándose como siempre.

test('regresión BAJA: deja modificar_reenviar sin tipo_rechazo ni motivo_rechazo, y origenBaja true', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO, motivo: 'Motivo de la baja.' })], documentos: [documento({ id: 1 })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const sr = srEnBd();
  assert.equal(sr.estado_solicitud, 'modificar_reenviar');
  assert.equal(sr.estado_anterior, 'alumno_asignado');
  assert.equal(sr.tipo_rechazo, null);
  assert.equal(sr.motivo_rechazo, null);

  // Nunca pasó por el estado de rechazo: no hay pantalla de "Solicitud rechazada definitivamente".
  const escrituras = escriturasA('solicitud_registro').flatMap((e) => Object.values(e.data ?? {}));
  assert.equal(escrituras.includes('rechazada_definitivamente'), false,
    'la baja no debe escribir el estado de rechazo en ningún momento');

  const info = await gr.obtenerInfoModificarSolicitud(U_ALUMNO);
  assert.equal(info.origenBaja, true);
});

test('regresión RECHAZO de GR: conserva rechazada_definitivamente con su motivo, y origenBaja false', async () => {
  // Rechazo definitivo REAL de GR, escrito por su propio flujo (no por bajas).
  montar();
  srEnBd().estado_solicitud = 'rechazada_definitivamente';
  srEnBd().estado_anterior = 'SISS_y_documentacion_pendiente';
  srEnBd().tipo_rechazo = 'definitivo';
  srEnBd().motivo_rechazo = 'Documentación incompleta.';
  bd.usuarios.find((u) => u.id === U_ALUMNO).rol = 'alumno_sin_asignar';

  // Sigue exigiendo el botón "Modificar solicitud y reenviar": su flujo NO cambió.
  const inicio = await gr.iniciarModificarSolicitud(U_ALUMNO);
  assert.equal(inicio.estado_solicitud, 'modificar_reenviar');
  assert.equal(srEnBd().estado_anterior, 'rechazada_definitivamente', 'otro origen, otro marcador');
  assert.equal(srEnBd().motivo_rechazo, 'Documentación incompleta.',
    'GR conserva el motivo hasta que el alumno reenvía');

  const info = await gr.obtenerInfoModificarSolicitud(U_ALUMNO);
  assert.equal(info.origenBaja, false, 'un rechazo NO debe presentarse como una baja');
});

test('regresión: los dos caminos llegan al MISMO estado por marcadores de origen distintos', async () => {
  // Camino A — baja aprobada.
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });
  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  const porBaja = { ...srEnBd(), origenBaja: (await gr.obtenerInfoModificarSolicitud(U_ALUMNO)).origenBaja };

  // Camino B — rechazo definitivo de GR.
  montar();
  srEnBd().estado_solicitud = 'rechazada_definitivamente';
  srEnBd().estado_anterior = 'registro_SISS';
  srEnBd().tipo_rechazo = 'definitivo';
  srEnBd().motivo_rechazo = 'Plazo vencido.';
  await gr.iniciarModificarSolicitud(U_ALUMNO);
  const porRechazo = { ...srEnBd(), origenBaja: (await gr.obtenerInfoModificarSolicitud(U_ALUMNO)).origenBaja };

  assert.equal(porBaja.estado_solicitud, porRechazo.estado_solicitud, 'el mismo estado de GR-13');
  assert.notEqual(porBaja.estado_anterior, porRechazo.estado_anterior, 'pero distinto origen');
  assert.equal(porBaja.origenBaja, true);
  assert.equal(porRechazo.origenBaja, false);
  assert.equal(porBaja.motivo_rechazo, null, 'la baja no deja motivo de rechazo');
  assert.equal(porRechazo.motivo_rechazo, 'Plazo vencido.', 'el rechazo sí lo conserva');
});

// ── Rechazo ──

test('ADM-12 rechazar: marca rechazada, guarda comentario y NO borra nada', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const r = await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Expediente incompleto.' });

  assert.equal(r.estado, 'rechazada');
  assert.equal(bd.bajas[0].comentario, 'Expediente incompleto.');
  assert.equal(bd.bajas[0].coordinador_id, 1);
  assert.ok(bd.bajas[0].fecha_respuesta instanceof Date);
  assert.equal(bd.documentos[0].estado_documento, 'rechazada');
  // Nada se borró.
  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO) !== undefined, true);
  assert.equal(bd.solicitudesRegistro.length, 1);
  assert.equal(bd.bitacoras.length, 2);
  assert.equal(ofertaEnBd().cupos_disponibles, 1, 'el cupo sigue ocupado');
  assert.deepEqual(fsFalso.borradas, [], 'no se tocó el filesystem');
});

test('ADM-12 rechazar: comentario obligatorio', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  for (const comentario of ['', '   ', undefined]) {
    await assert.rejects(
      servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario }),
      (err) => err.status === 400 && /motivo del rechazo/i.test(err.message),
    );
  }
  assert.equal(bd.bajas[0].estado, 'pendiente');
});

test('ADM-12 rechazar: notifica al solicitante correcto', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'No procede.' });
  assert.equal(bd.notificaciones.at(-1).usuario_id, U_PROFESOR);

  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO })] });
  await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Faltan documentos.' });
  assert.equal(bd.notificaciones.at(-1).usuario_id, U_ALUMNO);
  assert.match(bd.notificaciones.at(-1).mensaje, /Faltan documentos\./);
});

test('ADM-12 rechazar: una ya resuelta no se rechaza otra vez', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, estado: 'aprobada', fechaRespuesta: new Date() })] });

  await assert.rejects(
    servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'tarde' }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
});

test('ADM-12 rechazar: tras el rechazo el alumno puede volver a solicitar (fila NUEVA)', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  await servicio.rechazarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1, comentario: 'Incompleto.' });
  await servicio.solicitarBajaAlumno({ usuarioId: U_ALUMNO, motivo: 'Reintento.', archivoPdf: pdf() });

  assert.equal(bd.bajas.length, 2);
  assert.equal(bd.bajas[0].estado, 'rechazada', 'la anterior no se sobrescribe');
  assert.equal(bd.bajas[1].estado, 'pendiente');
});

// ── Notificaciones al crear ──

test('crear solicitud avisa a TODOS los coordinadores', async () => {
  await servicio.solicitarBajaProfesor({ usuarioId: U_PROFESOR, alumnoBoleta: BOLETA, motivo: 'x' });

  const coordinadores = bd.notificaciones.filter((n) => n.usuario_id !== U_ALUMNO);
  assert.deepEqual(coordinadores.map((n) => n.usuario_id).sort(), [U_COORD_1, U_COORD_2]);
  assert.match(coordinadores[0].ruta_relacionada, /^\/coordinacion\/gestionar-bajas\?destacar=/);
});

// ── CU-ADM-09: el profesor CONSULTA el seguimiento (solo lectura) ───────────

test('seguimiento: el profesor ve la etapa de la baja que él solicitó', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, motivo: 'Faltas reiteradas.' })] });

  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });
  const suyo = alumnos[0];

  assert.equal(suyo.tieneBajaPendiente, true);
  assert.equal(suyo.baja.etapa, 'pendiente_expediente', 'falta que el alumno adjunte el expediente');
  assert.equal(suyo.baja.estado, 'pendiente');
  assert.equal(suyo.baja.origen, 'profesor');
  assert.equal(suyo.baja.laSolicitasteTu, true);
  assert.equal(suyo.baja.motivo, 'Faltas reiteradas.', 'su propio texto sí se le devuelve');
  assert.equal(suyo.baja.tieneExpediente, false);
});

test('seguimiento: la etapa avanza conforme avanza el trámite', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.completarExpedienteDeBaja({ usuarioId: U_ALUMNO, archivoPdf: pdf() });
  let { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });
  assert.equal(alumnos[0].baja.etapa, 'pendiente_coordinacion', 'ya hay expediente');
  assert.equal(alumnos[0].baja.tieneExpediente, true);

  await servicio.marcarEnRevision({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  ({ alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR }));
  assert.equal(alumnos[0].baja.etapa, 'en_revision_autoridades');
});

test('seguimiento: NO se le expone el motivo de una baja que pidió el propio alumno', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1, motivo: 'Motivo privado del alumno.' })], documentos: [documento({ id: 1 })] });

  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });

  assert.equal(alumnos[0].baja.origen, 'alumno');
  assert.equal(alumnos[0].baja.laSolicitasteTu, false);
  assert.equal(alumnos[0].baja.motivo, null, 'el motivo del alumno es información suya');
  assert.equal(alumnos[0].baja.etapa, 'pendiente_coordinacion', 'la etapa sí la puede ver');
});

test('seguimiento: no se exponen datos internos de la solicitud', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });

  assert.deepEqual(Object.keys(alumnos[0].baja).sort(), [
    'comentario', 'estado', 'etapa', 'fecha', 'fechaRespuesta', 'id',
    'laSolicitasteTu', 'motivo', 'origen', 'tieneExpediente',
  ]);
  for (const prohibido of ['documento_id', 'documentoId', 'ruta_archivo', 'coordinador_id', 'solicitante_id']) {
    assert.equal(prohibido in alumnos[0].baja, false, `${prohibido} no debe salir`);
  }
});

test('seguimiento: sin baja en curso el alumno no trae seguimiento', async () => {
  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });

  assert.equal(alumnos[0].tieneBajaPendiente, false);
  assert.equal(alumnos[0].baja, null);
});

test('seguimiento: el comentario de Coordinación solo viaja cuando ya hay resolución', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, documentoId: 1, comentario: 'Nota interna.' })], documentos: [documento({ id: 1 })] });

  const { alumnos } = await servicio.listarMisAlumnos({ usuarioId: U_PROFESOR });
  assert.equal(alumnos[0].baja.comentario, null, 'todavía está activa');
});

// ── Resumen para el dashboard ───────────────────────────────────────────────

test('dashboard alumno: marca que debe completar el expediente de la baja de su profesor', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  const r = await servicio.resumenBajaDelAlumno({ usuarioId: U_ALUMNO });

  assert.equal(r.etapa, 'pendiente_expediente');
  assert.equal(r.origen, 'profesor');
  assert.equal(r.requiereExpediente, true, 'es la alerta que exige acción del alumno');
});

test('dashboard alumno: su propia baja NO le exige adjuntar nada', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const r = await servicio.resumenBajaDelAlumno({ usuarioId: U_ALUMNO });

  assert.equal(r.requiereExpediente, false);
  assert.equal(r.etapa, 'pendiente_coordinacion');
});

test('dashboard alumno: en revisión por las autoridades', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_ALUMNO })], documentos: [documento({ id: 1 })] });

  const r = await servicio.resumenBajaDelAlumno({ usuarioId: U_ALUMNO });
  assert.equal(r.etapa, 'en_revision_autoridades');
});

test('dashboard alumno: una baja RESUELTA ya no genera alerta de estado', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1, estado: 'rechazada', fechaRespuesta: new Date() })], documentos: [documento({ id: 1 })] });

  assert.equal(await servicio.resumenBajaDelAlumno({ usuarioId: U_ALUMNO }), null,
    'el evento ya viajó como notificación; el estado no debe insistir');
});

test('dashboard alumno: sin baja no hay resumen', async () => {
  assert.equal(await servicio.resumenBajaDelAlumno({ usuarioId: U_ALUMNO }), null);
});

test('dashboard profesor: cuenta las activas y las que esperan expediente', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  const r = await servicio.resumenBajasDelProfesor({ usuarioId: U_PROFESOR });

  assert.deepEqual(r, { activas: 1, propias: 1, esperandoExpediente: 1 });
});

test('dashboard profesor: una baja del propio alumno cuenta como activa pero no como suya', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  const r = await servicio.resumenBajasDelProfesor({ usuarioId: U_PROFESOR });

  assert.deepEqual(r, { activas: 1, propias: 0, esperandoExpediente: 0 });
});

test('dashboard profesor: no ve las bajas de alumnos que no supervisa', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  const r = await servicio.resumenBajasDelProfesor({ usuarioId: U_OTRO_PROF });
  assert.deepEqual(r, { activas: 0, propias: 0, esperandoExpediente: 0 });
});

test('dashboard coordinación: separa por turnar, sin expediente y en revisión', async () => {
  montar({
    usuarios: [...bd.usuarios, usuario({ id: 11, correo: 'otro@alumno.ipn.mx' }), usuario({ id: 12, correo: 'tres@alumno.ipn.mx' })],
    alumnos: [alumno(), alumno({ boleta: '2022630002', usuarioId: 11 }), alumno({ boleta: '2022630003', usuarioId: 12 })],
    bajas: [
      baja({ id: 1, solicitanteId: U_PROFESOR }),                                   // sin expediente
      baja({ id: 2, boleta: '2022630002', solicitanteId: 11, documentoId: 1 }),      // por turnar
      baja({ id: 3, boleta: '2022630003', solicitanteId: 12, documentoId: 2, estado: 'en_revision' }),
      baja({ id: 4, solicitanteId: U_PROFESOR, estado: 'rechazada', fechaRespuesta: new Date() }),
    ],
    documentos: [documento({ id: 1, boleta: '2022630002', creadorId: 11 }), documento({ id: 2, boleta: '2022630003', creadorId: 12 })],
  });

  const r = await servicio.resumenBajasDeCoordinacion();

  assert.deepEqual(r, { activas: 3, porTurnar: 1, enRevision: 1, sinExpediente: 1 },
    'la resuelta no cuenta como atención pendiente');
});

// ── Notificaciones: cada rol recibe una ruta que puede abrir ────────────────

test('notificaciones: al aprobar, el profesor recibe SU ruta y Coordinación la suya', async () => {
  montar({ bajas: [bajaEnRevision({ solicitanteId: U_PROFESOR })], documentos: [documento({ id: 1 })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const deProfesor = bd.notificaciones.find((n) => n.usuario_id === U_PROFESOR);
  assert.equal(deProfesor.ruta_relacionada, '/profesor/solicitar-baja-alumno',
    'no se le manda a la bandeja de Coordinación, donde no puede entrar');
  for (const coord of [U_COORD_1, U_COORD_2]) {
    assert.equal(bd.notificaciones.find((n) => n.usuario_id === coord).ruta_relacionada,
      '/coordinacion/gestionar-bajas');
  }
});

// ── Autorización ──

test('autorización: un coordinador no tiene perfil de profesor ni de alumno', async () => {
  await assert.rejects(
    servicio.solicitarBajaProfesor({ usuarioId: U_COORD_1, alumnoBoleta: BOLETA, motivo: 'x' }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_PROFESOR',
  );
  await assert.rejects(
    servicio.solicitarBajaAlumno({ usuarioId: U_COORD_1, motivo: 'x', archivoPdf: pdf() }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_ALUMNO',
  );
  assert.equal(bd.bajas.length, 0);
});

test('solicitud inexistente → 404 en todas las operaciones de Coordinación', async () => {
  await assert.rejects(servicio.obtenerSolicitud({ solicitudId: 99 }), (err) => err.status === 404);
  await assert.rejects(servicio.aprobarSolicitud({ solicitudId: 99, coordinadorUsuarioId: U_COORD_1 }), (err) => err.status === 404);
  await assert.rejects(servicio.rechazarSolicitud({ solicitudId: 99, coordinadorUsuarioId: U_COORD_1, comentario: 'x' }), (err) => err.status === 404);
  await assert.rejects(servicio.obtenerExpediente({ solicitudId: 99 }), (err) => err.status === 404);
});

test('expediente: una baja sin documento devuelve 404 SIN_EXPEDIENTE', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  await assert.rejects(servicio.obtenerExpediente({ solicitudId: 1 }), (err) => err.code === 'SIN_EXPEDIENTE');
});
