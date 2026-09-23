// Prueba SEGURA de las cascadas reales de MariaDB para el E2E de bajas.
//
// Abre una transacción, borra al usuario E2E, comprueba DENTRO de la misma transacción qué filas
// desaparecieron de verdad por CASCADE, y hace ROLLBACK SIEMPRE. Nunca hace COMMIT, nunca toca el
// filesystem y nunca llama al endpoint de aprobación.
//
// El rollback se fuerza lanzando un error al final del callback: Prisma revierte la transacción
// interactiva ante cualquier excepción. El error es esperado y se captura afuera.
//
// Uso: node backend/src/modules/administrativa/bajas/seed/prueba-cascade-rollback.js

require('dotenv').config();
const prisma = require('../../../../lib/prisma');
const { snapshot, imprimir, BOLETA, CORREO } = require('./snapshot-e2e-bajas');

const ROLLBACK_INTENCIONAL = 'ROLLBACK_INTENCIONAL_E2E';
// COALESCE/SUM devuelven Decimal (no number) en este driver, y COUNT devuelve BigInt:
// se normaliza todo a number antes de comparar, o las igualdades estrictas fallan.
const n = (v) => (v === null || v === undefined ? 0 : Number(v));

// Cuentas medidas DENTRO de la transacción, con SQL crudo y nombres reales.
async function contarTodo(tx, usuarioId, srId) {
  const uno = async (sql, ...p) => n((await tx.$queryRawUnsafe(sql, ...p))[0].n);
  return {
    usuario: await uno('SELECT COUNT(*) n FROM usuario WHERE id = ?', usuarioId),
    alumno: await uno('SELECT COUNT(*) n FROM alumno WHERE boleta = ?', BOLETA),
    solicitud_registro: await uno('SELECT COUNT(*) n FROM solicitud_registro WHERE alumno_id = ?', BOLETA),
    solicitud_baja: await uno('SELECT COUNT(*) n FROM solicitud_baja WHERE alumno_id = ?', BOLETA),
    documento: await uno('SELECT COUNT(*) n FROM documento WHERE alumno_id = ?', BOLETA),
    cumulo_horas_y_faltas: await uno('SELECT COUNT(*) n FROM cumulo_horas_y_faltas WHERE alumno_id = ?', BOLETA),
    actividad: await uno('SELECT COUNT(*) n FROM actividad WHERE solicitud_registro_id = ?', srId),
    bitacora: await uno('SELECT COUNT(*) n FROM bitacora WHERE solicitud_registro_id = ?', srId),
    registro_bitacora_actividades: await uno(
      'SELECT COUNT(*) n FROM registro_bitacora_actividades r JOIN bitacora b ON b.id = r.bitacora_id WHERE b.solicitud_registro_id = ?', srId),
    reporte_mensual: await uno('SELECT COUNT(*) n FROM reporte_mensual WHERE solicitud_registro_id = ?', srId),
    revision_reporte_mensual: await uno(
      'SELECT COUNT(*) n FROM revision_reporte_mensual v JOIN reporte_mensual r ON r.id = v.reporte_mensual_id WHERE r.solicitud_registro_id = ?', srId),
    notificacion: await uno('SELECT COUNT(*) n FROM notificacion WHERE usuario_id = ?', usuarioId),
    // Ajenos: no deben moverse ni un milímetro.
    usuariosTotales: await uno('SELECT COUNT(*) n FROM usuario'),
    ofertasTotales: await uno('SELECT COUNT(*) n FROM oferta_servicio'),
    cuposOfertaE2E: await uno("SELECT COALESCE(cupos_disponibles,0) n FROM oferta_servicio WHERE nombre_proyecto LIKE '[E2E-BAJAS]%'"),
    cuposTotalesProfesor: await uno('SELECT cupos_totales n FROM profesor WHERE id = 1'),
  };
}

(async () => {
  console.log('═══ PRUEBA DE CASCADE CON ROLLBACK (sin COMMIT) ═══\n');

  const usuario = await prisma.$queryRawUnsafe('SELECT id FROM usuario WHERE correo_institucional = ?', CORREO);
  if (usuario.length === 0) {
    console.error('⛔ No existe el usuario E2E. Corre primero seed-e2e-bajas.js');
    process.exit(1);
  }
  const usuarioId = usuario[0].id;
  const srId = (await prisma.$queryRawUnsafe('SELECT id FROM solicitud_registro WHERE alumno_id = ?', BOLETA))[0].id;

  let antes = null;
  let despues = null;
  let errorFk = null;

  try {
    await prisma.$transaction(async (tx) => {
      antes = await contarTodo(tx, usuarioId, srId);

      // El DELETE bajo prueba. Si alguna FK lo impidiera, MariaDB lanzaría aquí.
      await tx.$executeRawUnsafe('DELETE FROM usuario WHERE id = ?', usuarioId);

      despues = await contarTodo(tx, usuarioId, srId);

      // Fuerza el ROLLBACK: nada de lo anterior se confirma.
      throw new Error(ROLLBACK_INTENCIONAL);
    });
  } catch (err) {
    if (err.message !== ROLLBACK_INTENCIONAL) {
      errorFk = err;
    }
  }

  if (errorFk) {
    console.error('⛔ EL DELETE FALLÓ — no se modificó el schema. Error exacto:\n');
    console.error('  ', errorFk.message);
    console.error('\n  code:', errorFk.code, '| meta:', JSON.stringify(errorFk.meta ?? {}));
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('DELETE ejecutado dentro de la transacción y revertido con ROLLBACK.\n');
  console.log('Tabla                              antes  después  resultado');
  console.log('─────────────────────────────────  ─────  ───────  ─────────────────────');
  const esperadoCero = [
    'usuario', 'alumno', 'solicitud_registro', 'solicitud_baja', 'documento',
    'cumulo_horas_y_faltas', 'actividad', 'bitacora', 'registro_bitacora_actividades',
    'reporte_mensual', 'revision_reporte_mensual', 'notificacion',
  ];
  let todoOk = true;
  for (const tabla of esperadoCero) {
    const ok = despues[tabla] === 0 && antes[tabla] > 0;
    if (!ok) todoOk = false;
    console.log(`${tabla.padEnd(34)} ${String(antes[tabla]).padStart(5)}  ${String(despues[tabla]).padStart(7)}  ${ok ? '✅ eliminado por CASCADE' : '❌ NO se eliminó'}`);
  }

  console.log('\nDatos que NO deben moverse:');
  const invariantes = [
    ['usuariosTotales', antes.usuariosTotales - 1, 'un usuario menos (el E2E), el resto intacto'],
    ['ofertasTotales', antes.ofertasTotales, 'ninguna oferta se borra'],
    ['cuposOfertaE2E', antes.cuposOfertaE2E, 'el DELETE por sí solo NO libera cupo'],
    ['cuposTotalesProfesor', antes.cuposTotalesProfesor, 'cupos_totales del profesor intacto'],
  ];
  for (const [clave, esperado, nota] of invariantes) {
    const ok = despues[clave] === esperado;
    if (!ok) todoOk = false;
    console.log(`  ${clave.padEnd(24)} ${String(antes[clave]).padStart(4)} → ${String(despues[clave]).padStart(4)}  esperado ${String(esperado).padStart(4)}  ${ok ? '✅' : '❌'}  (${nota})`);
  }

  console.log('\n' + (todoOk
    ? '✅ Las cascadas reales eliminan TODO el proceso con un solo DELETE sobre usuario.'
    : '❌ Alguna comprobación falló — revisar arriba.'));

  console.log('\n═══ Verificando que el ROLLBACK devolvió todo ═══');
  imprimir('DESPUÉS DEL ROLLBACK', await snapshot());

  await prisma.$disconnect();
})();
