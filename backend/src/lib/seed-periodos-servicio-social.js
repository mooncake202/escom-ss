// seed-periodos-servicio-social.js
//
// Crea 38 registros de evento_calendario (tipo "Periodo") + su periodo_registro
// correspondiente, a partir del calendario oficial IPN 2025-2026.
//
// Bloque A (filas 1-19): años tal cual la imagen oficial, con 3 fechas límite
// de expediente corregidas por typo evidente (venían con año anterior al de
// la fecha de inicio, lo cual no tiene sentido operativo):
//   - fila 8:  06/01/2025 -> 06/01/2026
//   - fila 11: 06/03/2025 -> 06/03/2026
//   - fila 12: 24/03/2025 -> 24/03/2026
//
// Bloque B (filas 20-38): las mismas 19 fechas del Bloque A, recorridas
// exactamente +1 año, para tener periodos vigentes respecto a la fecha
// actual del sistema.
//
// REQUIERE que ya hayas corrido seed-test-users.js antes (usa el coordinador
// de prueba coordinador.test@ipn.mx para poblar evento_calendario.coordinador_id).
//
// Colócalo en la raíz de tu proyecto backend (junto a package.json) y AJUSTA
// el require de abajo para que apunte a tu prisma.js real.

const prisma = require('./prisma'); // <-- ajusta este path

const COORDINADOR_CORREO = 'coordinador.test@ipn.mx';

// anio y semestre van directo a periodo_registro. semestre usa las claves del
// enum SemestrePeriodo (s01/s02), que Prisma mapea a "01"/"02" en la BD.
const PERIODOS = [
  // ── Bloque A — años originales de la imagen ─────────────────────────────
  { anio: '2026', semestre: 's01', fechaInicio: '2025-10-01', fechaFin: '2026-04-30', fechaLimiteExpediente: '2025-09-17' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-10-16', fechaFin: '2026-05-14', fechaLimiteExpediente: '2025-10-01' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-11-03', fechaFin: '2026-06-03', fechaLimiteExpediente: '2025-10-15' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-11-18', fechaFin: '2026-06-18', fechaLimiteExpediente: '2025-11-03' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-12-01', fechaFin: '2026-07-01', fechaLimiteExpediente: '2025-11-18' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-12-16', fechaFin: '2026-07-16', fechaLimiteExpediente: '2025-12-01' },
  { anio: '2026', semestre: 's01', fechaInicio: '2026-01-05', fechaFin: '2026-07-17', fechaLimiteExpediente: '2025-12-12' },
  { anio: '2026', semestre: 's01', fechaInicio: '2026-01-16', fechaFin: '2026-08-14', fechaLimiteExpediente: '2026-01-06' }, // typo corregido (era 2025)
  { anio: '2026', semestre: 's02', fechaInicio: '2026-02-03', fechaFin: '2026-09-03', fechaLimiteExpediente: '2026-01-19' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-03-02', fechaFin: '2026-10-02', fechaLimiteExpediente: '2026-02-16' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-03-17', fechaFin: '2026-10-16', fechaLimiteExpediente: '2026-03-06' }, // typo corregido (era 2025)
  { anio: '2026', semestre: 's02', fechaInicio: '2026-04-16', fechaFin: '2026-11-16', fechaLimiteExpediente: '2026-03-24' }, // typo corregido (era 2025)
  { anio: '2026', semestre: 's02', fechaInicio: '2026-05-04', fechaFin: '2026-12-04', fechaLimiteExpediente: '2026-04-24' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-05-18', fechaFin: '2026-12-18', fechaLimiteExpediente: '2026-05-07' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-06-01', fechaFin: '2027-01-01', fechaLimiteExpediente: '2026-05-18' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-06-16', fechaFin: '2027-01-15', fechaLimiteExpediente: '2026-06-02' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-07-01', fechaFin: '2027-02-01', fechaLimiteExpediente: '2026-06-23' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-07-16', fechaFin: '2027-02-16', fechaLimiteExpediente: '2026-07-03' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-08-17', fechaFin: '2027-03-17', fechaLimiteExpediente: '2026-07-15' },

  // ── Bloque B — mismas fechas del Bloque A, +1 año ──────────────────────
  { anio: '2027', semestre: 's01', fechaInicio: '2026-10-01', fechaFin: '2027-04-30', fechaLimiteExpediente: '2026-09-17' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-10-16', fechaFin: '2027-05-14', fechaLimiteExpediente: '2026-10-01' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-11-03', fechaFin: '2027-06-03', fechaLimiteExpediente: '2026-10-15' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-11-18', fechaFin: '2027-06-18', fechaLimiteExpediente: '2026-11-03' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-12-01', fechaFin: '2027-07-01', fechaLimiteExpediente: '2026-11-18' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-12-16', fechaFin: '2027-07-16', fechaLimiteExpediente: '2026-12-01' },
  { anio: '2027', semestre: 's01', fechaInicio: '2027-01-05', fechaFin: '2027-07-17', fechaLimiteExpediente: '2026-12-12' },
  { anio: '2027', semestre: 's01', fechaInicio: '2027-01-16', fechaFin: '2027-08-14', fechaLimiteExpediente: '2027-01-06' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-02-03', fechaFin: '2027-09-03', fechaLimiteExpediente: '2027-01-19' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-03-02', fechaFin: '2027-10-02', fechaLimiteExpediente: '2027-02-16' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-03-17', fechaFin: '2027-10-16', fechaLimiteExpediente: '2027-03-06' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-04-16', fechaFin: '2027-11-16', fechaLimiteExpediente: '2027-03-24' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-05-04', fechaFin: '2027-12-04', fechaLimiteExpediente: '2027-04-24' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-05-18', fechaFin: '2027-12-18', fechaLimiteExpediente: '2027-05-07' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-06-01', fechaFin: '2028-01-01', fechaLimiteExpediente: '2027-05-18' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-06-16', fechaFin: '2028-01-15', fechaLimiteExpediente: '2027-06-02' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-07-01', fechaFin: '2028-02-01', fechaLimiteExpediente: '2027-06-23' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-07-16', fechaFin: '2028-02-16', fechaLimiteExpediente: '2027-07-03' },
  { anio: '2028', semestre: 's01', fechaInicio: '2027-08-17', fechaFin: '2028-03-17', fechaLimiteExpediente: '2027-07-15' },
];

function formatearDDMMYYYY(fechaISO) {
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

async function main() {
  // 1. Buscar al coordinador de prueba (creado por seed-test-users.js).
  const usuarioCoordinador = await prisma.usuario.findUnique({
    where: { correo_institucional: COORDINADOR_CORREO },
    include: { coordinador: true },
  });

  if (!usuarioCoordinador || !usuarioCoordinador.coordinador) {
    throw new Error(
      `No se encontró un coordinador con correo ${COORDINADOR_CORREO}. ` +
      `Corre primero seed-test-users.js.`
    );
  }

  const coordinadorId = usuarioCoordinador.coordinador.id;

  // 2. Pre-chequeo: ¿cuáles fechas de inicio ya existen como evento_calendario
  //    tipo "Periodo"? Se compara por fecha_inicio porque no hay una columna
  //    única natural para todo el conjunto (anio+semestre se repite dentro de
  //    los 38 registros a propósito).
  const fechasInicio = PERIODOS.map((p) => new Date(p.fechaInicio));
  const existentes = await prisma.evento_calendario.findMany({
    where: { tipo: 'Periodo', fecha_inicio: { in: fechasInicio } },
    select: { fecha_inicio: true },
  });
  const existentesSet = new Set(existentes.map((e) => e.fecha_inicio.toISOString().slice(0, 10)));

  const nuevos = PERIODOS.filter((p) => !existentesSet.has(p.fechaInicio));
  const omitidos = PERIODOS.length - nuevos.length;

  if (nuevos.length === 0) {
    console.log('✅ Los 38 periodos ya existían, no se insertó nada nuevo.');
    return;
  }

  // 3. Inserción atómica: todo dentro de una sola transacción.
  const creados = await prisma.$transaction(async (tx) => {
    const nombres = [];

    for (const p of nuevos) {
      const semestreNumero = parseInt(p.semestre.replace('s', ''), 10);
      const nombre = `Servicio Social ${p.anio}-${semestreNumero} (inicio ${formatearDDMMYYYY(p.fechaInicio)})`;

      const evento = await tx.evento_calendario.create({
        data: {
          coordinador_id: coordinadorId,
          nombre,
          tipo: 'Periodo',
          fecha_inicio: new Date(p.fechaInicio),
          fecha_fin: new Date(p.fechaFin),
        },
      });

      await tx.periodo_registro.create({
        data: {
          evento_calendario_id: evento.id,
          anio: p.anio,
          semestre: p.semestre,
          fecha_max_expediente: new Date(p.fechaLimiteExpediente),
        },
      });

      nombres.push(nombre);
    }

    return nombres;
  });

  console.log(`✅ Transacción completada. ${creados.length} periodos creados (${omitidos} ya existían y se omitieron):`);
  creados.forEach((n) => console.log(`  - ${n}`));
}

main()
  .catch((e) => {
    console.error('❌ No se insertó nada (rollback automático).');
    console.error('   Motivo:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
