// FIXTURE HISTÓRICO DE INTEGRACIÓN para probar CU-REP-01 (Reportes).
// NO representa un periodo oficial real: solo reproduce su estructura (inicio en día 16,
// fecha_fin = inicio + 7 meses + 1 día) con fechas ya cerradas, para poder verificar puedeGenerar=true.

const path = require('path');
const { calcularDiaMexicoUTC } = require('../../../lib/fechas');
const { calcularPeriodoReporte, periodoCerrado, esFinDeSemanaISO, normalizarFechaISO } = require('../reportes.periodos');
const { eventoCubreFecha } = require('../reportes.calendario');

const PREFIJO = '[SEED-REPORTES-REP01]';
const PASSWORD_PLANO = '12345678';
const CARRERA_CODIGO = 'ISC';
const BOLETA = '2096630001';

// Misma ruta que usa GR para documentos (RUTA_BASE_DOCUMENTOS es privada de gr.service.js).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../../uploads/documentos');

const USUARIOS = Object.freeze({
  coordinador: { rol: 'coordinador', correo: 'seedrep01.coordinador@ipn.mx', nombre: 'SEEDREP01', apellidos: 'COORDINADOR UNO' },
  profesor: { rol: 'profesor', correo: 'seedrep01.profesor@ipn.mx', nombre: 'SEEDREP01', apellidos: 'PROFESOR UNO' },
  alumno: { rol: 'alumno_asignado', correo: 'seedrep01.alumno@alumno.ipn.mx', nombre: 'SEEDREP01', apellidos: 'ALUMNO UNO' },
});
const CORREOS = Object.values(USUARIOS).map((u) => u.correo);

const PERFIL_PROFESOR = Object.freeze({
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5512345678',
  horario_atencion: 'Lunes a viernes 10:00-12:00',
  cubiculo: 'SEED-REP01',
  cupos_totales: 3,
});

const PERFIL_ALUMNO = Object.freeze({
  celular: '5598765432',
  creditos: 100,
  semestre: 8,
});

const PERIODO_REGISTRO = Object.freeze({ anio: '2026', semestre: 's02', fechaMaxExpediente: '2026-06-25' });

const EVENTOS = Object.freeze({
  periodo: {
    tipo: 'Periodo',
    nombre: `${PREFIJO} Periodo de prestación (fixture histórico, NO oficial)`,
    fechaInicio: '2026-07-16',
    fechaFin: '2027-02-17',
  },
  inhabil: { tipo: 'Inhabil', nombre: `${PREFIJO} Día inhábil (fixture)`, fechaInicio: '2026-07-27', fechaFin: null },
  vacacional: { tipo: 'Vacacional', nombre: `${PREFIJO} Periodo vacacional (fixture)`, fechaInicio: '2026-08-03', fechaFin: '2026-08-07' },
});
const NOMBRES_EVENTOS = Object.values(EVENTOS).map((e) => e.nombre);

const OFERTA = Object.freeze({
  nombreProyecto: `${PREFIJO} Proyecto de integración de Reportes`,
  nombreSISS: 'SEED-REP01 Actividad SISS',
  programaSISS: 'SEED-REP01 Programa SISS',
  descripcion: 'Oferta del fixture de integración de Reportes (CU-REP-01).',
  cuposOfertados: 3,
  cuposDisponibles: 2, // uno ocupado por el alumno del fixture
  estadoOferta: 'aprobada',
  fechaRegistro: '2026-06-01T15:00:00.000Z',
});

const SOLICITUD = Object.freeze({
  motivacion: 'Fixture de integración de Reportes: solicitud ya asignada.',
  estadoSolicitud: 'alumno_asignado',
  estadoAnterior: 'expediente_pendiente_revision',
  fechaAplicacion: '2026-06-01T15:00:00.000Z',
  fechaCartaCompromiso: '2026-06-15T15:00:00.000Z',
});

// fecha_limite en el futuro: el cron de AH no las marca vencidas.
const ACTIVIDADES = Object.freeze({
  analisis: {
    titulo: 'Análisis de requerimientos',
    descripcion: 'Levantar y documentar los requerimientos del proyecto.',
    entregable: 'Documento de requerimientos.',
    fechaLimite: '2026-12-15',
    estado: 'en_progreso',
    porcentajeProgreso: 80,
    fechaAsignacion: '2026-07-16T15:00:00.000Z',
  },
  diseno: {
    titulo: 'Diseño de base de datos',
    descripcion: 'Diseñar el modelo de datos del proyecto.',
    entregable: 'Diagrama entidad-relación.',
    fechaLimite: '2026-12-15',
    estado: 'sin_comenzar',
    porcentajeProgreso: 0,
    fechaAsignacion: '2026-07-16T15:00:00.000Z',
  },
});

// Horas de inicio/fin en UTC (09:00 hora México = 15:00Z). `avance` = % acumulado que reporta
// la bitácora sobre la actividad "Análisis de requerimientos".
const bitacora = (clave, fecha, estado, horas, avance, extra = {}) => ({
  clave,
  fecha,
  estado,
  horas,
  avance,
  horaInicio: `${fecha}T15:00:00.000Z`,
  horaFin: `${fecha}T${String(15 + horas).padStart(2, '0')}:00:00.000Z`,
  descripcion: `Fixture ${clave}: avance en análisis de requerimientos.`,
  evidencia: `Fixture ${clave}: evidencia de prueba.`,
  ...extra,
});

const BITACORAS = Object.freeze([
  bitacora('B1', '2026-07-16', 'aprobada', 4, 20, { revision: '2026-07-17T16:00:00.000Z' }),
  bitacora('B2', '2026-07-17', 'aprobada', 3, 35, { revision: '2026-07-20T16:00:00.000Z' }),
  bitacora('B3', '2026-07-21', 'aprobada', 2, 45, { revision: '2026-07-22T16:00:00.000Z' }),
  bitacora('P', '2026-07-22', 'pendiente_revision', 2, 50),
  bitacora('R', '2026-07-23', 'rechazada', 4, 55, {
    revision: '2026-07-24T16:00:00.000Z',
    motivoRechazo: 'Fixture de integración: evidencia insuficiente.',
  }),
  bitacora('B4', '2026-08-10', 'aprobada', 4, 60, { revision: '2026-08-11T16:00:00.000Z' }),
  // Fuera del reporte #1 (pertenece al periodo #2): no debe entrar en sus horas.
  bitacora('F', '2026-08-17', 'aprobada', 4, 80, { revision: '2026-08-18T16:00:00.000Z' }),
]);

// El cúmulo suma toda bitácora confirmada y separa las rechazadas; NO es la fuente de horas de Reportes.
const CUMULO = Object.freeze({
  horasAcumuladas: BITACORAS.reduce((s, b) => s + b.horas, 0),
  horasRechazadas: BITACORAS.filter((b) => b.estado === 'rechazada').reduce((s, b) => s + b.horas, 0),
});

const ESPERADO_REPORTE_1 = Object.freeze({
  numero: 1,
  esquema: 'mediados_de_mes',
  periodo: { inicio: '2026-07-16', fin: '2026-08-14' }, // el 15-ago es sábado: el periodo termina el viernes
  diasLaborados: 4,
  horas: 13,
  bitacorasAprobadas: 4,
  cumulo: { horasAcumuladas: 23, horasRechazadas: 4 },
  actividad1: { porcentajeActual: 80, avance: { alInicio: 0, alCierre: 60, enPeriodo: 60 }, bitacorasEnPeriodo: 4 },
});

const fechaUTC = (iso) => new Date(`${iso}T00:00:00.000Z`);
const instanteUTC = (iso) => new Date(iso);

// Falla antes de tocar la BD si alguien edita el fixture y rompe el escenario aprobado.
function verificarConsistenciaFixture(hoyISO) {
  const problemas = [];
  const esperado = ESPERADO_REPORTE_1;
  const ev = EVENTOS.periodo;

  const periodo = calcularPeriodoReporte({ fechaInicio: ev.fechaInicio, fechaFin: ev.fechaFin, numero: 1 });
  if (periodo.esquema !== esperado.esquema) problemas.push(`esquema ${periodo.esquema}`);
  if (periodo.inicio !== esperado.periodo.inicio || periodo.fin !== esperado.periodo.fin) {
    problemas.push(`periodo #1 ${periodo.inicio}→${periodo.fin}`);
  }
  if (periodo.rebasaFinServicio) problemas.push('el periodo #1 rebasa fecha_fin');
  if (!periodoCerrado(periodo, hoyISO)) problemas.push(`el periodo #1 (fin ${periodo.fin}) aún no cierra al ${hoyISO}`);

  const noLaborables = [EVENTOS.inhabil, EVENTOS.vacacional];
  const fechas = new Set();
  for (const b of BITACORAS) {
    if (fechas.has(b.fecha)) problemas.push(`fecha de bitácora repetida ${b.fecha}`);
    fechas.add(b.fecha);
    if (esFinDeSemanaISO(b.fecha)) problemas.push(`${b.clave} cae en fin de semana (${b.fecha})`);
    if (noLaborables.some((e) => eventoCubreFecha(e, b.fecha))) problemas.push(`${b.clave} cae en día no laborable (${b.fecha})`);
    const horasReales = (instanteUTC(b.horaFin) - instanteUTC(b.horaInicio)) / 3600000;
    if (horasReales !== b.horas) problemas.push(`${b.clave}: hora_fin - hora_inicio ≠ ${b.horas} h`);
  }

  // Una bitácora cuenta en el reporte cuyo periodo contiene su fecha_revision (día en México), no su fecha_registro.
  const diaDeRevision = (b) => normalizarFechaISO(calcularDiaMexicoUTC(instanteUTC(b.revision)));
  const cuentan = BITACORAS.filter((b) => b.estado === 'aprobada' && diaDeRevision(b) >= periodo.inicio && diaDeRevision(b) <= periodo.fin);
  const horas = cuentan.reduce((s, b) => s + b.horas, 0);
  if (cuentan.length !== esperado.bitacorasAprobadas) problemas.push(`bitácoras que cuentan = ${cuentan.length}`);
  if (horas !== esperado.horas) problemas.push(`horas del reporte #1 = ${horas}`);
  if (cuentan.length * 4 === horas) problemas.push('las horas coinciden con días × 4: el fixture no demuestra horas reales');
  if (CUMULO.horasAcumuladas !== esperado.cumulo.horasAcumuladas || CUMULO.horasRechazadas !== esperado.cumulo.horasRechazadas) {
    problemas.push(`cúmulo ${CUMULO.horasAcumuladas}/${CUMULO.horasRechazadas}`);
  }

  const ultimoAvance = BITACORAS[BITACORAS.length - 1].avance;
  if (ACTIVIDADES.analisis.porcentajeProgreso !== ultimoAvance) problemas.push('porcentaje_progreso ≠ último avance registrado');
  const alCierre = cuentan[cuentan.length - 1].avance;
  if (alCierre !== esperado.actividad1.avance.alCierre) problemas.push(`alCierre = ${alCierre}`);

  if (problemas.length > 0) throw new Error(`El fixture es inconsistente: ${problemas.join('; ')}`);
  return periodo;
}

module.exports = {
  PREFIJO,
  PASSWORD_PLANO,
  CARRERA_CODIGO,
  BOLETA,
  RUTA_BASE_DOCUMENTOS,
  USUARIOS,
  CORREOS,
  PERFIL_PROFESOR,
  PERFIL_ALUMNO,
  PERIODO_REGISTRO,
  EVENTOS,
  NOMBRES_EVENTOS,
  OFERTA,
  SOLICITUD,
  ACTIVIDADES,
  BITACORAS,
  CUMULO,
  ESPERADO_REPORTE_1,
  fechaUTC,
  instanteUTC,
  verificarConsistenciaFixture,
};
