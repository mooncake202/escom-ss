// Prisma falso: no hay BD ni escrituras.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  prepararReporteMensual,
  calcularAvanceActividades,
  evaluarBloqueos,
  evaluarBloqueosDeDatos,
} = require('./reportes-alumno.service');
const { MOTIVOS_BLOQUEO, ESTADOS_REPORTE } = require('./reportes.shared');

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
const codigos = (r) => r.motivosBloqueo.map((m) => m.codigo);

function crearEscenario(opciones = {}) {
  const {
    fechaInicio = '2025-10-16',
    fechaFin = '2026-05-14',
    conPeriodo = true,
    conOferta = true,
    carrera = 'ISC',
    correoPersonal = 'ana.garcia@example.com',
    programa = 'Programa SISS de prueba',
    creditos = '85.50',
    profesorUsuario = { nombre: 'LUIS', apellidos: 'TORRES VEGA' },
    rubrica = null,
    reportes = [],
    eventos = [],
    bitacoras = [],
    actividades = [],
    registros = [],
    sinAlumno = false,
  } = opciones;

  const llamadas = {};
  const registrar = (nombre, args) => { llamadas[nombre] = args; };

  const alumno = sinAlumno
    ? null
    : {
        boleta: '2022630001',
        carrera,
        semestre: 8,
        celular: '5512345678',
        creditos,
        correo_personal: correoPersonal,
        usuario: {
          nombre: 'ANA',
          apellidos: 'GARCIA LOPEZ',
          correo_institucional: 'agarcia@alumno.ipn.mx',
          rubrica_imagen: rubrica,
        },
        solicitud_registro: {
          id: 42,
          periodo_registro: conPeriodo
            ? { evento_calendario: { fecha_inicio: utc(fechaInicio), fecha_fin: fechaFin ? utc(fechaFin) : null } }
            : null,
          oferta: conOferta
            ? {
                id: 3,
                nombre_proyecto: 'Proyecto X',
                programa_SISS: programa,
                profesor: profesorUsuario ? { usuario_id: 60, usuario: profesorUsuario } : null,
              }
            : null,
        },
      };

  const prisma = {
    alumno: { findUnique: async (a) => { registrar('alumno', a); return alumno; } },
    reporte_mensual: { findMany: async (a) => { registrar('reporte_mensual', a); return reportes; } },
    evento_calendario: { findMany: async (a) => { registrar('evento_calendario', a); return eventos; } },
    // Aplica el filtro real de la consulta (estado y rango de fecha_revision), como lo haría la BD.
    bitacora: {
      findMany: async (a) => {
        registrar('bitacora', a);
        const { estado, fecha_revision: rango } = a.where;
        return bitacoras
          .filter((b) => b.estado === estado && b.fecha_revision >= rango.gte && b.fecha_revision < rango.lt)
          .sort((x, y) => x.fecha_revision - y.fecha_revision);
      },
    },
    actividad: { findMany: async (a) => { registrar('actividad', a); return actividades; } },
    registro_bitacora_actividades: { findMany: async (a) => { registrar('registros', a); return registros; } },
  };
  return { prisma, llamadas };
}

// Bitácora de AH: `fecha` es el día de la jornada (fecha_registro); por omisión se aprobó ese mismo día (10:00 en México).
const bit = (id, fecha, horas, revision = `${fecha}T16:00:00.000Z`, estado = 'aprobada') => ({
  id, estado, fecha_registro: utc(fecha), fecha_revision: new Date(revision), horas_contabilizadas: horas,
});
// Instante (UTC) cuyo día calendario en México es `iso` a mediodía.
const ahoraMx = (iso) => new Date(`${iso}T18:00:00.000Z`);

test('sin alumno o sin solicitud: 404 genérico', async () => {
  const { prisma } = crearEscenario({ sinAlumno: true });
  await assert.rejects(
    () => prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') }),
    (err) => err.status === 404 && /solicitud de servicio social/.test(err.message),
  );
});

test('sin periodo oficial: no hay reporte y el motivo es SIN_PERIODO_OFICIAL', async () => {
  const { prisma, llamadas } = crearEscenario({ conPeriodo: false });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.reporte, null);
  assert.equal(r.puedeGenerar, false);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL]);
  assert.equal(r.servicio.fechaInicio, null);
  assert.equal(llamadas.bitacora, undefined, 'no debe consultar bitácoras sin periodo');
});

test('puede generar: periodo cerrado, horas REALES (no días × 4) y datos de alumno/profesor', async () => {
  const { prisma, llamadas } = crearEscenario({
    rubrica: null,
    eventos: [{ id: 9, nombre: 'Receso', tipo: 'Vacacional', fecha_inicio: utc('2025-10-27'), fecha_fin: utc('2025-10-28') }],
    bitacoras: [bit(1, '2025-10-16', 4), bit(2, '2025-10-17', 3), bit(3, '2025-10-20', 2)],
  });

  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-20') });

  assert.equal(r.puedeGenerar, true);
  assert.deepEqual(r.motivosBloqueo, []);
  assert.equal(r.reporte.numero, 1);
  assert.equal(r.reporte.titulo, 'Reporte mensual de actividades No. 1');
  assert.equal(r.reporte.esquema, 'mediados_de_mes');
  assert.deepEqual(r.reporte.periodo, {
    inicio: '2025-10-16',
    fin: '2025-11-14', // el 15-nov es sábado: el periodo termina el viernes
    inicioTexto: '16 de octubre de 2025',
    finTexto: '14 de noviembre de 2025',
    esPrimero: true,
    cerrado: true,
    rebasaFinServicio: false,
  });
  assert.deepEqual(r.resumen, { diasLaborados: 3, horas: 9, bitacorasAprobadas: 3 }); // 9, no 12

  assert.equal(r.servicio.hoy, '2025-11-20');
  assert.deepEqual([r.servicio.fechaInicio, r.servicio.fechaFin, r.servicio.servicioIniciado], ['2025-10-16', '2026-05-14', true]);

  assert.equal(r.alumno.carrera, 'ISC');
  assert.equal(r.alumno.carreraNombre, 'Ingeniería en Sistemas Computacionales');
  assert.equal(r.alumno.telefono, '5512345678');
  assert.equal(r.alumno.semestre, 8);
  assert.equal(r.alumno.nombreCompleto, 'ANA GARCIA LOPEZ');
  assert.deepEqual([r.alumno.creditos, r.alumno.creditosTexto], [85.5, '85.5 %']);
  assert.equal(r.alumno.correoPersonal, 'ana.garcia@example.com');
  assert.equal(r.servicio.programa, 'Programa SISS de prueba');
  assert.equal(r.profesor.nombre, 'LUIS');
  assert.equal(r.profesor.nombreCompleto, 'LUIS TORRES VEGA');
  assert.equal(r.profesor.ofertaId, 3);
  assert.equal(r.profesor.usuarioId, 60, 'id de usuario del profesor, para avisarle');
  assert.deepEqual(r.firma, { tieneRubrica: false, requiereSubirRubrica: true });

  // calendario: 30 días del 16-oct al 14-nov, con el evento y las bitácoras
  assert.equal(r.calendario.dias.length, 30);
  assert.equal(r.calendario.dias.find((d) => d.fecha === '2025-10-16').horas, 4);
  assert.equal(r.calendario.dias.find((d) => d.fecha === '2025-10-27').tipo, 'vacacional');
  assert.equal(r.calendario.eventos.length, 1);
  assert.deepEqual(r.diagnostico.inconsistenciasCalendario, []);

  // consultas: alumno por usuario; SOLO bitácoras aprobadas del periodo; solo eventos no laborables
  assert.deepEqual(llamadas.alumno.where, { usuario_id: 7 });
  assert.equal(llamadas.bitacora.where.solicitud_registro_id, 42);
  assert.equal(llamadas.bitacora.where.estado, 'aprobada');
  // El periodo se decide por fecha_revision, en días completos de México (16-oct 00:00 → 15-nov 00:00), nunca por fecha_registro.
  assert.deepEqual(llamadas.bitacora.where.fecha_revision, {
    gte: new Date('2025-10-16T06:00:00.000Z'),
    lt: new Date('2025-11-15T06:00:00.000Z'),
  });
  assert.equal(llamadas.bitacora.where.fecha_registro, undefined);
  assert.deepEqual(llamadas.evento_calendario.where.tipo, { in: ['Inhabil', 'Vacacional'] });
  assert.equal(llamadas.registros.where.bitacora.estado, 'aprobada');
  // actividades asignadas hasta el final del 14-nov EN MÉXICO (= 15-nov 06:00 UTC)
  assert.deepEqual(llamadas.actividad.where.fecha_asignacion, { lt: new Date('2025-11-15T06:00:00.000Z') });
});

test('periodo por fecha_revision: una jornada vieja aprobada dentro del periodo cuenta en ESE reporte, y una aprobada después no', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-09-30', 4, '2025-10-20T16:00:00.000Z'),                      // jornada anterior al periodo, aprobada dentro: cuenta
      bit(2, '2025-10-16', 3, '2025-10-17T16:00:00.000Z'),                      // jornada y aprobación dentro: cuenta
      bit(3, '2025-10-20', 4, '2025-11-20T16:00:00.000Z'),                      // jornada dentro, aprobada después del cierre: NO cuenta aquí
      bit(4, '2025-10-21', 4, '2025-10-22T16:00:00.000Z', 'pendiente_revision'), // sin aprobar: no cuenta
      bit(5, '2025-10-22', 4, '2025-10-23T16:00:00.000Z', 'rechazada'),          // rechazada: no cuenta
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });

  assert.deepEqual(r.resumen, { diasLaborados: 2, horas: 7, bitacorasAprobadas: 2 });
  assert.deepEqual(r.bitacoras.map((b) => b.id), [2, 1], 'ordenadas por fecha de aprobación');
  assert.deepEqual(r.bitacoras.map((b) => [b.fecha, b.fechaRevision]), [
    ['2025-10-16', '2025-10-17T16:00:00.000Z'],
    ['2025-09-30', '2025-10-20T16:00:00.000Z'],
  ]);
  assert.equal(r.puedeGenerar, true);
});

test('periodo por fecha_revision: los límites son días COMPLETOS de México (00:00 local, no UTC)', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-10-10', 4, '2025-10-16T05:59:59.000Z'), // 15-oct 23:59:59 en México: periodo anterior, NO cuenta
      bit(2, '2025-10-11', 3, '2025-10-16T06:00:00.000Z'), // 16-oct 00:00:00 en México: primer instante del periodo, cuenta
      bit(3, '2025-11-12', 2, '2025-11-15T05:59:59.000Z'), // 14-nov 23:59:59 en México: último instante del periodo, cuenta
      bit(4, '2025-11-13', 4, '2025-11-15T06:00:00.000Z'), // 15-nov 00:00:00 en México (sábado): fuera del periodo, NO cuenta
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(r.bitacoras.map((b) => b.id), [2, 3]);
  assert.deepEqual(r.resumen, { diasLaborados: 2, horas: 5, bitacorasAprobadas: 2 });
});

test('días = cantidad de bitácoras aprobadas y horas = suma de horas_contabilizadas de AH (1 a 4 h, no 4 fijas)', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 1), bit(2, '2025-10-17', 2), bit(3, '2025-10-20', 3), bit(4, '2025-10-21', 4), bit(5, '2025-10-22', null)],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(r.resumen, { diasLaborados: 5, horas: 10, bitacorasAprobadas: 5 }); // una bitácora sin horas suma 0, no 4
});

test('carreraNombre sale del catálogo de Reportes; IA (legado) se resuelve como IIA; el resto desconocido es null', async () => {
  const esperados = {
    LCD: 'Licenciatura en Ciencia de Datos',
    IIA: 'Ingeniería en Inteligencia Artificial',
    IA: 'Ingeniería en Inteligencia Artificial',
    XYZ: null,
  };
  for (const [carrera, nombre] of Object.entries(esperados)) {
    const { prisma } = crearEscenario({ carrera, bitacoras: [bit(1, '2025-10-16', 4)] });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
    assert.equal(r.alumno.carrera, carrera, 'se conserva el código guardado');
    assert.equal(r.alumno.carreraNombre, nombre);
    assert.equal(r.puedeGenerar, nombre !== null, carrera);
  }
});

test('rúbrica guardada: tieneRubrica true y no se expone la ruta', async () => {
  const { prisma } = crearEscenario({ rubrica: 'rubricas/ana.png', bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(r.firma, { tieneRubrica: true, requiereSubirRubrica: false });
  assert.equal(JSON.stringify(r).includes('rubricas/ana.png'), false);
});

test('oferta ya no disponible: profesor null, sigue respondiendo y bloquea con SIN_PROFESOR_RESPONSABLE', async () => {
  const { prisma } = crearEscenario({ conOferta: false, bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.profesor, null);
  assert.equal(r.servicio.programa, null);
  assert.equal(r.puedeGenerar, false);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE]); // sin ruido de SIN_PROGRAMA_SISS
  assert.equal(r.reporte.numero, 1, 'el resto de la respuesta sigue funcionando');
});

// ── Datos que el PDF necesita ────────────────────────────────

test('SIN_CORREO_PERSONAL: nulo, vacío o solo espacios; el correo institucional NO lo sustituye', async () => {
  for (const correoPersonal of [null, '', '   ']) {
    const { prisma } = crearEscenario({ correoPersonal, bitacoras: [bit(1, '2025-10-16', 4)] });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
    assert.equal(r.puedeGenerar, false, JSON.stringify(correoPersonal));
    assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL]);
    assert.equal(r.alumno.correoPersonal, null);
    assert.equal(r.alumno.correoInstitucional, 'agarcia@alumno.ipn.mx'); // existe, pero no se usa como correo del reporte
  }
});

test('correo personal: se entrega recortado', async () => {
  const { prisma } = crearEscenario({ correoPersonal: '  ana@example.com ', bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.alumno.correoPersonal, 'ana@example.com');
  assert.equal(r.puedeGenerar, true);
});

test('SIN_PROGRAMA_SISS: oferta con programa_SISS nulo, vacío o solo espacios', async () => {
  for (const programa of [null, '', '  ']) {
    const { prisma } = crearEscenario({ programa, bitacoras: [bit(1, '2025-10-16', 4)] });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
    assert.equal(r.puedeGenerar, false, JSON.stringify(programa));
    assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS]);
    assert.equal(r.servicio.programa, null);
  }
});

test('SIN_PROFESOR_RESPONSABLE: la oferta existe pero no se puede resolver su profesor', async () => {
  const { prisma } = crearEscenario({ profesorUsuario: null, bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.profesor, null);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE]);
});

test('programa: se entrega recortado y es el de la oferta (no el nombre del proyecto)', async () => {
  const { prisma } = crearEscenario({ programa: '  Programa Institucional ', bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.servicio.programa, 'Programa Institucional');
  assert.notEqual(r.servicio.programa, r.profesor.ofertaNombre);
});

test('varios datos faltantes se informan juntos, después de los motivos del periodo', async () => {
  const { prisma } = crearEscenario({
    carrera: 'XYZ', correoPersonal: null, programa: null, fechaFin: null, bitacoras: [bit(1, '2025-10-16', 4)],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.puedeGenerar, false);
  assert.deepEqual(codigos(r), [
    MOTIVOS_BLOQUEO.FECHA_FIN_NO_DISPONIBLE,
    MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA,
    MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL,
    MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS,
  ]);
  assert.ok(r.motivosBloqueo.every((m) => typeof m.mensaje === 'string' && m.mensaje.length > 0));
});

test('sin periodo oficial: los datos faltantes también se informan', async () => {
  const { prisma } = crearEscenario({ conPeriodo: false, correoPersonal: null });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL, MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL]);
  assert.equal(r.alumno.creditosTexto, '85.5 %'); // los datos del alumno se entregan aun sin periodo
  assert.equal(r.profesor.nombreCompleto, 'LUIS TORRES VEGA');
});

test('créditos: se entregan como número y con texto sin ceros innecesarios', async () => {
  const casos = [['85', 85, '85 %'], ['85.50', 85.5, '85.5 %'], [85.5, 85.5, '85.5 %'], ['70.25', 70.25, '70.25 %'], [100, 100, '100 %']];
  for (const [entrada, numero, texto] of casos) {
    const { prisma } = crearEscenario({ creditos: entrada, bitacoras: [bit(1, '2025-10-16', 4)] });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
    assert.deepEqual([r.alumno.creditos, r.alumno.creditosTexto], [numero, texto], String(entrada));
  }
});

test('créditos: el Decimal de Prisma (objeto con toString) se entrega igual', async () => {
  const decimal = { toString: () => '85.50' };
  const { prisma } = crearEscenario({ creditos: decimal, bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual([r.alumno.creditos, r.alumno.creditosTexto], [85.5, '85.5 %']);
  assert.equal(JSON.stringify(r).includes('toString'), false);
});

test('la respuesta sigue sin exponer datos sensibles (ruta de rúbrica, contraseña)', async () => {
  const { prisma } = crearEscenario({ rubrica: 'rubricas/ana.png', bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  const texto = JSON.stringify(r);
  assert.equal(/rubrica_imagen|contrasena|rubricas\/ana/.test(texto), false);
});

test('evaluarBloqueosDeDatos: combinaciones y orden', () => {
  const completos = {
    carreraNombre: 'X', correoPersonal: 'a@b.c', profesor: { nombre: 'P' }, ofertaExiste: true, programa: 'P',
  };
  assert.deepEqual(evaluarBloqueosDeDatos(completos), []);
  assert.deepEqual(evaluarBloqueosDeDatos({ ...completos, carreraNombre: null }), [MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA]);
  assert.deepEqual(evaluarBloqueosDeDatos({ ...completos, correoPersonal: null }), [MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL]);
  assert.deepEqual(evaluarBloqueosDeDatos({ ...completos, profesor: null }), [MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE]);
  assert.deepEqual(evaluarBloqueosDeDatos({ ...completos, programa: null }), [MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS]);
  // sin oferta no se pide programa (lo cubre SIN_PROFESOR_RESPONSABLE)
  assert.deepEqual(
    evaluarBloqueosDeDatos({ ...completos, profesor: null, ofertaExiste: false, programa: null }),
    [MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE],
  );
  assert.deepEqual(
    evaluarBloqueosDeDatos({ carreraNombre: null, correoPersonal: null, profesor: null, ofertaExiste: true, programa: null }),
    [
      MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA,
      MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL,
      MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE,
      MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS,
    ],
  );
});

test('esquema mes_calendario (inicio día 3): primer periodo de la fecha real al último día laboral del mes', async () => {
  const { prisma } = crearEscenario({ fechaInicio: '2025-11-03', fechaFin: '2026-06-03', bitacoras: [bit(1, '2025-11-04', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-12-02') });
  assert.equal(r.reporte.esquema, 'mes_calendario');
  assert.equal(r.reporte.periodo.inicio, '2025-11-03');
  assert.equal(r.reporte.periodo.fin, '2025-11-28'); // el 30-nov es domingo
  assert.equal(r.puedeGenerar, true);
});

test('caso obligatorio: inicio 2026-07-16 → R1 2026-07-16→2026-08-14 y, con R1 aprobado, R2 2026-08-17→2026-09-15', async () => {
  const { prisma } = crearEscenario({
    fechaInicio: '2026-07-16', fechaFin: '2027-02-17',
    bitacoras: [bit(1, '2026-07-20', 4)],
  });
  const r1 = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2026-08-15') });
  assert.equal(r1.reporte.esquema, 'mediados_de_mes');
  assert.deepEqual([r1.reporte.numero, r1.reporte.periodo.inicio, r1.reporte.periodo.fin], [1, '2026-07-16', '2026-08-14']);
  assert.equal(r1.reporte.periodo.cerrado, true);

  const aprobado = [{ id: 1, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }];
  const { prisma: p2 } = crearEscenario({
    fechaInicio: '2026-07-16', fechaFin: '2027-02-17', reportes: aprobado,
    bitacoras: [{ ...bit(2, '2026-08-20', 4), fecha_revision: new Date('2026-08-20T16:00:00.000Z') }],
  });
  const r2 = await prepararReporteMensual(7, { prisma: p2, ahora: ahoraMx('2026-09-16') });
  assert.deepEqual([r2.reporte.numero, r2.reporte.periodo.inicio, r2.reporte.periodo.fin], [2, '2026-08-17', '2026-09-15']);
  assert.equal(r2.puedeGenerar, true);
});

test('los eventos Inhabil/Vacacional no desplazan los límites del periodo', async () => {
  const { prisma } = crearEscenario({
    eventos: [{ id: 9, nombre: 'Receso', tipo: 'Vacacional', fecha_inicio: utc('2025-11-13'), fecha_fin: utc('2025-11-14') }],
    bitacoras: [bit(1, '2025-10-16', 4)],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual([r.reporte.periodo.inicio, r.reporte.periodo.fin], ['2025-10-16', '2025-11-14']);
  assert.equal(r.calendario.dias.at(-1).tipo, 'vacacional', 'el último día sigue siendo el 14-nov, aunque sea vacacional');
});

test('inicio real en sábado o domingo: inconsistencia que bloquea; NO se corrige ni se calcula el periodo', async (t) => {
  const advertencias = [];
  t.mock.method(console, 'warn', (mensaje) => advertencias.push(mensaje));
  for (const [fechaInicio, esperado] of [['2025-10-18', 'sábado'], ['2025-10-19', 'domingo']]) {
    const { prisma, llamadas } = crearEscenario({ fechaInicio, bitacoras: [bit(1, '2025-10-20', 4)] });
    const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-12-20') });

    assert.equal(r.puedeGenerar, false, esperado);
    assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.INICIO_SERVICIO_FIN_DE_SEMANA], esperado);
    assert.match(r.motivosBloqueo[0].mensaje, /sábado o domingo/);
    assert.equal(r.reporte, null, 'sin periodo calculado');
    assert.equal(r.servicio.fechaInicio, fechaInicio, 'la fecha real se muestra tal cual, sin moverla al lunes');
    assert.deepEqual(r.calendario, { dias: [], eventos: [] });
    assert.equal(llamadas.bitacora, undefined, 'no se consultan bitácoras');
  }
  assert.equal(advertencias.length, 2);
  assert.match(advertencias[0], /Inconsistencia.*2025-10-18.*sábado o domingo/);
});

test('inicio en fin de semana junto con datos faltantes: se informan todos, el del inicio primero', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const { prisma } = crearEscenario({ fechaInicio: '2025-10-18', correoPersonal: null, programa: null });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-12-20') });
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.INICIO_SERVICIO_FIN_DE_SEMANA, MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL, MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS]);
});

test('periodo aún no cerrado: el último día del periodo todavía no permite generar', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const ultimoDia = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-14') });
  assert.deepEqual(codigos(ultimoDia), [MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO]);
  assert.equal(ultimoDia.reporte.periodo.cerrado, false);

  // El periodo termina el viernes 14-nov: cierra el sábado 15 (el día siguiente a su último día).
  const diaSiguiente = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-15') });
  assert.equal(diaSiguiente.puedeGenerar, true);
});

test('la fecha de hoy es el día calendario de MÉXICO, no el de UTC', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  // 2025-11-15 03:00 UTC = 2025-11-14 21:00 en México → el periodo (fin 14-nov) aún NO cierra.
  const r = await prepararReporteMensual(1, { prisma, ahora: new Date('2025-11-15T03:00:00.000Z') });
  assert.equal(r.servicio.hoy, '2025-11-14');
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO]);
});

test('servicio no iniciado', async () => {
  const { prisma } = crearEscenario({ fechaInicio: '2025-10-16' });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-10-10') });
  assert.equal(r.servicio.servicioIniciado, false);
  assert.ok(codigos(r).includes(MOTIVOS_BLOQUEO.SERVICIO_NO_INICIADO));
  assert.equal(r.puedeGenerar, false);
});

test('periodo cerrado sin ninguna bitácora aprobada: SIN_BITACORAS_APROBADAS', async () => {
  const { prisma } = crearEscenario({ bitacoras: [] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS]);
  assert.deepEqual(r.resumen, { diasLaborados: 0, horas: 0, bitacorasAprobadas: 0 });
});

test('un periodo que rebasa la fecha oficial de término no es generable (sin recorte ni parcial)', async () => {
  // 6 reportes aprobados → el siguiente es el 7: 16-abr → 15-may, pero el servicio termina el 14-may.
  const reportes = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, num_reporte: n, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2026-04-20', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2026-05-20') });
  assert.equal(r.reporte.numero, 7);
  assert.equal(r.reporte.periodo.inicio, '2026-04-16');
  assert.equal(r.reporte.periodo.fin, '2026-05-15'); // el periodo NO se recorta a 14-may
  assert.equal(r.reporte.periodo.rebasaFinServicio, true);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.PERIODO_REBASA_FIN_SERVICIO]);
  assert.equal(r.puedeGenerar, false);
});

test('sin fecha_fin oficial no se puede confirmar el periodo: FECHA_FIN_NO_DISPONIBLE', async () => {
  const { prisma } = crearEscenario({ fechaFin: null, bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.servicio.fechaFin, null);
  assert.equal(r.reporte.periodo.rebasaFinServicio, null);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.FECHA_FIN_NO_DISPONIBLE]);
});

test('reporte anterior: solo aprobado_coordinador permite avanzar; el siguiente número es max + 1', async () => {
  const aprobado = [{ id: 1, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }];
  const { prisma } = crearEscenario({ reportes: aprobado, bitacoras: [bit(1, '2025-11-20', 4)] });
  const ok = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-12-20') });
  assert.equal(ok.reporte.numero, 2);
  assert.equal(ok.reporte.periodo.inicio, '2025-11-17'); // el 16-nov es domingo
  assert.equal(ok.reporte.periodo.fin, '2025-12-15');
  assert.equal(ok.puedeGenerar, true);
  assert.deepEqual(ok.reportesAnteriores, { total: 1, bloqueantes: [] });

  for (const estado of [
    ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    ESTADOS_REPORTE.RECHAZADO_PROFESOR,
    ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
    ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
  ]) {
    const { prisma: p } = crearEscenario({
      reportes: [{ id: 5, num_reporte: 1, estado_reporte: estado }],
      bitacoras: [bit(1, '2025-11-20', 4)],
    });
    const r = await prepararReporteMensual(1, { prisma: p, ahora: ahoraMx('2025-12-20') });
    assert.equal(r.puedeGenerar, false, estado);
    assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.REPORTE_ANTERIOR_SIN_APROBACION_FINAL], estado);
    assert.equal(r.reportesAnteriores.bloqueantes[0].estadoReporte, estado);
    assert.equal(r.reportesAnteriores.bloqueantes[0].puedeModificar, estado.startsWith('rechazado_'));
  }
});

test('evaluarBloqueos: un reporte ya existente para el periodo bloquea (REPORTE_YA_EXISTE)', () => {
  const motivos = evaluarBloqueos({
    servicio: { fechaInicio: '2025-10-16' },
    periodo: { inicio: '2025-10-16', fin: '2025-11-15', rebasaFinServicio: false },
    hoy: '2025-11-20',
    diasLaborados: 3,
    reporteExistente: { id: 1, numero: 1, estadoReporte: 'pendiente_revision_profesor', puedeModificar: false },
    reportesBloqueantes: [],
  });
  assert.deepEqual(motivos.map((m) => m.codigo), [MOTIVOS_BLOQUEO.REPORTE_YA_EXISTE]);
});

test('bitácora aprobada en día Vacacional: se informa en diagnostico, NO se corrige y NO bloquea', async (t) => {
  const advertencias = [];
  t.mock.method(console, 'warn', (mensaje) => advertencias.push(mensaje));

  const { prisma } = crearEscenario({
    eventos: [{ id: 9, nombre: 'Receso', tipo: 'Vacacional', fecha_inicio: utc('2025-10-27'), fecha_fin: utc('2025-10-28') }],
    bitacoras: [bit(1, '2025-10-16', 4), bit(2, '2025-10-27', 4)],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });

  assert.equal(r.diagnostico.inconsistenciasCalendario.length, 1);
  const inc = r.diagnostico.inconsistenciasCalendario[0];
  assert.equal(inc.fecha, '2025-10-27');
  assert.deepEqual(inc.bitacoraIds, [2]);
  assert.deepEqual(inc.motivos, ['evento_vacacional']);

  // El dato de AH se muestra tal cual: cuenta como día laborado y como horas.
  assert.deepEqual(r.resumen, { diasLaborados: 2, horas: 8, bitacorasAprobadas: 2 });
  assert.equal(r.calendario.dias.find((d) => d.fecha === '2025-10-27').inconsistente, true);
  assert.equal(r.puedeGenerar, true);
  assert.equal(advertencias.length, 1);
  assert.match(advertencias[0], /Inconsistencia AH\/calendario.*2025-10-27.*Revisar en AH/);
});

test('avance por actividad: solo bitácoras aprobadas; alInicio / alCierre / enPeriodo', () => {
  const actividades = [
    { id: 1, titulo: 'Análisis', estado: 'en_progreso', fecha_limite: utc('2025-12-01'), porcentaje_progreso: 80 },
    { id: 2, titulo: 'Diseño', estado: 'sin_comenzar', fecha_limite: utc('2025-12-10'), porcentaje_progreso: 0 },
    { id: 3, titulo: 'Pruebas', estado: 'en_progreso', fecha_limite: utc('2025-12-20'), porcentaje_progreso: 30 },
  ];
  const registros = [
    { actividad_id: 1, porcentaje_avance_registrado: 20, bitacora: { fecha_registro: utc('2025-10-20') } }, // antes del periodo
    { actividad_id: 1, porcentaje_avance_registrado: 50, bitacora: { fecha_registro: utc('2025-11-03') } }, // en el periodo
    { actividad_id: 1, porcentaje_avance_registrado: 60, bitacora: { fecha_registro: utc('2025-11-10') } }, // en el periodo (último)
    { actividad_id: 3, porcentaje_avance_registrado: 30, bitacora: { fecha_registro: utc('2025-10-25') } }, // solo antes
  ];

  const [a1, a2, a3] = calcularAvanceActividades({ actividades, registros, inicio: '2025-11-01', fin: '2025-11-30' });

  assert.deepEqual(a1.avance, { alInicio: 20, alCierre: 60, enPeriodo: 40 });
  assert.equal(a1.bitacorasEnPeriodo, 2);
  assert.equal(a1.porcentajeActual, 80); // incluye avances aún no aprobados; solo informativo
  assert.equal(a1.fechaLimite, '2025-12-01');

  assert.deepEqual(a2.avance, { alInicio: 0, alCierre: 0, enPeriodo: 0 });
  assert.equal(a2.bitacorasEnPeriodo, 0);

  assert.deepEqual(a3.avance, { alInicio: 30, alCierre: 30, enPeriodo: 0 });
});

test('el avance usa el ÚLTIMO registro aprobado, no el máximo, y nunca es negativo', () => {
  const actividades = [{ id: 1, titulo: 'A', estado: 'en_progreso', fecha_limite: utc('2025-12-01'), porcentaje_progreso: 10 }];
  const registros = [
    { actividad_id: 1, porcentaje_avance_registrado: 70, bitacora: { fecha_registro: utc('2025-10-20') } },
    { actividad_id: 1, porcentaje_avance_registrado: 40, bitacora: { fecha_registro: utc('2025-11-05') } },
  ];
  const [a] = calcularAvanceActividades({ actividades, registros, inicio: '2025-11-01', fin: '2025-11-30' });
  assert.deepEqual(a.avance, { alInicio: 70, alCierre: 40, enPeriodo: 0 });
});

test('las actividades llegan en la respuesta con su avance calculado', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [{ id: 1, titulo: 'Análisis', estado: 'en_progreso', fecha_limite: utc('2025-12-01'), porcentaje_progreso: 60 }],
    registros: [{ actividad_id: 1, porcentaje_avance_registrado: 60, bitacora: { fecha_registro: utc('2025-10-16') } }],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.actividades.length, 1);
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 60, enPeriodo: 60 });
});
