// test-cron-faltas.js
//
// Prueba manual del cron nocturno de faltas (CU-AH-03, RN-AH-13) sin
// esperar a las 06:00 UTC — llama directamente a contabilizarFaltasDiarias(),
// la misma función que usa el schedule real de producción (ah.cron.js), sin
// pasar por node-cron ni por HTTP. Reutiliza los mismos helpers de
// ah.shared.js que usa la función real (calcularDiaMexicoUTC, restarDias,
// esDiaLaborable, obtenerBitacoraDelDia) — no reimplementa nada de esa
// lógica, solo la usa para PREVER el recorrido antes de ejecutar.
//
// Desde que contabilizarFaltasDiarias recorre TODOS los días pendientes
// desde fecha_ultima_evaluacion_faltas (no solo "ayer"), este script
// muestra por alumno el RANGO completo recorrido, no un solo día.
//
// ADVERTENCIA: esto SÍ escribe datos reales — cualquier
// solicitud_registro 'alumno_asignado' con días laborables pendientes sin
// bitácora quedará con faltas_acumuladas/faltas_consecutivas
// incrementadas, igual que lo haría el cron en producción.
//
// USO:
//   docker compose exec backend node backend/test-cron-faltas.js

const prisma = require('./src/lib/prisma');
const { contabilizarFaltasDiarias } = require('./src/modules/ah/ah.cron');
const { calcularDiaMexicoUTC, restarDias, esDiaLaborable, obtenerBitacoraDelDia, LIMITE_HORAS_SERVICIO } = require('./src/modules/ah/ah.shared');

function fmt(d) {
  return d ? d.toISOString().slice(0, 10) : '(nunca evaluado)';
}

function describirSolicitud(s) {
  const al = s.alumno;
  return `  - solicitud id=${s.id} | ${al.usuario.nombre} ${al.usuario.apellidos} (boleta ${al.boleta})`;
}

async function main() {
  const hoy = calcularDiaMexicoUTC();
  const ayerLimite = restarDias(hoy, 1);

  console.log(`Hoy (México, UTC): ${fmt(hoy)}`);
  console.log(`Último día evaluable (ayer, inclusive): ${fmt(ayerLimite)}\n`);

  // ── ANTES ────────────────────────────────────────────────────────────────
  const candidatas = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado' },
    include: {
      alumno: { include: { usuario: true } },
      periodo_registro: { include: { evento_calendario: true } },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Solicitudes candidatas totales (estado='alumno_asignado'): ${candidatas.length}`);
  candidatas.forEach(s => console.log(describirSolicitud(s)));

  const conPeriodoIniciado = candidatas.filter(s => !!s.periodo_registro?.evento_calendario?.fecha_inicio);
  console.log(`\nDe esas, con periodo asignado: ${conPeriodoIniciado.length}`);

  // Para cada alumno, precalcular (SOLO LECTURA) el rango que la función
  // real va a recorrer, y cuántos días laborables sin bitácora hay en él —
  // replica la misma lógica de puntoPartida que ah.cron.js, sin escribir.
  const preview = [];
  for (const s of conPeriodoIniciado) {
    const cumulo = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: s.alumno_id } });
    const fechaInicio = new Date(s.periodo_registro.evento_calendario.fecha_inicio);

    // RN-AH-17: mismo criterio que ah.cron.js — ya completó las 480h, no se evalúa.
    const yaCompletoServicio = (cumulo?.horas_acumuladas ?? 0) >= LIMITE_HORAS_SERVICIO;
    if (yaCompletoServicio) {
      preview.push({ s, cumulo, puntoPartida: null, sinRecorrido: true, yaCompletoServicio, diasLaborablesSinBitacora: [], consecutivasEsperadas: cumulo?.faltas_consecutivas ?? 0 });
      console.log(`\n${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos} (boleta ${s.alumno_id}, solicitud id=${s.id}):`);
      console.log(`  Ya completó las ${LIMITE_HORAS_SERVICIO}h (horas_acumuladas=${cumulo.horas_acumuladas}) — excluido del recorrido de faltas.`);
      continue;
    }

    const puntoPartidaPorFechaInicio = new Date(fechaInicio); // el propio día de inicio ya es evaluable
    const puntoPartidaPorUltimaEvaluacion = cumulo?.fecha_ultima_evaluacion_faltas
      ? restarDias(new Date(cumulo.fecha_ultima_evaluacion_faltas), -1)
      : null;
    // Mismo resguardo defensivo que ah.cron.js: nunca antes de fecha_inicio+1.
    const puntoPartida = puntoPartidaPorUltimaEvaluacion && puntoPartidaPorUltimaEvaluacion > puntoPartidaPorFechaInicio
      ? puntoPartidaPorUltimaEvaluacion
      : puntoPartidaPorFechaInicio;

    const sinRecorrido = puntoPartida > ayerLimite;
    const diasLaborablesSinBitacora = [];
    let ultimoResultadoConsecutivas = cumulo?.faltas_consecutivas ?? 0;

    if (!sinRecorrido) {
      for (let d = puntoPartida; d <= ayerLimite; d = restarDias(d, -1)) {
        if (!(await esDiaLaborable(d))) continue;
        const bit = await obtenerBitacoraDelDia(s.id, d);
        if (bit) {
          ultimoResultadoConsecutivas = 0;
        } else {
          diasLaborablesSinBitacora.push(d);
          ultimoResultadoConsecutivas++;
        }
      }
    }

    preview.push({ s, cumulo, puntoPartida, sinRecorrido, diasLaborablesSinBitacora, consecutivasEsperadas: ultimoResultadoConsecutivas });

    console.log(`\n${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos} (boleta ${s.alumno_id}, solicitud id=${s.id}):`);
    console.log(`  fecha_ultima_evaluacion_faltas (antes): ${fmt(cumulo?.fecha_ultima_evaluacion_faltas ? new Date(cumulo.fecha_ultima_evaluacion_faltas) : null)}`);
    if (sinRecorrido) {
      console.log('  Nada pendiente por evaluar (punto de partida es posterior a ayer).');
    } else {
      console.log(`  Rango a recorrer: ${fmt(puntoPartida)} -> ${fmt(ayerLimite)}`);
      console.log(`  Días laborables SIN bitácora encontrados en el rango: ${diasLaborablesSinBitacora.length}`);
      diasLaborablesSinBitacora.forEach(d => console.log(`    - ${fmt(d)}`));
    }
  }

  // ── EJECUCIÓN ────────────────────────────────────────────────────────────
  console.log('\nEjecutando contabilizarFaltasDiarias()...\n');
  const resultado = await contabilizarFaltasDiarias();
  console.log(`Resultado: faltas contabilizadas=${resultado.faltas}, alumnos evaluados=${resultado.alumnosEvaluados}`);

  const faltasEsperadas = preview.reduce((acc, p) => acc + p.diasLaborablesSinBitacora.length, 0);
  const coincide = resultado.faltas === faltasEsperadas;
  console.log(coincide
    ? `✅ El número de faltas contabilizadas (${resultado.faltas}) coincide con lo previsto (${faltasEsperadas}).`
    : `❌ Discrepancia: se esperaban ${faltasEsperadas} faltas, se contabilizaron ${resultado.faltas}.`);

  // ── DESPUÉS ──────────────────────────────────────────────────────────────
  console.log('\n--- Antes / Después de cumulo_horas_y_faltas por alumno ---');
  for (const p of preview) {
    const despues = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: p.s.alumno_id } });
    console.log(`\n${p.s.alumno.usuario.nombre} ${p.s.alumno.usuario.apellidos} (boleta ${p.s.alumno_id}, solicitud id=${p.s.id}):`);
    console.log(`  antes:    faltas_acumuladas=${p.cumulo?.faltas_acumuladas ?? 0}, faltas_consecutivas=${p.cumulo?.faltas_consecutivas ?? 0}, fecha_ultima_evaluacion_faltas=${fmt(p.cumulo?.fecha_ultima_evaluacion_faltas ? new Date(p.cumulo.fecha_ultima_evaluacion_faltas) : null)}`);
    console.log(`  después:  faltas_acumuladas=${despues?.faltas_acumuladas ?? 0}, faltas_consecutivas=${despues?.faltas_consecutivas ?? 0}, fecha_ultima_evaluacion_faltas=${fmt(despues?.fecha_ultima_evaluacion_faltas ? new Date(despues.fecha_ultima_evaluacion_faltas) : null)}`);
    if (!p.sinRecorrido) {
      const consecutivasOk = despues?.faltas_consecutivas === p.consecutivasEsperadas;
      console.log(`  faltas_consecutivas esperadas=${p.consecutivasEsperadas} -> ${consecutivasOk ? '✅ coincide' : '❌ NO coincide'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al correr la prueba:', e);
  process.exit(1);
});
