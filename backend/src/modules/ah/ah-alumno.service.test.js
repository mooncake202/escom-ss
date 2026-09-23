// Prisma falso: no hay BD ni escrituras.
//
// ah-alumno.service.js (igual que ah.shared.js) usa el singleton `require('../../lib/prisma')` directamente, sin
// inyección de dependencias — mismo patrón que reportes-profesor.http.test.js ya usa para `lib/redis`: se reemplaza
// la entrada de require.cache por un Proxy ANTES de requerir el servicio, así que todo módulo que haga
// require('../../lib/prisma') (incluido reportes-alumno.service.js, del que este bloque importa
// plazoEnvioReporteMensualVencido) recibe la misma base falsa. Cero cambios de producción para poder probar esto.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';

const test = require('node:test');
const assert = require('node:assert/strict');

const rutaPrisma = require.resolve('../../lib/prisma');
let bd = null;
require.cache[rutaPrisma] = {
  id: rutaPrisma,
  filename: rutaPrisma,
  loaded: true,
  exports: new Proxy({}, { get: (_target, prop) => bd[prop] }),
};

const ahAlumnoService = require('./ah-alumno.service');
const { ESTADOS_REPORTE } = require('../reportes/reportes.shared');

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
// Instante (UTC) cuyo día calendario en México es `iso` a mediodía — mismo criterio que reportes-alumno.service.test.js.
const ahoraMx = (iso) => new Date(`${iso}T18:00:00.000Z`);

// ── Prisma falso: mismo criterio de "cubre la fecha" que reportes.calendario.js (eventoCubreFecha), para no
// reinventar la regla de Inhabil/Vacacional en el fixture. ──────────────────────────────────────────────────
function eventoCubreFecha(evento, fecha) {
  if (evento.fecha_inicio > fecha) return false;
  if (evento.fecha_fin) return evento.fecha_fin >= fecha;
  return +evento.fecha_inicio === +fecha;
}
function eventoSeSolapaConRango(evento, inicio, fin) {
  for (let d = inicio; d <= fin; d = new Date(d.getTime() + 86400000)) {
    if (eventoCubreFecha(evento, d)) return true;
  }
  return false;
}

/**
 * Escenario base: alumno con solicitud, periodo oficial y (opcionalmente) reportes/eventos/bitácoras/actividades ya
 * existentes. Cubre a la vez lo que necesita AH (ah-alumno.service.js, ah.shared.js) y lo que necesita Reportes
 * (plazoEnvioReporteMensualVencido, vía ah-alumno.service.js) — un solo Prisma falso para ambos.
 */
function crearEscenario(opciones = {}) {
  const {
    fechaInicio = '2025-10-16',
    fechaFin = '2026-05-14',
    reportes = [],
    eventos = [],
    bitacoras = [],
    actividades = [{ id: 1, estado: 'en_progreso', solicitud_registro_id: 42 }],
    cumulo = { alumno_id: '2022630001', horas_acumuladas: 0, horas_rechazadas: 0 },
  } = opciones;

  const alumno = {
    boleta: '2022630001',
    usuario: { nombre: 'ANA', apellidos: 'GARCIA LOPEZ', correo_institucional: 'agarcia@alumno.ipn.mx', rubrica_imagen: null },
    solicitud_registro: {
      id: 42,
      periodo_registro: { evento_calendario: { fecha_inicio: utc(fechaInicio), fecha_fin: fechaFin ? utc(fechaFin) : null } },
      oferta: { id: 3, profesor: { usuario_id: 60, usuario: { nombre: 'LUIS', apellidos: 'TORRES VEGA' } } },
    },
  };

  let siguienteIdBitacora = 1000;
  const bitacorasBd = [...bitacoras];

  bd = {
    alumno: { findUnique: async () => alumno },
    reporte_mensual: { findMany: async () => reportes },
    evento_calendario: {
      // ah.shared.js: esDiaLaborable(hoy) — cuenta eventos Inhabil/Vacacional que cubren exactamente `hoy`.
      count: async (args) => {
        const dia = args.where.fecha_inicio.lte; // mismo día usado en ambos extremos del rango de esDiaLaborable
        return eventos.filter((e) => eventoCubreFecha(e, dia)).length;
      },
      // reportes-alumno.service.js: consultarEventosNoLaborables(prisma, inicio, fin) — eventos que se solapan con la ventana.
      findMany: async (args) => {
        const inicio = args.where.OR[0].fecha_fin.gte;
        const fin = args.where.fecha_inicio.lte;
        return eventos.filter((e) => eventoSeSolapaConRango(e, inicio, fin));
      },
    },
    bitacora: {
      findFirst: async (args) => {
        const w = args.where;
        let candidatas = bitacorasBd.filter((b) => b.solicitud_registro_id === w.solicitud_registro_id);
        if (w.estado) candidatas = candidatas.filter((b) => b.estado === w.estado);
        if (w.fecha_registro) candidatas = candidatas.filter((b) => +b.fecha_registro === +w.fecha_registro);
        if (args.orderBy?.fecha_registro) candidatas = [...candidatas].sort((a, b2) => a.fecha_registro - b2.fecha_registro);
        return candidatas[0] ?? null;
      },
      create: async ({ data }) => {
        const nueva = { id: siguienteIdBitacora++, hora_fin: null, horas_contabilizadas: null, ...data };
        bitacorasBd.push(nueva);
        return nueva;
      },
      update: async ({ where, data }) => {
        const bitacora = bitacorasBd.find((b) => b.id === where.id);
        Object.assign(bitacora, data);
        return bitacora;
      },
    },
    actividad: {
      findMany: async (args) => actividades.filter(
        (a) => a.solicitud_registro_id === args.where.solicitud_registro_id && args.where.estado.in.includes(a.estado),
      ),
    },
    cumulo_horas_y_faltas: { findUnique: async () => cumulo },
  };

  return { bitacorasBd };
}

// Fija "hoy" (Date global) para calcularDiaMexicoUTC(), tanto del lado de AH como del de Reportes — mismo mecanismo
// para las dos, así que un solo mock cubre todo el flujo de iniciarJornada.
function fijarHoy(t, iso) {
  t.mock.timers.enable({ apis: ['Date'], now: ahoraMx(iso) });
}

// Mismo periodo base que reportes-alumno.service.test.js usa para sus pruebas de Bloque 2/3: periodo #1 = 2025-10-16
// al 2025-11-14 (viernes); Día 1 del plazo = lunes 2025-11-17; Día 5 = viernes 2025-11-21; vencido desde el
// lunes 2025-11-24 (22-23 son fin de semana, no cuentan).

test('Bloque 4 — Día 1-5: no bloquea el inicio de una jornada nueva', async (t) => {
  for (const hoy of ['2025-11-14', '2025-11-17', '2025-11-21']) {
    crearEscenario();
    fijarHoy(t, hoy);
    const r = await ahAlumnoService.iniciarJornada(7);
    assert.equal(r.fase, 'activa', hoy);
    t.mock.timers.reset();
  }
});

test('Bloque 4 — antes de Día 1 (dentro del periodo aún no cerrado): no bloquea', async (t) => {
  crearEscenario();
  fijarHoy(t, '2025-11-14'); // último día del periodo; Reportes todavía no habilita ni el aviso preventivo
  const estado = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(estado.bloqueos.reporteMensualVencido, false);
  assert.equal(estado.fase, 'inicio');
});

test('Bloque 4 — después del Día 5 sin reporte enviado: bloquea con 409 y código REPORTE_MENSUAL_PENDIENTE', async (t) => {
  crearEscenario();
  fijarHoy(t, '2025-11-24'); // lunes: día hábil administrativo 6 (fin de semana 22-23 no cuenta)
  await assert.rejects(
    () => ahAlumnoService.iniciarJornada(7),
    (err) => err.status === 409 && err.code === 'REPORTE_MENSUAL_PENDIENTE' && /reporte mensual/i.test(err.message),
  );
});

test('Bloque 4 — obtenerEstadoJornadaActual también refleja el vencimiento (bloqueos.reporteMensualVencido, fase bloqueado)', async (t) => {
  crearEscenario();
  fijarHoy(t, '2025-11-24');
  const estado = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(estado.bloqueos.reporteMensualVencido, true);
  assert.equal(estado.fase, 'bloqueado');
});

test('Bloque 4 — fines de semana e Inhabil no cuentan como día hábil administrativo (mismo cálculo que Bloque 3)', async (t) => {
  // Puente Inhabil que cubre solo el lunes 17-nov (igual que las pruebas de Bloque 2/3): Día 1 se recorre al
  // martes 18-nov, así que el día hábil 5 cae en el lunes 24 (saltando el fin de semana 22-23), no en el 21.
  crearEscenario({ eventos: [{ id: 20, nombre: 'Puente', tipo: 'Inhabil', fecha_inicio: utc('2025-11-17'), fecha_fin: null }] });

  fijarHoy(t, '2025-11-21'); // sería "día 5" sin el Inhabil; con él, es apenas el día hábil 4 → todavía no vence
  const dia4 = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(dia4.bloqueos.reporteMensualVencido, false);
  t.mock.timers.reset();

  fijarHoy(t, '2025-11-24'); // día hábil 5 real (18,19,20,21,24 — el 22-23 de fin de semana no cuenta)
  const dia5 = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(dia5.bloqueos.reporteMensualVencido, false);
  t.mock.timers.reset();

  fijarHoy(t, '2025-11-25'); // día hábil 6: ya vencido
  const dia6 = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(dia6.bloqueos.reporteMensualVencido, true);
});

test('Bloque 4 — reporte ya enviado (aunque sin aprobación): no bloquea, aunque sería el vencimiento del anterior', async (t) => {
  // El Reporte 1 ya existe: `numero` avanza a 2 y el periodo evaluado es el #2, cuyo propio Día 1 está lejos
  // todavía — misma garantía que Bloque 3 (numero = max(num_reporte) + 1 por construcción).
  crearEscenario({ reportes: [{ id: 5, num_reporte: 1, estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR }] });
  fijarHoy(t, '2025-11-24');
  const r = await ahAlumnoService.iniciarJornada(7);
  assert.equal(r.fase, 'activa');
});

test('Bloque 4 — reporte rechazado por profesor o coordinación sigue contando como enviado: no bloquea', async (t) => {
  for (const estado of [ESTADOS_REPORTE.RECHAZADO_PROFESOR, ESTADOS_REPORTE.RECHAZADO_COORDINADOR]) {
    crearEscenario({ reportes: [{ id: 5, num_reporte: 1, estado_reporte: estado }] });
    fijarHoy(t, '2025-11-24');
    const r = await ahAlumnoService.iniciarJornada(7);
    assert.equal(r.fase, 'activa', estado);
    t.mock.timers.reset();
  }
});

test('Bloque 4 — una bitácora EXISTENTE (en_curso o pendiente_datos) no se toca ni se bloquea por este aviso', async (t) => {
  fijarHoy(t, '2025-11-24'); // vencido: si el bloqueo tocara bitácoras existentes, estos dos casos fallarían

  // 'pendiente_datos': jornada auto-cerrada por abandono, esperando que el alumno capture el formulario.
  const { bitacorasBd: b1 } = crearEscenario();
  b1.push({ id: 900, solicitud_registro_id: 42, estado: 'pendiente_datos', fecha_registro: utc('2025-11-20'), hora_inicio: new Date(), hora_fin: null });
  const conPendiente = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(conPendiente.fase, 'formulario');
  assert.equal(conPendiente.bitacoraId, 900);
  assert.equal(conPendiente.bloqueos.reporteMensualVencido, true, 'el aviso sigue reportándose, solo no bloquea esta rama');

  // 'en_curso': jornada de HOY ya iniciada antes de que este bloqueo pudiera aplicar.
  const { bitacorasBd: b2 } = crearEscenario();
  b2.push({ id: 901, solicitud_registro_id: 42, estado: 'en_curso', fecha_registro: utc('2025-11-24'), hora_inicio: new Date(), hora_fin: null });
  const conEnCurso = await ahAlumnoService.obtenerEstadoJornadaActual(7);
  assert.equal(conEnCurso.fase, 'activa');
  assert.equal(conEnCurso.bitacoraId, 901);

  // finalizarJornada (completar una bitácora YA iniciada) tampoco se toca por este bloque: sigue funcionando
  // aunque el plazo de envío esté vencido.
  t.mock.timers.tick(3600 * 1000); // cumple la jornada mínima de 1 hora
  const finalizada = await ahAlumnoService.finalizarJornada(7);
  assert.equal(finalizada.bitacoraId, 901);
  assert.equal(finalizada.fase, 'formulario');
});
