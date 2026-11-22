// verificar.js — amd-pro-rep (SOLO LECTURA: SELECT y lectura de disco)
//
//   docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/verificar.js
//
// Dos bloques:
//   MIS CASOS      → decide el código de salida (0 = todo bien, 1 = algo falla).
//   DATOS DE KAREN → solo informa con ⚠️ si algo difiere de lo esperado; NO
//                    hace fallar la verificación (Karen puede ajustar sus seeds).
// La protección dura de los datos de Karen es la huella de index.js.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');
const { RUTA_BASE_DOCUMENTOS, RUTA_BASE_PROFESORES } = require('../../../modules/reportes/reportes.shared');
const {
  PASSWORD, CORREO_COORDINADOR_CREADOR, CORREOS_COORDINADORES, PROFESORES, CORREOS_PROFESORES, esBoletaMia,
  FECHA_CREACION_PROFESORES, OFERTAS, PROGRAMA, ACTIVIDAD,
} = require('./_datos');
const { calcularFechasOferta, rutaDeOferta, mensajeConclusion } = require('./02-ofertas');
const { esHabil } = require('./_helpers');
const { contarCuposOcupados, ESTADOS_LSS_LIBERAN_CUPO } = require('../../../lib/cupos');
const crypto = require('crypto');
const { descifrarBuffer } = require('../../../lib/fileEncryption');
const { leerSello } = require('../../../modules/reportes/reportes.assets');
const { prepararReporteMensual, plazoEnvioReporteMensualVencido } = require('../../../modules/reportes/reportes-alumno.service');
const { prepararReporteGlobal } = require('../../../modules/reportes/reportes-global.service');
const { obtenerSolicitud: obtenerSolicitudCaracteristica } = require('../../../modules/administrativa/caracteristicas/caracteristicas.service');
const { ALUMNOS, ALUMNOS_BAJAS, ANUNCIOS, CARTAS_FIRMADAS, TEXTOS_REPORTES } = require('./_datos');
const { validarActividades } = require('../../../modules/reportes/reportes.texto');
const { idsUsuarioServidor } = require('./_permisos');
const bajasService = require('../../../modules/administrativa/bajas/bajas.service');
const cartaFirmadaService = require('../../../modules/administrativa/documentos/carta-firmada.service');
const documentosService = require('../../../modules/administrativa/documentos/documentos.service');
const usuariosAsignadosService = require('../../../modules/administrativa/directorio/usuarios-asignados.service');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../../../modules/gr/gr.shared');

// ── Lo esperado de Karen (cred-gr-ah-lss al 21-nov-2026) ──────────────────
const KAREN_PROFESORES = {
  'profesorcastillo@ipn.mx': { caracteristica: null, cupos: 3 },
  'profesorvaldez@ipn.mx': { caracteristica: 'Investigador', cupos: 4 },
  'profesorromero@ipn.mx': { caracteristica: 'Presidente_de_academia', cupos: 5 },
  'profesorochoa@ipn.mx': { caracteristica: 'Coordinador', cupos: 5 },
  'profesorsandoval@ipn.mx': { caracteristica: 'Jefe_de_departamento', cupos: 6 },
  'profesorfigueroa@ipn.mx': { caracteristica: 'Funcionario', cupos: 6 },
  'profesorvega@ipn.mx': { caracteristica: 'Profesor_coordinador_de_clubes', cupos: 6 },
};

// boleta → [correo, estado_solicitud esperado]
const KAREN_ALUMNOS = {
  '2020630101': ['rosales0101@alumno.ipn.mx', 'espera_respuesta_de_profesor'],
  '2019630201': ['camacho0201@alumno.ipn.mx', 'rechazada_definitivamente'],
  '2020630301': ['briones0301@alumno.ipn.mx', 'rechazada_definitivamente'],
  '2021630401': ['quintero0401@alumno.ipn.mx', 'alumno_asignado'],
  '2019630501': ['barrera0501@alumno.ipn.mx', 'alumno_asignado'],
  '2020630601': ['estrada0601@alumno.ipn.mx', 'espera_respuesta_de_profesor'],
  '2021630701': ['nava0701@alumno.ipn.mx', 'espera_respuesta_de_profesor'],
  '2019630801': ['guerrero0801@alumno.ipn.mx', 'SISS_y_documentacion_pendiente'],
  '2020630901': ['maldonado0901@alumno.ipn.mx', 'SISS_y_documentacion_pendiente'],
  '2021631001': ['cervantes1001@alumno.ipn.mx', 'SISS_y_documentacion_pendiente'],
  '2019631101': ['ibarra1101@alumno.ipn.mx', 'expediente_con_correcciones'],
  '2020631201': ['pacheco1201@alumno.ipn.mx', 'expediente_pendiente_revision'],
  '2021631301': ['olvera1301@alumno.ipn.mx', 'espera_confirmacion_carta_compromiso'],
  '2020631401': ['rangel1401@alumno.ipn.mx', 'alumno_asignado'],
  '2019631501': ['fuentes1501@alumno.ipn.mx', 'alumno_asignado'],
  '2020631601': ['rosado1601@alumno.ipn.mx', 'alumno_asignado'],
  '2019631701': ['duarte1701@alumno.ipn.mx', 'alumno_asignado'],
  '2020631801': ['bravo1801@alumno.ipn.mx', 'alumno_asignado'],
};

const KAREN_OFERTAS = { total: 18, aprobada: 17, concluida: 1 };

// ── Registro de resultados ────────────────────────────────────────────────
let fallas = 0;
let avisos = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const falla = (m) => { fallas += 1; console.log(`  ❌ ${m}`); };
const aviso = (m) => { avisos += 1; console.log(`  ⚠️  ${m}`); };
const revisar = (cond, mOk, mMal) => (cond ? ok(mOk) : falla(mMal ?? mOk));

async function misCasos() {
  console.log('\n══ MIS CASOS (deciden el resultado) ══');
  const creador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR_CREADOR } });

  console.log('\n· Profesores');
  for (const p of Object.values(PROFESORES)) {
    const u = await prisma.usuario.findUnique({
      where: { correo_institucional: p.correo },
      include: { profesor: { include: { caracteristica: true } } },
    });
    if (!u) { falla(`${p.clave} ${p.correo}: no existe`); continue; }
    const problemas = [];
    if (u.rol !== 'profesor' || !u.profesor) problemas.push(`rol ${u.rol}`);
    const carac = u.profesor?.caracteristica?.nombre ?? null;
    if (carac !== p.caracteristica) problemas.push(`característica ${carac ?? 'base'} ≠ ${p.caracteristica ?? 'base'}`);
    if (u.profesor?.cupos_totales !== p.cuposEsperados) problemas.push(`cupos ${u.profesor?.cupos_totales} ≠ ${p.cuposEsperados}`);
    if (u.creado_por_id !== creador?.id) problemas.push(`creado_por_id ${u.creado_por_id} ≠ ${creador?.id} (herrera)`);
    if (u.intentos_fallidos !== null) problemas.push(`intentos_fallidos ${u.intentos_fallidos}`);
    if (u.cuenta_bloqueada !== null) problemas.push(`cuenta_bloqueada ${u.cuenta_bloqueada}`);
    if (u.profesor && (u.profesor.departamento !== p.departamento || u.profesor.cubiculo !== p.cubiculo
      || u.profesor.horario_atencion !== p.horario || u.profesor.telefono_personal !== p.telefono)) {
      problemas.push('departamento/cubículo/horario/teléfono distintos a _datos.js');
    }
    if (!(await bcrypt.compare(PASSWORD, u.contrasena))) problemas.push('la contraseña no es la del seed');
    revisar(!problemas.length,
      `${p.clave} ${p.correo} · ${carac ?? 'base'} · ${u.profesor?.cupos_totales} cupos · creado por herrera · contraseña OK`,
      `${p.clave} ${p.correo}: ${problemas.join('; ')}`);
  }

  const totalMios = await prisma.usuario.count({ where: { correo_institucional: { in: CORREOS_PROFESORES } } });
  revisar(totalMios === CORREOS_PROFESORES.length, `${totalMios} profesores míos, sin duplicados`);

  console.log('\n· Alta de mis profesores');
  for (const p of Object.values(PROFESORES)) {
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: p.correo } });
    if (!u) continue;
    revisar(u.fecha_creacion.getTime() === new Date(FECHA_CREACION_PROFESORES).getTime(),
      `${p.clave} fecha_creacion ${u.fecha_creacion.toISOString().slice(0, 10)}`,
      `${p.clave} fecha_creacion ${u.fecha_creacion.toISOString()} ≠ ${FECHA_CREACION_PROFESORES}`);
  }

  await verificarOfertas();
  await verificarREP();
  await verificarRubricas();
  await verificarADM();
  await verificarPdfsConTexto();

  console.log('\n· uploads/ de mis usuarios');
  // Toda carpeta mía en uploads debe tener dueño en la BD, y una rubrica.enc
  // solo puede existir si la BD la tiene registrada (si no → 409 al firmar).
  const carpetas = [];
  if (fs.existsSync(RUTA_BASE_DOCUMENTOS)) {
    for (const n of fs.readdirSync(RUTA_BASE_DOCUMENTOS)) if (esBoletaMia(n)) carpetas.push({ tipo: 'alumno', clave: n, base: RUTA_BASE_DOCUMENTOS });
  }
  for (const correo of CORREOS_PROFESORES) {
    if (fs.existsSync(path.join(RUTA_BASE_PROFESORES, correo))) carpetas.push({ tipo: 'profesor', clave: correo, base: RUTA_BASE_PROFESORES });
  }
  let problemasUploads = 0;
  for (const c of carpetas) {
    const usuario = c.tipo === 'alumno'
      ? (await prisma.alumno.findUnique({ where: { boleta: c.clave }, include: { usuario: true } }))?.usuario
      : await prisma.usuario.findUnique({ where: { correo_institucional: c.clave } });
    if (!usuario) { problemasUploads += 1; falla(`uploads/${path.basename(c.base)}/${c.clave}: huérfana (su dueño no existe)`); continue; }
    const rubrica = path.join(c.base, c.clave, 'Rubrica', 'rubrica.enc');
    if (fs.existsSync(rubrica) && !usuario.rubrica_imagen) {
      problemasUploads += 1;
      falla(`${c.clave}: rubrica.enc vieja en disco y rubrica_imagen null (daría 409)`);
    }
  }
  if (!problemasUploads) ok(`${carpetas.length} carpeta(s) mía(s) en uploads, ninguna huérfana ni con rubrica.enc vieja`);

  await verificarAccesoNode();
}

// ── Acceso real del servidor (usuario `node`) a mis archivos ──────────────
//
// El backend corre como `node`; si un archivo no es legible/escribible por ese
// usuario, la pantalla falla (500 EACCES en el historial de REP, 404 en ADM-13).
// La prueba se hace DE VERDAD como node:
//   - si verificar.js corre como root (lo normal: `docker compose exec`), lanza un
//     proceso hijo con el uid/gid de node (child_process.spawnSync con uid/gid);
//   - si ya corre como node (`docker compose exec -u node`), la hace directamente.
// Lee cada archivo y, para escribir, crea y borra un archivo temporal.

// Esta función se ejecuta dentro del proceso hijo (como node): solo usa `fs`/`path`.
function probarAccesoComoNode(plan) {
  const fs = require('fs');
  const path = require('path');
  const r = { leer: [], escribir: [], carpetasAjenas: [] };
  for (const f of plan.leer) {
    try { fs.readFileSync(f); r.leer.push([f, true]); } catch (e) { r.leer.push([f, e.code]); }
  }
  for (const d of plan.escribir) {
    const t = path.join(d, `.verificar-node-${process.pid}`);
    try { fs.writeFileSync(t, 'x'); fs.unlinkSync(t); r.escribir.push([d, true]); } catch (e) { r.escribir.push([d, e.code]); }
  }
  // Carpetas ajenas: ¿node puede recorrerlas y leer todo lo que hay dentro?
  const recorrer = (ruta) => {
    const st = fs.lstatSync(ruta);
    if (st.isDirectory()) { for (const h of fs.readdirSync(ruta)) recorrer(path.join(ruta, h)); } else { fs.closeSync(fs.openSync(ruta, 'r')); }
  };
  for (const c of plan.ajenas) {
    let lectura = true;
    let escritura = true;
    try { recorrer(c); } catch (e) { lectura = e.code; }
    const t = path.join(c, `.verificar-node-${process.pid}`);
    try { fs.writeFileSync(t, 'x'); fs.unlinkSync(t); } catch (e) { escritura = e.code; }
    r.carpetasAjenas.push([c, lectura, escritura]);
  }
  return r;
}

function ejecutarComoNode(plan) {
  const { uid, gid } = idsUsuarioServidor();
  const actual = process.getuid();
  if (actual === uid) return probarAccesoComoNode(plan);
  if (actual !== 0) throw new Error(`verificar.js corre como uid ${actual}: no puede probar como node (usa root o -u node).`);
  const codigo = `const plan = JSON.parse(require('fs').readFileSync(0, 'utf8'));\nconst probar = ${probarAccesoComoNode.toString()};\n`
    + 'process.stdout.write(JSON.stringify(probar(plan)));';
  const { spawnSync } = require('child_process');
  const res = spawnSync(process.execPath, ['-e', codigo], { input: JSON.stringify(plan), uid, gid, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) throw new Error(`la prueba como node falló: ${res.stderr || res.error?.message}`);
  return JSON.parse(res.stdout);
}

/** Archivos de una carpeta, recursivamente (listado hecho por este proceso). */
function archivosDe(carpeta) {
  const out = [];
  if (!fs.existsSync(carpeta)) return out;
  for (const h of fs.readdirSync(carpeta)) {
    const ruta = path.join(carpeta, h);
    if (fs.lstatSync(ruta).isDirectory()) out.push(...archivosDe(ruta)); else out.push(ruta);
  }
  return out;
}

async function verificarAccesoNode() {
  console.log('\n· Acceso del servidor (usuario node) a mis archivos');
  const alumnos = [...ALUMNOS, ...ALUMNOS_BAJAS];
  const plan = { leer: [], escribir: [], ajenas: [] };
  const porDueño = new Map(); // ruta → etiqueta del usuario mío al que pertenece

  for (const al of alumnos) {
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: al.correoInst } });
    const carpeta = path.join(RUTA_BASE_DOCUMENTOS, al.boleta);
    const archivos = archivosDe(carpeta);
    const etiqueta = `${al.sufijo} ${al.correoInst.split('@')[0]}`;
    if (u?.rubrica_imagen && !archivos.includes(path.join(RUTA_BASE_DOCUMENTOS, u.rubrica_imagen))) archivos.push(path.join(RUTA_BASE_DOCUMENTOS, u.rubrica_imagen));
    archivos.forEach((f) => { plan.leer.push(f); porDueño.set(f, etiqueta); });
    // Escribir: su carpeta (GR, bajas, carta firmada) y Reportes/ si existe (REP la crea si no).
    for (const d of [carpeta, path.join(carpeta, 'Reportes')]) {
      if (fs.existsSync(d)) { plan.escribir.push(d); porDueño.set(d, etiqueta); }
    }
  }
  for (const p of Object.values(PROFESORES)) {
    const carpeta = path.join(RUTA_BASE_PROFESORES, p.correo);
    const etiqueta = `${p.clave} ${p.correo.split('@')[0]}`;
    if (fs.existsSync(carpeta)) {
      archivosDe(carpeta).forEach((f) => { plan.leer.push(f); porDueño.set(f, etiqueta); });
      plan.escribir.push(carpeta); porDueño.set(carpeta, etiqueta);
    } else {
      // Sin firma todavía: el servidor debe poder crear su carpeta dentro de la base.
      plan.escribir.push(RUTA_BASE_PROFESORES); porDueño.set(RUTA_BASE_PROFESORES, `${etiqueta} (base profesores/)`);
    }
  }
  plan.escribir = [...new Set(plan.escribir)];

  // Carpetas de Karen (solo informativo): todo lo que NO es mío, sin coordinador/.
  for (const n of fs.existsSync(RUTA_BASE_DOCUMENTOS) ? fs.readdirSync(RUTA_BASE_DOCUMENTOS) : []) {
    if (!esBoletaMia(n)) plan.ajenas.push(path.join(RUTA_BASE_DOCUMENTOS, n));
  }
  for (const n of fs.existsSync(RUTA_BASE_PROFESORES) ? fs.readdirSync(RUTA_BASE_PROFESORES) : []) {
    if (!CORREOS_PROFESORES.includes(n)) plan.ajenas.push(path.join(RUTA_BASE_PROFESORES, n));
  }

  let r;
  try { r = ejecutarComoNode(plan); } catch (e) { falla(e.message); return; }

  const malos = new Map();
  for (const [ruta, res] of [...r.leer, ...r.escribir]) {
    if (res !== true) {
      const quien = porDueño.get(ruta) ?? ruta;
      malos.set(quien, [...(malos.get(quien) ?? []), `${path.relative(path.dirname(RUTA_BASE_DOCUMENTOS), ruta)} (${res})`]);
    }
  }
  const usuarios = alumnos.length + Object.keys(PROFESORES).length;
  if (!malos.size) {
    ok(`node lee ${r.leer.length} archivo(s) (firmas, reportes, documentos) y escribe en ${r.escribir.length} carpeta(s) de mis ${usuarios} usuario(s)`);
  } else {
    for (const [quien, lista] of malos) falla(`node no puede acceder (${quien}): ${lista.slice(0, 3).join(', ')}${lista.length > 3 ? ` … y ${lista.length - 3} más` : ''}`);
  }
  ACCESO_KAREN = r.carpetasAjenas;
}

let ACCESO_KAREN = null;

async function verificarOfertas() {
  console.log('\n· Ofertas (PRO)');
  const ahora = new Date();
  for (const o of OFERTAS) {
    const p = PROFESORES[o.profesor];
    const prof = await prisma.usuario.findUnique({ where: { correo_institucional: p.correo }, include: { profesor: true } });
    if (!prof?.profesor) { falla(`${o.clave}: no existe su profesor ${p.correo}`); continue; }
    const filas = await prisma.oferta_servicio.findMany({
      where: { profesor_id: prof.profesor.id, nombre_proyecto: o.titulo },
      include: { coordinador: { include: { usuario: true } }, deseo_de_carrera: { include: { carrera: true } } },
    });
    if (filas.length !== 1) { falla(`${o.clave} "${o.titulo}": ${filas.length} filas (se esperaba 1)`); continue; }
    const of = filas[0];
    const problemas = [];

    if (of.estado_oferta !== o.estadoFinal) problemas.push(`estado ${of.estado_oferta} ≠ ${o.estadoFinal}`);
    if (of.tipo_oferta !== o.tipo) problemas.push(`tipo ${of.tipo_oferta}`);
    const cuposOf = o.tipo === 'proyecto' ? o.cupos : null;
    if (of.cupos_ofertados !== cuposOf) problemas.push(`cupos_ofertados ${of.cupos_ofertados} ≠ ${cuposOf}`);
    const dispEsperados = o.estadoFinal === 'concluida' ? 0 : (o.tipo === 'proyecto' ? o.cupos : 1);
    // Las ofertas de P1/P3 las ocupan las partes 3–4: aquí solo se exige que no excedan su tope.
    const tope = o.tipo === 'proyecto' ? o.cupos : 1;
    if (o.alumnos ? of.cupos_disponibles > tope : of.cupos_disponibles !== dispEsperados) {
      problemas.push(`cupos_disponibles ${of.cupos_disponibles}`);
    }
    const carreras = of.deseo_de_carrera.map((d) => d.carrera.nombre).sort().join(',');
    if (carreras !== [...o.carreras].sort().join(',')) problemas.push(`carreras ${carreras}`);

    const decidida = o.estadoFinal !== 'pendiente_revision';
    const revisor = of.coordinador?.usuario?.correo_institucional ?? null;
    if (decidida ? revisor !== o.revisor : revisor !== null) problemas.push(`revisor ${revisor} ≠ ${decidida ? o.revisor : 'ninguno'}`);
    const conSISS = ['aprobada', 'cerrada', 'concluida'].includes(o.estadoFinal);
    if (conSISS) {
      if (of.programa_SISS !== o.programa || of.nombre_SISS !== o.actividad) problemas.push('Programa/Actividad SISS distintos al catálogo');
      if (!Object.values(PROGRAMA).includes(of.programa_SISS) || !Object.values(ACTIVIDAD).includes(of.nombre_SISS)) problemas.push('SISS fuera del catálogo de DecisionPanel');
    } else if (of.programa_SISS || of.nombre_SISS) problemas.push('tiene SISS sin estar aprobada');
    if (o.estadoFinal === 'rechazada' ? of.motivo_rechazo !== o.motivoRechazo : of.motivo_rechazo) problemas.push(`motivo_rechazo ${of.motivo_rechazo ? 'distinto' : 'vacío'}`);

    // Cadena de fechas: alta < registro < decisión < lectura < conclusión < ahora
    const f = await calcularFechasOferta(o);
    if (of.fecha_registro.getTime() !== f.registro.getTime()) problemas.push(`fecha_registro ${of.fecha_registro.toISOString()} ≠ ${f.registro.toISOString()}`);
    if (!(await esHabil(of.fecha_registro.toISOString().slice(0, 10)))) problemas.push('registro en día inhábil');
    const notis = await prisma.notificacion.findMany({ where: { usuario_id: prof.id, ruta_relacionada: rutaDeOferta(of.id) }, orderBy: { id: 'asc' } });
    const nDecision = notis.filter((n) => /fue (aprobada|rechazada)/.test(n.mensaje));
    const nConclusion = notis.filter((n) => n.mensaje === mensajeConclusion(o.titulo));
    const cadena = [new Date(FECHA_CREACION_PROFESORES), of.fecha_registro];
    if (decidida) {
      if (nDecision.length !== 1) problemas.push(`${nDecision.length} notificaciones de decisión (se esperaba 1)`);
      else {
        const n = nDecision[0];
        cadena.push(n.fecha_creacion);
        if (n.fecha_creacion.getTime() !== f.decision.getTime()) problemas.push('fecha de la notificación de decisión distinta');
        const debeLeida = o.estadoFinal !== 'rechazada';
        if (n.leida !== debeLeida) problemas.push(`notificación de decisión ${n.leida ? 'leída' : 'sin leer'} (se esperaba ${debeLeida ? 'leída' : 'sin leer'})`);
        if (n.leida) cadena.push(n.fecha_leida);
      }
    } else if (nDecision.length) problemas.push('tiene notificación de decisión sin estar decidida');
    if (f.cierre) cadena.push(f.cierre);
    if (o.estadoFinal === 'concluida') {
      if (nConclusion.length !== 1 || !nConclusion[0].leida) problemas.push('falta la notificación de conclusión leída');
      else cadena.push(nConclusion[0].fecha_creacion, nConclusion[0].fecha_leida);
    }
    cadena.push(ahora);
    for (let i = 1; i < cadena.length; i += 1) {
      if (!(cadena[i - 1] < cadena[i])) { problemas.push(`fechas fuera de orden (${cadena[i - 1]?.toISOString()} ≥ ${cadena[i]?.toISOString()})`); break; }
    }
    if (f.periodo && f.decision >= new Date(`${f.periodo.maxExpediente}T00:00:00-06:00`)) problemas.push('aprobada después de la fecha límite de expediente de su periodo');

    revisar(!problemas.length,
      `${o.clave} ${o.titulo} · ${of.estado_oferta} · registro ${of.fecha_registro.toISOString().slice(0, 10)}${decidida ? ` · ${revisor.replace('@ipn.mx', '')}` : ''}`,
      `${o.clave} ${o.titulo}: ${problemas.join('; ')}`);
  }

  // Ninguna oferta mía debe cumplir la regla de conclusión automática (cron 00:00).
  const mias = await prisma.oferta_servicio.findMany({
    where: { estado_oferta: 'aprobada', profesor: { usuario: { correo_institucional: { in: CORREOS_PROFESORES } } } },
    include: { solicitud_registro: { include: { liberacion_proceso: true } } },
  });
  const concluiria = mias.filter((of) => {
    const activos = of.solicitud_registro.filter((s) => ESTADOS_QUE_OCUPAN_CUPO_PROFESOR.includes(s.estado_solicitud));
    return of.cupos_disponibles === 0 && activos.length > 0
      && activos.every((s) => ESTADOS_LSS_LIBERAN_CUPO.includes(s.liberacion_proceso?.estado));
  });
  revisar(!concluiria.length, `${mias.length} ofertas mías aprobadas; ninguna la concluiría el cron`,
    `el cron concluiría: ${concluiria.map((x) => x.nombre_proyecto).join(', ')}`);

  const p2 = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES.P2.correo }, include: { profesor: true } });
  if (p2?.profesor) {
    const ocupados = await contarCuposOcupados(p2.profesor.id);
    revisar(ocupados === 0, 'P2 salinas: 0 cupos ocupados', `P2 salinas: ${ocupados} cupos ocupados (se esperaba 0)`);
  }
}

// Lo que debe ver cada alumno el lunes 23-nov (simulado a las 9:30 y a las 13:00).
const ESPERADO_DEMO = {
  1901: { numero: 1, puede: true, bloqueos: [], plazo: 'preventivo', dia: 5, ah: false },
  2001: { numero: 1, puede: true, bloqueos: [], plazo: 'vencido', ah: true },
  2101: { numero: 5, puede: false, bloqueos: ['PERIODO_NO_CERRADO'], plazo: null, ah: false },
  2201: { numero: 5, puede: false, bloqueos: ['PERIODO_NO_CERRADO'], plazo: null, ah: false },
  2301: { numero: 8, puede: false, bloqueos: ['PERIODO_NO_CERRADO'], plazo: null, ah: false, global: true },
  2401: { numero: 1, puede: false, bloqueos: ['BITACORAS_SIN_REVISAR'], plazo: 'preventivo', dia: 5, ah: false },
};
const MOMENTOS_DEMO = [new Date('2026-11-23T09:30:00-06:00'), new Date('2026-11-23T13:00:00-06:00')];

function archivoValido(base, rutaRelativa, hashEsperado) {
  try {
    const pdf = descifrarBuffer(fs.readFileSync(path.join(base, rutaRelativa)));
    return !hashEsperado || crypto.createHash('sha256').update(pdf).digest('hex') === hashEsperado;
  } catch { return false; }
}

async function verificarREP() {
  console.log('\n· Reportes (REP)');
  const ahora = new Date();

  try { leerSello(); ok('sello de coordinación (uploads/coordinador) se descifra con la ENCRYPTION_KEY de este entorno'); } catch (e) { falla(`sello de coordinación ilegible: ${e.message}`); }

  const p1 = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES.P1.correo }, include: { profesor: true } });
  revisar(Boolean(p1?.rubrica_imagen) && fs.existsSync(path.join(RUTA_BASE_PROFESORES, p1.rubrica_imagen)),
    'P1 con firma registrada (BD y disco)', 'P1 sin firma en BD o en disco');
  if (p1?.profesor) {
    const ocupados = await contarCuposOcupados(p1.profesor.id);
    revisar(ocupados === 6, 'P1 lozano: 6 de 6 cupos ocupados', `P1 lozano: ${ocupados} cupos ocupados (se esperaba 6)`);
  }

  for (const al of ALUMNOS) {
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: al.correoInst } });
    if (!u) { falla(`${al.sufijo} ${al.correoInst}: no existe`); continue; }
    const sol = await prisma.solicitud_registro.findFirst({
      where: { alumno_id: al.boleta },
      include: { oferta: true, periodo_registro: { include: { evento_calendario: true } } },
    });
    const problemas = [];
    const oferta = OFERTAS.find((o) => o.clave === al.oferta);
    if (sol?.estado_solicitud !== 'alumno_asignado') problemas.push(`solicitud ${sol?.estado_solicitud}`);
    if (sol?.oferta?.nombre_proyecto !== oferta.titulo) problemas.push(`oferta ${sol?.oferta?.nombre_proyecto}`);
    const inicio = sol?.periodo_registro?.evento_calendario?.fecha_inicio?.toISOString().slice(0, 10);
    if (inicio !== al.periodoInicio) problemas.push(`periodo ${inicio}`);

    // Bitácoras y horas
    const bits = await prisma.bitacora.findMany({ where: { solicitud_registro_id: sol.id }, orderBy: { fecha_registro: 'asc' } });
    const horasTodas = bits.reduce((s, b) => s + b.horas_contabilizadas, 0);
    const cumulo = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: al.boleta } });
    if (cumulo?.horas_acumuladas !== horasTodas) problemas.push(`cúmulo ${cumulo?.horas_acumuladas} ≠ ${horasTodas} h de bitácoras`);
    if (cumulo?.fecha_ultima_evaluacion_faltas?.toISOString().slice(0, 10) !== '2026-12-01') problemas.push('fecha_ultima_evaluacion_faltas ≠ 2026-12-01');
    if (al.bitacoras.hasta480 && bits.filter((b) => b.estado === 'aprobada').reduce((s, b) => s + b.horas_contabilizadas, 0) !== 480) problemas.push('no suma 480 h aprobadas');
    const pendientes = bits.filter((b) => b.estado !== 'aprobada').map((b) => b.fecha_registro.toISOString().slice(0, 10));
    if (pendientes.join() !== (al.bitacoras.pendiente ?? '')) problemas.push(`bitácoras no aprobadas: ${pendientes.join() || 'ninguna'}`);
    for (const b of bits) {
      const f = b.fecha_registro.toISOString().slice(0, 10);
      if (f < al.periodoInicio || b.hora_fin > ahora || (b.fecha_revision && b.fecha_revision > ahora)) { problemas.push(`bitácora ${f} fuera de rango o futura`); break; }
      if (!(await esHabil(f))) { problemas.push(`bitácora ${f} en día inhábil`); break; }
    }
    const enCurso = bits.filter((b) => ['en_curso', 'pendiente_datos'].includes(b.estado));
    if (enCurso.length) problemas.push(`${enCurso.length} jornadas en curso`);
    const abiertas = await prisma.actividad.findMany({ where: { solicitud_registro_id: sol.id, estado: { in: ['sin_comenzar', 'en_progreso'] } } });
    if (abiertas.some((a) => a.fecha_limite.toISOString().slice(0, 10) < '2026-11-24')) problemas.push('actividad abierta que vencería antes del 24-nov');

    // Reportes, revisiones y archivos
    const reps = await prisma.reporte_mensual.findMany({
      where: { solicitud_registro_id: sol.id }, orderBy: { num_reporte: 'asc' },
      include: { documento: true, revision_reporte_mensual: { orderBy: { id: 'asc' } } },
    });
    const globales = await prisma.reporte_global.count({ where: { solicitud_registro_id: sol.id } });
    if (globales) problemas.push('tiene reporte global (debe generarse en vivo)');
    const estados = reps.map((r) => r.estado_reporte);
    const esperados = al.reportes.map((c) => ({ AC: 'aprobado_coordinador', RC: 'rechazado_coordinador', PC: 'pendiente_revision_coordinador', RP: 'rechazado_profesor', PP: 'pendiente_revision_profesor' })[c]);
    if (estados.join() !== esperados.join()) problemas.push(`reportes [${estados.join(', ')}] ≠ [${esperados.join(', ')}]`);

    const cadena = [['alta', u.fecha_creacion], ['solicitud', sol.fecha_aplicacion], ['carta compromiso', sol.fecha_carta_compromiso]];
    const docsGR = await prisma.documento.findMany({ where: { alumno_id: al.boleta, tipo_documento: { in: ['carta_creditos', 'constancia_seguro_social', 'expediente'] } } });
    const fExp = docsGR.find((d) => d.tipo_documento === 'expediente')?.fecha_creacion;
    cadena.push(['expediente', fExp], ['inicio del periodo', new Date(`${al.periodoInicio}T00:00:00-06:00`)]);
    if (docsGR.some((d) => d.tipo_documento !== 'expediente' && !(d.fecha_creacion > sol.fecha_aplicacion && d.fecha_creacion < fExp))) problemas.push('documentos iniciales fuera de orden');
    if (bits.length) cadena.push(['primera bitácora', bits[0].hora_inicio]);
    // Reportes: todas sus revisiones (envío, profesor, coordinación) en orden creciente, de R1 a Rn.
    for (const r of reps) {
      const fechas = r.revision_reporte_mensual.map((v) => v.fecha);
      cadena.push(...fechas.map((d, i) => [`R${r.num_reporte} revisión ${i + 1}`, d]));
      const ultimaBitDelPeriodo = bits.filter((b) => b.fecha_registro <= fechas[0]).pop();
      if (ultimaBitDelPeriodo && !(ultimaBitDelPeriodo.hora_fin < fechas[0])) problemas.push(`R${r.num_reporte} enviado antes de su última bitácora`);
      if (!archivoValido(RUTA_BASE_DOCUMENTOS, r.documento.ruta_archivo)) problemas.push(`R${r.num_reporte}: PDF vigente ausente o ilegible`);
      const redactado = TEXTOS_REPORTES[al.sufijo]?.[r.num_reporte - 1];
      if (redactado && r.actividades_mes !== validarActividades(redactado.join('\n')).texto) problemas.push(`R${r.num_reporte}: texto de actividades distinto al redactado`);
      for (const v of r.revision_reporte_mensual.filter((x) => x.estado === 'aprobado')) {
        if (!v.token_tsa || !v.hash_documento) problemas.push(`R${r.num_reporte} revisión ${v.tipo_revisor} sin hash o sin sello de tiempo`);
        else if (!archivoValido(RUTA_BASE_DOCUMENTOS, v.ruta_archivo, v.hash_documento)) problemas.push(`R${r.num_reporte} revisión ${v.tipo_revisor}: PDF no coincide con su hash`);
      }
    }
    if (reps.length && u.rubrica_fecha_registro >= reps[0].revision_reporte_mensual[0].fecha) problemas.push('firma registrada después del primer envío');
    cadena.push(['ahora', ahora]);
    // alta < solicitud < carta < expediente < inicio < 1.ª bitácora < R1… < Rn < ahora (estrictamente creciente)
    for (let i = 1; i < cadena.length; i += 1) {
      const [nA, fA] = cadena[i - 1];
      const [nB, fB] = cadena[i];
      if (!fA || !fB || !(fA < fB)) { problemas.push(`fechas fuera de orden: ${nA} (${fA?.toISOString()}) ≥ ${nB} (${fB?.toISOString()})`); break; }
    }

    // Notificaciones
    const notis = await prisma.notificacion.findMany({ where: { usuario_id: u.id } });
    const sinLeer = notis.filter((n) => !n.leida);
    const rechazosVivos = reps.filter((r) => r.estado_reporte.startsWith('rechazado')).length;
    if (sinLeer.length !== rechazosVivos || sinLeer.some((n) => !/rechaz/i.test(n.mensaje))) problemas.push(`${sinLeer.length} notificaciones sin leer (se esperaban ${rechazosVivos}, solo rechazos)`);
    if (notis.some((n) => n.fecha_creacion > ahora || (n.fecha_leida && n.fecha_leida > ahora))) problemas.push('notificación con fecha futura');

    // Lo que verá el lunes 23-nov (servicios reales, solo lectura)
    const esp = ESPERADO_DEMO[al.sufijo];
    for (const momento of MOMENTOS_DEMO) {
      const hora = momento.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
      const d = await prepararReporteMensual(u.id, { ahora: momento });
      const bloqueos = d.motivosBloqueo.map((m) => m.codigo);
      const plazo = d.diagnostico?.plazoEnvio;
      const ah = await plazoEnvioReporteMensualVencido(u.id, { ahora: momento });
      if (d.reporte.numero !== esp.numero) problemas.push(`${hora}: siguiente reporte ${d.reporte.numero} ≠ ${esp.numero}`);
      if (d.puedeGenerar !== esp.puede || bloqueos.join() !== esp.bloqueos.join()) problemas.push(`${hora}: puedeGenerar ${d.puedeGenerar}, bloqueos [${bloqueos.join()}]`);
      if ((plazo?.aplica ? plazo.estado : null) !== esp.plazo || (esp.dia && plazo.diaHabilActual !== esp.dia)) problemas.push(`${hora}: plazo ${plazo?.estado} día ${plazo?.diaHabilActual}`);
      if (ah !== esp.ah) problemas.push(`${hora}: bloqueo de jornada en AH ${ah} ≠ ${esp.ah}`);
      // Sin envíos → sin rúbrica: el asistente debe pedirla (paso "firma") la primera vez.
      if (d.firma?.requiereSubirRubrica !== !al.reportes.length) problemas.push(`${hora}: requiereSubirRubrica ${d.firma?.requiereSubirRubrica} (esperado ${!al.reportes.length})`);
      if (esp.global) {
        const g = await prepararReporteGlobal(u.id, { ahora: momento });
        if (!g.puedeGenerar || g.horas?.acumuladas !== 480) problemas.push(`${hora}: global puedeGenerar ${g.puedeGenerar} (${g.motivosBloqueo?.map((m) => m.codigo).join()})`);
      }
    }

    const demo = esp.global ? 'global listo' : `R${esp.numero} ${esp.puede ? 'generable' : esp.bloqueos.join()}${esp.plazo ? ` · ${esp.plazo}${esp.dia ? ` ${esp.dia}/5` : ''}` : ''}${esp.ah ? ' · AH bloqueada' : ''}`;
    revisar(!problemas.length,
      `${al.sufijo} ${al.correoInst} · ${bits.length} bitácoras, ${horasTodas} h · [${al.reportes.join(' ') || 'sin reportes'}] · 23-nov: ${demo}`,
      `${al.sufijo} ${al.correoInst}: ${problemas.join('; ')}`);
  }

  // Característica de P1: pendiente y ya no aprobable (6 ocupados > 4)
  const solC = await prisma.solicitud_caracteristica.findFirst({ where: { profesor_id: p1.profesor.id }, orderBy: { id: 'desc' } });
  if (!solC) { falla('P1 sin solicitud de característica'); return; }
  const det = await obtenerSolicitudCaracteristica({ solicitudId: solC.id });
  revisar(det.estado === 'pendiente' && det.puedeAprobarse === false && det.capacidadResultante === 4 && det.profesor.ocupados === 6 && det.cuposALiberar === 2,
    `P1 solicita Investigador: pendiente · capacidad resultante 4 · 6 ocupados · "ya no puede aprobarse" (liberar 2)`,
    `característica de P1: ${JSON.stringify({ estado: det.estado, puede: det.puedeAprobarse, cap: det.capacidadResultante, ocup: det.profesor?.ocupados })}`);
}

// Regla: un usuario mío tiene rúbrica sembrada ⇔ ya firmó algo (envío como
// alumno o aprobación como profesor, de un reporte mensual o global). Quien no
// ha firmado nada no tiene rúbrica en BD ni carpeta Rubrica/ en disco: la dibuja
// en vivo la primera vez (si no, guardarRubrica daría 409 RUBRICA_YA_REGISTRADA).
async function verificarRubricas() {
  console.log('\n· Rúbricas (con rúbrica ⇔ ya firmó algo)');
  const usuarios = [
    ...Object.values(PROFESORES).map((p) => ({ etiqueta: `${p.clave} ${p.correo}`, correo: p.correo, base: RUTA_BASE_PROFESORES, clave: p.correo })),
    ...[...ALUMNOS, ...ALUMNOS_BAJAS].map((a) => ({ etiqueta: `${a.sufijo} ${a.correoInst}`, correo: a.correoInst, base: RUTA_BASE_DOCUMENTOS, clave: a.boleta })),
  ];
  const con = [];
  const sin = [];
  for (const x of usuarios) {
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: x.correo } });
    if (!u) { falla(`${x.etiqueta}: no existe`); continue; }
    const donde = { usuario_id: u.id, tipo_revisor: { in: ['alumno', 'profesor'] }, estado: 'aprobado' };
    const firmas = await prisma.revision_reporte_mensual.count({ where: donde }) + await prisma.revision_reporte_global.count({ where: donde });
    const carpeta = path.join(x.base, x.clave, 'Rubrica');
    const problemas = [];
    if (firmas > 0) {
      if (!u.rubrica_imagen) problemas.push(`firmó ${firmas} vez/veces pero rubrica_imagen es null`);
      else if (!fs.existsSync(path.join(x.base, u.rubrica_imagen))) problemas.push(`rubrica_imagen ${u.rubrica_imagen} no existe en disco`);
    } else {
      if (u.rubrica_imagen || u.rubrica_fecha_registro) problemas.push('tiene rúbrica en BD sin haber firmado nada');
      if (fs.existsSync(carpeta)) problemas.push('existe la carpeta Rubrica/ en disco sin haber firmado nada');
    }
    if (problemas.length) falla(`${x.etiqueta}: ${problemas.join('; ')}`);
    else (firmas > 0 ? con : sin).push(x.etiqueta.split(' ')[0]);
  }
  if (con.length || sin.length) ok(`con rúbrica (ya firmaron): ${con.join(', ') || 'ninguno'} · sin rúbrica ni carpeta Rubrica/ (la dibujan en vivo): ${sin.join(', ') || 'ninguno'}`);
}

const ESPERADO_BAJA = {
  2501: { estado: 'rechazada', etapa: 'rechazada', doc: 'rechazada', origen: 'profesor' },
  2601: { estado: 'pendiente', etapa: 'pendiente_coordinacion', doc: 'en_revision', origen: 'alumno' },
  2701: { estado: 'en_revision', etapa: 'en_revision_autoridades', doc: 'en_revision', origen: 'profesor' },
};

async function verificarADM() {
  console.log('\n· Administrativo (ADM)');
  const ahora = new Date();
  const correoDe = async (id) => (await prisma.usuario.findUnique({ where: { id } })).correo_institucional;

  // 9. Característica de P2: pendiente y aprobable
  const p2 = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES.P2.correo }, include: { profesor: true } });
  const solP2 = await prisma.solicitud_caracteristica.findFirst({ where: { profesor_id: p2.profesor.id }, orderBy: { id: 'desc' } });
  if (!solP2) falla('P2 sin solicitud de característica');
  else {
    const d = await obtenerSolicitudCaracteristica({ solicitudId: solP2.id });
    revisar(d.estado === 'pendiente' && d.puedeAprobarse === true && d.capacidadResultante === 4 && d.profesor.ocupados === 0 && solP2.fecha < ahora,
      'P2 solicita Investigador: pendiente · capacidad resultante 4 · 0 ocupados · aprobable en vivo',
      `característica de P2: ${JSON.stringify({ estado: d.estado, puede: d.puedeAprobarse, cap: d.capacidadResultante, ocup: d.profesor?.ocupados })}`);
  }

  // 11–13. Bajas
  const p3 = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES.P3.correo }, include: { profesor: true } });
  for (const al of ALUMNOS_BAJAS) {
    const esp = ESPERADO_BAJA[al.sufijo];
    const problemas = [];
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: al.correoInst } });
    if (!u) { falla(`${al.sufijo} ${al.correoInst}: no existe`); continue; }
    const sol = await prisma.solicitud_registro.findFirst({ where: { alumno_id: al.boleta }, include: { oferta: true } });
    if (sol?.estado_solicitud !== 'alumno_asignado' || sol.oferta?.profesor_id !== p3.profesor.id) problemas.push(`solicitud ${sol?.estado_solicitud}`);
    const filas = await prisma.solicitud_baja.findMany({ where: { alumno_id: al.boleta }, include: { documento: true }, orderBy: { id: 'asc' } });
    if (filas.length !== 1) problemas.push(`${filas.length} bajas (se esperaba 1)`);
    const b = filas[filas.length - 1];
    if (b) {
      const det = await bajasService.obtenerSolicitud({ solicitudId: b.id });
      const origen = b.solicitante_id === u.id ? 'alumno' : 'profesor';
      if (b.estado !== esp.estado || det.etapa !== esp.etapa) problemas.push(`estado ${b.estado} / etapa ${det.etapa}`);
      if (origen !== esp.origen || (origen === 'profesor' && b.solicitante_id !== p3.id)) problemas.push(`origen ${origen}`);
      if (b.documento?.estado_documento !== esp.doc || b.documento?.tipo_documento !== 'expediente_baja') problemas.push(`expediente ${b.documento?.estado_documento}`);
      if (b.documento && !archivoValido(RUTA_BASE_DOCUMENTOS, b.documento.ruta_archivo)) problemas.push('expediente ilegible en disco');
      if (esp.estado !== 'pendiente' && (await correoDe((await prisma.coordinador.findUnique({ where: { id: b.coordinador_id } })).usuario_id)) !== CORREO_COORDINADOR_CREADOR) problemas.push('coordinador distinto a herrera');
      if (esp.estado === 'rechazada' && !b.comentario) problemas.push('rechazo sin comentario');
      // Cadena: asignación < solicitud de baja ≤ expediente < respuesta < ahora, en días hábiles
      const cadena = [sol.fecha_aplicacion, new Date(`${al.periodoInicio}T00:00:00-06:00`), b.fecha, b.documento?.fecha_creacion, b.fecha_respuesta, ahora].filter(Boolean);
      for (let i = 1; i < cadena.length; i += 1) if (cadena[i - 1] > cadena[i]) { problemas.push('fechas de la baja fuera de orden'); break; }
      for (const f of [b.fecha, b.documento?.fecha_creacion, b.fecha_respuesta].filter(Boolean)) {
        const dia = new Date(f.getTime() - 6 * 3600 * 1000).toISOString().slice(0, 10);
        if (!(await esHabil(dia))) { problemas.push(`fecha de la baja en día inhábil (${dia})`); break; }
      }
    }
    // Notificaciones del alumno: solo la amonestación de 2501 sin leer
    const sinLeer = await prisma.notificacion.findMany({ where: { usuario_id: u.id, leida: false } });
    const esperadoSinLeer = al.sufijo === '2501' ? 1 : 0;
    if (sinLeer.length !== esperadoSinLeer || sinLeer.some((n) => !n.mensaje.startsWith('Amonestación'))) problemas.push(`${sinLeer.length} notificaciones sin leer (se esperaba ${esperadoSinLeer})`);
    if (await prisma.notificacion.count({ where: { usuario_id: u.id, OR: [{ fecha_creacion: { gt: ahora } }, { fecha_leida: { gt: ahora } }] } })) problemas.push('notificación con fecha futura');
    const cumulo = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: al.boleta } });
    if (cumulo?.fecha_ultima_evaluacion_faltas?.toISOString().slice(0, 10) !== '2026-12-01') problemas.push('faltas no evaluadas al 1-dic');
    revisar(!problemas.length,
      `${al.sufijo} ${al.correoInst} · baja ${esp.estado} (${esp.etapa}, origen ${esp.origen})${al.sufijo === '2501' ? ' · amonestación sin leer' : ''}`,
      `${al.sufijo} ${al.correoInst}: ${problemas.join('; ')}`);
  }
  const unreadP3 = await prisma.notificacion.count({ where: { usuario_id: p3.id, leida: false } });
  revisar(unreadP3 === 0, 'P3 aguirre: todas sus notificaciones leídas', `P3 aguirre: ${unreadP3} notificaciones sin leer`);

  // Coordinadores: exactamente 6 sin leer (características de P1 y P2, baja de 2601)
  const coords = await prisma.usuario.findMany({ where: { rol: 'coordinador' } });
  const unreadCoord = await prisma.notificacion.findMany({ where: { usuario_id: { in: coords.map((c) => c.id) }, leida: false } });
  const solP1 = await prisma.solicitud_caracteristica.findFirst({ where: { profesor: { usuario: { correo_institucional: PROFESORES.P1.correo } } } });
  const baja2601 = await prisma.solicitud_baja.findFirst({ where: { alumno_id: ALUMNOS_BAJAS.find((x) => x.sufijo === '2601').boleta } });
  const rutasOk = new Set([
    `/coordinacion/solicitudes-caracteristicas?destacar=${solP1?.id}`,
    `/coordinacion/solicitudes-caracteristicas?destacar=${solP2?.id}`,
    `/coordinacion/gestionar-bajas?destacar=${baja2601?.id}`,
  ]);
  revisar(unreadCoord.length === 6 && unreadCoord.every((n) => rutasOk.has(n.ruta_relacionada)),
    'coordinadores: 6 notificaciones sin leer (3 por coordinador: características de P1 y P2, baja de 2601)',
    `coordinadores: ${unreadCoord.length} sin leer → ${[...new Set(unreadCoord.map((n) => n.ruta_relacionada))].join(', ')}`);

  // 14. Anuncios
  const todos = [...ALUMNOS, ...ALUMNOS_BAJAS];
  for (const a of ANUNCIOS) {
    const prof = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESORES[a.profesor].correo } });
    const filas = await prisma.anuncio.findMany({ where: { usuario_id: prof.id, titulo: a.titulo }, include: { registro_anuncio_visto: true } });
    const an = filas[0];
    const problemas = [];
    if (filas.length !== 1) problemas.push(`${filas.length} anuncios`);
    if (an) {
      if (an.origen !== 'profesor') problemas.push(`origen ${an.origen}`);
      if (an.fecha_publicacion.getTime() !== new Date(`${a.fecha}T${a.hora}:00-06:00`).getTime() || an.fecha_publicacion > ahora) problemas.push('fecha de publicación');
      const vistos = an.registro_anuncio_visto.map((r) => todos.find((x) => x.boleta === r.alumno_id)?.sufijo).sort();
      if (vistos.join() !== [...a.vistoPor].sort().join()) problemas.push(`visto por [${vistos.join()}]`);
    }
    const destinatarios = todos.filter((x) => x.profesor === a.profesor).length;
    revisar(!problemas.length,
      `anuncio ${a.profesor} "${a.titulo}" · ${a.fecha} · visto ${a.vistoPor.length}/${destinatarios}`,
      `anuncio ${a.profesor} "${a.titulo}": ${problemas.join('; ')}`);
  }
  const deCoordinacion = await prisma.anuncio.count({ where: { origen: 'coordinador' } });
  revisar(deCoordinacion === 0, 'ningún anuncio de coordinación', `${deCoordinacion} anuncios de coordinación`);

  // 15. Carta compromiso firmada (ADM-14)
  const lista = (await cartaFirmadaService.listarAlumnos()).alumnos;
  for (const al of ALUMNOS) {
    const esperada = CARTAS_FIRMADAS.find((c) => c.sufijo === al.sufijo);
    const debe = Boolean(esperada);
    const docs = await prisma.documento.findMany({ where: { alumno_id: al.boleta, tipo_documento: cartaFirmadaService.TIPO_CARTA_FIRMADA } });
    const sol = await prisma.solicitud_registro.findFirst({ where: { alumno_id: al.boleta } });
    const enLista = lista.find((x) => x.boleta === al.boleta)?.carta?.enviada;
    const okCarta = debe
      ? docs.length === 1 && docs[0].estado_documento === 'aprobado' && archivoValido(RUTA_BASE_DOCUMENTOS, docs[0].ruta_archivo)
        && docs[0].fecha_creacion.getTime() === new Date(`${esperada.fecha}T${esperada.hora}:00-06:00`).getTime()
        && docs[0].fecha_creacion > sol.fecha_carta_compromiso && docs[0].fecha_creacion < ahora && enLista === true
      : docs.length === 0 && enLista === false;
    if (debe || ['1901', '2101', '2201'].includes(al.sufijo)) {
      revisar(okCarta, `carta firmada ${al.sufijo}: ${debe ? `enviada ${docs[0]?.fecha_creacion.toISOString().slice(0, 10)} (etapa Término de ADM-13)` : (al.sufijo === '1901' ? 'pendiente (se sube en vivo)' : 'pendiente')}`,
        `carta firmada ${al.sufijo}: ${docs.length} documento(s), en lista ${enLista}`);
    } else if (!okCarta) falla(`carta firmada ${al.sufijo}: no debería tener`);
  }

  // 16. ADM-13 (documentos) y 17. usuarios asignados — servicios reales de solo lectura
  const exp = await documentosService.obtenerExpedienteDeAlumno({ boleta: ALUMNOS.find((x) => x.sufijo === '2301').boleta });
  const tipos = exp.documentos.map((d) => d.tipo);
  const mensuales = tipos.filter((t) => t === 'reporte_mensual').length;
  revisar(['carta_creditos', 'constancia_seguro_social', 'expediente', cartaFirmadaService.TIPO_CARTA_FIRMADA].every((t) => tipos.includes(t)) && mensuales === 7,
    `ADM-13 rojas2301: ${exp.documentos.length} documentos (inicio + carta firmada + ${mensuales} reportes mensuales)`,
    `ADM-13 rojas2301: tipos [${tipos.join(', ')}]`);
  const profs = (await usuariosAsignadosService.listarProfesores()).profesores;
  const total = (correo) => profs.find((x) => x.correoInstitucional === correo)?.totalAlumnos;
  revisar(total(PROFESORES.P1.correo) === 6 && total(PROFESORES.P2.correo) === 0 && total(PROFESORES.P3.correo) === 3,
    'ADM-17: lozano 6 alumnos · salinas 0 · aguirre 3',
    `ADM-17: lozano ${total(PROFESORES.P1.correo)} · salinas ${total(PROFESORES.P2.correo)} · aguirre ${total(PROFESORES.P3.correo)}`);
}

// Los documentos que el seed sube por mis alumnos (GR, baja, carta firmada) deben
// tener texto legible (antes eran páginas en blanco de pdfDummy).
const PAGINAS_ESPERADAS = { carta_creditos: 1, constancia_seguro_social: 1, expediente: 3, expediente_baja: 1, carta_compromiso_firmada: 1 };

async function paginasConTexto(pdfBuffer) {
  const zlib = require('zlib');
  const { PDFDocument, PDFName, PDFArray } = require('pdf-lib');
  const doc = await PDFDocument.load(pdfBuffer);
  let conTexto = 0;
  for (const page of doc.getPages()) {
    const contenido = page.node.Contents();
    const streams = contenido instanceof PDFArray ? contenido.asArray().map((r) => doc.context.lookup(r)) : [contenido];
    const texto = streams.some((st) => {
      if (!st) return false;
      let bytes = Buffer.from(st.getContents());
      const filtro = st.dict.get(PDFName.of('Filter'));
      if (filtro && String(filtro).includes('FlateDecode')) bytes = zlib.inflateSync(bytes);
      return /\bT[jJ]\b/.test(bytes.toString('latin1'));
    });
    if (texto) conTexto += 1;
  }
  return { paginas: doc.getPageCount(), conTexto };
}

async function verificarPdfsConTexto() {
  console.log('\n· Documentos de ejemplo de mis alumnos (texto legible)');
  const boletas = [...ALUMNOS, ...ALUMNOS_BAJAS].map((a) => a.boleta);
  const docs = await prisma.documento.findMany({ where: { alumno_id: { in: boletas }, tipo_documento: { in: Object.keys(PAGINAS_ESPERADAS) } } });
  const malos = [];
  const porTipo = {};
  for (const d of docs) {
    try {
      const pdf = descifrarBuffer(fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, d.ruta_archivo)));
      const r = await paginasConTexto(pdf);
      if (r.paginas !== PAGINAS_ESPERADAS[d.tipo_documento] || r.conTexto !== r.paginas) malos.push(`${d.alumno_id} ${d.tipo_documento}: ${r.conTexto}/${r.paginas} páginas con texto`);
    } catch (e) { malos.push(`${d.alumno_id} ${d.tipo_documento}: ${e.message}`); }
    porTipo[d.tipo_documento] = (porTipo[d.tipo_documento] ?? 0) + 1;
  }
  revisar(!malos.length && docs.length > 0,
    `${docs.length} documentos con texto en todas sus páginas (${Object.entries(porTipo).map(([t, n]) => `${t} ${n}`).join(', ')})`,
    `documentos sin texto o con páginas inesperadas: ${malos.slice(0, 4).join('; ')}${malos.length > 4 ? ` … y ${malos.length - 4} más` : ''}`);
}

async function datosDeKaren() {
  console.log('\n══ DATOS DE KAREN (solo informativo) ══');

  console.log('\n· Acceso del servidor (usuario node) a sus carpetas de uploads/');
  if (ACCESO_KAREN) {
    const lista = (xs) => `${xs.slice(0, 6).map(([c]) => path.basename(c)).join(', ')}${xs.length > 6 ? ' …' : ''}`;
    const sinLectura = ACCESO_KAREN.filter(([, l]) => l !== true);
    const sinEscritura = ACCESO_KAREN.filter(([, , e]) => e !== true);
    if (!sinLectura.length && !sinEscritura.length) ok(`node puede leer y escribir sus ${ACCESO_KAREN.length} carpeta(s)`);
    else {
      if (sinLectura.length) aviso(`node no puede LEER ${sinLectura.length} de ${ACCESO_KAREN.length} carpeta(s) suyas (firmas/reportes de root): ${lista(sinLectura)}`);
      if (sinEscritura.length) aviso(`node no puede ESCRIBIR en ${sinEscritura.length} de ${ACCESO_KAREN.length} carpeta(s) suyas (subidas en vivo fallarían): ${lista(sinEscritura)}`);
      aviso('propuesta (no aplicada): docker compose exec -T backend chown -R node:node /app/backend/uploads/documentos /app/backend/uploads/profesores');
    }
  }

  console.log('\n· Coordinadores');
  const coords = await prisma.usuario.findMany({ where: { rol: 'coordinador' } });
  const correosCoords = coords.map((c) => c.correo_institucional).sort();
  if (correosCoords.join() === [...CORREOS_COORDINADORES].sort().join()) ok('2 coordinadores: herrera y villagrán');
  else aviso(`coordinadores: ${correosCoords.join(', ')}`);

  console.log('\n· Profesores');
  let difProf = 0;
  for (const [correo, esp] of Object.entries(KAREN_PROFESORES)) {
    const u = await prisma.usuario.findUnique({
      where: { correo_institucional: correo },
      include: { profesor: { include: { caracteristica: true } } },
    });
    const carac = u?.profesor?.caracteristica?.nombre ?? null;
    if (!u) { difProf += 1; aviso(`${correo}: no existe`); }
    else if (carac !== esp.caracteristica || u.profesor.cupos_totales !== esp.cupos) {
      difProf += 1; aviso(`${correo}: ${carac ?? 'base'}/${u.profesor.cupos_totales} (esperado ${esp.caracteristica ?? 'base'}/${esp.cupos})`);
    }
  }
  if (!difProf) ok('7 profesores con su característica y cupos esperados');

  console.log('\n· Alumnos y solicitudes');
  let difAl = 0;
  for (const [boleta, [correo, estado]] of Object.entries(KAREN_ALUMNOS)) {
    const a = await prisma.alumno.findUnique({ where: { boleta }, include: { usuario: true, solicitud_registro: true } });
    if (!a) { difAl += 1; aviso(`${boleta} ${correo}: no existe`); continue; }
    if (a.usuario.correo_institucional !== correo) { difAl += 1; aviso(`${boleta}: correo ${a.usuario.correo_institucional} ≠ ${correo}`); }
    const actual = a.solicitud_registro?.estado_solicitud ?? '(sin solicitud)';
    if (actual !== estado) { difAl += 1; aviso(`${correo}: ${actual} (esperado ${estado})`); }
  }
  if (!difAl) ok('18 alumnos con su solicitud en el estado esperado');

  const todos = await prisma.usuario.findMany({ select: { correo_institucional: true } });
  const deKaren = todos.filter((u) => !CORREOS_PROFESORES.includes(u.correo_institucional)
    && !/^[a-z]+(19|2[0-7])01@alumno\.ipn\.mx$/.test(u.correo_institucional));
  if (deKaren.length === 27) ok('27 usuarios de 00-comun + Karen (2 + 7 + 18)');
  else aviso(`usuarios que no son míos: ${deKaren.length} (esperado 27)`);

  const solicitudesKaren = await prisma.solicitud_registro.count({ where: { alumno_id: { in: Object.keys(KAREN_ALUMNOS) } } });
  if (solicitudesKaren === 18) ok('18 solicitudes de Karen');
  else aviso(`solicitudes de Karen: ${solicitudesKaren} (esperado 18)`);

  console.log('\n· Ofertas');
  const ofertas = await prisma.oferta_servicio.findMany({
    where: { profesor: { usuario: { correo_institucional: { in: Object.keys(KAREN_PROFESORES) } } } },
    select: { estado_oferta: true },
  });
  const porEstado = ofertas.reduce((acc, o) => ({ ...acc, [o.estado_oferta]: (acc[o.estado_oferta] ?? 0) + 1 }), {});
  if (ofertas.length === KAREN_OFERTAS.total && porEstado.aprobada === KAREN_OFERTAS.aprobada && porEstado.concluida === KAREN_OFERTAS.concluida) {
    ok('18 ofertas: 17 aprobadas + 1 concluida');
  } else {
    aviso(`ofertas de Karen: ${ofertas.length} → ${JSON.stringify(porEstado)} (esperado 17 aprobadas + 1 concluida)`);
  }
}

async function main() {
  const inicio = new Date();
  console.log(`verificar.js · ${inicio.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} (México)`);
  await misCasos();
  await datosDeKaren();
  console.log('\n══ Resultado ══');
  console.log(`  MIS CASOS: ${fallas ? `❌ ${fallas} falla(s)` : '✅ todo bien'}`);
  console.log(`  DATOS DE KAREN: ${avisos ? `⚠️  ${avisos} aviso(s)` : '✅ como se esperaba'}`);
  return fallas ? 1 : 0;
}

main()
  .then(async (codigo) => { await prisma.$disconnect(); process.exit(codigo); })
  .catch(async (e) => {
    console.error(`\n❌ verificar.js falló: ${e.message}`);
    try { await prisma.$disconnect(); } catch {}
    process.exit(1);
  });
