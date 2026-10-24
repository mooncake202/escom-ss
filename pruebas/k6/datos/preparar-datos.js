// Datos para las pruebas de rendimiento con k6 (pruebas/k6/). Basado en pruebas/seguridad/seed-pruebas-seguridad.js,
// pero SIN TSA: los reportes pasan por el envío y la aprobación reales con un sello falso inyectado en
// `deps.solicitarSelloTiempo` (nunca se llama a FreeTSA).
//
// Lote identificado por K6_PREFIJO (solo letras). Con los valores por omisión (lib/config.js):
//   - 2 coordinadores.
//   - 10 profesores BASE (los que usan las pruebas) y los profesores ADICIONALES necesarios para que los 100 alumnos tengan
//     oferta. Todos sin característica: cupo real = CUPOS_BASE (3, caracteristicas.service.js). Los alumnos llenan primero el
//     cupo de los base (30) y el resto se reparte entre los adicionales (24 → 70 alumnos). Cada profesor tiene una oferta
//     aprobada (programa SISS) con su cupo; además, cada profesor base tiene una oferta pendiente de revisión (bandeja de
//     coordinación).
//   - 100 alumnos asignados, cada uno con su solicitud_registro en alumno_asignado ligada al periodo y a la oferta de su
//     profesor, con los datos que exige el registro (GR-01) validados con los mismos validadores del backend; correo
//     personal, rúbrica, periodo iniciado (≈ K6_DIAS_ATRAS días antes de hoy), bitácoras aprobadas en los periodos #1 y #2
//     (ambos cerrados, sin pendientes), cúmulo y su reporte mensual #1 con PDF cifrado. El #2 queda listo para la vista previa.
//   - Reportes de los alumnos de los profesores BASE: pendiente_revision_profesor (3 por profesor base, sus bandejas tienen
//     contenido). Reportes de los alumnos de los ADICIONALES: los aprueba su profesor (rúbrica + sello falso) y quedan en
//     pendiente_revision_coordinador.
//   - Cada usuario con su propio hash bcrypt (costo 10, igual que el registro del sistema).
//
// Idempotente: si el lote existe completo solo completa lo que falte (rúbricas, reportes, hashes); si existe con OTRA forma
// (p. ej. el lote anterior 35/10/5), lo borra con limpiarLote() y lo crea de nuevo.
// Ejecutar dentro del contenedor, como el usuario `node` (ver README.md):
//   docker exec -u node -w /app/backend escom_backend node /app/pruebas/k6/datos/preparar-datos.js

import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import * as conf from '../lib/config.js';
import { limpiarLote, usuariosDelLote } from './limpiar-datos.js';

const require = createRequire(import.meta.url);
const req = (p) => require(path.join(conf.BACKEND_DIR, p));
const prisma = req('src/lib/prisma');
const bcrypt = req('node_modules/bcrypt');
const { calcularDiaMexicoUTC } = req('src/lib/fechas');
const {
  validarCorreoInstitucional, validarCorreoInstitucionalAlumno, validarBoleta, validarNombreOApellidos, validarTelefono, validarCorreoPersonal,
} = req('src/lib/validators');
const { calcularPeriodoReporte, normalizarFechaISO, sumarDiasISO } = req('src/modules/reportes/reportes.periodos');
const { enviarReporteMensual } = req('src/modules/reportes/reportes-envio.service');
const { aprobarReporte } = req('src/modules/reportes/reportes-revision.service');
const { guardarRubrica } = req('src/modules/reportes/reportes.rubricas');
const { CUPOS_BASE } = req('src/modules/administrativa/caracteristicas/caracteristicas.service');

const log = (m) => console.log(`[k6-datos ${conf.PREFIJO}] ${m}`);

// Mismo hash que usa el sistema al registrar usuarios: bcrypt.hash(contraseña, 10) (gr.service.js, usuarios.service.js,
// password.service.js). Cada usuario recibe SU PROPIO hash (sal distinta), como si se hubiera registrado por la app.
const COSTO_BCRYPT = 10;
const hashContrasena = () => bcrypt.hash(conf.PASSWORD, COSTO_BCRYPT);

// Mismas reglas del registro (gr.service.js): dos apellidos de solo letras, celular que no inicia en 0/1, motivación >= 20.
const DOS_APELLIDOS_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ]+\s[A-Za-zÀ-ÖØ-öø-ÿÑñ]+$/;
const TELEFONO_PRIMER_DIGITO_REGEX = /^[2-9]/;
const MOTIVACION = 'Solicitud del lote de pruebas de rendimiento: interés en el proyecto y en las actividades de la oferta.';
const CREDITOS = 100; // >= 70 % (CREDITOS_MIN_DEFAULT): sin dictamen
const SEMESTRE = 8;

// Sello de tiempo FALSO: mismo contrato que solicitarSelloTiempo ({ token }), sin red.
const selloFalso = async (hash) => ({ token: `K6-SIN-TSA-${hash.slice(0, 16)}` });
const sinSocket = () => {};

/** Índice → letras (0 → "AA", 25 → "AZ", 26 → "BA"…) para apellidos que solo admiten letras. */
function letras(n) {
  let t = '';
  let x = n;
  do { t = String.fromCharCode(65 + (x % 26)) + t; x = Math.floor(x / 26); } while (x > 0);
  return t.padStart(2, 'A');
}

function png(ancho, alto, semilla) {
  const filas = [];
  for (let y = 0; y < alto; y += 1) {
    const f = Buffer.alloc(1 + ancho * 3, 0xff); f[0] = 0;
    for (let x = 6; x < ancho - 6; x += 1) if (Math.abs(y - (alto / 2 + Math.sin((x + semilla * 13) / 9) * alto * 0.3)) <= 1.5) f.fill(0x10, 1 + x * 3, 4 + x * 3);
    filas.push(f);
  }
  const bloque = (t, d) => { const td = Buffer.concat([Buffer.from(t), d]); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]), bloque('IHDR', ihdr), bloque('IDAT', zlib.deflateSync(Buffer.concat(filas))), bloque('IEND', Buffer.alloc(0))]);
}

const fechaUTC = (iso) => new Date(`${iso}T00:00:00.000Z`);
const diaSemana = (iso) => fechaUTC(iso).getUTCDay();

// Lunes alrededor de K6_DIAS_ATRAS días antes de hoy (México): con eso los periodos #1 y #2 ya cerraron.
function inicioDelPeriodo(hoyISO) {
  let iso = sumarDiasISO(hoyISO, -conf.DIAS_ATRAS);
  while (diaSemana(iso) !== 1) iso = sumarDiasISO(iso, 1);
  return iso;
}

// Días hábiles (L-V, sin Inhabil/Vacacional del calendario real) dentro de [inicio, fin]; a lo más `n`.
function diasHabiles(inicio, fin, noLaborables, n) {
  const dias = [];
  for (let d = inicio; d <= fin && dias.length < n; d = sumarDiasISO(d, 1)) {
    const w = diaSemana(d);
    if (w !== 0 && w !== 6 && !noLaborables.has(d)) dias.push(d);
  }
  return dias;
}

async function noLaborables() {
  const eventos = await prisma.evento_calendario.findMany({ where: { tipo: { in: ['Inhabil', 'Vacacional'] } }, select: { fecha_inicio: true, fecha_fin: true } });
  const set = new Set();
  for (const e of eventos) {
    const ini = normalizarFechaISO(e.fecha_inicio);
    const fin = e.fecha_fin ? normalizarFechaISO(e.fecha_fin) : ini;
    for (let d = ini; d <= fin; d = sumarDiasISO(d, 1)) set.add(d);
  }
  return set;
}

// ── Plan del lote ────────────────────────────────────────────

/** Alumno a → profesor que lo recibe: primero se llena el cupo de cada profesor base, luego el de los adicionales. */
const profesorDeAlumno = (a) => Math.floor(a / CUPOS_BASE);
const esDeProfesorBase = (a) => profesorDeAlumno(a) < conf.PROFESORES;

function plan() {
  const boletas = conf.boletas();
  const alumnos = conf.correosAlumnos().map((correo, a) => ({
    correo, boleta: boletas[a], nombre: conf.MARCA_NOMBRE, apellidos: `ALUMNO ${letras(a)}`,
    celular: `55${boletas[a].slice(-8)}`, correoPersonal: correo.replace('@alumno.ipn.mx', '@gmail.com'), profesor: profesorDeAlumno(a),
  }));
  const profesores = [...conf.correosProfesores(), ...conf.correosProfesoresAdicionales()].map((correo, i) => ({
    correo, base: i < conf.PROFESORES, nombre: conf.MARCA_NOMBRE, apellidos: `${i < conf.PROFESORES ? 'PROFESOR' : 'ADICIONAL'} ${letras(i)}`,
    asignados: alumnos.filter((x) => x.profesor === i).length,
  }));
  const coordinadores = conf.correosCoordinadores().map((correo, i) => ({ correo, nombre: conf.MARCA_NOMBRE, apellidos: `COORDINACION ${letras(i)}` }));
  return { alumnos, profesores, coordinadores };
}

// Falla antes de tocar la BD si algún dato no pasaría las validaciones del sistema.
function validarPlan({ alumnos, profesores, coordinadores }) {
  if (conf.CUPOS_BASE !== CUPOS_BASE) throw new Error(`lib/config.js CUPOS_BASE=${conf.CUPOS_BASE} no coincide con el sistema (${CUPOS_BASE}).`);
  for (const a of alumnos) {
    validarCorreoInstitucionalAlumno(a.correo);
    validarBoleta(a.boleta);
    validarNombreOApellidos(a.nombre, 'El nombre');
    validarNombreOApellidos(a.apellidos, 'Los apellidos');
    if (!DOS_APELLIDOS_REGEX.test(a.apellidos)) throw new Error(`Apellidos sin dos palabras: ${a.apellidos}`);
    validarTelefono(a.celular, { requerido: true });
    if (!TELEFONO_PRIMER_DIGITO_REGEX.test(a.celular)) throw new Error(`Celular inválido: ${a.celular}`);
    validarCorreoPersonal(a.correoPersonal, { requerido: true });
  }
  for (const u of [...profesores, ...coordinadores]) {
    validarCorreoInstitucional(u.correo);
    validarNombreOApellidos(u.nombre, 'El nombre');
    validarNombreOApellidos(u.apellidos, 'Los apellidos');
  }
  const sinOferta = alumnos.filter((a) => a.profesor >= profesores.length).length;
  if (sinOferta) throw new Error(`${sinOferta} alumnos sin profesor: faltan profesores adicionales.`);
  if (profesores.some((p) => p.asignados > CUPOS_BASE)) throw new Error('Algún profesor rebasaría su cupo.');
}

async function estadoDelLote() {
  const actuales = new Set((await usuariosDelLote(prisma)).map((u) => u.correo_institucional));
  const esperados = conf.todosLosCorreos();
  const ofertas = await prisma.oferta_servicio.count({ where: { nombre_proyecto: { startsWith: conf.MARCA } } });
  const eventos = await prisma.evento_calendario.count({ where: { nombre: { startsWith: conf.MARCA } } });
  if (actuales.size === 0 && ofertas === 0 && eventos === 0) return 'ausente';
  const ofertasEsperadas = conf.PROFESORES + conf.profesoresAdicionales() + conf.PROFESORES; // aprobada por profesor + propuesta por base
  const mismaForma = actuales.size === esperados.length && esperados.every((c) => actuales.has(c)) && ofertas === ofertasEsperadas && eventos === 1;
  return mismaForma ? 'completo' : `otra forma (${actuales.size} usuarios, ${ofertas} ofertas, ${eventos} eventos)`;
}

// ── Creación (una transacción) ───────────────────────────────

async function crearBase(hoyISO, p) {
  const hashes = {};
  for (const correo of conf.todosLosCorreos()) hashes[correo] = await hashContrasena(); // fuera de la transacción: bcrypt es lento
  const ahora = new Date();
  const carrera = await prisma.carrera.findFirstOrThrow({ where: { nombre: 'ISC' } });

  const inicio = inicioDelPeriodo(hoyISO);
  const fin = sumarDiasISO(inicio, 213);
  const p1 = calcularPeriodoReporte({ fechaInicio: inicio, fechaFin: fin, numero: 1 });
  const p2 = calcularPeriodoReporte({ fechaInicio: inicio, fechaFin: fin, numero: 2 });
  const libres = await noLaborables();
  const jornadas = [...diasHabiles(p1.inicio, p1.fin, libres, conf.BITACORAS_POR_PERIODO), ...diasHabiles(p2.inicio, p2.fin, libres, conf.BITACORAS_POR_PERIODO)];
  // El registro ocurre antes del periodo: aplicación y carta compromiso con fechas anteriores al inicio.
  const fechaAplicacion = new Date(`${sumarDiasISO(inicio, -40)}T16:00:00.000Z`);
  const fechaCarta = new Date(`${sumarDiasISO(inicio, -25)}T16:00:00.000Z`);

  return prisma.$transaction(async (tx) => {
    const usuario = (rol, u) => tx.usuario.create({ data: { rol, correo_institucional: u.correo, contrasena: hashes[u.correo], nombre: u.nombre, apellidos: u.apellidos, intentos_fallidos: 0, cuenta_bloqueada: false, fecha_creacion: ahora } });

    const coordinadores = [];
    for (const c of p.coordinadores) coordinadores.push(await tx.coordinador.create({ data: { usuario_id: (await usuario('coordinador', c)).id } }));
    const evento = await tx.evento_calendario.create({ data: { coordinador_id: coordinadores[0].id, nombre: `${conf.MARCA} Periodo de prestación`, tipo: 'Periodo', fecha_inicio: fechaUTC(inicio), fecha_fin: fechaUTC(fin) } });
    const periodo = await tx.periodo_registro.create({ data: { evento_calendario_id: evento.id, anio: inicio.slice(0, 4), semestre: 's02', fecha_max_expediente: fechaUTC(sumarDiasISO(inicio, -20)) } });

    const ofertas = [];
    for (const [i, pr] of p.profesores.entries()) {
      const u = await usuario('profesor', pr);
      // Sin característica: cupos_totales = CUPOS_BASE (cálculo real: 3 + incremento de la característica vigente).
      const prof = await tx.profesor.create({ data: { usuario_id: u.id, departamento: 'Sistemas Computacionales', telefono_personal: '5511112222', horario_atencion: 'Lunes a viernes 10:00-12:00', cubiculo: conf.MARCA, cupos_totales: CUPOS_BASE, caracteristica_id: null } });
      const o = await tx.oferta_servicio.create({ data: { profesor_id: prof.id, coordinador_id: coordinadores[i % coordinadores.length].id, nombre_SISS: `${conf.MARCA} SISS ${i + 1}`, programa_SISS: `${conf.MARCA} Programa SISS ${i + 1}`, nombre_proyecto: `${conf.MARCA} Proyecto ${i + 1}`, tipo_oferta: 'proyecto', descripcion_actividades: 'Proyecto del lote de pruebas de rendimiento.', cupos_ofertados: CUPOS_BASE, cupos_disponibles: CUPOS_BASE - pr.asignados, estado_oferta: 'aprobada', fecha_registro: ahora } });
      await tx.deseo_de_carrera.create({ data: { oferta_id: o.id, carrera_id: carrera.id } });
      if (pr.base) {
        // Para la bandeja de "ofertas pendientes" de coordinación.
        await tx.oferta_servicio.create({ data: { profesor_id: prof.id, nombre_proyecto: `${conf.MARCA} Propuesta ${i + 1}`, tipo_oferta: 'proyecto', descripcion_actividades: 'Propuesta pendiente del lote de pruebas.', cupos_ofertados: 2, cupos_disponibles: 2, estado_oferta: 'pendiente_revision', fecha_registro: ahora } });
      }
      ofertas.push({ oferta: o, profesor: prof });
    }

    for (const al of p.alumnos) {
      const { oferta, profesor } = ofertas[al.profesor];
      const u = await usuario('alumno_asignado', al);
      // Mismos campos que crea GR-01 (gr.service.js: usuario + alumno + solicitud_registro) más los avances del flujo
      // hasta alumno_asignado (SISS, documentación, carta compromiso y expediente aprobados).
      await tx.alumno.create({ data: { boleta: al.boleta, usuario_id: u.id, celular: al.celular, carrera: 'ISC', creditos: CREDITOS.toFixed(2), semestre: SEMESTRE, correo_personal: al.correoPersonal } });
      const s = await tx.solicitud_registro.create({ data: { alumno_id: al.boleta, carrera_id: carrera.id, dictamen: null, periodo_registro_id: periodo.id, oferta_id: oferta.id, motivacion_oferta: MOTIVACION, estado_solicitud: 'alumno_asignado', estado_anterior: 'expediente_pendiente_revision', fecha_aplicacion: fechaAplicacion, registro_siss: true, docs_iniciales: true, carta_compromiso: true, fecha_carta_compromiso: fechaCarta, expediente: true } });
      const act = await tx.actividad.create({ data: { solicitud_registro_id: s.id, titulo: 'Análisis de requerimientos', descripcion: 'Actividad del lote de pruebas de rendimiento.', entregable_esperado: 'Documento de requerimientos.', fecha_limite: fechaUTC(sumarDiasISO(fin, -1)), estado: 'en_progreso', fecha_asignacion: fechaUTC(inicio), porcentaje_progreso: Math.min(100, jornadas.length * 5) } });
      for (const [j, d] of jornadas.entries()) {
        const b = await tx.bitacora.create({ data: { solicitud_registro_id: s.id, hora_inicio: new Date(`${d}T15:00:00.000Z`), hora_fin: new Date(`${d}T19:00:00.000Z`), horas_contabilizadas: 4, estado: 'aprobada', fecha_registro: fechaUTC(d), fecha_revision: new Date(`${d}T23:00:00.000Z`), revisado_por_id: profesor.id } });
        await tx.registro_bitacora_actividades.create({ data: { bitacora_id: b.id, actividad_id: act.id, descripcion: `Avance del ${d}.`, porcentaje_avance_registrado: Math.min(100, (j + 1) * 5), evidencia: `Evidencia del ${d}.` } });
      }
      await tx.cumulo_horas_y_faltas.create({ data: { alumno_id: al.boleta, horas_acumuladas: jornadas.length * 4, horas_rechazadas: 0, faltas_acumuladas: 0, faltas_consecutivas: 0, fecha_ultima_evaluacion_faltas: fechaUTC(hoyISO) } });
    }
    return { inicio, fin, p1, p2, jornadas: jornadas.length };
  }, { timeout: 600000, maxWait: 20000 });
}

// Lotes creados por una versión anterior repetían UN hash en todos los usuarios. Aquí cada usuario del lote que comparta
// su hash con otro recibe uno propio (mismo id y demás datos; solo cambia `contrasena`), siempre que el hash siga
// correspondiendo a K6_PASSWORD. Idempotente: si todos son distintos, no hace nada.
async function asegurarHashesPropios() {
  const usuarios = await prisma.usuario.findMany({ where: { correo_institucional: { in: conf.todosLosCorreos() } }, select: { id: true, contrasena: true } });
  const porHash = new Map();
  for (const u of usuarios) porHash.set(u.contrasena, [...(porHash.get(u.contrasena) ?? []), u]);
  let corregidos = 0;
  for (const [hashCompartido, grupo] of porHash) {
    if (grupo.length < 2 || !(await bcrypt.compare(conf.PASSWORD, hashCompartido))) continue;
    for (const u of grupo) {
      await prisma.usuario.update({ where: { id: u.id }, data: { contrasena: await hashContrasena() } });
      corregidos += 1;
    }
  }
  return corregidos;
}

// Rúbricas (misma función que POST /reportes/rubrica) y reporte #1 por el flujo real de envío, con sello falso.
async function crearReportes(p) {
  const correos = [...p.alumnos, ...p.profesores].map((u) => u.correo);
  const usuarios = await prisma.usuario.findMany({ where: { correo_institucional: { in: correos } }, select: { id: true, correo_institucional: true, rol: true, rubrica_imagen: true } });
  const id = Object.fromEntries(usuarios.map((u) => [u.correo_institucional, u]));
  for (const [i, correo] of correos.entries()) {
    if (!id[correo].rubrica_imagen) {
      const [w, h] = id[correo].rol === 'profesor' ? [203, 61] : [321, 91];
      await guardarRubrica(id[correo].id, { buffer: png(w, h, i + 1) }, { ip: '127.0.0.1', prisma });
    }
  }
  let enviados = 0; let aprobados = 0;
  for (const [a, al] of p.alumnos.entries()) {
    const existe = await prisma.reporte_mensual.findFirst({ where: { num_reporte: 1, solicitud_registro: { alumno_id: al.boleta } } });
    let reporteId = existe?.id;
    if (!existe) {
      const r = await enviarReporteMensual(id[al.correo].id, 'Actividades del periodo para el lote de pruebas de rendimiento.', { ip: '127.0.0.1', solicitarSelloTiempo: selloFalso, emitirAUsuario: sinSocket });
      reporteId = r.reporte.id; enviados += 1;
    }
    // Alumnos de un profesor base: su reporte se queda pendiente del profesor (bandejas de los profesores que se conectan).
    // Alumnos de un adicional: su profesor lo aprueba (rúbrica + sello falso) y pasa a coordinación.
    const fila = await prisma.reporte_mensual.findUnique({ where: { id: reporteId } });
    if (!esDeProfesorBase(a) && fila.estado_reporte === 'pendiente_revision_profesor') {
      await aprobarReporte(id[p.profesores[al.profesor].correo].id, 'mensual', reporteId, { ip: '127.0.0.1', solicitarSelloTiempo: selloFalso, emitirAUsuario: sinSocket });
      aprobados += 1;
    }
  }
  return { enviados, aprobados };
}

async function resumen(p) {
  const boletas = p.alumnos.map((a) => a.boleta);
  const estados = await prisma.reporte_mensual.groupBy({ by: ['estado_reporte'], where: { solicitud_registro: { alumno_id: { in: boletas } } }, _count: true });
  const asignados = await prisma.solicitud_registro.count({ where: { alumno_id: { in: boletas }, estado_solicitud: 'alumno_asignado', oferta: { estado_oferta: 'aprobada' } } });
  const bitacoras = await prisma.bitacora.count({ where: { solicitud_registro: { alumno_id: { in: boletas } } } });
  const base = p.profesores.filter((x) => x.base).length;
  log(`alumnos ${p.alumnos.length} (asignados a oferta aprobada: ${asignados}) | profesores base ${base} | adicionales ${p.profesores.length - base} | coordinadores ${p.coordinadores.length}`);
  log(`bitácoras ${bitacoras} | reportes ${estados.map((e) => `${e.estado_reporte}=${e._count}`).join(', ')}`);
  log(`ejemplos: ${p.alumnos[0].correo} · ${p.profesores[0].correo} · ${p.coordinadores[0].correo} (contraseña ${conf.PASSWORD})`);
}

async function main() {
  const p = plan();
  validarPlan(p);
  const hoyISO = normalizarFechaISO(calcularDiaMexicoUTC());
  let estado = await estadoDelLote();
  if (estado.startsWith('otra forma')) {
    log(`ya existe un lote con ${estado}: se borra y se crea de nuevo`);
    const { restos } = await limpiarLote(prisma);
    if (Object.values(restos).some((x) => x > 0)) throw new Error(`No se pudo limpiar el lote anterior: ${JSON.stringify(restos)}`);
    estado = 'ausente';
  }
  if (estado === 'ausente') {
    const base = await crearBase(hoyISO, p);
    log(`base creada: periodo ${base.inicio} → ${base.fin}; #1 ${base.p1.inicio}→${base.p1.fin}; #2 ${base.p2.inicio}→${base.p2.fin}; ${base.jornadas} bitácoras por alumno`);
  } else {
    log('el lote ya existía completo; solo se completan hashes, rúbricas y reportes que falten');
  }
  const corregidos = await asegurarHashesPropios();
  if (corregidos > 0) log(`hash propio para ${corregidos} usuario(s) que compartían el mismo`);
  const r = await crearReportes(p);
  log(`reportes enviados ahora: ${r.enviados}; aprobados por el profesor ahora: ${r.aprobados}`);
  await resumen(p);
}

main()
  .catch((e) => { console.error(`\n${e.stack}\n`); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); try { req('src/lib/redis').disconnect(); } catch {} });
