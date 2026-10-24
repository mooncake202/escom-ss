// Seed de datos para PRUEBAS DE SEGURIDAD. Independiente de los seeds de los módulos: no los importa ni los modifica.
//
// Crea un escenario coherente con el flujo real:
//   - Coordinador y profesor (característica Investigador: 3 + 1 = 4 cupos) con una oferta 'proyecto' aprobada.
//   - Periodo EN CURSO (prestación desde 2026-08-17): alumnos A y B, solicitudes 'alumno_asignado' en esa oferta,
//     con correo personal, rúbrica registrada y 5 bitácoras aprobadas en el periodo del reporte #1
//     (2026-08-17 → 2026-09-15). Su reporte mensual #1 queda en 'pendiente_revision_profesor' pasando por el MISMO
//     flujo del envío (CU-REP-01): validaciones, PDF real con la rúbrica, SHA-256, sello de la TSA, cifrado.
//   - Periodo VIGENTE (fecha_max_expediente a futuro): alumno C, 'alumno_sin_asignar', solicitud en
//     'adjuntar_documentacion_inicial' en la misma oferta (listo para POST /registro/adjuntar-documentacion).
//     C no puede ir en el periodo en curso: al iniciar sesión, verificarYAplicarVencimiento lo rechazaría.
//
// Idempotente: la base (usuarios, periodos, oferta, solicitudes, bitácoras) se crea en una sola transacción solo si no
// existe; si existe a medias, aborta. Los pasos siguientes (correo personal, rúbrica, reporte #1) se aplican solo si
// faltan. Además corrige en sitio, conservando ids, lo que dejaron versiones anteriores de este seed: correos de
// alumno que el login rechazaba, boletas fuera del formato ESCOM y reportes con un PDF provisional sin rúbrica ni sello.
//
// Requiere salida a internet: el reporte se sella con la TSA real, como en el envío. Si la TSA falla, no se registra.
//
// Ejecutar como el usuario `node` (el backend corre así; si se corre como root los archivos quedan ilegibles para él):
//   docker exec -u node -w /app/backend escom_backend node /app/pruebas/seguridad/seed-pruebas-seguridad.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Vive en pruebas/seguridad/ (fuera del backend): todo lo de la aplicación se carga desde backend/.
const BACKEND = path.join(__dirname, '../../backend');
const back = (ruta) => require(path.join(BACKEND, ruta));
const bcrypt = back('node_modules/bcrypt');
const prisma = back('src/lib/prisma');
const redis = back('src/lib/redis');
const { calcularDiaMexicoUTC } = back('src/lib/fechas');
const {
  validarCorreoInstitucional, validarCorreoInstitucionalAlumno, validarCorreoPersonal, validarBoleta,
} = back('src/lib/validators');
const {
  enviarReporteMensual, sha256, pedirSello, guardarPdfCifrado, OPCIONES_TRANSACCION,
} = back('src/modules/reportes/reportes-envio.service');
const { prepararReporteParaPdf } = back('src/modules/reportes/reportes-preparacion');
const { generarPdfReporteMensual } = back('src/modules/reportes/reportes.pdf');
const { guardarRubrica } = back('src/modules/reportes/reportes.rubricas');
const { RUTA_BASE_DOCUMENTOS, TIPO_REVISOR_ALUMNO } = back('src/modules/reportes/reportes.shared');
const { CACHE_KEY_PERIODOS } = back('src/modules/periodos/periodos.service');

const PREFIJO = '[SEED-SEGURIDAD]';
const PASSWORD_PLANO = '12345678';
// Mismo hash que usa el sistema al registrar usuarios: bcrypt.hash(contraseña, 10) (gr.service.js, usuarios.service.js,
// password.service.js). Cada usuario recibe SU PROPIO hash (sal distinta), como si se hubiera registrado por la app.
const COSTO_BCRYPT = 10;
const hashContrasena = () => bcrypt.hash(PASSWORD_PLANO, COSTO_BCRYPT);
const CARRERA = 'ISC';
const IP_FIRMA = '127.0.0.1';

// Alumnos: correo con LETRAS + EXACTAMENTE 4 DÍGITOS + @alumno.ipn.mx (LoginPage.jsx y validators.js; un punto lo
// invalida) y boleta ESCOM: año de ingreso + 63 + 4 dígitos (validators.js, BOLETA_REGEX).
const USUARIOS = Object.freeze({
  coordinador: { rol: 'coordinador', correo: 'seguridad.coord@ipn.mx', nombre: 'SEGURIDAD', apellidos: 'COORDINADOR PRUEBAS' },
  profesor: { rol: 'profesor', correo: 'seguridad.profesor@ipn.mx', nombre: 'SEGURIDAD', apellidos: 'PROFESOR PRUEBAS' },
  alumnoA: {
    rol: 'alumno_asignado', correo: 'segalumnoa6401@alumno.ipn.mx', correoPersonal: 'segalumnoa6401@gmail.com',
    nombre: 'SEGURIDAD', apellidos: 'ALUMNO A', boleta: '2021636401',
  },
  alumnoB: {
    rol: 'alumno_asignado', correo: 'segalumnob6402@alumno.ipn.mx', correoPersonal: 'segalumnob6402@gmail.com',
    nombre: 'SEGURIDAD', apellidos: 'ALUMNO B', boleta: '2021636402',
  },
  alumnoC: {
    rol: 'alumno_sin_asignar', correo: 'segalumnoc6403@alumno.ipn.mx', correoPersonal: 'segalumnoc6403@gmail.com',
    nombre: 'SEGURIDAD', apellidos: 'ALUMNO C', boleta: '2021636403',
  },
});
const ALUMNOS = ['alumnoA', 'alumnoB', 'alumnoC'];
const ALUMNOS_ASIGNADOS = ['alumnoA', 'alumnoB'];
const CORREOS = Object.values(USUARIOS).map((u) => u.correo);
const BOLETAS = ALUMNOS.map((clave) => USUARIOS[clave].boleta);

// Datos de versiones anteriores de este seed que no cumplían el formato. Se corrigen en sitio (mismos ids).
const CORREOS_ANTERIORES = Object.freeze({
  alumnoA: 'seguridad.alumnoa@alumno.ipn.mx',
  alumnoB: 'seguridad.alumnob@alumno.ipn.mx',
  alumnoC: 'seguridad.alumnoc@alumno.ipn.mx',
});
const BOLETAS_ANTERIORES = Object.freeze({ alumnoA: '2096640001', alumnoB: '2096640002', alumnoC: '2096640003' });

const PERFIL_PROFESOR = Object.freeze({
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5511112222',
  horario_atencion: 'Lunes a viernes 10:00-12:00',
  cubiculo: 'SEED-SEGURIDAD',
  cupos_totales: 4, // 3 base + 1 de Investigador
});
const CARACTERISTICA_PROFESOR = 'Investigador';

// Periodo en curso (A y B): la prestación ya inició, así que el reporte #1 ya cerró y se puede enviar.
const PERIODO_EN_CURSO = Object.freeze({
  anio: '2026', semestre: 's02', fechaMaxExpediente: '2026-07-31',
  evento: { nombre: `${PREFIJO} Periodo en curso`, fechaInicio: '2026-08-17', fechaFin: '2027-03-18' },
});
// Periodo vigente (C): fecha_max_expediente a futuro, como lo filtra listarPeriodosVigentes.
const PERIODO_VIGENTE = Object.freeze({
  anio: '2027', semestre: 's01', fechaMaxExpediente: '2026-12-04',
  evento: { nombre: `${PREFIJO} Periodo vigente`, fechaInicio: '2027-01-18', fechaFin: '2027-08-19' },
});

// A, B y C ya fueron aceptados por el profesor: cada uno consumió un lugar de la oferta (RN-GR-08).
const OFERTA = Object.freeze({
  nombreProyecto: `${PREFIJO} Proyecto de pruebas de seguridad`,
  nombreSISS: 'SEED-SEGURIDAD Actividad SISS',
  programaSISS: 'SEED-SEGURIDAD Programa SISS',
  descripcion: 'Oferta del fixture de pruebas de seguridad.',
  cuposOfertados: 4,
  cuposDisponibles: 1,
});

// Reporte #1: 2026-08-17 (lunes) → 2026-09-15. Cinco días hábiles, 17 h.
const BITACORAS = Object.freeze([
  { fecha: '2026-08-17', horas: 4, avance: 20 },
  { fecha: '2026-08-18', horas: 3, avance: 35 },
  { fecha: '2026-08-19', horas: 4, avance: 50 },
  { fecha: '2026-08-20', horas: 2, avance: 60 },
  { fecha: '2026-08-21', horas: 4, avance: 70 },
]);
const HORAS_BITACORAS = BITACORAS.reduce((s, b) => s + b.horas, 0);
const ACTIVIDADES_MES = 'Análisis de requerimientos del proyecto de pruebas de seguridad.';

const fechaUTC = (iso) => new Date(`${iso}T00:00:00.000Z`);
const dosDigitos = (n) => String(n).padStart(2, '0');
const log = (mensaje) => console.log(`${PREFIJO} ${mensaje}`);

// Falla antes de tocar la BD si un dato no cumple el formato que valida el sistema.
function validarDatos() {
  for (const u of Object.values(USUARIOS)) {
    if (u.rol.startsWith('alumno')) {
      validarCorreoInstitucionalAlumno(u.correo);
      validarCorreoPersonal(u.correoPersonal, { requerido: true });
      validarBoleta(u.boleta);
    } else {
      validarCorreoInstitucional(u.correo);
    }
  }
}

// ── Rúbrica (imagen de firma) ────────────────────────────────

// PNG RGB de 320 x 90 con un trazo ondulado: lo mismo que el alumno subiría como imagen de su firma.
function crearPngFirma(semilla) {
  const ancho = 320;
  const alto = 90;
  const filas = [];
  for (let y = 0; y < alto; y += 1) {
    const fila = Buffer.alloc(1 + ancho * 3, 0xff);
    fila[0] = 0; // filtro "None"
    for (let x = 20; x < ancho - 20; x += 1) {
      const centro = alto / 2 + Math.sin((x + semilla * 17) / 14) * 18 + Math.sin(x / 41) * 8;
      if (Math.abs(y - centro) <= 1.5) fila.fill(0x1a, 1 + x * 3, 1 + x * 3 + 3);
    }
    filas.push(fila);
  }
  const bloque = (tipo, datos) => {
    const tipoYDatos = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
    const longitud = Buffer.alloc(4);
    longitud.writeUInt32BE(datos.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(tipoYDatos));
    return Buffer.concat([longitud, tipoYDatos, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB, sin entrelazado
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(Buffer.concat(filas))),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}

// ── Correcciones de versiones anteriores ─────────────────────

async function renombrarCorreosAnteriores() {
  for (const [clave, anterior] of Object.entries(CORREOS_ANTERIORES)) {
    const { correo } = USUARIOS[clave];
    const { count } = await prisma.usuario.updateMany({
      where: { correo_institucional: anterior, alumno: { is: { boleta: { in: [BOLETAS_ANTERIORES[clave], USUARIOS[clave].boleta] } } } },
      data: { correo_institucional: correo },
    });
    if (count > 0) log(`Correo renombrado: ${anterior} → ${correo}`);
  }
}

// La boleta es la PK de alumno: solicitud, documento y cúmulo la siguen por ON UPDATE CASCADE. Las rutas de archivo
// empiezan con la boleta (uploads/documentos/<boleta>/...), así que se mueve la carpeta y se reescriben las rutas.
async function renombrarBoletasAnteriores() {
  for (const [clave, anterior] of Object.entries(BOLETAS_ANTERIORES)) {
    const { boleta, correo } = USUARIOS[clave];
    const alumno = await prisma.alumno.findFirst({ where: { boleta: anterior, usuario: { correo_institucional: correo } } });
    if (!alumno) continue;

    const carpetaAnterior = path.join(RUTA_BASE_DOCUMENTOS, anterior);
    const carpetaNueva = path.join(RUTA_BASE_DOCUMENTOS, boleta);
    if (fs.existsSync(carpetaNueva)) throw new Error(`Ya existe ${carpetaNueva}; no se renombra la boleta ${anterior}.`);
    const hayCarpeta = fs.existsSync(carpetaAnterior);
    if (hayCarpeta) fs.renameSync(carpetaAnterior, carpetaNueva);

    const prefijo = `${anterior}/`;
    const nuevaRuta = (ruta) => `${boleta}/${ruta.slice(prefijo.length)}`;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.alumno.update({ where: { boleta: anterior }, data: { boleta } });
        const documentos = await tx.documento.findMany({ where: { alumno_id: boleta, ruta_archivo: { startsWith: prefijo } } });
        for (const d of documentos) {
          await tx.documento.update({ where: { id: d.id }, data: { ruta_archivo: nuevaRuta(d.ruta_archivo) } });
        }
        const revisiones = await tx.revision_reporte_mensual.findMany({
          where: { reporte_mensual: { solicitud_registro: { alumno_id: boleta } }, ruta_archivo: { startsWith: prefijo } },
        });
        for (const r of revisiones) {
          await tx.revision_reporte_mensual.update({ where: { id: r.id }, data: { ruta_archivo: nuevaRuta(r.ruta_archivo) } });
        }
        await tx.usuario.updateMany({
          where: { id: alumno.usuario_id, rubrica_imagen: { startsWith: prefijo } },
          data: { rubrica_imagen: `${boleta}/Rubrica/rubrica.enc` },
        });
      });
    } catch (err) {
      if (hayCarpeta) fs.renameSync(carpetaNueva, carpetaAnterior);
      throw err;
    }
    log(`Boleta renombrada: ${anterior} → ${boleta}`);
  }
}

// ── Existencia ───────────────────────────────────────────────

async function estadoFixture() {
  const [usuarios, alumnos, ofertas, eventos] = await Promise.all([
    prisma.usuario.findMany({ where: { correo_institucional: { in: CORREOS } }, select: { id: true } }),
    prisma.alumno.findMany({ where: { boleta: { in: BOLETAS } }, select: { boleta: true } }),
    prisma.oferta_servicio.findMany({ where: { nombre_proyecto: OFERTA.nombreProyecto }, select: { id: true } }),
    prisma.evento_calendario.findMany({
      where: { nombre: { in: [PERIODO_EN_CURSO.evento.nombre, PERIODO_VIGENTE.evento.nombre] } }, select: { id: true },
    }),
  ]);
  const encontrados = usuarios.length + alumnos.length + ofertas.length + eventos.length;
  const esperados = CORREOS.length + BOLETAS.length + 1 + 2;
  if (encontrados === 0) return 'ausente';
  if (encontrados === esperados) return 'completo';
  return `parcial (usuarios ${usuarios.length}/${CORREOS.length}, alumnos ${alumnos.length}/${BOLETAS.length}, `
    + `ofertas ${ofertas.length}/1, eventos ${eventos.length}/2)`;
}

// ── Base del fixture (una transacción) ───────────────────────

async function sembrarBase(tx, { carrera, caracteristica, hashes, ahora, hoy }) {
  const crearUsuario = (u) => tx.usuario.create({
    data: {
      rol: u.rol, correo_institucional: u.correo, contrasena: hashes[u.correo], nombre: u.nombre, apellidos: u.apellidos,
      intentos_fallidos: 0, cuenta_bloqueada: false, fecha_creacion: ahora,
    },
  });

  const coordinador = await tx.coordinador.create({ data: { usuario_id: (await crearUsuario(USUARIOS.coordinador)).id } });
  const usuarioProfesor = await crearUsuario(USUARIOS.profesor);
  const profesor = await tx.profesor.create({
    data: { usuario_id: usuarioProfesor.id, caracteristica_id: caracteristica.id, ...PERFIL_PROFESOR },
  });

  const crearPeriodo = async (p) => {
    const evento = await tx.evento_calendario.create({
      data: {
        coordinador_id: coordinador.id, nombre: p.evento.nombre, tipo: 'Periodo',
        fecha_inicio: fechaUTC(p.evento.fechaInicio), fecha_fin: fechaUTC(p.evento.fechaFin),
      },
    });
    return tx.periodo_registro.create({
      data: { evento_calendario_id: evento.id, anio: p.anio, semestre: p.semestre, fecha_max_expediente: fechaUTC(p.fechaMaxExpediente) },
    });
  };
  const periodoEnCurso = await crearPeriodo(PERIODO_EN_CURSO);
  const periodoVigente = await crearPeriodo(PERIODO_VIGENTE);

  const oferta = await tx.oferta_servicio.create({
    data: {
      profesor_id: profesor.id, coordinador_id: coordinador.id, nombre_SISS: OFERTA.nombreSISS, programa_SISS: OFERTA.programaSISS,
      nombre_proyecto: OFERTA.nombreProyecto, tipo_oferta: 'proyecto', descripcion_actividades: OFERTA.descripcion,
      cupos_ofertados: OFERTA.cuposOfertados, cupos_disponibles: OFERTA.cuposDisponibles, estado_oferta: 'aprobada',
      fecha_registro: new Date('2026-06-01T15:00:00.000Z'),
    },
  });
  await tx.deseo_de_carrera.create({ data: { oferta_id: oferta.id, carrera_id: carrera.id } });

  const crearAlumno = async (u) => {
    const usuario = await crearUsuario(u);
    await tx.alumno.create({
      data: {
        boleta: u.boleta, usuario_id: usuario.id, carrera: CARRERA, celular: '55' + u.boleta.slice(2),
        creditos: 100, semestre: 8, correo_personal: u.correoPersonal,
      },
    });
  };

  // A y B: asignados en el periodo en curso, con actividad y bitácoras aprobadas del periodo del reporte #1.
  for (const clave of ALUMNOS_ASIGNADOS) {
    const u = USUARIOS[clave];
    await crearAlumno(u);
    const solicitud = await tx.solicitud_registro.create({
      data: {
        alumno_id: u.boleta, carrera_id: carrera.id, periodo_registro_id: periodoEnCurso.id, oferta_id: oferta.id,
        motivacion_oferta: `${PREFIJO} Solicitud asignada.`, estado_solicitud: 'alumno_asignado',
        estado_anterior: 'expediente_pendiente_revision', fecha_aplicacion: new Date('2026-06-02T15:00:00.000Z'),
        registro_siss: true, docs_iniciales: true, carta_compromiso: true,
        fecha_carta_compromiso: new Date('2026-06-20T15:00:00.000Z'), expediente: true,
      },
    });

    const actividad = await tx.actividad.create({
      data: {
        solicitud_registro_id: solicitud.id, titulo: 'Análisis de requerimientos', descripcion: ACTIVIDADES_MES,
        entregable_esperado: 'Documento de requerimientos.', fecha_limite: fechaUTC('2026-12-15'), estado: 'en_progreso',
        fecha_asignacion: new Date('2026-08-17T15:00:00.000Z'), porcentaje_progreso: BITACORAS[BITACORAS.length - 1].avance,
      },
    });
    for (const b of BITACORAS) {
      const bitacora = await tx.bitacora.create({
        data: {
          solicitud_registro_id: solicitud.id,
          hora_inicio: new Date(`${b.fecha}T15:00:00.000Z`), hora_fin: new Date(`${b.fecha}T${dosDigitos(15 + b.horas)}:00:00.000Z`),
          horas_contabilizadas: b.horas, estado: 'aprobada', fecha_registro: fechaUTC(b.fecha),
          fecha_revision: new Date(`${b.fecha}T23:00:00.000Z`), revisado_por_id: profesor.id,
        },
      });
      await tx.registro_bitacora_actividades.create({
        data: {
          bitacora_id: bitacora.id, actividad_id: actividad.id, descripcion: `Avance del ${b.fecha}.`,
          porcentaje_avance_registrado: b.avance, evidencia: `Evidencia del ${b.fecha}.`,
        },
      });
    }
    // fecha_ultima_evaluacion_faltas = hoy: sin esto el cron de AH cobraría faltas históricas.
    await tx.cumulo_horas_y_faltas.create({
      data: {
        alumno_id: u.boleta, horas_acumuladas: HORAS_BITACORAS, horas_rechazadas: 0,
        faltas_acumuladas: 0, faltas_consecutivas: 0, fecha_ultima_evaluacion_faltas: hoy,
      },
    });
  }

  // C: sin asignar, periodo vigente, aceptado por el profesor y con SISS confirmado → adjuntar documentación.
  const u = USUARIOS.alumnoC;
  await crearAlumno(u);
  await tx.solicitud_registro.create({
    data: {
      alumno_id: u.boleta, carrera_id: carrera.id, periodo_registro_id: periodoVigente.id, oferta_id: oferta.id,
      motivacion_oferta: `${PREFIJO} Solicitud en adjuntar documentación.`, estado_solicitud: 'adjuntar_documentacion_inicial',
      estado_anterior: 'registro_SISS', fecha_aplicacion: ahora, registro_siss: true,
    },
  });

  return { ofertaId: oferta.id, periodoEnCursoId: periodoEnCurso.id, periodoVigenteId: periodoVigente.id };
}

async function crearBase() {
  const [carrera, caracteristica] = await Promise.all([
    prisma.carrera.findFirst({ where: { nombre: CARRERA } }),
    prisma.caracteristica.findFirst({ where: { nombre: CARACTERISTICA_PROFESOR } }),
  ]);
  if (!carrera) throw new Error(`No existe la carrera ${CARRERA}. No se insertó nada.`);
  if (!caracteristica) throw new Error(`No existe la característica ${CARACTERISTICA_PROFESOR}. No se insertó nada.`);

  // Un hash por usuario, calculado ANTES de la transacción (bcrypt es lento y no debe alargarla).
  const hashes = {};
  for (const correo of CORREOS) hashes[correo] = await hashContrasena();
  const ids = await prisma.$transaction(
    (tx) => sembrarBase(tx, { carrera, caracteristica, hashes, ahora: new Date(), hoy: calcularDiaMexicoUTC() }),
    { timeout: 60000, maxWait: 10000 },
  );
  log(`Base creada. oferta=${ids.ofertaId} periodo_en_curso=${ids.periodoEnCursoId} periodo_vigente=${ids.periodoVigenteId}`);

  // El listado de periodos vigentes se cachea 5 min en Redis; se invalida para que el nuevo aparezca ya.
  try {
    await redis.del(CACHE_KEY_PERIODOS);
  } catch (err) {
    console.error('No se pudo invalidar la caché de periodos (no crítico):', err.message);
  }
}

// ── Pasos que se aplican solo si faltan ──────────────────────

const usuarioIdDe = async (clave) => (await prisma.usuario.findUniqueOrThrow({
  where: { correo_institucional: USUARIOS[clave].correo }, select: { id: true },
})).id;

// Versiones anteriores de este seed calculaban UN hash y lo repetían en todos los usuarios. Aquí se le da un hash propio
// a cada usuario del fixture que comparta el suyo con otro (mismo id y demás datos; solo cambia `contrasena`). Solo se
// tocan hashes que siguen correspondiendo a PASSWORD_PLANO. Idempotente: si todos son distintos, no hace nada.
async function asegurarHashesPropios() {
  const usuarios = await prisma.usuario.findMany({ where: { correo_institucional: { in: CORREOS } }, select: { id: true, correo_institucional: true, contrasena: true } });
  const porHash = new Map();
  for (const u of usuarios) porHash.set(u.contrasena, [...(porHash.get(u.contrasena) ?? []), u]);
  let corregidos = 0;
  for (const [hashCompartido, grupo] of porHash) {
    if (grupo.length < 2 || !(await bcrypt.compare(PASSWORD_PLANO, hashCompartido))) continue;
    for (const u of grupo) {
      await prisma.usuario.update({ where: { id: u.id }, data: { contrasena: await hashContrasena() } });
      corregidos += 1;
    }
  }
  if (corregidos > 0) log(`Hash propio para ${corregidos} usuario(s) que compartían el mismo.`);
  return corregidos > 0;
}

// SIN_CORREO_PERSONAL bloquea el reporte: el PDF lo imprime y no se sustituye por el institucional.
async function asegurarCorreoPersonal(clave) {
  const { boleta, correoPersonal } = USUARIOS[clave];
  const { count } = await prisma.alumno.updateMany({ where: { boleta, correo_personal: null }, data: { correo_personal: correoPersonal } });
  if (count > 0) log(`Correo personal registrado: ${boleta}`);
  return count > 0;
}

// Misma función que usa POST /reportes/rubrica: imagen cifrada en documentos/<boleta>/Rubrica/rubrica.enc y
// usuario.rubrica_imagen / rubrica_ip / rubrica_fecha_registro.
async function asegurarRubrica(clave, semilla) {
  const usuarioId = await usuarioIdDe(clave);
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { rubrica_imagen: true } });
  if (usuario.rubrica_imagen) return false;
  await guardarRubrica(usuarioId, { buffer: crearPngFirma(semilla) }, { ip: IP_FIRMA, prisma });
  log(`Rúbrica registrada: ${USUARIOS[clave].correo}`);
  return true;
}

async function reporteUnoDe(clave) {
  return prisma.reporte_mensual.findFirst({
    where: { num_reporte: 1, solicitud_registro: { alumno_id: USUARIOS[clave].boleta } },
    include: { documento: true, revision_reporte_mensual: { where: { tipo_revisor: TIPO_REVISOR_ALUMNO }, orderBy: { id: 'asc' } } },
  });
}

// Datos del reporte #1 calculados por el flujo real (prepararReporteParaPdf) para un reporte que YA existe: dentro
// de una transacción se quita la fila (como si aún no se hubiera enviado), se prepara y se revierte todo. No escribe.
async function prepararComoSiNoExistiera(usuarioId, reporte) {
  const REVERTIR = Symbol('revertir');
  let preparado;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.documento.delete({ where: { id: reporte.documento_id } }); // cascada: reporte y revisiones
      preparado = await prepararReporteParaPdf(usuarioId, reporte.actividades_mes, { prisma: tx });
      throw REVERTIR;
    }, OPCIONES_TRANSACCION);
  } catch (err) {
    if (err !== REVERTIR) throw err;
  }
  return preparado;
}

// Reporte creado por una versión anterior de este seed: PDF provisional, sin rúbrica ni sello (token_tsa null).
// Se rehace con la misma cadena del envío y se actualiza EN SITIO (mismo id de reporte, documento y revisión).
async function rehacerReporteProvisional(clave, reporte) {
  const usuarioId = await usuarioIdDe(clave);
  const { boleta } = USUARIOS[clave];
  const firma = reporte.revision_reporte_mensual[0];

  const { resultado, datos, rubricaAlumno } = await prepararComoSiNoExistiera(usuarioId, reporte);
  const pdf = Buffer.from(await generarPdfReporteMensual(datos, { rubricaAlumno }));
  const hash = sha256(pdf);
  const token = await pedirSello(hash);
  const archivo = await guardarPdfCifrado(pdf, boleta, hash, RUTA_BASE_DOCUMENTOS);

  const ahora = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.documento.update({ where: { id: reporte.documento_id }, data: { ruta_archivo: archivo.rutaRelativa, fecha_creacion: ahora } });
      await tx.reporte_mensual.update({
        where: { id: reporte.id },
        data: { actividades_mes: datos.actividades.texto, dias_laborados: resultado.resumen.diasLaborados, horas_reportadas: resultado.resumen.horas },
      });
      await tx.revision_reporte_mensual.update({
        where: { id: firma.id },
        data: { hash_documento: hash, ruta_archivo: archivo.rutaRelativa, ip_firma: IP_FIRMA, token_tsa: token, fecha: ahora },
      });
    }, OPCIONES_TRANSACCION);
  } catch (err) {
    fs.rmSync(archivo.rutaAbsoluta, { force: true });
    throw err;
  }
  fs.rmSync(path.join(RUTA_BASE_DOCUMENTOS, reporte.documento.ruta_archivo), { force: true });
  log(`Reporte ${reporte.id} rehecho con el flujo de envío (rúbrica + sello TSA).`);
}

async function asegurarReporteUno(clave) {
  const reporte = await reporteUnoDe(clave);
  if (!reporte) {
    // Envío real (CU-REP-01): valida, genera el PDF con la rúbrica, sella, cifra y registra.
    const { reporte: enviado } = await enviarReporteMensual(await usuarioIdDe(clave), ACTIVIDADES_MES, { ip: IP_FIRMA });
    log(`Reporte ${enviado.id} enviado: ${enviado.estadoReporte}`);
    return true;
  }
  if (reporte.revision_reporte_mensual.some((r) => !r.token_tsa)) {
    await rehacerReporteProvisional(clave, reporte);
    return true;
  }
  return false;
}

// ── Resumen ──────────────────────────────────────────────────

async function imprimirResumen() {
  const usuarios = await prisma.usuario.findMany({
    where: { correo_institucional: { in: CORREOS } },
    select: { id: true, correo_institucional: true, rol: true, rubrica_imagen: true, alumno: { select: { boleta: true } } },
    orderBy: { id: 'asc' },
  });
  for (const u of usuarios) {
    console.log(`USUARIO: ${u.id} | ${u.correo_institucional} | ${u.rol} | boleta ${u.alumno?.boleta ?? '-'} | `
      + `rúbrica ${u.rubrica_imagen ? 'sí' : 'no'} | ${PASSWORD_PLANO}`);
  }
  for (const clave of ALUMNOS_ASIGNADOS) {
    const r = await reporteUnoDe(clave);
    const firma = r?.revision_reporte_mensual[0];
    console.log(`REPORTE_${clave.slice(-1)}: ${r?.id} | ${r?.estado_reporte} | ${r?.dias_laborados} días, ${r?.horas_reportadas} h | `
      + `sello ${firma?.token_tsa ? 'sí' : 'no'} | hash ${firma?.hash_documento}`);
  }
}

async function main() {
  validarDatos();
  await renombrarCorreosAnteriores();
  await renombrarBoletasAnteriores();

  const estado = await estadoFixture();
  if (estado === 'ausente') await crearBase();
  else if (estado !== 'completo') {
    throw new Error(`${PREFIJO} El fixture existe a medias: ${estado}. No se insertó nada; revísalo a mano.`);
  }

  let cambios = estado === 'ausente';
  cambios = (await asegurarHashesPropios()) || cambios;
  for (const clave of ALUMNOS) cambios = (await asegurarCorreoPersonal(clave)) || cambios;
  for (const [i, clave] of ALUMNOS_ASIGNADOS.entries()) cambios = (await asegurarRubrica(clave, i + 1)) || cambios;
  for (const clave of ALUMNOS_ASIGNADOS) cambios = (await asegurarReporteUno(clave)) || cambios;

  if (!cambios) log('Ya estaba completo; no se modificó nada.');
  await imprimirResumen();
}

main()
  .catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
