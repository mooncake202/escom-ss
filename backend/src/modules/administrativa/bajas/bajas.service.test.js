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

const { crearBd, usuario, alumno, profesor, oferta, solicitudRegistro, baja, documento, cumulo } = require('./bajas.fakes');

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
require.cache[rutaSocket] = {
  id: rutaSocket, filename: rutaSocket, loaded: true,
  exports: { emitirAUsuario: () => {} },
};
require.cache[rutaMailer] = {
  id: rutaMailer, filename: rutaMailer, loaded: true,
  exports: {
    enviarCorreoBajaAprobada: async (datos) => {
      if (fsFalso.fallarCorreo) throw new Error('SMTP caído');
      correos.push(datos);
    },
  },
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
    bitacoras: [{ id: 1, solicitud_registro_id: 1 }, { id: 2, solicitud_registro_id: 1 }],
    actividades: [{ id: 1, solicitud_registro_id: 1 }],
    reportes: [{ id: 1, solicitud_registro_id: 1 }],
    ...extra,
  });
  bd = creada.bd;
  prismaActual = creada.prisma;
  correos.length = 0;
  fsFalso.borradas.length = 0;
  fsFalso.escritos.length = 0;
  fsFalso.fallarBorrado = false;
  fsFalso.fallarEscritura = false;
  fsFalso.fallarCorreo = false;
  return bd;
}

const escriturasA = (modelo) => bd.escrituras.filter((e) => e.modelo === modelo);
const ofertaEnBd = (id = 1) => bd.ofertas.find((o) => o.id === id);

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
  // La de ADM-11 con expediente en revisión se marca para la etiqueta de UI.
  assert.equal(pendientes.find((s) => s.id === 2).enRevisionInstitucional, true);
  assert.equal(pendientes.find((s) => s.id === 1).enRevisionInstitucional, false);
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

// ── Aprobación ──

test('ADM-12 aprobar: elimina usuario, alumno y TODO el proceso', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO), undefined, 'usuario eliminado');
  assert.equal(bd.alumnos.length, 0, 'alumno eliminado');
  assert.equal(bd.solicitudesRegistro.length, 0, 'solicitud_registro eliminada');
  assert.equal(bd.bitacoras.length, 0, 'bitácoras eliminadas');
  assert.equal(bd.actividades.length, 0, 'actividades eliminadas');
  assert.equal(bd.reportes.length, 0, 'reportes eliminados');
  assert.equal(bd.cumulos.length, 0, 'acumulados eliminados');
  assert.equal(bd.documentos.length, 0, 'documentos eliminados');
  assert.equal(bd.bajas.length, 0, 'la propia solicitud_baja desaparece por CASCADE');
});

test('ADM-12 aprobar: devuelve exactamente 1 cupo si la oferta está aprobada', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  assert.equal(ofertaEnBd().cupos_disponibles, 1);

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.cupoLiberado, true);
  assert.equal(ofertaEnBd().cupos_disponibles, 2, 'exactamente +1');
  assert.equal(bd.profesores[0].cupos_totales, 3, 'cupos_totales del profesor INTACTO');
});

for (const estado of ['cerrada', 'concluida', 'rechazada', 'pendiente_revision']) {
  test(`ADM-12 aprobar: NO devuelve cupo si la oferta está ${estado}`, async () => {
    montar({ ofertas: [oferta({ estado })], bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

    const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

    assert.equal(r.cupoLiberado, false);
    assert.equal(ofertaEnBd().cupos_disponibles, 1, 'cupos_disponibles sin cambio');
    assert.equal(ofertaEnBd().estado_oferta, estado, 'la oferta no cambia de estado');
    assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO), undefined, 'la baja sí se ejecuta');
  });
}

test('ADM-12 aprobar: el expediente pasa a aprobada antes del borrado', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_ALUMNO, documentoId: 1 })], documentos: [documento({ id: 1 })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  const update = escriturasA('documento').find((e) => e.operacion === 'update');
  assert.equal(update.data.estado_documento, 'aprobada');
  // Y aun así la fila desaparece con el alumno: la escritura no deja rastro consultable.
  assert.equal(bd.documentos.length, 0);
});

test('ADM-12 aprobar: borra la carpeta del alumno, y solo esa', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.carpetaEliminada, true);
  const borrado = fsFalso.borradas.find((b) => b.opciones?.recursive);
  assert.equal(borrado.ruta, path.join(servicio.RUTA_BASE_DOCUMENTOS, BOLETA));
  assert.equal(borrado.opciones.force, true, 'idempotente');
  assert.equal(borrado.ruta.includes('profesores'), false);
  assert.equal(borrado.ruta.includes('coordinador'), false);
});

test('ADM-12 aprobar: un fallo del filesystem NO revierte la baja', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  fsFalso.fallarBorrado = true;

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.equal(r.carpetaEliminada, false);
  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO), undefined, 'la baja quedó hecha');
});

test('ADM-12 aprobar: envía correo con los datos capturados ANTES del DELETE', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, 'ana.torres@alumno.ipn.mx');
  assert.equal(correos[0].nombre, 'Ana Torres Vega');
  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO), undefined, 'el usuario ya no existe');
});

test('ADM-12 aprobar: un fallo de correo NO revierte la baja', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });
  fsFalso.fallarCorreo = true;

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.estado, 'aprobada');
  assert.equal(bd.alumnos.length, 0);
});

test('ADM-12 aprobar: NO crea notificación para el alumno (su usuario desaparece)', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(bd.notificaciones.some((n) => n.usuario_id === U_ALUMNO), false);
  // Profesor y ambos coordinadores sí.
  const destinatarios = new Set(bd.notificaciones.map((n) => n.usuario_id));
  assert.equal(destinatarios.has(U_PROFESOR), true);
  assert.equal(destinatarios.has(U_COORD_1), true);
  assert.equal(destinatarios.has(U_COORD_2), true);
});

test('ADM-12 aprobar: toma el lock del profesor ANTES de cualquier escritura', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(bd.locks.length, 1);
  assert.equal(bd.locks[0].profesorId, 1);
  assert.equal(bd.locks[0].escriturasPrevias, 0, 'el lock es la primera sentencia de la transacción');
});

test('ADM-12 aprobar: doble aprobación → 409 y un solo incremento de cupo', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })] });

  await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });
  assert.equal(ofertaEnBd().cupos_disponibles, 2);

  // La fila ya no existe: el segundo coordinador recibe 404.
  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_2 }),
    (err) => err.status === 404,
  );
  assert.equal(ofertaEnBd().cupos_disponibles, 2, 'no se liberó un segundo cupo');
});

test('ADM-12 aprobar: una solicitud ya resuelta no se aprueba otra vez', async () => {
  montar({ bajas: [baja({ id: 1, solicitanteId: U_PROFESOR, estado: 'rechazada', fechaRespuesta: new Date() })] });

  await assert.rejects(
    servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 }),
    (err) => err.status === 409 && err.code === 'SOLICITUD_YA_RESUELTA',
  );
  assert.equal(bd.usuarios.find((u) => u.id === U_ALUMNO) !== undefined, true, 'nadie fue borrado');
});

test('ADM-12 aprobar: si la solicitud ya no ocupaba cupo, no libera nada pero sí borra', async () => {
  montar({
    solicitudesRegistro: [solicitudRegistro({ estado: 'rechazada_definitivamente' })],
    bajas: [baja({ id: 1, solicitanteId: U_PROFESOR })],
  });

  const r = await servicio.aprobarSolicitud({ solicitudId: 1, coordinadorUsuarioId: U_COORD_1 });

  assert.equal(r.cupoLiberado, false);
  assert.equal(ofertaEnBd().cupos_disponibles, 1);
  assert.equal(bd.alumnos.length, 0);
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

  const destinatarios = bd.notificaciones.map((n) => n.usuario_id).sort();
  assert.deepEqual(destinatarios, [U_COORD_1, U_COORD_2]);
  assert.match(bd.notificaciones[0].ruta_relacionada, /^\/coordinacion\/gestionar-bajas\?destacar=/);
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
