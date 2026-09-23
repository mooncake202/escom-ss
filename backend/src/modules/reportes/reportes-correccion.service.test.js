// CU-REP-04 (Alumno): corregir y reenviar un reporte rechazado. BD falsa con transacciones y reversa, carpetas temporales
// reales y TSA falsa. El PDF se genera con un doble rápido salvo en las pruebas marcadas "PDF real". Nunca se llama a
// FreeTSA ni a la red.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const { generarVistaPreviaCorreccion, reenviarReporteCorregido, normalizarActividades, CODIGOS_ERROR } = require('./reportes-correccion.service');
const { ESTADOS_REPORTE } = require('./reportes.shared');
const { reporteMensual, crearBdProfesor, alumnoGrafo } = require('./reportes.profesor.fixtures');
const { crearPng } = require('./reportes.pdf.fixtures');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');

const ALUMNO = 201; // alumno del reporte con id 1
const OTRO_ALUMNO = 202;
const PROFESOR_DEL_REPORTE = 301;
const IP = '187.190.10.20';
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA-NO-ES-UN-SELLO-REAL').toString('base64');
const RUBRICA = crearPng(400, 140);
const ACTIVIDADES_ORIGINALES = 'Actividad original uno.\nActividad original dos.';
const ACTIVIDADES_NUEVAS = 'Actividad corregida uno.\nActividad corregida dos con más detalle.';

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const archivos = (base) => (fs.existsSync(base)
  ? fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(base, path.join(e.parentPath ?? e.path, e.name))).sort()
  : []);
const rev = (id, tipo, estado, fecha, extra = {}) => ({
  id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: `${id}`.repeat(64).slice(0, 64), ip_firma: '10.0.0.1', token_tsa: `token-${id}`, comentario: null,
  usuario: { nombre: 'X', apellidos: 'Y' }, ...extra,
});

const HISTORIAL_RECHAZO_PROFESOR = () => [
  rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'),
  rev(2, 'profesor', 'rechazado', '2026-08-18T15:00:00.000Z', { comentario: 'Detalla las pruebas realizadas.' }),
];
const HISTORIAL_RECHAZO_COORDINACION = () => [
  rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'),
  rev(2, 'profesor', 'aprobado', '2026-08-18T15:00:00.000Z'),
  rev(3, 'coordinador', 'rechazado', '2026-08-20T15:00:00.000Z', { comentario: 'El formato no es claro.' }),
];

/**
 * Escenario: reporte 1 del alumno 201 rechazado (con su PDF anterior cifrado en disco, snapshot de 4 días y 13 horas), reporte 2
 * de otro alumno, rúbrica del alumno ya registrada (salvo `sinRubrica`), TSA, notificaciones y generador de PDF falsos.
 */
async function escenario(t, { estado = ESTADOS_REPORTE.RECHAZADO_PROFESOR, revisiones, sinRubrica = false, alumno = {}, bd: opcionesBd = {}, tsa, generarPdf } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseDocumentos = tmp('correccion-docs-');
  const rutaBaseRubricas = tmp('correccion-rubricas-');
  fs.mkdirSync(path.join(rutaBaseDocumentos, '2022630001'), { recursive: true });
  const pdfAnterior = Buffer.from('%PDF-anterior (versión rechazada)');
  fs.writeFileSync(path.join(rutaBaseDocumentos, '2022630001/anterior.pdf'), cifrarBuffer(pdfAnterior));
  fs.mkdirSync(path.join(rutaBaseRubricas, '2022630001', 'Rubrica'), { recursive: true });
  fs.writeFileSync(path.join(rutaBaseRubricas, '2022630001/Rubrica/rubrica.enc'), cifrarBuffer(RUBRICA));

  const historial = revisiones ?? (estado === ESTADOS_REPORTE.RECHAZADO_COORDINADOR ? HISTORIAL_RECHAZO_COORDINACION() : HISTORIAL_RECHAZO_PROFESOR());
  const reportes = [
    reporteMensual({ id: 1, estado, numero: 2, diasLaborados: 4, horasReportadas: 13, actividades: ACTIVIDADES_ORIGINALES, rutaArchivo: '2022630001/anterior.pdf', revisiones: historial }),
    reporteMensual({ id: 2, alumnoUsuarioId: OTRO_ALUMNO, boleta: '2022630002', estado: ESTADOS_REPORTE.RECHAZADO_PROFESOR, rutaArchivo: '2022630002/x.pdf' }),
    reporteMensual({ id: 3, alumnoUsuarioId: ALUMNO, boleta: '2022630001', estado: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, numero: 3, rutaArchivo: '2022630001/x3.pdf' }),
    reporteMensual({ id: 4, alumnoUsuarioId: ALUMNO, boleta: '2022630001', estado: ESTADOS_REPORTE.APROBADO_COORDINADOR, numero: 4, rutaArchivo: '2022630001/x4.pdf' }),
  ];
  const bd = crearBdProfesor({
    profesores: {},
    reportes,
    escritura: true,
    usuarios: { [ALUMNO]: { rubrica_imagen: sinRubrica ? null : '2022630001/Rubrica/rubrica.enc' } },
    alumnos: { [ALUMNO]: alumnoGrafo({ usuarioId: ALUMNO, ...alumno }) },
    ...opcionesBd,
  });

  const sellosDeTiempo = [];
  const generados = [];
  const notificaciones = [];
  const emisiones = [];
  const deps = {
    prisma: bd.prisma,
    rutaBaseDocumentos,
    rutaBaseRubricas,
    ip: IP,
    ahora: new Date('2026-09-22T15:00:00.000Z'),
    generarPdf: generarPdf ?? (async (datos, opciones) => {
      generados.push({ datos, rubrica: Buffer.from(opciones.rubricaAlumno) });
      return Buffer.from(`%PDF-corregido\n${datos.actividades.texto}`);
    }),
    solicitarSelloTiempo: tsa ?? (async (hash) => { sellosDeTiempo.push(hash); return { token: TOKEN, fecha: new Date() }; }),
    crearNotificacion: async (datos) => { notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { emisiones.push({ usuarioId, evento, datos }); },
  };
  // Sin opciones se usan valores normales; una clave presente se respeta aunque sea undefined.
  const opcion = (o, clave, defecto) => (clave in o ? o[clave] : defecto);
  return {
    ...bd, reportes, pdfAnterior, rutaBaseDocumentos, rutaBaseRubricas, sellosDeTiempo, generados, notificaciones, emisiones, deps,
    reporte: reportes[0],
    estadoActual: () => structuredClone(reportes),
    // reenviar(actividades, { usuario, id, tipo, deps }) · vistaPrevia igual. Sin argumentos usa las actividades nuevas; un
    // `undefined` explícito se respeta (para probar entradas inválidas).
    reenviar: (...args) => reenviarReporteCorregido(opcion(args[1] ?? {}, 'usuario', ALUMNO), opcion(args[1] ?? {}, 'tipo', 'mensual'), opcion(args[1] ?? {}, 'id', 1),
      args.length ? args[0] : ACTIVIDADES_NUEVAS, { ...deps, ...(args[1] ?? {}).deps }),
    vistaPrevia: (...args) => generarVistaPreviaCorreccion(opcion(args[1] ?? {}, 'usuario', ALUMNO), opcion(args[1] ?? {}, 'tipo', 'mensual'), opcion(args[1] ?? {}, 'id', 1),
      args.length ? args[0] : ACTIVIDADES_NUEVAS, { ...deps, ...(args[1] ?? {}).deps }),
  };
}

const codigo = (c, status) => (err) => err.code === c && (status === undefined || err.status === status);
const revisionesDe = (reporte) => reporte.revision_reporte_mensual;
const sinCambios = (e, antes, mensaje = 'no cambia nada') => assert.deepEqual(e.estadoActual(), antes, mensaje);
const es404 = (err) => err.status === 404 && err.message === 'Reporte no encontrado.';

// ══ Reenvío ═══════════════════════════════════════════════════

test('reenviar: pasa a pendiente_revision_profesor con las actividades nuevas y el snapshot INTACTO (número, días, horas)', async (t) => {
  const e = await escenario(t);
  const r = await e.reenviar();

  assert.deepEqual(r, { reporte: { id: 1, numero: 2, estadoReporte: 'pendiente_revision_profesor' }, fechaEnvio: '2026-09-22T15:00:00.000Z' });
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.equal(e.reporte.actividades_mes, ACTIVIDADES_NUEVAS);
  assert.equal(e.reporte.num_reporte, 2);
  assert.equal(e.reporte.dias_laborados, 4);
  assert.equal(e.reporte.horas_reportadas, 13);
  // Nunca se consultan bitácoras (el modelo no existe en la BD falsa: consultarlas haría fallar todo).
  assert.ok(!e.operaciones.some((o) => o.startsWith('bitacora')));
});

test('reenviar: el PDF usa la plantilla con el número y el periodo del snapshot, los datos actuales del alumno, y la rúbrica YA registrada', async (t) => {
  const e = await escenario(t);
  await e.reenviar();

  assert.equal(e.generados.length, 1);
  const { datos, rubrica } = e.generados[0];
  assert.equal(datos.numeroReporte, 2);
  assert.equal(datos.periodo.inicioTexto, '17 de agosto de 2026', 'periodo del reporte 2 según el periodo oficial (el 16 de agosto es domingo); no sale de bitácoras');
  assert.equal(datos.alumno.nombreCompleto, 'ANA GARCIA LOPEZ');
  assert.equal(datos.profesor.nombreCompleto, 'LUIS TORRES VEGA');
  assert.equal(datos.programa, 'Programa SISS de prueba');
  assert.equal(datos.actividades.texto, ACTIVIDADES_NUEVAS);
  assert.equal(Buffer.compare(rubrica, RUBRICA), 0, 'la rúbrica guardada, sin pedir otra');
  assert.ok(!e.operaciones.includes('usuario.updateMany'), 'no se registra una rúbrica nueva');
  assert.deepEqual(archivos(e.rutaBaseRubricas), ['2022630001/Rubrica/rubrica.enc'], 'la rúbrica anterior no se toca');
});

test('reenviar: hash, TSA, archivo y BD son de ESE mismo Buffer; el documento apunta al PDF nuevo y el anterior queda en disco', async (t) => {
  const e = await escenario(t);
  await e.reenviar();

  const rutaNueva = e.reporte.documento.ruta_archivo;
  assert.notEqual(rutaNueva, '2022630001/anterior.pdf');
  assert.match(rutaNueva, /^2022630001\/Reportes\/[0-9a-f-]{36}\.pdf$/);
  const guardado = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, rutaNueva)));
  assert.equal(guardado.toString(), `%PDF-corregido\n${ACTIVIDADES_NUEVAS}`);
  assert.deepEqual(e.sellosDeTiempo, [sha256(guardado)], 'la TSA recibió el hash del Buffer que se guardó');
  assert.equal(revisionesDe(e.reporte).at(-1).hash_documento, sha256(guardado));
  // El PDF anterior sigue ahí, byte por byte.
  assert.equal(Buffer.compare(descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, '2022630001/anterior.pdf'))), e.pdfAnterior), 0);
  assert.equal(archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 2);
});

test('reenviar: agrega una revisión NUEVA del alumno (hash, IP, TSA) y conserva TODO el historial anterior sin tocarlo', async (t) => {
  const e = await escenario(t);
  const antes = revisionesDe(e.reporte).map((r) => structuredClone(r));

  await e.reenviar();

  const revisiones = revisionesDe(e.reporte);
  assert.deepEqual(revisiones.slice(0, antes.length), antes, 'las revisiones, hashes y sellos de tiempo anteriores quedan idénticos');
  assert.equal(revisiones.length, antes.length + 1);
  const { id, usuario, ruta_archivo: rutaArchivo, ...nueva } = revisiones.at(-1);
  assert.equal(usuario, undefined);
  assert.ok(id > 9000);
  assert.equal(rutaArchivo, e.reporte.documento.ruta_archivo, 'la revisión apunta al PDF nuevo, el mismo que ya quedó vigente en el documento');
  assert.deepEqual({ ...nueva, hash_documento: '(hash)' }, {
    reporte_mensual_id: 1,
    usuario_id: ALUMNO,
    tipo_revisor: 'alumno',
    estado: 'aprobado',
    comentario: null,
    hash_documento: '(hash)',
    ip_firma: IP,
    token_tsa: TOKEN,
    fecha: new Date('2026-09-22T15:00:00.000Z'),
  });
  assert.equal(revisiones.filter((r) => r.tipo_revisor === 'profesor' && r.estado === 'rechazado').length, 1, 'el rechazo anterior se conserva');
});

test('reenviar tras un rechazo de COORDINACIÓN: vuelve al profesor (nunca directo a coordinación) y conserva la aprobación anterior del profesor', async (t) => {
  const e = await escenario(t, { estado: ESTADOS_REPORTE.RECHAZADO_COORDINADOR });
  const antes = revisionesDe(e.reporte).map((r) => structuredClone(r));

  const r = await e.reenviar();

  assert.equal(r.reporte.estadoReporte, 'pendiente_revision_profesor');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  const revisiones = revisionesDe(e.reporte);
  assert.deepEqual(revisiones.slice(0, antes.length), antes, 'la firma anterior del profesor y el rechazo de coordinación siguen como historia');
  assert.deepEqual(revisiones.slice(antes.length).map((x) => [x.tipo_revisor, x.estado]), [['alumno', 'aprobado']], 'solo una revisión nueva: la del alumno; ninguna del profesor se reutiliza');
  assert.equal(e.notificaciones[0].usuarioId, PROFESOR_DEL_REPORTE, 'avisa al profesor, no a coordinación');
});

test('reenviar: avisa al profesor con la notificación existente (destacando el reporte) y el evento reporte:nuevo', async (t) => {
  const e = await escenario(t);
  await e.reenviar();
  assert.deepEqual(e.notificaciones, [{
    usuarioId: PROFESOR_DEL_REPORTE,
    tipo: 'warning',
    mensaje: 'ANA GARCIA LOPEZ corrigió y reenvió el Reporte Mensual No. 2 para tu revisión.',
    rutaRelacionada: '/profesor/reportes?destacar=1',
  }]);
  assert.deepEqual(e.emisiones, [{ usuarioId: PROFESOR_DEL_REPORTE, evento: 'reporte:nuevo', datos: { reporteId: 1 } }]);
});

test('reenviar: fail-open — si falla la notificación o el socket, el reenvío ya confirmado no se revierte', async (t) => {
  const registro = t.mock.method(console, 'error', () => {});
  const e = await escenario(t);
  const r = await e.reenviar(ACTIVIDADES_NUEVAS, { deps: {
    crearNotificacion: async () => { throw new Error('notificaciones caídas'); },
    emitirAUsuario: () => { throw new Error('socket no inicializado'); },
  } });
  assert.equal(r.reporte.estadoReporte, 'pendiente_revision_profesor');
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);
  assert.equal(registro.mock.callCount(), 2);
});

// ── Quién y cuándo ───────────────────────────────────────────

test('reenviar: solo reportes rechazados — pendiente, en coordinación o aprobado → 409 con el estado y sin cambios', async (t) => {
  for (const [id, estado] of [[3, 'pendiente_revision_profesor'], [4, 'aprobado_coordinador']]) {
    const e = await escenario(t);
    const antes = e.estadoActual();
    await assert.rejects(e.reenviar(ACTIVIDADES_NUEVAS, { id }), (err) => err.status === 409 && err.code === CODIGOS_ERROR.REPORTE_NO_CORREGIBLE && err.estadoReporte === estado, estado);
    assert.deepEqual([e.sellosDeTiempo, e.generados], [[], []]);
    sinCambios(e, antes);
  }
  const enCoordinacion = await escenario(t, { estado: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR });
  await assert.rejects(enCoordinacion.reenviar(), codigo(CODIGOS_ERROR.REPORTE_NO_CORREGIBLE, 409));
});

test('reenviar/vista previa: solo el alumno dueño — ajeno, inexistente, global, otro tipo o id inválido → el mismo 404 sin generar nada', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const hacer of [(o) => e.reenviar(ACTIVIDADES_NUEVAS, o), (o) => e.vistaPrevia(ACTIVIDADES_NUEVAS, o)]) {
    await assert.rejects(hacer({ id: 2 }), es404, 'de otro alumno');
    await assert.rejects(hacer({ usuario: OTRO_ALUMNO }), es404, 'quien no es el dueño');
    await assert.rejects(hacer({ id: 999 }), es404);
    for (const [tipo, id] of [['global', 1], ['semanal', 1], ['__proto__', 1]]) await assert.rejects(hacer({ tipo, id }), es404, `${tipo}/${id}`);
    for (const id of ['abc', 0, '1.5', undefined]) await assert.rejects(hacer({ id }), es404, String(id));
  }
  assert.deepEqual([e.sellosDeTiempo, e.generados], [[], []]);
  sinCambios(e, antes);
});

// ── Actividades ──────────────────────────────────────────────

test('se exige un cambio REAL en las actividades: iguales, con otros saltos de línea, líneas vacías o espacios de más no cuentan', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const igual of [
    ACTIVIDADES_ORIGINALES,
    ACTIVIDADES_ORIGINALES.replace('\n', '\r\n'),
    `\n\n${ACTIVIDADES_ORIGINALES}\n\n`,
    ACTIVIDADES_ORIGINALES.replace('\n', '\n\n\n'),
    `  ${ACTIVIDADES_ORIGINALES}  `,
    ACTIVIDADES_ORIGINALES.replace('Actividad original', 'Actividad   original'),
  ]) {
    await assert.rejects(e.reenviar(igual), codigo(CODIGOS_ERROR.SIN_CAMBIOS_EN_ACTIVIDADES, 422), JSON.stringify(igual));
    await assert.rejects(e.vistaPrevia(igual), codigo(CODIGOS_ERROR.SIN_CAMBIOS_EN_ACTIVIDADES, 422));
  }
  assert.deepEqual([e.sellosDeTiempo, e.generados], [[], []]);
  sinCambios(e, antes);
  await e.reenviar(`${ACTIVIDADES_ORIGINALES} Y algo más.`); // cualquier cambio de contenido sí cuenta
});

test('actividades vacías, ausentes o con caracteres no imprimibles se rechazan con los códigos de siempre y sin cambios', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  for (const malo of [undefined, null, '', '   \n  ']) await assert.rejects(e.reenviar(malo), codigo('ACTIVIDADES_VACIAS'), String(malo));
  await assert.rejects(e.reenviar('Actividad con emoji 😀 no imprimible'), codigo('CARACTERES_NO_SOPORTADOS', 400));
  sinCambios(e, antes);
});

test('normalizarActividades: mismo criterio que validarActividades (saltos de línea, líneas vacías y espacios en los extremos)', () => {
  assert.equal(normalizarActividades('  a\r\n\r\nb  \n'), normalizarActividades('a\nb'));
  assert.equal(normalizarActividades(null), '');
  assert.equal(normalizarActividades('a  b'), normalizarActividades('a b'), 'los espacios repetidos se unifican, igual que al validar');
  assert.notEqual(normalizarActividades('a b'), normalizarActividades('a c'));
});

// ── Datos del PDF ────────────────────────────────────────────

test('si faltan datos para imprimir (correo personal, profesor, programa) → 409 REPORTE_NO_GENERABLE con los motivos; sin periodo oficial también', async (t) => {
  const sinCorreo = await escenario(t, { alumno: { correoPersonal: null } });
  await assert.rejects(sinCorreo.reenviar(), (err) => err.status === 409 && err.code === CODIGOS_ERROR.REPORTE_NO_GENERABLE && err.motivosBloqueo.some((m) => m.codigo === 'SIN_CORREO_PERSONAL'));
  const sinProfesor = await escenario(t, { alumno: { sinOferta: true } });
  await assert.rejects(sinProfesor.vistaPrevia(), (err) => err.code === CODIGOS_ERROR.REPORTE_NO_GENERABLE && err.motivosBloqueo.some((m) => m.codigo === 'SIN_PROFESOR_RESPONSABLE'));
  const sinPeriodo = await escenario(t, { alumno: { sinPeriodo: true } });
  await assert.rejects(sinPeriodo.reenviar(), (err) => err.code === CODIGOS_ERROR.REPORTE_NO_GENERABLE && err.motivosBloqueo.some((m) => m.codigo === 'SIN_PERIODO_OFICIAL'));
  for (const e of [sinCorreo, sinProfesor, sinPeriodo]) assert.deepEqual([e.sellosDeTiempo, e.generados, e.reporte.estado_reporte], [[], [], ESTADOS_REPORTE.RECHAZADO_PROFESOR]);
});

test('sin rúbrica registrada → 409 RUBRICA_NO_REGISTRADA (no se pide una nueva aquí) y no se genera ni sella nada', async (t) => {
  const e = await escenario(t, { sinRubrica: true });
  const antes = e.estadoActual();
  await assert.rejects(e.reenviar(), codigo(CODIGOS_ERROR.RUBRICA_NO_REGISTRADA, 409));
  await assert.rejects(e.vistaPrevia(), codigo(CODIGOS_ERROR.RUBRICA_NO_REGISTRADA, 409));
  assert.deepEqual([e.sellosDeTiempo, e.generados], [[], []]);
  sinCambios(e, antes);
});

// ── Vista previa ─────────────────────────────────────────────

test('vista previa: genera el PDF corregido en memoria con la misma plantilla — sin firmar, sellar ni guardar nada', async (t) => {
  const e = await escenario(t);
  const antes = e.estadoActual();
  const archivosAntes = archivos(e.rutaBaseDocumentos);

  const { pdf, numeroReporte } = await e.vistaPrevia();

  assert.equal(numeroReporte, 2);
  assert.equal(pdf.toString(), `%PDF-corregido\n${ACTIVIDADES_NUEVAS}`);
  assert.equal(Buffer.compare(e.generados[0].rubrica, RUBRICA), 0);
  assert.deepEqual(e.sellosDeTiempo, [], 'sin TSA');
  assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, 'no se guarda ningún archivo');
  sinCambios(e, antes);
  assert.ok(e.operaciones.every((o) => /\.(findUnique|findFirst|findMany)$/.test(o)), `solo lecturas: ${e.operaciones.join(', ')}`);
});

// ── Fallos: nada avanza ──────────────────────────────────────

test('si la TSA falla (sin conexión, respuesta inservible) → 503 reintentable y NO se avanza el estado ni queda archivo ni revisión', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const tsa of [
    async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); },
    async () => ({ token: '' }),
    async () => null,
  ]) {
    const e = await escenario(t, { tsa });
    const antes = e.estadoActual();
    const archivosAntes = archivos(e.rutaBaseDocumentos);
    await assert.rejects(e.reenviar(), (err) => err.status === 503 && err.code === 'SELLO_TIEMPO_NO_DISPONIBLE' && err.reintentable === true);
    sinCambios(e, antes);
    assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, 'sin archivo nuevo');
    assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
    assert.ok(!e.operaciones.includes('$transaction'), 'ni siquiera se abre la transacción');
  }
});

test('si falla la persistencia en BD, todo se revierte (estado, actividades, documento, revisión) y el archivo nuevo se borra', async (t) => {
  for (const operacion of ['revision_reporte_mensual.create', 'documento.updateMany']) {
    const e = await escenario(t, { bd: { fallos: { [operacion]: new Error('BD caída') } } });
    const antes = e.estadoActual();
    const archivosAntes = archivos(e.rutaBaseDocumentos);
    await assert.rejects(e.reenviar(), /BD caída/, operacion);
    sinCambios(e, antes, operacion);
    assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_PROFESOR);
    assert.equal(e.reporte.actividades_mes, ACTIVIDADES_ORIGINALES);
    assert.deepEqual(archivos(e.rutaBaseDocumentos), archivosAntes, `${operacion}: el archivo nuevo se borró`);
    assert.deepEqual([e.notificaciones, e.emisiones], [[], []]);
  }
});

test('dos reenvíos simultáneos — solo uno avanza; el otro recibe 409, su archivo se borra y se avisa una sola vez', async (t) => {
  const e = await escenario(t, { tsa: async (hash) => { await new Promise((r) => setTimeout(r, 25)); return { token: `${TOKEN}-${hash.slice(0, 6)}`, fecha: new Date() }; } });
  const antes = revisionesDe(e.reporte).length;
  const resultados = await Promise.allSettled([e.reenviar(ACTIVIDADES_NUEVAS), e.reenviar(`${ACTIVIDADES_NUEVAS} Otra.`)]);

  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find((r) => r.status === 'rejected').reason.code, CODIGOS_ERROR.REPORTE_NO_CORREGIBLE);
  assert.equal(revisionesDe(e.reporte).length, antes + 1, 'una sola revisión nueva');
  assert.equal(e.notificaciones.length, 1);
  const propios = archivos(e.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/'));
  assert.equal(propios.length, 2, 'el PDF anterior y el registrado; el del perdedor se borró');
  assert.ok(propios.includes(e.reporte.documento.ruta_archivo));
});

test('si el reporte cambió mientras se firmaba (otro archivo en el documento o ya no rechazado) → 409 y no se pisa nada', async (t) => {
  const cambiaArchivo = await escenario(t, { tsa: async (hash) => { cambiaArchivo.reporte.documento.ruta_archivo = '2022630001/otro.pdf'; return { token: TOKEN }; } });
  await assert.rejects(cambiaArchivo.reenviar(), codigo(CODIGOS_ERROR.REPORTE_NO_CORREGIBLE, 409));
  assert.equal(cambiaArchivo.reporte.documento.ruta_archivo, '2022630001/otro.pdf');
  assert.equal(archivos(cambiaArchivo.rutaBaseDocumentos).filter((a) => a.startsWith('2022630001/')).length, 1, 'el archivo nuevo se borró');

  const cambiaEstado = await escenario(t, { tsa: async () => { cambiaEstado.reporte.estado_reporte = ESTADOS_REPORTE.RECHAZADO_COORDINADOR; return { token: TOKEN }; } });
  await assert.rejects(cambiaEstado.reenviar(), codigo(CODIGOS_ERROR.REPORTE_NO_CORREGIBLE, 409));
  assert.equal(cambiaEstado.reporte.estado_reporte, ESTADOS_REPORTE.RECHAZADO_COORDINADOR);
  assert.equal(cambiaEstado.reporte.actividades_mes, ACTIVIDADES_ORIGINALES);
});

test('la IP sale de la conexión y una IP inservible no se guarda', async (t) => {
  const e = await escenario(t);
  await e.reenviar(ACTIVIDADES_NUEVAS, { deps: { ip: 'x'.repeat(60) } });
  assert.equal(revisionesDe(e.reporte).at(-1).ip_firma, null);
});

test('reenviar: solo lecturas y las escrituras previstas — nunca se borra ni se modifica una revisión (append-only)', async (t) => {
  const e = await escenario(t);
  await e.reenviar();
  const permitidas = new Set(['reporte_mensual.findFirst', 'alumno.findUnique', 'usuario.findUnique', '$transaction', 'reporte_mensual.updateMany', 'documento.updateMany', 'revision_reporte_mensual.create']);
  assert.ok(e.operaciones.every((o) => permitidas.has(o)), e.operaciones.join(', '));
  assert.throws(() => e.prisma.revision_reporte_mensual.deleteMany, /Operación no permitida/);
  assert.throws(() => e.prisma.revision_reporte_mensual.updateMany, /Operación no permitida/);
});

// ── PDF real ─────────────────────────────────────────────────

test('PDF real: el reenvío guarda una página Carta con la firma del alumno y el hash del archivo coincide con el registrado', async (t) => {
  const { generarPdfReporteMensual } = require('./reportes.pdf');
  const e = await escenario(t, { generarPdf: generarPdfReporteMensual });
  await e.reenviar();

  const guardado = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, e.reporte.documento.ruta_archivo)));
  const documento = await PDFDocument.load(new Uint8Array(guardado));
  assert.equal(documento.getPageCount(), 1);
  assert.deepEqual([Math.round(documento.getPage(0).getWidth()), Math.round(documento.getPage(0).getHeight())], [612, 792]);
  assert.equal(revisionesDe(e.reporte).at(-1).hash_documento, sha256(guardado));
  assert.deepEqual(e.sellosDeTiempo, [sha256(guardado)]);
  assert.equal(e.reporte.estado_reporte, ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR);

  const { pdf } = await (await escenario(t, { generarPdf: generarPdfReporteMensual })).vistaPrevia();
  assert.equal((await PDFDocument.load(new Uint8Array(pdf))).getPageCount(), 1);
});
