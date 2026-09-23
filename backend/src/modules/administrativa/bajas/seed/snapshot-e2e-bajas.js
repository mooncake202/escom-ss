// Snapshot del estado del E2E de bajas. SOLO LECTURA — no escribe nada.
//
// Muestra dos bloques: los datos del alumno E2E (los que deben desaparecer con la baja) y los
// conteos globales + datos ajenos (los que NO deben cambiar). Usa SQL crudo con los nombres reales
// de tablas y columnas, para no depender de la capa de Prisma al comprobar cascadas.
//
// Uso: node backend/src/modules/administrativa/bajas/seed/snapshot-e2e-bajas.js [etiqueta]

require('dotenv').config();
const prisma = require('../../../../lib/prisma');

const BOLETA = '2099999999';
const CORREO = 'e2e.baja@alumno.ipn.mx';
const PROFESOR_ID = 1;

// COALESCE/SUM devuelven Decimal (no number) en este driver, y COUNT devuelve BigInt:
// se normaliza todo a number antes de comparar, o las igualdades estrictas fallan.
const n = (v) => (v === null || v === undefined ? 0 : Number(v));

async function contar(sql, ...params) {
  const filas = await prisma.$queryRawUnsafe(sql, ...params);
  return n(filas[0]?.n ?? 0);
}

async function snapshot() {
  const usuario = await prisma.$queryRawUnsafe(
    'SELECT id, rol, correo_institucional, nombre, apellidos FROM usuario WHERE correo_institucional = ?', CORREO);
  const usuarioId = usuario[0]?.id ?? -1;

  const sr = await prisma.$queryRawUnsafe(
    'SELECT id, alumno_id, oferta_id, estado_solicitud FROM solicitud_registro WHERE alumno_id = ?', BOLETA);
  const srId = sr[0]?.id ?? -1;

  return {
    // ── Datos del alumno E2E (deben desaparecer) ──
    e2e: {
      usuario: usuario.length,
      alumno: await contar('SELECT COUNT(*) n FROM alumno WHERE boleta = ?', BOLETA),
      solicitud_registro: await contar('SELECT COUNT(*) n FROM solicitud_registro WHERE alumno_id = ?', BOLETA),
      solicitud_baja: await contar('SELECT COUNT(*) n FROM solicitud_baja WHERE alumno_id = ?', BOLETA),
      documento: await contar('SELECT COUNT(*) n FROM documento WHERE alumno_id = ?', BOLETA),
      cumulo_horas_y_faltas: await contar('SELECT COUNT(*) n FROM cumulo_horas_y_faltas WHERE alumno_id = ?', BOLETA),
      actividad: await contar('SELECT COUNT(*) n FROM actividad WHERE solicitud_registro_id = ?', srId),
      bitacora: await contar('SELECT COUNT(*) n FROM bitacora WHERE solicitud_registro_id = ?', srId),
      registro_bitacora_actividades: await contar(
        'SELECT COUNT(*) n FROM registro_bitacora_actividades r JOIN bitacora b ON b.id = r.bitacora_id WHERE b.solicitud_registro_id = ?', srId),
      reporte_mensual: await contar('SELECT COUNT(*) n FROM reporte_mensual WHERE solicitud_registro_id = ?', srId),
      revision_reporte_mensual: await contar(
        'SELECT COUNT(*) n FROM revision_reporte_mensual v JOIN reporte_mensual r ON r.id = v.reporte_mensual_id WHERE r.solicitud_registro_id = ?', srId),
      notificacion: await contar('SELECT COUNT(*) n FROM notificacion WHERE usuario_id = ?', usuarioId),
    },
    detalle: {
      usuarioId,
      solicitudRegistroId: srId,
      estadoSolicitud: sr[0]?.estado_solicitud ?? null,
      solicitudBaja: (await prisma.$queryRawUnsafe(
        'SELECT id, estado, coordinador_id, documento_id, fecha_respuesta, comentario FROM solicitud_baja WHERE alumno_id = ?', BOLETA))[0] ?? null,
      documentos: await prisma.$queryRawUnsafe(
        'SELECT id, tipo_documento, estado_documento, ruta_archivo FROM documento WHERE alumno_id = ? ORDER BY id', BOLETA),
      cumulo: (await prisma.$queryRawUnsafe(
        'SELECT horas_acumuladas, horas_rechazadas, faltas_acumuladas, faltas_consecutivas FROM cumulo_horas_y_faltas WHERE alumno_id = ?', BOLETA))[0] ?? null,
    },
    // ── Cupos: la oferta E2E y la capacidad del profesor ──
    cupos: {
      ofertaE2E: (await prisma.$queryRawUnsafe(
        "SELECT id, estado_oferta, tipo_oferta, cupos_ofertados, cupos_disponibles FROM oferta_servicio WHERE nombre_proyecto LIKE '[E2E-BAJAS]%'"))[0] ?? null,
      profesor: (await prisma.$queryRawUnsafe(
        'SELECT id, cupos_totales, caracteristica_id FROM profesor WHERE id = ?', PROFESOR_ID))[0] ?? null,
    },
    // ── Totales globales: NO deben cambiar (salvo los del propio alumno E2E) ──
    globales: {
      usuario: await contar('SELECT COUNT(*) n FROM usuario'),
      alumno: await contar('SELECT COUNT(*) n FROM alumno'),
      profesor: await contar('SELECT COUNT(*) n FROM profesor'),
      coordinador: await contar('SELECT COUNT(*) n FROM coordinador'),
      solicitud_registro: await contar('SELECT COUNT(*) n FROM solicitud_registro'),
      oferta_servicio: await contar('SELECT COUNT(*) n FROM oferta_servicio'),
      documento: await contar('SELECT COUNT(*) n FROM documento'),
      bitacora: await contar('SELECT COUNT(*) n FROM bitacora'),
      actividad: await contar('SELECT COUNT(*) n FROM actividad'),
      reporte_mensual: await contar('SELECT COUNT(*) n FROM reporte_mensual'),
      revision_reporte_mensual: await contar('SELECT COUNT(*) n FROM revision_reporte_mensual'),
      notificacion: await contar('SELECT COUNT(*) n FROM notificacion'),
      solicitud_baja: await contar('SELECT COUNT(*) n FROM solicitud_baja'),
      cumulo_horas_y_faltas: await contar('SELECT COUNT(*) n FROM cumulo_horas_y_faltas'),
    },
    // Suma de cupos_disponibles de TODAS las ofertas ajenas: detecta cualquier liberación indebida.
    cuposAjenos: await contar(
      "SELECT COALESCE(SUM(cupos_disponibles),0) n FROM oferta_servicio WHERE nombre_proyecto NOT LIKE '[E2E-BAJAS]%'"),
  };
}

function imprimir(etiqueta, s) {
  console.log(`\n═══════════ SNAPSHOT: ${etiqueta} ═══════════`);
  console.log('\n── Datos del alumno E2E (boleta ' + BOLETA + ') ──');
  for (const [tabla, cuenta] of Object.entries(s.e2e)) console.log(`  ${tabla.padEnd(32)} ${cuenta}`);

  console.log('\n── Detalle ──');
  console.log('  usuario.id              :', s.detalle.usuarioId);
  console.log('  solicitud_registro.id   :', s.detalle.solicitudRegistroId, '| estado:', s.detalle.estadoSolicitud);
  console.log('  solicitud_baja          :', JSON.stringify(s.detalle.solicitudBaja));
  console.log('  cumulo                  :', JSON.stringify(s.detalle.cumulo));
  for (const d of s.detalle.documentos) console.log(`    documento ${d.id}: ${d.tipo_documento} / ${d.estado_documento} → ${d.ruta_archivo}`);

  console.log('\n── Cupos ──');
  console.log('  oferta E2E              :', JSON.stringify(s.cupos.ofertaE2E));
  console.log('  profesor id=1           :', JSON.stringify(s.cupos.profesor));
  console.log('  suma cupos_disponibles de ofertas AJENAS:', s.cuposAjenos);

  console.log('\n── Totales globales ──');
  for (const [tabla, cuenta] of Object.entries(s.globales)) console.log(`  ${tabla.padEnd(32)} ${cuenta}`);
}

if (require.main === module) {
  snapshot()
    .then((s) => { imprimir(process.argv[2] ?? 'actual', s); return prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}

module.exports = { snapshot, imprimir, BOLETA, CORREO, PROFESOR_ID };
