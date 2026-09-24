// Seed EXCLUSIVO del E2E de CU-ADM-09/11/12. No toca ningún dato existente.
//
// Cubre la máquina de estados COMPLETA y los DOS orígenes:
//
//   pendiente ──► en_revision ──► aprobada        (la baja definitiva vive solo en esta flecha)
//       │              └────────► rechazada
//       └────────────────────────► rechazada
//
// Escenarios creados (un alumno nuevo por cada uno, identificables a simple vista):
//
//   A  alumno   → pendiente    CON expediente        Coordinación puede turnar o rechazar
//   B  alumno   → en_revision  CON expediente        Coordinación puede aprobar o rechazar
//   C  profesor → pendiente    SIN expediente        el ALUMNO debe completarlo (ADM-11)
//   D  profesor → pendiente    CON expediente        ya lo completó el alumno (creador_id = alumno)
//   E  profesor → en_revision  CON expediente        turnada a las autoridades
//   F  alumno   → aprobada                           baja definitiva YA aplicada
//   G  alumno   → rechazada                          su servicio sigue intacto
//
// El escenario F se siembra con el estado POSTERIOR a la aprobación, no con uno imposible: su
// servicio quedó en 'modificar_reenviar' (el estado real de CU-GR-13, sin tipo_rechazo ni
// motivo_rechazo, porque una baja NO es un rechazo), su rol volvió a 'alumno_sin_asignar', su avance
// ya no existe, su cúmulo está en cero y solo conserva el expediente de la baja. Es exactamente lo
// que deja aprobarSolicitud.
//
// PROFESORES: se crean DOS profesores exclusivos del E2E, con cupos_totales = 3 (Profesor base, sin
// característica). No se reutiliza ningún profesor real porque seis alumnos activos excederían la
// capacidad de uno solo, y sembrar un profesor con más capacidad de la que el modelo permite sería
// inventar datos imposibles. Cada profesor recibe 3 alumnos que ocupan lugar, ni uno más.
//
// Del resto de la BD solo se reutilizan el coordinador id=1 y los catálogos de carrera y periodo.
//
// Idempotente: si los usuarios del E2E existen, los elimina primero (cascada) y los vuelve a crear.
//
// Uso:  node backend/src/modules/administrativa/bajas/seed/seed-e2e-bajas.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');
const { cifrarBuffer } = require('../../../../lib/fileEncryption');

const PASSWORD = '12345678';
const COORDINADOR_ID = 1;
const CARRERA_ID = 1; // ISC
const PERIODO_ID = 3;

// Prefijos que identifican TODO lo que este seed crea, y lo único que borra al reejecutarse.
const PREFIJO = '[E2E-BAJAS]';
const DOMINIO_ALUMNO = '@alumno.ipn.mx';
const CORREO_ALUMNO = (clave) => `e2e.baja.${clave.toLowerCase()}${DOMINIO_ALUMNO}`;
const CORREO_PROFESOR = (n) => `e2e.baja.profesor${n}@ipn.mx`;

const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../../uploads/documentos');
const carpetaDe = (boleta) => path.join(RUTA_BASE_DOCUMENTOS, boleta);

const ahora = new Date();
const dia = (offset) => new Date(Date.UTC(2026, 8, 10 + offset));
const hora = (offset, h) => new Date(Date.UTC(2026, 8, 10 + offset, h, 0, 0));

// ── Definición de los siete escenarios ──────────────────────────────────────
//
// `origen`         'alumno' | 'profesor' — quién abrió la solicitud (solicitante_id).
// `estado`         estado de solicitud_baja.
// `conExpediente`  si la solicitud tiene documento_id.
// `expedienteDe`   quién subió ese expediente: 'alumno' siempre (es su trámite), incluso cuando la
//                  solicitud la abrió el profesor (escenario D).
// `servicioActivo` false solo en F: ahí la baja definitiva ya corrió.
// `profesor`       1 o 2 — reparte la capacidad para no exceder 3 ocupantes por profesor.
const ESCENARIOS = [
  {
    clave: 'A', nombre: 'Ana', apellidos: 'Pendiente Alumno', boleta: '2099999001', profesor: 1,
    origen: 'alumno', estado: 'pendiente', conExpediente: true, servicioActivo: true,
    motivo: `${PREFIJO} Solicito mi baja por motivos personales (escenario A).`,
    descripcion: 'alumno → pendiente CON expediente',
  },
  {
    clave: 'B', nombre: 'Bruno', apellidos: 'Revision Alumno', boleta: '2099999002', profesor: 1,
    origen: 'alumno', estado: 'en_revision', conExpediente: true, servicioActivo: true,
    motivo: `${PREFIJO} Solicito mi baja por cambio de residencia (escenario B).`,
    descripcion: 'alumno → en_revision CON expediente',
  },
  {
    clave: 'C', nombre: 'Carla', apellidos: 'SinExpediente Profesor', boleta: '2099999003', profesor: 1,
    origen: 'profesor', estado: 'pendiente', conExpediente: false, servicioActivo: true,
    motivo: `${PREFIJO} Faltas reiteradas sin justificación (escenario C).`,
    descripcion: 'profesor → pendiente SIN expediente (el alumno debe completarlo)',
  },
  {
    clave: 'D', nombre: 'Diego', apellidos: 'Completado Profesor', boleta: '2099999004', profesor: 2,
    origen: 'profesor', estado: 'pendiente', conExpediente: true, servicioActivo: true,
    motivo: `${PREFIJO} Abandono de actividades del proyecto (escenario D).`,
    descripcion: 'profesor → pendiente CON expediente completado por el alumno',
  },
  {
    clave: 'E', nombre: 'Elena', apellidos: 'Revision Profesor', boleta: '2099999005', profesor: 2,
    origen: 'profesor', estado: 'en_revision', conExpediente: true, servicioActivo: true,
    motivo: `${PREFIJO} Incumplimiento sostenido de entregables (escenario E).`,
    descripcion: 'profesor → en_revision CON expediente',
  },
  {
    clave: 'F', nombre: 'Fernanda', apellidos: 'Aprobada Alumno', boleta: '2099999006', profesor: 2,
    origen: 'alumno', estado: 'aprobada', conExpediente: true, servicioActivo: false,
    motivo: `${PREFIJO} Solicito mi baja por motivos de salud (escenario F).`,
    comentario: `${PREFIJO} Baja autorizada por las autoridades correspondientes.`,
    descripcion: 'alumno → APROBADA (baja definitiva ya aplicada)',
  },
  {
    clave: 'G', nombre: 'Gabriel', apellidos: 'Rechazada Alumno', boleta: '2099999007', profesor: 2,
    origen: 'alumno', estado: 'rechazada', conExpediente: true, servicioActivo: true,
    motivo: `${PREFIJO} Solicito mi baja por carga académica (escenario G).`,
    comentario: `${PREFIJO} El expediente está incompleto: falta la carta compromiso por ambos lados.`,
    descripcion: 'alumno → RECHAZADA (su servicio sigue intacto)',
  },
];

const ES_ACTIVA = (estado) => estado === 'pendiente' || estado === 'en_revision';

// ── Limpieza idempotente ────────────────────────────────────────────────────

async function limpiarSiExiste() {
  const correos = [
    ...ESCENARIOS.map((e) => CORREO_ALUMNO(e.clave)),
    CORREO_PROFESOR(1), CORREO_PROFESOR(2),
  ];
  const existentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correos } },
    select: { id: true, correo_institucional: true, rol: true },
  });
  if (existentes.length === 0) return 0;

  // Los alumnos primero: al borrar al profesor caen sus ofertas, y `solicitud_registro.oferta_id`
  // quedaría en NULL en vez de desaparecer con el alumno.
  const alumnos = existentes.filter((u) => u.rol !== 'profesor');
  const profesores = existentes.filter((u) => u.rol === 'profesor');
  for (const u of [...alumnos, ...profesores]) {
    await prisma.usuario.delete({ where: { id: u.id } });
  }

  for (const e of ESCENARIOS) {
    fs.rmSync(carpetaDe(e.boleta), { recursive: true, force: true });
  }
  return existentes.length;
}

// ── Archivos ficticios, cifrados como los escribiría el sistema ─────────────

/**
 * El contenido se cifra con cifrarBuffer, igual que el sistema real: escribirlo en texto plano hacía
 * que descifrarBuffer fallara con "unable to authenticate data" al descargar el expediente.
 *
 * Estructura idéntica a la de un alumno real: el expediente de baja y los de GR en la raíz de
 * <boleta>/, los PDFs de reportes en Reportes/ y la rúbrica en Rubrica/. Así el E2E puede comprobar
 * que el borrado selectivo baja por los subdirectorios y CONSERVA el expediente de la baja.
 */
function crearArchivos(escenario) {
  const carpeta = carpetaDe(escenario.boleta);
  const archivos = [];

  if (escenario.conExpediente) archivos.push(['expediente-baja.enc', 'expediente de baja']);

  // El alumno F ya fue dado de baja: su avance y sus archivos del servicio ya no existen.
  if (escenario.servicioActivo) {
    fs.mkdirSync(path.join(carpeta, 'Reportes'), { recursive: true });
    fs.mkdirSync(path.join(carpeta, 'Rubrica'), { recursive: true });
    archivos.push(
      ['expediente-gr.enc', 'expediente de GR'],
      [path.join('Reportes', 'reporte-mensual-1.enc'), 'reporte mensual 1'],
      [path.join('Rubrica', 'rubrica.enc'), 'rubrica del alumno'],
    );
  }

  fs.mkdirSync(carpeta, { recursive: true });
  for (const [relativa, texto] of archivos) {
    const contenido = `CONTENIDO FICTICIO ${PREFIJO} — ${texto} (${escenario.boleta})\n`.repeat(40);
    fs.writeFileSync(path.join(carpeta, relativa), cifrarBuffer(Buffer.from(contenido, 'utf8')));
  }
  return archivos.map(([r]) => r);
}

// ── Creación de un escenario completo ───────────────────────────────────────

async function crearProfesor(tx, n, hash) {
  const usuario = await tx.usuario.create({
    data: {
      rol: 'profesor',
      correo_institucional: CORREO_PROFESOR(n),
      nombre: `E2E Profesor ${n}`,
      apellidos: 'Bajas Prueba',
      contrasena: hash,
      fecha_creacion: ahora,
      intentos_fallidos: 0,
      cuenta_bloqueada: false,
    },
  });

  // Profesor base: 3 cupos y NINGUNA característica (caracteristica_id null), como manda el modelo.
  const profesor = await tx.profesor.create({
    data: {
      usuario_id: usuario.id,
      departamento: 'Ingeniería en Sistemas Computacionales',
      telefono_personal: '5500000000',
      horario_atencion: 'Lunes a viernes, 10:00 a 14:00',
      cubiculo: `E2E-${n}`,
      cupos_totales: 3,
      caracteristica_id: null,
    },
  });

  return { usuarioId: usuario.id, profesorId: profesor.id };
}

async function crearEscenario(tx, escenario, profesores, hash) {
  const { profesorId, usuarioId: profesorUsuarioId } = profesores[escenario.profesor];

  const usuario = await tx.usuario.create({
    data: {
      // F ya fue dado de baja: su rol volvió a 'alumno_sin_asignar', que es lo que deja la aprobación.
      rol: escenario.servicioActivo ? 'alumno_asignado' : 'alumno_sin_asignar',
      correo_institucional: CORREO_ALUMNO(escenario.clave),
      nombre: `E2E ${escenario.nombre}`,
      apellidos: escenario.apellidos,
      contrasena: hash,
      fecha_creacion: ahora,
      intentos_fallidos: 0,
      cuenta_bloqueada: false,
    },
  });

  const alumno = await tx.alumno.create({
    data: {
      boleta: escenario.boleta,
      usuario_id: usuario.id,
      celular: '5500000000',
      carrera: 'ISC',
      creditos: 65.0,
      semestre: 8,
      correo_personal: `e2e.baja.${escenario.clave.toLowerCase()}.personal@gmail.com`,
    },
  });

  // Una oferta por escenario, exclusiva del E2E: así la liberación de cupo se mide sobre una oferta
  // que no le importa a nadie más. En F el lugar YA fue devuelto (2 de 3 disponibles).
  const oferta = await tx.oferta_servicio.create({
    data: {
      profesor_id: profesorId,
      coordinador_id: COORDINADOR_ID,
      nombre_proyecto: `${PREFIJO} Proyecto del escenario ${escenario.clave}`,
      tipo_oferta: 'proyecto',
      descripcion_actividades: `Oferta creada solo para el escenario ${escenario.clave} del E2E de bajas.`,
      cupos_ofertados: 3,
      cupos_disponibles: escenario.servicioActivo ? 1 : 2,
      estado_oferta: 'aprobada',
      fecha_registro: ahora,
      nombre_SISS: 'Actividad E2E',
      programa_SISS: 'Programa E2E',
    },
  });

  // El servicio: activo, o ya revertido al punto de retorno de CU-GR-13 cuando la baja se aprobó.
  const solicitud = await tx.solicitud_registro.create({
    data: escenario.servicioActivo
      ? {
          alumno_id: alumno.boleta,
          carrera_id: CARRERA_ID,
          periodo_registro_id: PERIODO_ID,
          oferta_id: oferta.id,
          estado_solicitud: 'alumno_asignado',
          estado_anterior: 'expediente_aprobado',
          fecha_aplicacion: ahora,
          registro_siss: true,
          docs_iniciales: true,
          carta_compromiso: true,
          fecha_carta_compromiso: dia(-5),
          expediente: true,
          motivacion_oferta: `${PREFIJO} Motivación del escenario ${escenario.clave}.`,
          dictamen: 1,
        }
      : {
          // Estado EXACTO que deja aprobarSolicitud: entra DIRECTO a CU-GR-13.
          // `estado_anterior: 'alumno_asignado'` es el marcador de origen del que GR-13 deriva su
          // `origenBaja`. `tipo_rechazo` y `motivo_rechazo` van en null: el motivo vive en
          // solicitud_baja, no se reinterpreta como un rechazo del registro.
          alumno_id: alumno.boleta,
          carrera_id: CARRERA_ID,
          periodo_registro_id: null,
          oferta_id: null,
          estado_solicitud: 'modificar_reenviar',
          estado_anterior: 'alumno_asignado',
          tipo_rechazo: null,
          motivo_rechazo: null,
          fecha_aplicacion: ahora,
          registro_siss: false,
          docs_iniciales: false,
          carta_compromiso: false,
          fecha_carta_compromiso: null,
          expediente: false,
          motivacion_oferta: null,
          dictamen: 1,
        },
  });

  // El cúmulo existe siempre; en F está reiniciado, no borrado (así lo deja la aprobación).
  await tx.cumulo_horas_y_faltas.create({
    data: escenario.servicioActivo
      ? {
          alumno_id: alumno.boleta,
          horas_acumuladas: 48,
          horas_rechazadas: 4,
          faltas_acumuladas: 3,
          faltas_consecutivas: 2,
          fecha_ultima_evaluacion_faltas: dia(10),
        }
      : {
          alumno_id: alumno.boleta,
          horas_acumuladas: 0,
          horas_rechazadas: 0,
          faltas_acumuladas: 0,
          faltas_consecutivas: 0,
          fecha_ultima_evaluacion_faltas: null,
        },
  });

  const creado = {
    ...escenario,
    usuarioId: usuario.id,
    profesorId,
    ofertaId: oferta.id,
    solicitudRegistroId: solicitud.id,
    documentos: [],
  };

  // ── Avance del servicio. F no lo tiene: la aprobación ya lo eliminó ──
  if (escenario.servicioActivo) {
    const actividad = await tx.actividad.create({
      data: {
        solicitud_registro_id: solicitud.id,
        titulo: `${PREFIJO} Levantamiento de requisitos`,
        descripcion: 'Actividad de prueba del E2E de bajas.',
        entregable_esperado: 'Documento de prueba.',
        fecha_limite: dia(20),
        estado: 'en_progreso',
        fecha_asignacion: ahora,
        porcentaje_progreso: 40,
      },
    });

    // Una bitácora por día: hay UNIQUE(solicitud_registro_id, fecha_registro).
    const bitacoras = [];
    for (let i = 0; i < 3; i++) {
      bitacoras.push(await tx.bitacora.create({
        data: {
          solicitud_registro_id: solicitud.id,
          hora_inicio: hora(i, 14),
          hora_fin: hora(i, 18),
          horas_contabilizadas: 4,
          estado: i < 2 ? 'aprobada' : 'pendiente_revision',
          fecha_registro: dia(i),
          fecha_revision: i < 2 ? hora(i + 1, 10) : null,
          revisado_por_id: i < 2 ? profesorId : null,
        },
      }));
    }

    // Tabla puente: comprueba el borrado de segundo nivel.
    await tx.registro_bitacora_actividades.create({
      data: {
        bitacora_id: bitacoras[0].id,
        actividad_id: actividad.id,
        porcentaje_avance_registrado: 40,
        descripcion: `${PREFIJO} Avance registrado en la bitácora de prueba.`,
        evidencia: `${PREFIJO} Evidencia ficticia del avance.`,
      },
    });

    const docGr = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: usuario.id,
        tipo_documento: 'expediente',
        fecha_creacion: ahora,
        estado_documento: 'aprobado',
        ruta_archivo: path.join(escenario.boleta, 'expediente-gr.enc'),
        nombre_expediente: `${escenario.apellidos}_${escenario.boleta}.pdf`,
      },
    });

    const docReporte = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: usuario.id,
        tipo_documento: 'reporte_mensual',
        fecha_creacion: ahora,
        // Los reportes nacen y permanecen 'vigente': su aprobación vive en reporte_mensual.
        estado_documento: 'vigente',
        ruta_archivo: path.join(escenario.boleta, 'Reportes', 'reporte-mensual-1.enc'),
      },
    });

    const reporte = await tx.reporte_mensual.create({
      data: {
        solicitud_registro_id: solicitud.id,
        documento_id: docReporte.id,
        num_reporte: 1,
        actividades_mes: `${PREFIJO} Actividades del mes de prueba.`,
        dias_laborados: 12,
        horas_reportadas: 48,
        estado_reporte: 'aprobado_coordinador',
      },
    });

    // Firma del PROFESOR sobre el reporte del alumno: es una fila de un TERCERO y debe desaparecer
    // con el reporte cuando la baja se aprueba.
    await tx.revision_reporte_mensual.create({
      data: {
        reporte_mensual_id: reporte.id,
        usuario_id: profesorUsuarioId,
        tipo_revisor: 'profesor',
        estado: 'aprobado',
        ruta_archivo: path.join(escenario.boleta, 'Reportes', 'reporte-mensual-1.enc'),
        hash_documento: `e2e${escenario.clave.toLowerCase()}`.padEnd(64, '0'),
        token_tsa: `${PREFIJO} sello de tiempo ficticio`,
        fecha: ahora,
      },
    });

    // La rúbrica vive en usuario, no en documento: su ruta debe acompañar al archivo.
    await tx.usuario.update({
      where: { id: usuario.id },
      data: {
        rubrica_imagen: path.join(escenario.boleta, 'Rubrica', 'rubrica.enc'),
        rubrica_ip: '127.0.0.1',
        rubrica_fecha_registro: ahora,
      },
    });

    creado.documentos.push(docGr.id, docReporte.id);
    creado.reporteId = reporte.id;
  }

  // ── El expediente de la baja, cuando toca ──
  let docBajaId = null;
  if (escenario.conExpediente) {
    const doc = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        // Siempre lo aporta el ALUMNO, incluso cuando la solicitud la abrió su profesor (D y E):
        // así queda registrado quién lo subió.
        creador_id: usuario.id,
        tipo_documento: 'expediente_baja',
        fecha_creacion: ahora,
        estado_documento: ES_ACTIVA(escenario.estado) ? 'en_revision' : escenario.estado,
        ruta_archivo: path.join(escenario.boleta, 'expediente-baja.enc'),
      },
    });
    docBajaId = doc.id;
    creado.documentos.push(doc.id);
  }

  // ── La solicitud de baja ──
  const resuelta = !ES_ACTIVA(escenario.estado);
  const baja = await tx.solicitud_baja.create({
    data: {
      alumno_id: alumno.boleta,
      // De aquí DERIVA el origen: si el solicitante es el propio alumno viene de ADM-11; si no, de ADM-09.
      solicitante_id: escenario.origen === 'alumno' ? usuario.id : profesorUsuarioId,
      // Se fija al turnar o al resolver; en 'pendiente' todavía no hay coordinador.
      coordinador_id: escenario.estado === 'pendiente' ? null : COORDINADOR_ID,
      documento_id: docBajaId,
      estado: escenario.estado,
      motivo: escenario.motivo,
      fecha: dia(-2),
      fecha_respuesta: resuelta ? dia(0) : null,
      comentario: escenario.comentario ?? null,
    },
  });
  creado.bajaId = baja.id;

  // Notificación propia del alumno, coherente con su estado.
  const mensajePorEstado = {
    pendiente: escenario.origen === 'profesor'
      ? `${PREFIJO} Tu profesor solicitó tu baja del servicio social. Debes completar el expediente correspondiente.`
      : `${PREFIJO} Registramos tu solicitud de baja del servicio social.`,
    en_revision: 'Tu solicitud de baja está en revisión por las autoridades correspondientes.',
    aprobada: 'Tu baja del servicio social fue aprobada. Tu cuenta se conserva: puedes modificar tu '
      + 'solicitud y postularte a otra oferta.',
    rechazada: `Tu solicitud de baja del servicio social fue rechazada. Motivo: ${escenario.comentario ?? ''}`,
  };
  await tx.notificacion.create({
    data: {
      usuario_id: usuario.id,
      tipo: escenario.estado === 'rechazada' || escenario.origen === 'profesor' ? 'urgente' : 'info',
      mensaje: mensajePorEstado[escenario.estado],
      ruta_relacionada: '/alumno/solicitar-baja',
      fecha_creacion: ahora,
    },
  });

  return creado;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══ SEED E2E DE BAJAS ═══\n');

  const borrados = await limpiarSiExiste();
  if (borrados > 0) console.log(`Existían ${borrados} usuarios E2E previos: eliminados antes de recrear.\n`);

  const hash = await bcrypt.hash(PASSWORD, 10);

  const creados = await prisma.$transaction(async (tx) => {
    const profesores = {
      1: await crearProfesor(tx, 1, hash),
      2: await crearProfesor(tx, 2, hash),
    };

    const salida = [];
    for (const escenario of ESCENARIOS) {
      salida.push(await crearEscenario(tx, escenario, profesores, hash));
    }
    return { profesores, escenarios: salida };
  }, { timeout: 30000 });

  console.log('Profesores E2E (Profesor base, 3 cupos cada uno):');
  for (const n of [1, 2]) {
    console.log(`  ${CORREO_PROFESOR(n)}  → profesor.id ${creados.profesores[n].profesorId}`);
  }

  console.log('\nEscenarios:');
  for (const e of creados.escenarios) {
    const archivos = crearArchivos(e);
    console.log(`\n  ${e.clave}) ${e.descripcion}`);
    console.log('     correo               :', CORREO_ALUMNO(e.clave));
    console.log('     boleta               :', e.boleta);
    console.log('     solicitud_baja.id    :', e.bajaId, `(estado: ${e.estado}, origen: ${e.origen})`);
    console.log('     solicitud_registro.id:', e.solicitudRegistroId);
    console.log('     oferta_servicio.id   :', e.ofertaId, `(profesor ${e.profesorId})`);
    console.log('     documento.id         :', e.documentos.length ? e.documentos.join(', ') : '— (sin documentos)');
    console.log('     archivos             :', archivos.length ? archivos.join(', ') : '— (ninguno)');
  }

  console.log('\nQué probar con cada uno:');
  console.log('  A → Coordinación puede "Marcar en revisión" o "Rechazar". NO debe ver "Aprobar".');
  console.log('  B → Coordinación puede "Aprobar" (baja definitiva) o "Rechazar".');
  console.log('  C → el ALUMNO entra a /alumno/solicitar-baja y adjunta su expediente a ESA solicitud.');
  console.log('      Coordinación todavía no puede turnarla: sin expediente no hay nada que turnar.');
  console.log('  D → igual que A, pero el origen sigue siendo el profesor y el motivo es el suyo.');
  console.log('  E → igual que B, con origen profesor.');
  console.log('  F → ya aprobada: su servicio quedó en "modificar_reenviar", listo para entrar DIRECTO');
  console.log('      a CU-GR-13 (sin tipo_rechazo ni motivo_rechazo); conserva cuenta y su expediente_baja.');
  console.log('  G → rechazada: su servicio social sigue intacto y puede volver a solicitar la baja.');

  console.log('\nContraseña de todos los usuarios E2E:', PASSWORD);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error en el seed E2E:', e);
  await prisma.$disconnect();
  process.exit(1);
});

module.exports = { ESCENARIOS, PREFIJO, CORREO_ALUMNO, CORREO_PROFESOR, carpetaDe };
