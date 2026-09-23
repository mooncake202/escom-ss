// Prisma falso: no hay BD ni escrituras.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  prepararReporteMensual,
  calcularAvanceActividades,
  evaluarBloqueos,
  evaluarBloqueosDeDatos,
  plazoEnvioReporteMensualVencido,
} = require('./reportes-alumno.service');
const { MOTIVOS_BLOQUEO, ESTADOS_REPORTE } = require('./reportes.shared');
const plazoDeAviso = (r) => r.diagnostico.plazoEnvio;
const limiteDe = (r) => r.diagnostico.limiteServicio;

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
    // Aplica el filtro real de la consulta (estado y rango de fecha_registro), como lo haría la BD.
    bitacora: {
      findMany: async (a) => {
        registrar('bitacora', a);
        const estados = a.where.estado.in;
        const { gte, lte } = a.where.fecha_registro;
        return bitacoras
          .filter((b) => estados.includes(b.estado) && b.fecha_registro >= gte && b.fecha_registro <= lte)
          .sort((x, y) => x.fecha_registro - y.fecha_registro);
      },
    },
    actividad: { findMany: async (a) => { registrar('actividad', a); return actividades; } },
    // Mismo criterio: aplica el filtro real de estado (aprobada/rechazada) y de fecha_registro de la consulta.
    registro_bitacora_actividades: {
      findMany: async (a) => {
        registrar('registros', a);
        const estados = a.where.bitacora.estado.in;
        const { lte } = a.where.bitacora.fecha_registro;
        return registros.filter((r) => estados.includes(r.bitacora.estado) && r.bitacora.fecha_registro <= lte);
      },
    },
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
  assert.deepEqual(r.resumen, { diasLaborados: 3, horas: 9, bitacorasQueCuentan: 3 }); // 9, no 12

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

  // consultas: alumno por usuario; bitácoras del periodo (aprobada/rechazada + las tres sin decisión final); solo eventos no laborables
  assert.deepEqual(llamadas.alumno.where, { usuario_id: 7 });
  assert.equal(llamadas.bitacora.where.solicitud_registro_id, 42);
  assert.deepEqual(llamadas.bitacora.where.estado, { in: ['aprobada', 'rechazada', 'en_curso', 'pendiente_datos', 'pendiente_revision'] });
  // El periodo se decide por fecha_registro (el día de la jornada, fecha pura sin hora), nunca por fecha_revision.
  assert.deepEqual(llamadas.bitacora.where.fecha_registro, {
    gte: new Date('2025-10-16T00:00:00.000Z'),
    lte: new Date('2025-11-14T00:00:00.000Z'),
  });
  assert.equal(llamadas.bitacora.where.fecha_revision, undefined);
  assert.deepEqual(llamadas.evento_calendario.where.tipo, { in: ['Inhabil', 'Vacacional'] });
  // El avance usa las mismas bitácoras contabilizables que dias_laborados/horas_reportadas (aprobada + rechazada).
  assert.deepEqual(llamadas.registros.where.bitacora.estado, { in: ['aprobada', 'rechazada'] });
  // actividades asignadas hasta el final del 14-nov EN MÉXICO (= 15-nov 06:00 UTC)
  assert.deepEqual(llamadas.actividad.where.fecha_asignacion, { lt: new Date('2025-11-15T06:00:00.000Z') });
});

test('periodo por fecha_registro (Bloque 1): la jornada cuenta según el día en que se trabajó, no según cuándo se revisó; aprobada y rechazada cuentan, pendiente_revision no bloquea pero se detecta', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-10-16', 3, '2025-10-17T16:00:00.000Z'),                       // jornada Y revisión dentro del periodo: cuenta
      bit(2, '2025-09-30', 4, '2025-10-20T16:00:00.000Z'),                       // jornada ANTES del periodo, revisada dentro: ya NO cuenta (Bloque 1)
      bit(3, '2025-10-20', 4, '2025-11-20T16:00:00.000Z'),                       // jornada dentro, revisada DESPUÉS del cierre: ahora SÍ cuenta
      bit(4, '2025-10-21', 4, '2025-10-22T16:00:00.000Z', 'pendiente_revision'), // jornada dentro, sin decisión: no cuenta ni bloquea, pero se detecta
      bit(5, '2025-10-22', 2, '2025-10-23T16:00:00.000Z', 'rechazada'),          // jornada dentro, rechazada: SÍ cuenta (Bloque 1)
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });

  assert.deepEqual(r.resumen, { diasLaborados: 3, horas: 9, bitacorasQueCuentan: 3 }); // 3 (id1) + 4 (id3) + 2 (id5)
  assert.deepEqual(r.bitacoras.map((b) => b.id), [1, 3, 5], 'ordenadas por fecha_registro; la #2 (fuera del periodo) no aparece');
  assert.deepEqual(r.bitacoras.map((b) => b.estado), ['aprobada', 'aprobada', 'rechazada']);
  assert.deepEqual(r.diagnostico.bitacorasNoResueltas, [{ id: 4, estado: 'pendiente_revision', fecha: '2025-10-21' }]);
  assert.equal(r.puedeGenerar, true, 'la pendiente de revisión no bloquea el reporte');
  assert.deepEqual(codigos(r), []);
});

test('bitácoras no resueltas (Bloque 1, ajuste final): en_curso y pendiente_datos también se detectan, en el mismo orden por fecha_registro, sin contar ni bloquear', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-10-16', 4),                                                 // aprobada: cuenta
      bit(2, '2025-10-17', 4, undefined, 'en_curso'),                          // jornada activa (o finalizada sin confirmar): no cuenta, se detecta
      bit(3, '2025-10-18', 4, undefined, 'pendiente_datos'),                   // auto-cerrada por abandono (AH): no cuenta, se detecta
      bit(4, '2025-10-19', 4, undefined, 'pendiente_revision'),                // esperando al profesor: no cuenta, se detecta
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });

  assert.deepEqual(r.resumen, { diasLaborados: 1, horas: 4, bitacorasQueCuentan: 1 });
  assert.deepEqual(r.bitacoras.map((b) => b.id), [1]);
  assert.deepEqual(r.diagnostico.bitacorasNoResueltas, [
    { id: 2, estado: 'en_curso', fecha: '2025-10-17' },
    { id: 3, estado: 'pendiente_datos', fecha: '2025-10-18' },
    { id: 4, estado: 'pendiente_revision', fecha: '2025-10-19' },
  ]);
  assert.equal(r.puedeGenerar, true, 'ninguna de las tres bloquea el reporte');
  assert.deepEqual(codigos(r), []);
});

test('límites del periodo por fecha_registro: inclusivos; un día antes de inicio o después de fin no cuenta', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-10-15', 4), // un día antes del inicio del periodo (2025-10-16): NO cuenta
      bit(2, '2025-10-16', 3), // exactamente el inicio del periodo: cuenta
      bit(3, '2025-11-14', 2), // exactamente el fin del periodo: cuenta
      bit(4, '2025-11-15', 4), // un día después del fin del periodo: NO cuenta
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(r.bitacoras.map((b) => b.id), [2, 3]);
  assert.deepEqual(r.resumen, { diasLaborados: 2, horas: 5, bitacorasQueCuentan: 2 });
});

test('bitácoras pendientes de revisión sin ninguna aprobada/rechazada: sigue bloqueando SIN_BITACORAS_APROBADAS (las pendientes no bastan), pero se detectan', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4, undefined, 'pendiente_revision')],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(r.resumen, { diasLaborados: 0, horas: 0, bitacorasQueCuentan: 0 });
  assert.deepEqual(r.diagnostico.bitacorasNoResueltas, [{ id: 1, estado: 'pendiente_revision', fecha: '2025-10-16' }]);
  assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS]);
  assert.equal(r.puedeGenerar, false);
});

test('dias_laborados = aprobadas + rechazadas (Bloque 1) y horas = suma de horas_contabilizadas de AH (1 a 4 h, no 4 fijas); pendiente_revision no cuenta', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [
      bit(1, '2025-10-16', 1),
      bit(2, '2025-10-17', 2),
      bit(3, '2025-10-20', 3, undefined, 'rechazada'),
      bit(4, '2025-10-21', 4),
      bit(5, '2025-10-22', null),
      bit(6, '2025-10-23', 4, undefined, 'pendiente_revision'),
    ],
  });
  const r = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(r.resumen, { diasLaborados: 5, horas: 10, bitacorasQueCuentan: 5 }); // una bitácora sin horas suma 0, no 4; la #6 (pendiente) no cuenta
  assert.deepEqual(r.diagnostico.bitacorasNoResueltas, [{ id: 6, estado: 'pendiente_revision', fecha: '2025-10-23' }]);
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
  // fecha_fin nula ya NO aporta ningún motivo: es administrativa y no condiciona el mensual.
  assert.deepEqual(codigos(r), [
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
  // El periodo #1 cierra el viernes 14-ago; el 15-ago es sábado (no es día hábil administrativo, Bloque 2) —
  // se usa el lunes 17-ago, el primer día hábil administrativo posterior, para que sí esté disponible.
  const r1 = await prepararReporteMensual(7, { prisma, ahora: ahoraMx('2026-08-17') });
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
});

test('día hábil administrativo (Bloque 2): el periodo termina el viernes 14-nov, pero NO genera hasta el primer L-V después — sábado y domingo no bastan', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });

  // Sábado y domingo inmediatos al fin del periodo: el periodo ya "terminó" pero no hay día hábil administrativo todavía.
  for (const [ahora, esperado] of [['2025-11-15', 'sábado'], ['2025-11-16', 'domingo']]) {
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx(ahora) });
    assert.deepEqual(codigos(r), [MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO], esperado);
    assert.equal(r.reporte.periodo.cerrado, false, esperado);
  }

  // Lunes 17-nov: primer día hábil administrativo (L-V, sin Inhabil/Vacacional) después del 14-nov. Ahí sí se puede generar.
  const lunes = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-17') });
  assert.equal(lunes.puedeGenerar, true);
  assert.equal(lunes.reporte.periodo.cerrado, true);
});

test('día hábil administrativo (Bloque 2): un Inhabil/Vacacional justo después del fin del periodo empuja la fecha de generación', async () => {
  // El periodo termina el viernes 14-nov (igual que el escenario de arriba); un puente Inhabil cubre el lunes 17.
  const { prisma } = crearEscenario({
    eventos: [{ id: 20, nombre: 'Puente', tipo: 'Inhabil', fecha_inicio: utc('2025-11-17'), fecha_fin: null }],
    bitacoras: [bit(1, '2025-10-16', 4)],
  });

  // Lunes 17 (Inhabil): todavía no. Se necesita esperar al siguiente día hábil.
  const lunesInhabil = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-17') });
  assert.deepEqual(codigos(lunesInhabil), [MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO]);

  // Martes 18: primer día hábil administrativo real (L-V, sin Inhabil/Vacacional).
  const martes = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-18') });
  assert.equal(martes.puedeGenerar, true);
  assert.equal(martes.reporte.periodo.cerrado, true);
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
  assert.deepEqual(r.resumen, { diasLaborados: 0, horas: 0, bitacorasQueCuentan: 0 });
});

// ── fecha_fin es administrativa: no limita la secuencia mensual ─────────────────────────────────────────────

test('un periodo que rebasa la fecha oficial de término SÍ se genera (sin recorte ni parcial); el flag queda informativo', async () => {
  // 6 reportes aprobados → el siguiente es el 7: 16-abr → 15-may, y el servicio "termina" el 14-may.
  const reportes = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, num_reporte: n, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2026-04-20', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2026-05-20') });
  assert.equal(r.reporte.numero, 7);
  assert.equal(r.reporte.periodo.inicio, '2026-04-16');
  assert.equal(r.reporte.periodo.fin, '2026-05-15'); // el periodo NO se recorta a 14-may
  assert.equal(r.reporte.periodo.rebasaFinServicio, true, 'se sigue informando, pero ya no bloquea');
  assert.deepEqual(codigos(r), []);
  assert.equal(r.puedeGenerar, true);
  assert.deepEqual(r.resumen, { diasLaborados: 1, horas: 4, bitacorasQueCuentan: 1 });
});

test('tras enviar un reporte que rebasa fecha_fin, la secuencia continúa normal (R8, R9…)', async () => {
  // Ahora existen 7 reportes (el 7 ya rebasaba fecha_fin): el siguiente candidato debe ser el 8, con su periodo normal.
  const reportes = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: n, num_reporte: n, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2026-05-20', 4)] });
  const r8 = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2026-06-18') });
  assert.equal(r8.reporte.numero, 8);
  assert.deepEqual([r8.reporte.periodo.inicio, r8.reporte.periodo.fin], ['2026-05-18', '2026-06-15']);
  assert.equal(r8.reporte.esquema, 'mediados_de_mes', 'mismo motor de periodos, sin cambios');
  assert.deepEqual(codigos(r8), []);
  assert.equal(r8.puedeGenerar, true);

  // Y con 8 enviados, el 9 sigue igual: la secuencia no se detiene por fecha_fin.
  const nueve = [...reportes, { id: 8, num_reporte: 8, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }];
  const { prisma: p9 } = crearEscenario({ reportes: nueve, bitacoras: [bit(1, '2026-06-22', 4)] });
  const r9 = await prepararReporteMensual(1, { prisma: p9, ahora: ahoraMx('2026-07-20') });
  assert.equal(r9.reporte.numero, 9);
  assert.deepEqual([r9.reporte.periodo.inicio, r9.reporte.periodo.fin], ['2026-06-16', '2026-07-15']);
  assert.equal(r9.puedeGenerar, true);
});

test('sin fecha_fin oficial el mensual se genera igual (fecha_fin ya no condiciona nada del mensual)', async () => {
  const { prisma } = crearEscenario({ fechaFin: null, bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.servicio.fechaFin, null);
  assert.equal(r.reporte.periodo.rebasaFinServicio, null, 'sin fecha_fin no hay nada que comparar');
  assert.deepEqual(codigos(r), []);
  assert.equal(r.puedeGenerar, true);
});

test('el plazo de 5 días (Bloque 3) sigue aplicando a un periodo posterior a fecha_fin', async () => {
  // Periodo #7 (16-abr → 15-may) rebasa fecha_fin; su Día 1 es el lunes 18-may (16-may es sábado).
  const reportes = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, num_reporte: n, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2026-04-20', 4)] });

  const dia1 = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2026-05-18') });
  assert.deepEqual(plazoDeAviso(dia1), {
    aplica: true, estado: 'preventivo', diaHabilActual: 1, diasPlazo: 5,
    primerDia: '2026-05-18', fechaLimite: '2026-05-22', fechaLimiteTexto: '22 de mayo de 2026',
  });

  const vencido = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2026-05-25') });
  assert.equal(plazoDeAviso(vencido).estado, 'vencido', 'el aviso ya no queda huérfano de un reporte imposible');
});

test('Bloque 4 sigue bloqueando bitácoras por un periodo posterior a fecha_fin (antes se desactivaba por rebasaFinServicio)', async () => {
  const reportes = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, num_reporte: n, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const vencido = async (ahora, opciones = {}) => {
    const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2026-04-20', 4)], ...opciones });
    return plazoEnvioReporteMensualVencido(1, { prisma, ahora: ahoraMx(ahora) });
  };

  assert.equal(await vencido('2026-05-22'), false, 'día hábil 5 del plazo: todavía no vence');
  assert.equal(await vencido('2026-05-26'), true, 'pasado el día 5 sí bloquea, aunque el periodo rebase fecha_fin');
  // Y tampoco se desactiva por no tener fecha_fin registrada.
  assert.equal(await vencido('2026-05-26', { fechaFin: null }), true);
});

test('reporte anterior (Bloque 2): para Reporte N > 1 basta con que exista el Reporte N-1; su estado_reporte NO importa', async () => {
  // 'numero' siempre es max(num_reporte existentes) + 1, así que el Reporte N-1 SIEMPRE existe cuando N > 1 —
  // los cinco estados posibles del Reporte 1 (incluido aprobado_coordinador) deben permitir generar el Reporte 2 igual.
  for (const estado of [
    ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    ESTADOS_REPORTE.RECHAZADO_PROFESOR,
    ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
    ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
    ESTADOS_REPORTE.APROBADO_COORDINADOR,
  ]) {
    const { prisma } = crearEscenario({
      reportes: [{ id: 5, num_reporte: 1, estado_reporte: estado }],
      bitacoras: [bit(1, '2025-11-20', 4)],
    });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-12-20') });
    assert.equal(r.reporte.numero, 2, estado);
    assert.equal(r.puedeGenerar, true, estado);
    assert.deepEqual(codigos(r), [], estado);
  }
});

test('reportesAnteriores.sinAprobacionFinal (Bloque 2): informativo, ya no bloquea', async () => {
  const aprobado = [{ id: 1, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }];
  const { prisma } = crearEscenario({ reportes: aprobado, bitacoras: [bit(1, '2025-11-20', 4)] });
  const ok = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-12-20') });
  assert.equal(ok.reporte.numero, 2);
  assert.equal(ok.reporte.periodo.inicio, '2025-11-17'); // el 16-nov es domingo
  assert.equal(ok.reporte.periodo.fin, '2025-12-15');
  assert.equal(ok.puedeGenerar, true);
  assert.deepEqual(ok.reportesAnteriores, { total: 1, sinAprobacionFinal: [] });

  const { prisma: p } = crearEscenario({
    reportes: [{ id: 5, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.RECHAZADO_PROFESOR }],
    bitacoras: [bit(1, '2025-11-20', 4)],
  });
  const r = await prepararReporteMensual(1, { prisma: p, ahora: ahoraMx('2025-12-20') });
  assert.equal(r.puedeGenerar, true, 'el Reporte 1 sin aprobación final ya no bloquea al Reporte 2');
  assert.equal(r.reportesAnteriores.sinAprobacionFinal[0].estadoReporte, ESTADOS_REPORTE.RECHAZADO_PROFESOR);
  assert.equal(r.reportesAnteriores.sinAprobacionFinal[0].puedeModificar, true);
});

test('evaluarBloqueos: un reporte ya existente para el periodo bloquea (REPORTE_YA_EXISTE)', () => {
  const motivos = evaluarBloqueos({
    servicio: { fechaInicio: '2025-10-16' },
    periodo: { inicio: '2025-10-16', fin: '2025-11-15', rebasaFinServicio: false },
    hoy: '2025-11-20',
    periodoGenerable: true,
    diasLaborados: 3,
    reporteExistente: { id: 1, numero: 1, estadoReporte: 'pendiente_revision_profesor', puedeModificar: false },
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
  assert.deepEqual(r.resumen, { diasLaborados: 2, horas: 8, bitacorasQueCuentan: 2 });
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
    registros: [{ actividad_id: 1, porcentaje_avance_registrado: 60, bitacora: { fecha_registro: utc('2025-10-16'), estado: 'aprobada' } }],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.equal(r.actividades.length, 1);
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 60, enPeriodo: 60 });
});

// ── Avance: mismas bitácoras contabilizables que dias_laborados/horas_reportadas ────────────────────────────
//
// Periodo #1 = 2025-10-16 al 2025-11-14 (igual que el resto de los tests de este archivo).
const ACTIVIDAD_X = { id: 1, titulo: 'Actividad X', estado: 'en_progreso', fecha_limite: utc('2025-12-01'), porcentaje_progreso: 60 };
const registro = (fecha, estado, pct) => ({ actividad_id: 1, porcentaje_avance_registrado: pct, bitacora: { fecha_registro: utc(fecha), estado } });

test('avance: una bitácora aprobada cuenta', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [ACTIVIDAD_X],
    registros: [registro('2025-10-18', 'aprobada', 30)],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 30, enPeriodo: 30 });
  assert.equal(r.actividades[0].bitacorasEnPeriodo, 1);
});

test('avance: una bitácora rechazada cuenta igual que una aprobada', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [ACTIVIDAD_X],
    registros: [registro('2025-10-18', 'rechazada', 40)],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 40, enPeriodo: 40 });
  assert.equal(r.actividades[0].bitacorasEnPeriodo, 1);
});

test('avance: aprobada + rechazada se suman (ambas cuentan; el avance refleja el registro más reciente de las dos)', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [ACTIVIDAD_X],
    registros: [
      registro('2025-10-18', 'aprobada', 20),
      registro('2025-10-25', 'rechazada', 55),
    ],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 55, enPeriodo: 55 });
  assert.equal(r.actividades[0].bitacorasEnPeriodo, 2, 'las dos bitácoras cuentan para el total del periodo');
});

test('avance: en_curso, pendiente_datos y pendiente_revision NO cuentan (mismo criterio que dias_laborados)', async () => {
  const { prisma } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [ACTIVIDAD_X],
    registros: [
      registro('2025-10-18', 'aprobada', 20),            // cuenta
      registro('2025-10-25', 'en_curso', 90),             // no cuenta
      registro('2025-10-26', 'pendiente_datos', 95),       // no cuenta
      registro('2025-10-27', 'pendiente_revision', 99),    // no cuenta
    ],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  // Si alguna de las tres sin decisión final contara, alCierre sería 90/95/99, no 20.
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 20, enPeriodo: 20 });
  assert.equal(r.actividades[0].bitacorasEnPeriodo, 1, 'solo la aprobada llega a calcularAvanceActividades');
});

test('avance: respeta el periodo/rango — una bitácora aprobada FUERA del rango (después de periodo.fin) no cuenta', async () => {
  const { prisma, llamadas } = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    actividades: [ACTIVIDAD_X],
    registros: [
      registro('2025-10-18', 'aprobada', 20),  // dentro del periodo (2025-10-16 al 2025-11-14)
      registro('2025-11-20', 'aprobada', 100), // después de periodo.fin: no debe contarse en ESTE reporte
    ],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  assert.deepEqual(r.actividades[0].avance, { alInicio: 0, alCierre: 20, enPeriodo: 20 });
  assert.equal(r.actividades[0].bitacorasEnPeriodo, 1);
  // El corte de la consulta es exactamente periodo.fin, no una fecha arbitraria.
  assert.equal(llamadas.registros.where.bitacora.fecha_registro.lte.toISOString(), '2025-11-14T00:00:00.000Z');
});

// ── Bloque 3: aviso persistente por plazo de envío ──────────────────────
//
// Mismo escenario base de los tests de Bloque 2: periodo #1 = 2025-10-16 al 2025-11-14 (viernes); Día 1 del plazo
// (primerDiaGenerable) = lunes 2025-11-17. Sin eventos Inhabil/Vacacional de por medio, los 5 días hábiles
// administrativos del plazo son 17,18,19,20,21-nov (L-V); el 22-23 son sábado/domingo; el día 6 (vencido) es el
// lunes 24-nov.

test('Bloque 3: antes de habilitarse el periodo (antes del Día 1) no hay aviso', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  // Domingo 16-nov: un día antes del primer día hábil administrativo (lunes 17-nov).
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-16') });
  assert.equal(r.reporte.periodo.cerrado, false);
  assert.deepEqual(plazoDeAviso(r), {
    aplica: false, estado: null, diaHabilActual: null, diasPlazo: 5, primerDia: null, fechaLimite: null, fechaLimiteTexto: null,
  });
});

test('Bloque 3: Día 1 del plazo — aviso preventivo', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-17') });
  assert.deepEqual(plazoDeAviso(r), {
    aplica: true, estado: 'preventivo', diaHabilActual: 1, diasPlazo: 5,
    primerDia: '2025-11-17', fechaLimite: '2025-11-21', fechaLimiteTexto: '21 de noviembre de 2025',
  });
});

test('Bloque 3: Día 5 del plazo — todavía preventivo, no vencido', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-21') });
  assert.deepEqual(plazoDeAviso(r), {
    aplica: true, estado: 'preventivo', diaHabilActual: 5, diasPlazo: 5,
    primerDia: '2025-11-17', fechaLimite: '2025-11-21', fechaLimiteTexto: '21 de noviembre de 2025',
  });
});

test('Bloque 3: después del Día 5 — plazo vencido (fin de semana no cuenta como día 6)', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  // Sábado/domingo 22-23 no son día hábil administrativo: el día 6 real es hasta el lunes 24.
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-24') });
  assert.deepEqual(plazoDeAviso(r), {
    aplica: true, estado: 'vencido', diaHabilActual: 6, diasPlazo: 5,
    primerDia: '2025-11-17', fechaLimite: '2025-11-21', fechaLimiteTexto: '21 de noviembre de 2025',
  });
});

test('Bloque 3: un evento Inhabil dentro del plazo tampoco cuenta como día hábil (se reutiliza el calendario de Bloque 2)', async () => {
  // Mismo puente Inhabil que el test de Bloque 2 (solo cubre el lunes 17-nov) → Día 1 se recorre al martes 18-nov.
  const { prisma } = crearEscenario({
    eventos: [{ id: 20, nombre: 'Puente', tipo: 'Inhabil', fecha_inicio: utc('2025-11-17'), fecha_fin: null }],
    bitacoras: [bit(1, '2025-10-16', 4)],
  });

  // Días hábiles del plazo: 18,19,20,21 (mar-vie) y, saltando el fin de semana 22-23, el lunes 24 es el día 5.
  const dia4 = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-21') });
  assert.deepEqual(plazoDeAviso(dia4), {
    aplica: true, estado: 'preventivo', diaHabilActual: 4, diasPlazo: 5,
    primerDia: '2025-11-18', fechaLimite: '2025-11-24', fechaLimiteTexto: '24 de noviembre de 2025',
  });

  const dia5 = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-24') });
  assert.deepEqual(plazoDeAviso(dia5), {
    aplica: true, estado: 'preventivo', diaHabilActual: 5, diasPlazo: 5,
    primerDia: '2025-11-18', fechaLimite: '2025-11-24', fechaLimiteTexto: '24 de noviembre de 2025',
  });

  const vencido = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-25') });
  assert.deepEqual(plazoDeAviso(vencido).estado, 'vencido');
  assert.equal(plazoDeAviso(vencido).diaHabilActual, 6);
});

test('Bloque 3: en cuanto existe el reporte_mensual (primer envío) el aviso desaparece', async () => {
  // El Reporte 1 ya existe: `numero` avanza a 2 y el periodo evaluado ahora es el #2 (empieza 17-nov, termina mucho
  // después) — su propio Día 1 está muy lejos todavía, así que a esta misma fecha (que sí era el vencimiento del
  // Reporte 1) ya no hay ningún aviso.
  const { prisma } = crearEscenario({
    reportes: [{ id: 5, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }],
    bitacoras: [bit(1, '2025-11-20', 4)],
  });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-24') });
  assert.equal(r.reporte.numero, 2);
  assert.equal(plazoDeAviso(r).aplica, false);
});

test('Bloque 3: un reporte rechazado sigue contando como enviado — el aviso no reaparece', async () => {
  // La corrección modifica la MISMA fila (nunca crea una nueva); num_reporte sigue en 1, así que `numero` sigue
  // calculando 2 igual que si estuviera aprobado. El aviso del Reporte 1 no debe reaparecer.
  for (const estado of [ESTADOS_REPORTE.RECHAZADO_PROFESOR, ESTADOS_REPORTE.RECHAZADO_COORDINADOR]) {
    const { prisma } = crearEscenario({
      reportes: [{ id: 5, num_reporte: 1, estado_reporte: estado }],
      bitacoras: [bit(1, '2025-11-20', 4)],
    });
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-24') });
    assert.equal(r.reporte.numero, 2, estado);
    assert.equal(plazoDeAviso(r).aplica, false, estado);
  }
});

// ── Límite de duración del servicio (2 años). SOLO informativo: nunca bloquea nada ──────────────────────────
//
// Con fechaInicio 2025-10-16 el límite es el sábado 2027-10-16. Los días hábiles administrativos previos son
// lun 11, mar 12, mié 13, jue 14 y vie 15 de octubre de 2027.

test('límite de servicio: fuera de la ventana de aviso no hay estado, pero sí se informa la fecha límite', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-09-01') });
  assert.deepEqual(limiteDe(r), {
    fechaLimite: '2027-10-16',
    fechaLimiteTexto: '16 de octubre de 2027',
    diasHabilesRestantes: 33,
    estado: null,
  });
});

test('límite de servicio: 5, 3 y 1 días hábiles restantes → por_vencer', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  for (const [hoy, restantes] of [['2027-10-11', 5], ['2027-10-13', 3], ['2027-10-15', 1]]) {
    const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx(hoy) });
    assert.deepEqual(limiteDe(r), {
      fechaLimite: '2027-10-16',
      fechaLimiteTexto: '16 de octubre de 2027',
      diasHabilesRestantes: restantes,
      estado: 'por_vencer',
    }, hoy);
  }
});

test('límite de servicio: el sexto día hábil antes todavía queda fuera de la ventana', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-10-08') });
  assert.equal(limiteDe(r).diasHabilesRestantes, 6);
  assert.equal(limiteDe(r).estado, null);
});

test('límite de servicio: fines de semana e Inhabil/Vacacional no cuentan como días hábiles restantes', async () => {
  // Sin eventos, del lunes 11 al límite hay 5 días hábiles (el sáb 16 no cuenta). Con un Inhabil el miércoles 13
  // quedan 4, y con un periodo vacacional de 3 días quedan 2.
  const sinEventos = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const base = await prepararReporteMensual(1, { prisma: sinEventos.prisma, ahora: ahoraMx('2027-10-11') });
  assert.equal(limiteDe(base).diasHabilesRestantes, 5);

  const conInhabil = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    eventos: [{ id: 30, nombre: 'Puente', tipo: 'Inhabil', fecha_inicio: utc('2027-10-13'), fecha_fin: null }],
  });
  const r1 = await prepararReporteMensual(1, { prisma: conInhabil.prisma, ahora: ahoraMx('2027-10-11') });
  assert.equal(limiteDe(r1).diasHabilesRestantes, 4);
  assert.equal(limiteDe(r1).estado, 'por_vencer');

  const conVacacional = crearEscenario({
    bitacoras: [bit(1, '2025-10-16', 4)],
    eventos: [{ id: 31, nombre: 'Receso', tipo: 'Vacacional', fecha_inicio: utc('2027-10-13'), fecha_fin: utc('2027-10-15') }],
  });
  const r2 = await prepararReporteMensual(1, { prisma: conVacacional.prisma, ahora: ahoraMx('2027-10-11') });
  assert.equal(limiteDe(r2).diasHabilesRestantes, 2);
});

test('límite de servicio: la consulta de eventos llega hasta la fecha límite (no se queda en periodo.fin + 90)', async () => {
  const { prisma, llamadas } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-10-11') });
  // El periodo #1 termina el 2025-11-14; +90 días sería 2026-02-12, muy por debajo del límite.
  assert.deepEqual(llamadas.evento_calendario.where.fecha_inicio, { lte: new Date('2027-10-16T00:00:00.000Z') });
});

test('límite de servicio: el día exacto del límite es "alcanzado" (todavía válido), no "excedido"', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-10-16') });
  assert.equal(limiteDe(r).estado, 'alcanzado');
  assert.equal(limiteDe(r).fechaLimite, '2027-10-16');
});

test('límite de servicio: el día siguiente ya es "excedido"', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-10-17') });
  assert.equal(limiteDe(r).estado, 'excedido');
  assert.equal(limiteDe(r).diasHabilesRestantes, 0);
});

test('límite de servicio: estando excedido, Reportes NO agrega ningún bloqueo nuevo', async () => {
  const { prisma } = crearEscenario({ bitacoras: [bit(1, '2025-10-16', 4)] });
  const antes = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2025-11-20') });
  const despues = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-10-17') });

  assert.equal(limiteDe(despues).estado, 'excedido');
  assert.equal(despues.puedeGenerar, true, 'el reporte se sigue pudiendo generar después del límite');
  assert.deepEqual(codigos(despues), codigos(antes), 'los motivos de bloqueo no cambian por el límite');
  assert.deepEqual(codigos(despues), []);
});

test('límite de servicio: un reporte mensual posterior al límite sigue calculándose igual', async () => {
  // 20 reportes enviados → el #21 cae mucho después del límite y no se recorta ni cambia de esquema.
  const reportes = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, num_reporte: i + 1, estado_reporte: ESTADOS_REPORTE.APROBADO_COORDINADOR }));
  const { prisma } = crearEscenario({ reportes, bitacoras: [bit(1, '2027-07-01', 4)] });
  const r = await prepararReporteMensual(1, { prisma, ahora: ahoraMx('2027-08-20') });
  assert.equal(r.reporte.numero, 21);
  assert.deepEqual([r.reporte.periodo.inicio, r.reporte.periodo.fin], ['2027-06-16', '2027-07-15']);
  assert.equal(r.reporte.esquema, 'mediados_de_mes');
  assert.equal(limiteDe(r).estado, null, 'todavía no llega al límite: el periodo no lo toca');
  assert.equal(r.puedeGenerar, true);
});
