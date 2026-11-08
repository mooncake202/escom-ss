// 03-calendario.js
//
// Calendario institucional compartido — CERRADO (ver backend/src/seeds/README.md,
// sección "Calendario — cerrado, definitivo"). Nadie debe agregar, quitar ni
// modificar fechas aquí salvo que se vuelva a acordar explícitamente con el equipo.
//
// Cuatro bloques:
//   A. Festivos oficiales (tipo Inhabil) — calculados con la regla de la Ley
//      Federal del Trabajo Art. 74, más el 5 de mayo (decisión de equipo).
//      El validador real (calendario.validaciones.js) rechaza cualquier fecha
//      en fin de semana para CUALQUIER tipo de evento — por eso Día del
//      Trabajo 2027 (1 mayo, cae sábado) y Navidad 2027 (25 dic, cae sábado)
//      NO se sembraron: el sistema real nunca los dejaría registrar así.
//   B. Inhabilitaciones parciales (tipo Inhabil con `hora`) — un evento
//      Inhabil con `hora` no nula bloquea SOLO el inicio de nuevas jornadas
//      de AH a partir de esa hora ese día (ver ah.shared.js,
//      puedeIniciarJornadaAhora) — no afecta cómputo de día hábil ni faltas,
//      ni interrumpe una jornada ya en curso. Solo horas en punto de 07:00 a
//      18:00. Fechas de ejemplo elegidas por el equipo (2027, para que sean
//      futuras): 2 de noviembre desde las 14:00, y 27 de septiembre (el 25
//      original cae sábado, se recorrió +2 días igual que el resto) desde las
//      12:00 — si se querían años/días distintos, avisar para corregir.
//   C. Periodos vacacionales (tipo Vacacional) — los que dio el equipo para
//      2026, con los extremos en fin de semana recorridos (regla de equipo:
//      sábado -> +2 días al lunes siguiente; domingo -> -2 días al viernes
//      anterior — ver tabla completa en backend/src/seeds/README.md).
//      2027 queda PENDIENTE de confirmar (ver aviso al final de este archivo).
//   D. Periodos de registro (tipo Periodo) — los 38 oficiales de
//      backend/src/lib/seed-periodos-servicio-social.js, con DOS
//      correcciones: fechaInicio 2027-01-16 (sábado) -> 2027-01-18 (lunes), y
//      fecha_fin/fecha_max_expediente que caían en sábado recorridas al
//      siguiente día hábil (+2, lunes) — 11 campos en 9 filas, ver tabla
//      completa en backend/src/seeds/README.md.

const prisma = require('../../../lib/prisma');
const coordinadoresSeed = require('./02-coordinadores');

const FESTIVOS = [
  { nombre: 'Año Nuevo', fecha: '2026-01-01' },
  { nombre: 'Día de la Constitución', fecha: '2026-02-02' },
  { nombre: '5 de mayo', fecha: '2026-05-05' },
  { nombre: 'Natalicio de Benito Juárez', fecha: '2026-03-16' },
  { nombre: 'Día del Trabajo', fecha: '2026-05-01' },
  { nombre: 'Día de la Independencia', fecha: '2026-09-16' },
  { nombre: 'Día de la Revolución Mexicana', fecha: '2026-11-16' },
  { nombre: 'Navidad', fecha: '2026-12-25' },

  { nombre: 'Año Nuevo', fecha: '2027-01-01' },
  { nombre: 'Día de la Constitución', fecha: '2027-02-01' },
  { nombre: '5 de mayo', fecha: '2027-05-05' },
  { nombre: 'Natalicio de Benito Juárez', fecha: '2027-03-15' },
  { nombre: 'Día de la Independencia', fecha: '2027-09-16' },
  { nombre: 'Día de la Revolución Mexicana', fecha: '2027-11-15' },
  // Día del Trabajo 2027 (1 mayo) y Navidad 2027 (25 dic) quitados: caen sábado,
  // el validador real los rechazaría.
];

// tipo Inhabil con `hora` — ver bloque B en el comentario de arriba.
//
// CORREGIDO (2026-11-08): estas 2 fechas vivían mal puestas en 2027 — deben
// caer en 2026, que es el ciclo real que usan tanto la demo como el video.
// Movidas a octubre 2026 (8 y 22, ambos miércoles... en realidad jueves, día
// hábil, sin chocar con las bitácoras de octubre ya sembradas en AH del
// video: 6, 13, 15, 20, 27 y 29). Mismas horas que antes (14:00 y 12:00).
const INHABILES_PARCIALES = [
  { nombre: 'Cierre administrativo parcial', fecha: '2026-10-08', hora: '14:00' },
  { nombre: 'Cierre administrativo parcial', fecha: '2026-10-22', hora: '12:00' },
];

// Las 2 fechas de 2027 ya sembradas antes de esta corrección — hay que
// borrarlas explícitamente porque ya no están en INHABILES_PARCIALES y el
// resto del código solo sabe CREAR lo que falta, nunca borrar lo que sobra
// (mismo patrón que FESTIVOS_OBSOLETOS, arriba).
const INHABILES_PARCIALES_OBSOLETOS = [
  { nombre: 'Cierre administrativo parcial', fecha: '2027-11-02', hora: '14:00' },
  { nombre: 'Cierre administrativo parcial', fecha: '2027-09-27', hora: '12:00' },
];

async function borrarInhabilesParcialesObsoletos() {
  for (const p of INHABILES_PARCIALES_OBSOLETOS) {
    const existente = await prisma.evento_calendario.findFirst({
      where: {
        nombre: p.nombre,
        tipo: 'Inhabil',
        fecha_inicio: new Date(p.fecha),
        hora: new Date(`1970-01-01T${p.hora}:00.000Z`),
      },
    });
    if (existente) {
      await prisma.evento_calendario.delete({ where: { id: existente.id } });
      console.log(`🗑️  inhábil parcial obsoleto borrado: ${p.nombre} ${p.fecha} ${p.hora} (movido a 2026)`);
    }
  }
}

const VACACIONES_2026 = [
  { nombre: 'Periodo vacacional de invierno (cont. 2025)', fechaInicio: '2026-01-01', fechaFin: '2026-01-26' },
  { nombre: 'Periodo vacacional de primavera', fechaInicio: '2026-03-20', fechaFin: '2026-04-02' },
  { nombre: 'Periodo vacacional de verano', fechaInicio: '2026-08-03', fechaFin: '2026-08-21' },
  { nombre: 'Periodo vacacional de invierno', fechaInicio: '2026-12-21', fechaFin: '2027-01-22' },
];

// PENDIENTE — ver aviso al final del archivo: no inventamos fechas de Semana
// Santa / verano 2027 sin una fuente real (calendario oficial IPN del ciclo
// 2027). Déjalo vacío hasta confirmar.
const VACACIONES_2027 = [];

// Copiado tal cual de backend/src/lib/seed-periodos-servicio-social.js, con
// la única corrección acordada (fechaInicio 2027-01-16 -> 2027-01-18).
const PERIODOS_REGISTRO = [
  { anio: '2026', semestre: 's01', fechaInicio: '2025-10-01', fechaFin: '2026-04-30', fechaLimiteExpediente: '2025-09-17' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-10-16', fechaFin: '2026-05-14', fechaLimiteExpediente: '2025-10-01' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-11-03', fechaFin: '2026-06-03', fechaLimiteExpediente: '2025-10-15' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-11-18', fechaFin: '2026-06-18', fechaLimiteExpediente: '2025-11-03' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-12-01', fechaFin: '2026-07-01', fechaLimiteExpediente: '2025-11-18' },
  { anio: '2026', semestre: 's01', fechaInicio: '2025-12-16', fechaFin: '2026-07-16', fechaLimiteExpediente: '2025-12-01' },
  { anio: '2026', semestre: 's01', fechaInicio: '2026-01-05', fechaFin: '2026-07-17', fechaLimiteExpediente: '2025-12-12' },
  { anio: '2026', semestre: 's01', fechaInicio: '2026-01-16', fechaFin: '2026-08-14', fechaLimiteExpediente: '2026-01-06' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-02-03', fechaFin: '2026-09-03', fechaLimiteExpediente: '2026-01-19' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-03-02', fechaFin: '2026-10-02', fechaLimiteExpediente: '2026-02-16' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-03-17', fechaFin: '2026-10-16', fechaLimiteExpediente: '2026-03-06' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-04-16', fechaFin: '2026-11-16', fechaLimiteExpediente: '2026-03-24' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-05-04', fechaFin: '2026-12-04', fechaLimiteExpediente: '2026-04-24' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-05-18', fechaFin: '2026-12-18', fechaLimiteExpediente: '2026-05-07' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-06-01', fechaFin: '2027-01-01', fechaLimiteExpediente: '2026-05-18' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-06-16', fechaFin: '2027-01-15', fechaLimiteExpediente: '2026-06-02' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-07-01', fechaFin: '2027-02-01', fechaLimiteExpediente: '2026-06-23' },
  { anio: '2026', semestre: 's02', fechaInicio: '2026-07-16', fechaFin: '2027-02-16', fechaLimiteExpediente: '2026-07-03' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-08-17', fechaFin: '2027-03-17', fechaLimiteExpediente: '2026-07-15' },

  { anio: '2027', semestre: 's01', fechaInicio: '2026-10-01', fechaFin: '2027-04-30', fechaLimiteExpediente: '2026-09-17' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-10-16', fechaFin: '2027-05-14', fechaLimiteExpediente: '2026-10-01' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-11-03', fechaFin: '2027-06-03', fechaLimiteExpediente: '2026-10-15' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-11-18', fechaFin: '2027-06-18', fechaLimiteExpediente: '2026-11-03' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-12-01', fechaFin: '2027-07-01', fechaLimiteExpediente: '2026-11-18' },
  { anio: '2027', semestre: 's01', fechaInicio: '2026-12-16', fechaFin: '2027-07-16', fechaLimiteExpediente: '2026-12-01' },
  { anio: '2027', semestre: 's01', fechaInicio: '2027-01-05', fechaFin: '2027-07-19', fechaLimiteExpediente: '2026-12-14' }, // corregido: fechaFin/fechaLimiteExpediente caían sábado
  { anio: '2027', semestre: 's01', fechaInicio: '2027-01-18', fechaFin: '2027-08-16', fechaLimiteExpediente: '2027-01-06' }, // corregido: fechaInicio era 2027-01-16 (sábado), fechaFin también caía sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-02-03', fechaFin: '2027-09-03', fechaLimiteExpediente: '2027-01-19' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-03-02', fechaFin: '2027-10-04', fechaLimiteExpediente: '2027-02-16' }, // corregido: fechaFin caía sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-03-17', fechaFin: '2027-10-18', fechaLimiteExpediente: '2027-03-08' }, // corregido: fechaFin/fechaLimiteExpediente caían sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-04-16', fechaFin: '2027-11-16', fechaLimiteExpediente: '2027-03-24' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-05-04', fechaFin: '2027-12-06', fechaLimiteExpediente: '2027-04-26' }, // corregido: fechaFin/fechaLimiteExpediente caían sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-05-18', fechaFin: '2027-12-20', fechaLimiteExpediente: '2027-05-07' }, // corregido: fechaFin caía sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-06-01', fechaFin: '2028-01-03', fechaLimiteExpediente: '2027-05-18' }, // corregido: fechaFin caía sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-06-16', fechaFin: '2028-01-17', fechaLimiteExpediente: '2027-06-02' }, // corregido: fechaFin caía sábado
  { anio: '2027', semestre: 's02', fechaInicio: '2027-07-01', fechaFin: '2028-02-01', fechaLimiteExpediente: '2027-06-23' },
  { anio: '2027', semestre: 's02', fechaInicio: '2027-07-16', fechaFin: '2028-02-16', fechaLimiteExpediente: '2027-07-05' }, // corregido: fechaLimiteExpediente caía sábado
  { anio: '2028', semestre: 's01', fechaInicio: '2027-08-17', fechaFin: '2028-03-17', fechaLimiteExpediente: '2027-07-15' },
];

async function obtenerCoordinadorId() {
  const resultado = await coordinadoresSeed.main();
  return resultado[0].coordinadorId; // da igual cuál de los 2 — ver comentario arriba
}

async function crearEventoSimple(coordinadorId, nombre, tipo, fechaInicio, fechaFin) {
  const existente = await prisma.evento_calendario.findFirst({
    where: { nombre, tipo, fecha_inicio: new Date(fechaInicio) },
  });
  if (existente) {
    console.log(`↷ evento ya existía: ${tipo} | ${nombre} | ${fechaInicio}`);
    return existente;
  }
  const evento = await prisma.evento_calendario.create({
    data: {
      coordinador_id: coordinadorId,
      nombre,
      tipo,
      fecha_inicio: new Date(fechaInicio),
      fecha_fin: fechaFin ? new Date(fechaFin) : null,
    },
  });
  console.log(`✅ evento creado: ${tipo} | ${nombre} | ${fechaInicio}${fechaFin ? ' - ' + fechaFin : ''}`);
  return evento;
}

// Para Vacacional: cada `nombre` es único (no hay choque entre años como en
// FESTIVOS), así que se puede emparejar solo por nombre+tipo y CORREGIR las
// fechas si ya existía con las fechas viejas (de antes de mover los extremos
// de fin de semana) — a diferencia de crearEventoSimple, que solo crea si
// falta y nunca corrige una fecha ya sembrada distinta.
async function crearOActualizarVacacional(coordinadorId, nombre, fechaInicio, fechaFin) {
  const fechaInicioDate = new Date(fechaInicio);
  const fechaFinDate = new Date(fechaFin);
  const existente = await prisma.evento_calendario.findFirst({ where: { nombre, tipo: 'Vacacional' } });

  if (!existente) {
    const creado = await prisma.evento_calendario.create({
      data: { coordinador_id: coordinadorId, nombre, tipo: 'Vacacional', fecha_inicio: fechaInicioDate, fecha_fin: fechaFinDate },
    });
    console.log(`✅ evento creado: Vacacional | ${nombre} | ${fechaInicio} - ${fechaFin}`);
    return creado;
  }

  const coincide = existente.fecha_inicio.getTime() === fechaInicioDate.getTime()
    && existente.fecha_fin && existente.fecha_fin.getTime() === fechaFinDate.getTime();
  if (coincide) {
    console.log(`↷ evento ya existía y coincide: Vacacional | ${nombre}`);
    return existente;
  }

  const actualizado = await prisma.evento_calendario.update({
    where: { id: existente.id },
    data: { fecha_inicio: fechaInicioDate, fecha_fin: fechaFinDate },
  });
  console.log(`✏️  evento corregido: Vacacional | ${nombre} -> ${fechaInicio} - ${fechaFin}`);
  return actualizado;
}

// Los 2 festivos que se quitaron del arreglo (caían sábado) pudieron haber
// quedado sembrados de una corrida anterior a esta corrección — se borran
// explícitamente si existen, porque ya no están en FESTIVOS y el resto del
// código solo sabe CREAR lo que falta, nunca borrar lo que sobra.
const FESTIVOS_OBSOLETOS = [
  { nombre: 'Día del Trabajo', fecha: '2027-05-01' },
  { nombre: 'Navidad', fecha: '2027-12-25' },
];

async function borrarFestivosObsoletos() {
  for (const f of FESTIVOS_OBSOLETOS) {
    const existente = await prisma.evento_calendario.findFirst({
      where: { nombre: f.nombre, tipo: 'Inhabil', fecha_inicio: new Date(f.fecha), hora: null },
    });
    if (existente) {
      await prisma.evento_calendario.delete({ where: { id: existente.id } });
      console.log(`🗑️  festivo obsoleto borrado: ${f.nombre} ${f.fecha} (caía sábado, ya no se siembra)`);
    }
  }
}

async function crearInhabilParcial(coordinadorId, nombre, fecha, hora) {
  const existente = await prisma.evento_calendario.findFirst({
    where: { nombre, tipo: 'Inhabil', fecha_inicio: new Date(fecha) },
  });
  if (existente) {
    console.log(`↷ evento ya existía: Inhabil (parcial) | ${nombre} | ${fecha} ${hora}`);
    return existente;
  }
  // DateTime @db.Time en Prisma se guarda con una fecha base fija (1970-01-01);
  // solo la hora:minuto importa.
  const evento = await prisma.evento_calendario.create({
    data: {
      coordinador_id: coordinadorId,
      nombre,
      tipo: 'Inhabil',
      fecha_inicio: new Date(fecha),
      fecha_fin: null,
      hora: new Date(`1970-01-01T${hora}:00.000Z`),
    },
  });
  console.log(`✅ evento creado: Inhabil (parcial, desde ${hora}) | ${nombre} | ${fecha}`);
  return evento;
}

function formatearDDMMYYYY(fechaISO) {
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

// La fila oficial original (fecha_inicio 2027-01-16, sábado) se reemplaza por
// la corregida (2027-01-18) en vez de convivir con ella — si sigue existiendo
// de una corrida vieja del seed de origen, se borra antes de crear la nueva.
const FECHA_INICIO_INCORRECTA_A_REEMPLAZAR = '2027-01-16';

async function borrarPeriodoIncorrectoSiExiste() {
  const vieja = await prisma.evento_calendario.findFirst({
    where: { tipo: 'Periodo', fecha_inicio: new Date(FECHA_INICIO_INCORRECTA_A_REEMPLAZAR) },
  });
  if (vieja) {
    await prisma.evento_calendario.delete({ where: { id: vieja.id } }); // cascada: borra su periodo_registro también
    console.log(`🗑️  periodo incorrecto borrado (fecha_inicio ${FECHA_INICIO_INCORRECTA_A_REEMPLAZAR}, sábado), reemplazado por 2027-01-18.`);
  }
}

async function crearPeriodosRegistro(coordinadorId) {
  await borrarPeriodoIncorrectoSiExiste();

  let creados = 0;
  let corregidos = 0;
  let sinCambios = 0;

  for (const p of PERIODOS_REGISTRO) {
    const semestreNumero = parseInt(p.semestre.replace('s', ''), 10);
    const nombre = `Servicio Social ${p.anio}-${semestreNumero} (inicio ${formatearDDMMYYYY(p.fechaInicio)})`;
    const fechaFinDate = new Date(p.fechaFin);
    const fechaMaxExpedienteDate = new Date(p.fechaLimiteExpediente);

    const existente = await prisma.evento_calendario.findFirst({
      where: { tipo: 'Periodo', fecha_inicio: new Date(p.fechaInicio) },
      include: { periodo_registro: true },
    });

    if (!existente) {
      const evento = await prisma.evento_calendario.create({
        data: { coordinador_id: coordinadorId, nombre, tipo: 'Periodo', fecha_inicio: new Date(p.fechaInicio), fecha_fin: fechaFinDate },
      });
      await prisma.periodo_registro.create({
        data: { evento_calendario_id: evento.id, anio: p.anio, semestre: p.semestre, fecha_max_expediente: fechaMaxExpedienteDate },
      });
      console.log(`✅ periodo de registro creado: ${nombre}`);
      creados++;
      continue;
    }

    // Ya existía (de seed-periodos-servicio-social.js o de una corrida previa
    // de este archivo) — corrige fecha_fin/fecha_max_expediente si quedaron
    // con el valor viejo (antes de mover los que caían en sábado).
    const finCoincide = existente.fecha_fin && existente.fecha_fin.getTime() === fechaFinDate.getTime();
    const maxExpedienteCoincide = existente.periodo_registro
      && existente.periodo_registro.fecha_max_expediente.getTime() === fechaMaxExpedienteDate.getTime();

    if (finCoincide && maxExpedienteCoincide) {
      sinCambios++;
      continue;
    }

    if (!finCoincide) {
      await prisma.evento_calendario.update({ where: { id: existente.id }, data: { fecha_fin: fechaFinDate } });
    }
    if (!maxExpedienteCoincide && existente.periodo_registro) {
      await prisma.periodo_registro.update({
        where: { id: existente.periodo_registro.id },
        data: { fecha_max_expediente: fechaMaxExpedienteDate },
      });
    }
    console.log(`✏️  periodo de registro corregido: ${nombre}`);
    corregidos++;
  }

  console.log(`✅ periodos de registro: ${creados} creados, ${corregidos} corregidos, ${sinCambios} sin cambios.`);
}

async function main() {
  const coordinadorId = await obtenerCoordinadorId();

  for (const f of FESTIVOS) {
    await crearEventoSimple(coordinadorId, f.nombre, 'Inhabil', f.fecha, null);
  }
  await borrarFestivosObsoletos();

  await borrarInhabilesParcialesObsoletos();
  for (const p of INHABILES_PARCIALES) {
    await crearInhabilParcial(coordinadorId, p.nombre, p.fecha, p.hora);
  }

  for (const v of VACACIONES_2026) {
    await crearOActualizarVacacional(coordinadorId, v.nombre, v.fechaInicio, v.fechaFin);
  }

  if (VACACIONES_2027.length === 0) {
    console.warn(
      '⚠️  VACACIONES_2027 está vacío a propósito: faltan confirmar las fechas reales ' +
      '(Semana Santa / verano / puente diciembre 2027) contra el calendario oficial IPN ' +
      'del ciclo correspondiente antes de inventar nada. No se insertó ningún periodo ' +
      'vacacional 2027.'
    );
  } else {
    for (const v of VACACIONES_2027) {
      await crearOActualizarVacacional(coordinadorId, v.nombre, v.fechaInicio, v.fechaFin);
    }
  }

  await crearPeriodosRegistro(coordinadorId);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en 03-calendario.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, FESTIVOS, INHABILES_PARCIALES, VACACIONES_2026, VACACIONES_2027, PERIODOS_REGISTRO };
