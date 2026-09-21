// Envío definitivo (CU-REP-01, fase 6): BD falsa con transacciones y bloqueos, carpetas temporales reales, TSA falsa.
// Nunca se llama a FreeTSA ni a la red.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');

const { enviarReporteMensual, CODIGOS_ERROR } = require('./reportes-envio.service');
const { generarPdfReporteMensual } = require('./reportes.pdf');
const { guardarRubrica } = require('./reportes.rubricas');
const { crearBdEnvio, PROFESOR_USUARIO_ID } = require('./reportes.envio.fixtures');
const { crearPng, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');
const { descifrarBuffer, cifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');
const { ESTADOS_REPORTE, MOTIVOS_BLOQUEO } = require('./reportes.shared');

const RUBRICA = crearPng(500, 180);
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA-NO-ES-UN-SELLO-REAL').toString('base64');
const IP = '187.190.10.20';
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

const archivosEn = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name))
  : []);

// Escenario: BD falsa, carpeta de rúbricas y de documentos, espías de PDF generado y de sellos pedidos.
async function escenario(t, opciones = {}, { conRubrica = true, tsa } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseRubricas = tmp('envio-rubricas-');
  const rutaBaseDocumentos = tmp('envio-docs-');
  const bd = crearBdEnvio(opciones);
  if (conRubrica) await guardarRubrica(7, { buffer: RUBRICA }, { prisma: bd.prisma, rutaBase: rutaBaseRubricas, ip: '10.0.0.1' });
  bd.operaciones.length = 0;

  const eventos = [];
  const generados = [];
  const sellos = [];
  const generarPdf = async (datos, opcionesPdf) => {
    const pdf = await generarPdfReporteMensual(datos, opcionesPdf);
    generados.push(Buffer.from(pdf));
    eventos.push('pdf');
    return pdf;
  };
  const sello = tsa ?? (async (hash) => {
    sellos.push(hash);
    eventos.push('tsa');
    return { token: TOKEN, fecha: new Date() };
  });
  // Dobles de las notificaciones: la BD real y el socket no participan en estas pruebas.
  const notificaciones = [];
  const emisiones = [];
  const crearNotificacion = async (datos) => { notificaciones.push(datos); };
  const emitirAUsuario = (usuarioId, evento, datos) => { emisiones.push({ usuarioId, evento, datos }); };
  const enviar = (actividades = ACTIVIDADES_EJEMPLO, extra = {}) => enviarReporteMensual(7, actividades, {
    prisma: bd.prisma, ahora: bd.ahora, ip: IP, rutaBaseRubricas, rutaBaseDocumentos, solicitarSelloTiempo: sello, generarPdf,
    crearNotificacion, emitirAUsuario, ...extra,
  });
  return { ...bd, enviar, eventos, generados, sellos, notificaciones, emisiones, rutaBaseRubricas, rutaBaseDocumentos };
}

const nadaPersistido = (e) => {
  assert.deepEqual(e.db.documentos, [], 'sin documento');
  assert.deepEqual(e.db.reportes, [], 'sin reporte');
  assert.deepEqual(e.db.revisiones, [], 'sin revisión');
  assert.deepEqual(archivosEn(e.rutaBaseDocumentos), [], 'sin archivo en disco');
};

function silenciar(t) { return t.mock.method(console, 'error', () => {}); }

const contarImagenes = async (pdf) => {
  const doc = await PDFDocument.load(pdf);
  let n = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && !o.dict.has(PDFName.of('SMaskInData'))
      && o.dict.get(PDFName.of('ColorSpace')) !== PDFName.of('DeviceGray')) n += 1;
  }
  return { paginas: doc.getPageCount(), imagenes: n };
};

// ── Camino feliz ─────────────────────────────────────────────

test('envío: genera UN PDF, lo hashea, lo sella, lo cifra y registra documento + reporte + firma del alumno', async (t) => {
  const e = await escenario(t);
  const resultado = await e.enviar();

  // Respuesta: reporte enviado a revisión del profesor, sin ruta, hash ni token.
  assert.deepEqual(resultado, {
    reporte: { id: e.db.reportes[0].id, numero: 1, estadoReporte: 'pendiente_revision_profesor' },
    fechaEnvio: e.ahora.toISOString(),
  });
  assert.equal(/aprobad/i.test(JSON.stringify(resultado)), false, 'no dice "aprobado"');

  // Cadena documental: un solo PDF generado; el hash enviado a la TSA es el de ese PDF.
  assert.equal(e.generados.length, 1, 'el PDF se genera UNA sola vez');
  const hash = sha256(e.generados[0]);
  assert.deepEqual(e.sellos, [hash], 'la TSA recibió el hash del PDF generado');

  // Lo almacenado descifra EXACTAMENTE a ese Buffer.
  const [archivo] = archivosEn(e.rutaBaseDocumentos);
  const enDisco = fs.readFileSync(archivo);
  assert.equal(enDisco.includes(Buffer.from('%PDF-')), false, 'el archivo está cifrado');
  const descifrado = descifrarBuffer(enDisco);
  assert.ok(descifrado.equals(e.generados[0]), 'lo cifrado es exactamente el PDF hasheado');
  assert.equal(sha256(descifrado), hash);
  assert.deepEqual(await contarImagenes(descifrado), { paginas: 1, imagenes: 3 });

  // Registros.
  const [documento] = e.db.documentos;
  assert.equal(e.db.documentos.length, 1);
  assert.equal(documento.alumno_id, '2022630001');
  assert.equal(documento.creador_id, 7);
  assert.equal(documento.tipo_documento, 'reporte_mensual');
  assert.equal(documento.estado_documento, 'vigente');
  assert.equal(documento.aprobado_por_id, null);
  assert.equal(documento.fecha_creacion, e.ahora);
  assert.match(documento.ruta_archivo, /^2022630001\/[0-9a-f-]{36}\.pdf$/);
  assert.equal(path.relative(e.rutaBaseDocumentos, archivo).split(path.sep).join('/'), documento.ruta_archivo);

  assert.equal(e.db.reportes.length, 1);
  const [reporte] = e.db.reportes;
  assert.equal(reporte.solicitud_registro_id, 42);
  assert.equal(reporte.documento_id, documento.id);
  assert.equal(reporte.num_reporte, 1);
  assert.equal(reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.equal(reporte.actividades_mes, ACTIVIDADES_EJEMPLO);
  // Snapshot del primer envío, calculado desde AH: 2 bitácoras aprobadas en el periodo, de 4 h y 3 h.
  assert.equal(reporte.dias_laborados, 2);
  assert.equal(reporte.horas_reportadas, 7);

  assert.equal(e.db.revisiones.length, 1);
  const [revision] = e.db.revisiones;
  assert.deepEqual(
    { ...revision, id: undefined },
    {
      id: undefined, reporte_mensual_id: reporte.id, usuario_id: 7, tipo_revisor: 'alumno', estado: 'aprobado', comentario: null,
      hash_documento: hash, ip_firma: IP, token_tsa: TOKEN, fecha: e.ahora,
    },
  );
});

test('snapshot: días y horas se calculan bajo el bloqueo con lo que AH tiene aprobado en ese momento', async (t) => {
  const e = await escenario(t, {}, { tsa: null });
  const sello = async () => {
    // Mientras se espera a la TSA, AH aprueba otra bitácora dentro del periodo: entra en el snapshot del envío.
    e.bitacoras.push({ id: 3, estado: 'aprobada', fecha_registro: new Date('2025-10-20T00:00:00.000Z'), fecha_revision: new Date('2025-11-01T16:00:00.000Z'), horas_contabilizadas: 2 });
    return { token: TOKEN, fecha: new Date() };
  };
  await e.enviar(ACTIVIDADES_EJEMPLO, { solicitarSelloTiempo: sello });
  assert.equal(e.db.reportes[0].dias_laborados, 3);
  assert.equal(e.db.reportes[0].horas_reportadas, 9);
});

test('snapshot: usa las horas reales de AH (1 a 4 h), no 4 por día', async (t) => {
  const bit = (id, dia, horas) => ({ id, estado: 'aprobada', fecha_registro: new Date(`2025-10-${dia}T00:00:00.000Z`), fecha_revision: new Date(`2025-10-${dia}T16:00:00.000Z`), horas_contabilizadas: horas });
  const e = await escenario(t, { bitacoras: [bit(1, 16, 1), bit(2, 17, 2), bit(3, 20, 3), bit(4, 21, 4)] });
  await e.enviar();
  assert.deepEqual([e.db.reportes[0].dias_laborados, e.db.reportes[0].horas_reportadas], [4, 10]);
});

test('orden de la cadena: PDF → sello → archivo cifrado → transacción (bloqueo primero, luego registros)', async (t) => {
  const e = await escenario(t);
  const escrituraOriginal = fs.promises.writeFile;
  t.mock.method(fs.promises, 'writeFile', async (...args) => { e.eventos.push('archivo'); return escrituraOriginal.apply(fs.promises, args); });
  await e.enviar();
  assert.deepEqual(e.eventos, ['pdf', 'tsa', 'archivo']);

  const tx = e.operaciones.filter((op) => op.startsWith('tx:') || op.startsWith('$transaction'));
  assert.deepEqual(tx.filter((op) => !/findMany|findUnique/.test(op)), [
    '$transaction.inicio',
    'tx:$queryRaw(solicitud_registro)',
    'tx:$queryRaw(reporte_mensual)',
    'tx:documento.create',
    'tx:reporte_mensual.create',
    'tx:revision_reporte_mensual.create',
    '$transaction.commit',
  ]);
  // La revalidación con los datos frescos ocurre DENTRO de la transacción, con el bloqueo ya tomado.
  const dentro = e.operaciones.slice(e.operaciones.indexOf('tx:$queryRaw(reporte_mensual)'));
  assert.ok(dentro.includes('tx:alumno.findUnique') && dentro.includes('tx:bitacora.findMany'));
});

test('el hash y el sello son del mismo PDF que se guarda: cualquier otro PDF tendría otro hash', async (t) => {
  const e = await escenario(t);
  await e.enviar();
  const guardado = descifrarBuffer(fs.readFileSync(archivosEn(e.rutaBaseDocumentos)[0]));
  assert.equal(e.db.revisiones[0].hash_documento, sha256(guardado));
  const otro = Buffer.from(guardado);
  otro[otro.length - 3] ^= 0x01;
  assert.notEqual(sha256(otro), e.db.revisiones[0].hash_documento);
});

test('IP inválida o ausente → ip_firma nulo (no se inventa)', async (t) => {
  for (const ip of [null, '', 'x'.repeat(46)]) {
    const e = await escenario(t);
    await e.enviar(ACTIVIDADES_EJEMPLO, { ip });
    assert.equal(e.db.revisiones[0].ip_firma, null, String(ip));
  }
});

test('enviar de nuevo no duplica: el siguiente reporte queda bloqueado hasta que el actual se apruebe', async (t) => {
  const e = await escenario(t);
  await e.enviar();
  await assert.rejects(e.enviar(), (err) => err.status === 409 && err.code === 'REPORTE_NO_GENERABLE');
  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.reportes.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1);
});

// ── Validaciones previas: sin efectos ────────────────────────

test('validaciones previas: sin PDF, sin sello, sin archivo y sin transacción', async (t) => {
  const casos = [
    [{ bitacoras: [] }, {}, ACTIVIDADES_EJEMPLO, { status: 409, code: 'REPORTE_NO_GENERABLE' }],
    [{}, { conRubrica: false }, ACTIVIDADES_EJEMPLO, { status: 409, code: 'RUBRICA_NO_REGISTRADA' }],
    [{}, {}, '  ', { status: 400, code: 'ACTIVIDADES_VACIAS' }],
    [{}, {}, 'Terminé 😀', { status: 400, code: 'CARACTERES_NO_SOPORTADOS' }],
    [{}, {}, `Consulté ${'documentos-del-proyecto/'.repeat(30)}`, { status: 422, code: 'ACTIVIDADES_PALABRA_DEMASIADO_LARGA' }],
    [{}, {}, Array.from({ length: 40 }, (_, i) => `Actividad ${i + 1}: revisé y documenté los requerimientos del módulo asignado.`).join('\n'), { status: 422, code: 'ACTIVIDADES_EXCEDEN_ESPACIO' }],
    [{ nombre: 'ANA 😀' }, {}, ACTIVIDADES_EJEMPLO, { status: 422, code: 'DATOS_NO_IMPRIMIBLES' }],
  ];
  for (const [opciones, extra, actividades, esperado] of casos) {
    const e = await escenario(t, opciones, extra);
    await assert.rejects(e.enviar(actividades), (err) => err.status === esperado.status && err.code === esperado.code, esperado.code);
    assert.equal(e.generados.length, 0, `${esperado.code}: no se genera PDF`);
    assert.equal(e.sellos.length, 0, `${esperado.code}: no se pide sello`);
    assert.deepEqual(e.escrituras(), []);
    assert.equal(e.operaciones.includes('$transaction.inicio'), false);
    nadaPersistido(e);
  }
});

// ── Fallo de la TSA ──────────────────────────────────────────

test('si la TSA falla (cualquier código) → 503 reintentable y no queda NADA: ni archivo, ni documento, ni reporte, ni revisión', async (t) => {
  silenciar(t);
  for (const codigo of ['TSA_TIMEOUT', 'TSA_SIN_CONEXION', 'TSA_HTTP', 'TSA_RECHAZADO', 'TSA_ALGORITMO_NO_ACEPTADO', 'TSA_RESPUESTA_INVALIDA', 'TSA_HASH_DISTINTO', 'TSA_NONCE_DISTINTO']) {
    const e = await escenario(t, {}, { tsa: async () => { throw new ErrorTsa(`falla simulada ${codigo} en https://freetsa.org/tsr`, codigo); } });
    await assert.rejects(e.enviar(), (err) => {
      assert.equal(err.status, 503, codigo);
      assert.equal(err.code, CODIGOS_ERROR.SELLO_TIEMPO_NO_DISPONIBLE);
      assert.equal(err.reintentable, true);
      assert.match(err.message, /Tu reporte no fue enviado/);
      assert.equal(/freetsa|TSA_/.test(err.message), false, 'sin detalles internos');
      return true;
    });
    assert.equal(e.generados.length, 1);
    assert.equal(e.operaciones.includes('$transaction.inicio'), false, 'ni siquiera se abre la transacción');
    assert.deepEqual(e.escrituras(), []);
    nadaPersistido(e);
  }
});

test('respuesta inservible de la TSA (sin token) → 503 y nada persistido; un error inesperado no se disfraza', async (t) => {
  silenciar(t);
  for (const respuesta of [undefined, null, {}, { token: '' }, { token: 123 }]) {
    const e = await escenario(t, {}, { tsa: async () => respuesta });
    await assert.rejects(e.enviar(), (err) => err.status === 503 && err.code === 'SELLO_TIEMPO_NO_DISPONIBLE');
    nadaPersistido(e);
  }
  // HASH_INVALIDO es un error nuestro, no de disponibilidad: 500.
  const e = await escenario(t, {}, { tsa: async () => { throw new ErrorTsa('hash mal', 'HASH_INVALIDO'); } });
  await assert.rejects(e.enviar(), (err) => err.status === 500);
  nadaPersistido(e);
});

test('tras un fallo de la TSA, el reintento funciona y crea exactamente un reporte', async (t) => {
  silenciar(t);
  let intentos = 0;
  const e = await escenario(t, {}, {
    tsa: async () => {
      intentos += 1;
      if (intentos === 1) throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION');
      return { token: TOKEN, fecha: new Date() };
    },
  });
  await assert.rejects(e.enviar(), (err) => err.status === 503);
  nadaPersistido(e);

  const resultado = await e.enviar();
  assert.equal(resultado.reporte.numero, 1);
  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.reportes.length, 1);
  assert.equal(e.db.revisiones.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1);
  assert.equal(e.db.revisiones[0].hash_documento, sha256(e.generados[1]), 'el hash es del PDF del reintento');
});

test('con la TSA por omisión se usa el cliente real (RFC 3161) con el hash del PDF; aquí sin red: fetch simulado', async (t) => {
  silenciar(t);
  const peticiones = [];
  t.mock.method(globalThis, 'fetch', async (url, opciones) => { peticiones.push({ url, opciones }); throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }); });
  const base = await escenario(t);
  const generados = [];
  await assert.rejects(
    enviarReporteMensual(7, ACTIVIDADES_EJEMPLO, {
      prisma: base.prisma, ahora: base.ahora, ip: IP, rutaBaseRubricas: base.rutaBaseRubricas, rutaBaseDocumentos: base.rutaBaseDocumentos,
      generarPdf: async (datos, o) => { const pdf = await generarPdfReporteMensual(datos, o); generados.push(Buffer.from(pdf)); return pdf; },
    }),
    (err) => err.status === 503 && err.code === 'SELLO_TIEMPO_NO_DISPONIBLE',
  );
  assert.equal(peticiones.length, 1);
  assert.equal(peticiones[0].url, 'https://freetsa.org/tsr');
  assert.equal(peticiones[0].opciones.method, 'POST');
  assert.ok(peticiones[0].opciones.body.includes(Buffer.from(sha256(generados[0]), 'hex')), 'el TimeStampReq lleva el hash del PDF');
  nadaPersistido(base);
});

// ── Fallos después del sello ─────────────────────────────────

test('si falla cualquier registro dentro de la transacción → se revierte TODO y se borra el archivo', async (t) => {
  silenciar(t);
  for (const operacion of ['documento.create', 'reporte_mensual.create', 'revision_reporte_mensual.create']) {
    const e = await escenario(t, { fallos: { [operacion]: new Error(`falla simulada en ${operacion}`) } });
    await assert.rejects(e.enviar(), new RegExp(operacion.replace('.', '\\.')));
    assert.ok(e.operaciones.includes('$transaction.rollback'), operacion);
    assert.equal(e.operaciones.includes('$transaction.commit'), false);
    nadaPersistido(e);
  }
});

test('commit con resultado dudoso: si la BD SÍ tiene el documento, el archivo se conserva (no queda un registro sin archivo)', async (t) => {
  silenciar(t);
  const e = await escenario(t, { falloTrasCommit: new Error('conexión perdida al confirmar') });
  await assert.rejects(e.enviar(), /conexión perdida/);
  assert.equal(e.db.documentos.length, 1);
  const [archivo] = archivosEn(e.rutaBaseDocumentos);
  assert.ok(archivo, 'el archivo sigue ahí');
  assert.equal(path.relative(e.rutaBaseDocumentos, archivo).split(path.sep).join('/'), e.db.documentos[0].ruta_archivo);
});

test('si no se puede confirmar si el documento quedó registrado, el archivo se conserva (más vale un huérfano que un registro roto)', async (t) => {
  silenciar(t);
  const e = await escenario(t, { fallos: { 'reporte_mensual.create': new Error('falla') } });
  const prismaConsultaRota = new Proxy(e.prisma, {
    get(obj, prop) {
      if (prop === 'documento') return new Proxy(obj.documento, { get: (d, op) => (op === 'findFirst' ? async () => { throw new Error('BD caída'); } : d[op]) });
      return obj[prop];
    },
  });
  await assert.rejects(e.enviar(ACTIVIDADES_EJEMPLO, { prisma: prismaConsultaRota }), /falla/);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1);
  assert.deepEqual(e.db.documentos, []);
});

test('si no se puede escribir el archivo: no se toca la BD', async (t) => {
  silenciar(t);
  const e = await escenario(t);
  fs.writeFileSync(path.join(e.rutaBaseDocumentos, '2022630001'), 'esto es un archivo, no una carpeta');
  await assert.rejects(e.enviar());
  assert.equal(e.operaciones.includes('$transaction.inicio'), false);
  assert.deepEqual(e.escrituras(), []);
  assert.deepEqual(e.db.documentos, []);
  assert.deepEqual(e.db.reportes, []);
  assert.deepEqual(e.db.revisiones, []);
});

test('si lo guardado no descifra al mismo hash → 500 ARCHIVO_INCONSISTENTE, archivo borrado y nada en la BD', async (t) => {
  silenciar(t);
  const e = await escenario(t);
  const lecturaOriginal = fs.promises.readFile;
  t.mock.method(fs.promises, 'readFile', async (ruta, ...resto) => (
    String(ruta).startsWith(e.rutaBaseDocumentos) ? cifrarBuffer(Buffer.from('otro contenido')) : lecturaOriginal.call(fs.promises, ruta, ...resto)
  ));
  await assert.rejects(e.enviar(), (err) => err.status === 500 && err.code === CODIGOS_ERROR.ARCHIVO_INCONSISTENTE);
  assert.equal(e.operaciones.includes('$transaction.inicio'), false);
  nadaPersistido(e);
});

test('un archivo alterado en disco tampoco pasa la comprobación (GCM)', async (t) => {
  silenciar(t);
  const e = await escenario(t);
  const lecturaOriginal = fs.promises.readFile;
  t.mock.method(fs.promises, 'readFile', async (ruta, ...resto) => {
    const bytes = await lecturaOriginal.call(fs.promises, ruta, ...resto);
    if (String(ruta).startsWith(e.rutaBaseDocumentos)) { const copia = Buffer.from(bytes); copia[copia.length - 1] ^= 1; return copia; }
    return bytes;
  });
  await assert.rejects(e.enviar());
  nadaPersistido(e);
});

// ── Concurrencia ─────────────────────────────────────────────

test('envíos simultáneos: uno solo crea el reporte; los demás reciben 409 REPORTE_YA_EXISTE y no dejan archivos huérfanos', async (t) => {
  const e = await escenario(t, {}, {
    tsa: async () => { await new Promise((r) => setTimeout(r, 15)); return { token: TOKEN, fecha: new Date() }; },
  });
  const resultados = await Promise.allSettled([e.enviar(), e.enviar(), e.enviar(), e.enviar()]);

  const ganadores = resultados.filter((r) => r.status === 'fulfilled');
  const perdedores = resultados.filter((r) => r.status === 'rejected');
  assert.equal(ganadores.length, 1);
  assert.equal(perdedores.length, 3);
  for (const p of perdedores) {
    assert.equal(p.reason.status, 409);
    assert.equal(p.reason.code, 'REPORTE_YA_EXISTE');
    assert.deepEqual(p.reason.reporteExistente, { numero: 1, estadoReporte: 'pendiente_revision_profesor' });
  }
  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.reportes.length, 1);
  assert.equal(e.db.revisiones.length, 1);

  const archivos = archivosEn(e.rutaBaseDocumentos);
  assert.equal(archivos.length, 1, 'solo queda el archivo del ganador');
  assert.equal(path.relative(e.rutaBaseDocumentos, archivos[0]).split(path.sep).join('/'), e.db.documentos[0].ruta_archivo);
  // Y ese archivo corresponde al hash guardado del reporte ganador.
  assert.equal(sha256(descifrarBuffer(fs.readFileSync(archivos[0]))), e.db.revisiones[0].hash_documento);
});

test('otro envío se adelanta después de las validaciones previas → 409 REPORTE_YA_EXISTE con ese reporte, y se borra el archivo', async (t) => {
  const e = await escenario(t, {}, { tsa: null });
  const sello = async (hash) => {
    e.db.reportes.push({ id: 1, solicitud_registro_id: 42, num_reporte: 1, estado_reporte: 'pendiente_revision_profesor' }); // "lo confirmó otro"
    return { token: TOKEN, fecha: new Date(), hash };
  };
  await assert.rejects(
    e.enviar(ACTIVIDADES_EJEMPLO, { solicitarSelloTiempo: sello }),
    (err) => err.status === 409 && err.code === 'REPORTE_YA_EXISTE' && err.reporteExistente.numero === 1,
  );
  assert.equal(e.db.documentos.length, 0);
  assert.equal(e.db.revisiones.length, 0);
  assert.equal(e.db.reportes.length, 1, 'solo el que ya existía');
  assert.deepEqual(archivosEn(e.rutaBaseDocumentos), []);
});

test('la transacción exige el bloqueo de la solicitud antes de leer o escribir (la BD falsa lo hace cumplir)', async (t) => {
  const e = await escenario(t);
  await e.enviar();
  const ops = e.operaciones;
  const bloqueo = ops.indexOf('tx:$queryRaw(solicitud_registro)');
  assert.ok(bloqueo > ops.indexOf('$transaction.inicio'));
  // La primera sentencia de la transacción es el bloqueo: no hay lecturas antes.
  assert.equal(ops[ops.indexOf('$transaction.inicio') + 1], 'tx:$queryRaw(solicitud_registro)');
});

// ── Datos que cambian a mitad del envío ──────────────────────

test('si los datos impresos cambian tras generar el PDF → 409 DATOS_DEL_REPORTE_CAMBIARON: no se registra un PDF desactualizado', async (t) => {
  const e = await escenario(t, {}, { tsa: null });
  const sello = async () => {
    e.perfil.profesorUsuario = { nombre: 'OTRO', apellidos: 'PROFESOR NUEVO' };
    return { token: TOKEN, fecha: new Date() };
  };
  await assert.rejects(e.enviar(ACTIVIDADES_EJEMPLO, { solicitarSelloTiempo: sello }), (err) => err.status === 409 && err.code === 'DATOS_DEL_REPORTE_CAMBIARON' && /no fue enviado/.test(err.message));
  assert.ok(e.operaciones.includes('$transaction.rollback'));
  nadaPersistido(e);
});

test('si tras generar el PDF el reporte deja de ser generable → 409 REPORTE_NO_GENERABLE y nada se registra', async (t) => {
  const e = await escenario(t, {}, { tsa: null });
  const sello = async () => { e.perfil.correoPersonal = null; return { token: TOKEN, fecha: new Date() }; };
  await assert.rejects(e.enviar(ACTIVIDADES_EJEMPLO, { solicitarSelloTiempo: sello }), (err) => (
    err.status === 409 && err.code === 'REPORTE_NO_GENERABLE' && err.motivosBloqueo.some((m) => m.codigo === MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL)
  ));
  nadaPersistido(e);
});

test('la solicitud ausente se informa como 404 sin efectos', async (t) => {
  const e = await escenario(t);
  const sinSolicitud = new Proxy(e.prisma, {
    get(obj, prop) {
      if (prop === 'alumno') {
        return { findUnique: async (args) => (args.select ? null : obj.alumno.findUnique(args)) };
      }
      return obj[prop];
    },
  });
  await assert.rejects(e.enviar(ACTIVIDADES_EJEMPLO, { prisma: sinSolicitud }), (err) => err.status === 404);
  assert.equal(e.generados.length, 0);
  nadaPersistido(e);
});

// ── Aviso al profesor (mismo patrón que Ofertas: notificación persistida + evento por socket) ──

test('al enviar, se notifica al profesor responsable con el alumno y el número de reporte, y se navega a /profesor/reportes?destacar=<id>', async (t) => {
  const e = await escenario(t);
  const { reporte } = await e.enviar();

  assert.deepEqual(e.notificaciones, [{
    usuarioId: PROFESOR_USUARIO_ID,
    tipo: 'warning',
    mensaje: 'ANA GARCIA LOPEZ envió el Reporte Mensual No. 1 para tu revisión.',
    rutaRelacionada: `/profesor/reportes?destacar=${reporte.id}`,
  }]);
  assert.deepEqual(e.emisiones, [{ usuarioId: PROFESOR_USUARIO_ID, evento: 'reporte:nuevo', datos: { reporteId: reporte.id } }]);
});

test('la notificación se envía después de confirmar el registro (con el reporte ya guardado) y una sola vez', async (t) => {
  const e = await escenario(t);
  let reportesAlNotificar = null;
  await e.enviar(ACTIVIDADES_EJEMPLO, { crearNotificacion: async () => { reportesAlNotificar = e.db.reportes.length; } });
  assert.equal(reportesAlNotificar, 1);
  assert.equal(e.emisiones.length, 1);
});

test('fail-open: si falla crear la notificación, el envío sigue siendo válido y se emite igualmente el evento', async (t) => {
  const registro = t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const resultado = await e.enviar(ACTIVIDADES_EJEMPLO, { crearNotificacion: async () => { throw new Error('BD de notificaciones caída'); } });

  assert.equal(resultado.reporte.numero, 1);
  assert.equal(e.db.reportes.length, 1);
  assert.equal(e.db.documentos.length, 1);
  assert.equal(archivosEn(e.rutaBaseDocumentos).length, 1, 'el archivo se conserva');
  assert.equal(e.emisiones.length, 1);
  assert.match(String(registro.mock.calls[0].arguments[0]), /No se pudo crear la notificación/);
});

test('fail-open: si falla el socket (o no se pueden cargar los módulos de notificación), el envío sigue siendo válido', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const resultado = await e.enviar(ACTIVIDADES_EJEMPLO, { emitirAUsuario: () => { throw new Error('socket no inicializado'); } });
  assert.equal(resultado.reporte.numero, 1);
  assert.equal(e.notificaciones.length, 1, 'la notificación persistida no se pierde');
  assert.equal(e.db.revisiones.length, 1);
});

test('si el envío falla (TSA, registro o validación) NO se notifica al profesor', async (t) => {
  t.mock.method(console, 'error', () => {});
  const sinTsa = await escenario(t, {}, { tsa: async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); } });
  await assert.rejects(sinTsa.enviar(), (err) => err.status === 503);
  assert.deepEqual([sinTsa.notificaciones, sinTsa.emisiones], [[], []]);

  const sinRegistro = await escenario(t, { fallos: { 'reporte_mensual.create': new Error('falla') } });
  await assert.rejects(sinRegistro.enviar(), /falla/);
  assert.deepEqual([sinRegistro.notificaciones, sinRegistro.emisiones], [[], []]);

  const bloqueado = await escenario(t, { bitacoras: [] });
  await assert.rejects(bloqueado.enviar(), (err) => err.code === 'REPORTE_NO_GENERABLE');
  assert.deepEqual([bloqueado.notificaciones, bloqueado.emisiones], [[], []]);
});

test('envíos simultáneos: solo el que crea el reporte notifica al profesor', async (t) => {
  const e = await escenario(t, {}, { tsa: async () => { await new Promise((r) => setTimeout(r, 15)); return { token: TOKEN, fecha: new Date() }; } });
  const resultados = await Promise.allSettled([e.enviar(), e.enviar(), e.enviar()]);
  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(e.notificaciones.length, 1);
  assert.equal(e.emisiones.length, 1);
});
