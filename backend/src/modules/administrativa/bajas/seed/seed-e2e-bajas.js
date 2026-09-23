// Seed EXCLUSIVO del E2E de CU-ADM-09/11/12. No toca ningún dato existente.
//
// Crea un alumno completamente nuevo, identificable a simple vista (boleta 2099999999, correo
// e2e.baja@alumno.ipn.mx) y con un proceso de servicio social completo, para poder comprobar que
// una baja aprobada elimina TODO mediante las cascadas reales de MariaDB.
//
// Lo único que reutiliza de la BD existente es el profesor id=1 (profesor.normal@ipn.mx, elegido
// porque tiene 0 alumnos y 0 ofertas, así que el E2E no altera la capacidad de nadie), el
// coordinador id=1 y los catálogos de carrera y periodo. La OFERTA es nueva y exclusiva del E2E,
// para que la liberación de cupo se mida sobre una oferta que no le importa a nadie más.
//
// Idempotente: si el alumno E2E ya existe, lo elimina primero (cascada) y lo vuelve a crear.
//
// Uso:  node backend/src/modules/administrativa/bajas/seed/seed-e2e-bajas.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');

const BOLETA = '2099999999';
const CORREO = 'e2e.baja@alumno.ipn.mx';
const PASSWORD = '12345678';

const PROFESOR_ID = 1;      // profesor.normal@ipn.mx — 0 alumnos, 0 ofertas
const COORDINADOR_ID = 1;
const CARRERA_ID = 1;       // ISC
const PERIODO_ID = 3;

const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../../uploads/documentos');
const CARPETA_ALUMNO = path.join(RUTA_BASE_DOCUMENTOS, BOLETA);

const ahora = new Date();
const dia = (offset) => new Date(Date.UTC(2026, 8, 10 + offset));

async function limpiarSiExiste() {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO } });
  if (!existente) return false;
  // CASCADE se lleva alumno, solicitud_registro, bitácoras, documentos, etc.
  await prisma.usuario.delete({ where: { id: existente.id } });
  return true;
}

function crearArchivosFicticios() {
  // Estructura idéntica a la de un alumno real: expediente en la raíz, PDFs en Reportes/ y la
  // rúbrica en Rubrica/. Sirve para comprobar que el borrado recursivo baja por los subdirectorios.
  fs.mkdirSync(path.join(CARPETA_ALUMNO, 'Reportes'), { recursive: true });
  fs.mkdirSync(path.join(CARPETA_ALUMNO, 'Rubrica'), { recursive: true });

  const archivos = [
    ['expediente-baja-e2e.enc', 'CONTENIDO FICTICIO E2E — expediente de baja\n'.repeat(40)],
    ['expediente-gr-e2e.enc', 'CONTENIDO FICTICIO E2E — expediente de GR\n'.repeat(40)],
    [path.join('Reportes', 'reporte-mensual-1.enc'), 'CONTENIDO FICTICIO E2E — reporte mensual 1\n'.repeat(60)],
    [path.join('Reportes', 'reporte-mensual-2.enc'), 'CONTENIDO FICTICIO E2E — reporte mensual 2\n'.repeat(60)],
    [path.join('Rubrica', 'rubrica.enc'), 'CONTENIDO FICTICIO E2E — rubrica\n'.repeat(20)],
  ];

  for (const [relativa, contenido] of archivos) {
    fs.writeFileSync(path.join(CARPETA_ALUMNO, relativa), contenido);
  }
  return archivos.map(([r]) => r);
}

async function main() {
  console.log('═══ SEED E2E DE BAJAS ═══\n');

  const limpiado = await limpiarSiExiste();
  if (limpiado) console.log('Existía un alumno E2E previo: eliminado antes de recrear.\n');

  const hash = await bcrypt.hash(PASSWORD, 10);

  const creado = await prisma.$transaction(async (tx) => {
    // 1) Usuario + alumno
    const usuario = await tx.usuario.create({
      data: {
        rol: 'alumno_asignado',
        correo_institucional: CORREO,
        nombre: 'E2E Baja',
        apellidos: 'Alumno Prueba',
        contrasena: hash,
        fecha_creacion: ahora,
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
      },
    });

    const alumno = await tx.alumno.create({
      data: {
        boleta: BOLETA,
        usuario_id: usuario.id,
        celular: '5500000000',
        carrera: 'ISC',
        creditos: 80.5,
        semestre: 8,
        correo_personal: 'e2e.baja.personal@gmail.com',
      },
    });

    // 2) Oferta EXCLUSIVA del E2E. Proyecto con 3 lugares y 1 disponible: al aprobar la baja
    //    debe pasar a 2, exactamente +1 y sin superar cupos_ofertados.
    const oferta = await tx.oferta_servicio.create({
      data: {
        profesor_id: PROFESOR_ID,
        coordinador_id: COORDINADOR_ID,
        nombre_proyecto: '[E2E-BAJAS] Proyecto de prueba para baja',
        tipo_oferta: 'proyecto',
        descripcion_actividades: 'Oferta creada solo para el E2E del módulo de bajas.',
        cupos_ofertados: 3,
        cupos_disponibles: 1,
        estado_oferta: 'aprobada',
        fecha_registro: ahora,
        nombre_SISS: 'Actividad E2E',
        programa_SISS: 'Programa E2E',
      },
    });

    // 3) Proceso de servicio social en curso
    const solicitud = await tx.solicitud_registro.create({
      data: {
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
        expediente: true,
        motivacion_oferta: 'Motivación de prueba E2E.',
      },
    });

    // 4) Acumulado de horas y faltas
    await tx.cumulo_horas_y_faltas.create({
      data: {
        alumno_id: alumno.boleta,
        horas_acumuladas: 48,
        horas_rechazadas: 4,
        faltas_acumuladas: 3,
        faltas_consecutivas: 2,
        fecha_ultima_evaluacion_faltas: dia(10),
      },
    });

    // 5) Actividades
    const actividades = [];
    for (const [i, titulo] of ['Levantamiento de requisitos', 'Diseño de base de datos', 'Pruebas de integración'].entries()) {
      actividades.push(await tx.actividad.create({
        data: {
          solicitud_registro_id: solicitud.id,
          titulo: `[E2E] ${titulo}`,
          descripcion: 'Actividad de prueba del E2E de bajas.',
          entregable_esperado: 'Documento de prueba.',
          fecha_limite: dia(20 + i),
          estado: i === 0 ? 'completada_a_tiempo' : 'en_progreso',
          fecha_asignacion: ahora,
          porcentaje_progreso: i === 0 ? 100 : 40,
        },
      }));
    }

    // 6) Bitácoras (una por día: hay UNIQUE(solicitud_registro_id, fecha_registro))
    const bitacoras = [];
    for (let i = 0; i < 4; i++) {
      bitacoras.push(await tx.bitacora.create({
        data: {
          solicitud_registro_id: solicitud.id,
          hora_inicio: new Date(Date.UTC(2026, 8, 10 + i, 14, 0, 0)),
          hora_fin: new Date(Date.UTC(2026, 8, 10 + i, 18, 0, 0)),
          horas_contabilizadas: 4,
          estado: i < 3 ? 'aprobada' : 'pendiente_revision',
          fecha_registro: dia(i),
          fecha_revision: i < 3 ? new Date(Date.UTC(2026, 8, 11 + i, 10, 0, 0)) : null,
          revisado_por_id: i < 3 ? PROFESOR_ID : null,
        },
      }));
    }

    // 7) Enlace bitácora ↔ actividad (tabla puente: comprueba la cascada de segundo nivel)
    await tx.registro_bitacora_actividades.create({
      data: {
        bitacora_id: bitacoras[0].id,
        actividad_id: actividades[0].id,
        porcentaje_avance_registrado: 40,
        descripcion: '[E2E] Avance registrado en la bitácora de prueba.',
        evidencia: '[E2E] Evidencia ficticia del avance.',
      },
    });

    // 8) Documentos: expediente de GR + expediente de la baja (ADM-11)
    const docGr = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: usuario.id,
        tipo_documento: 'expediente',
        fecha_creacion: ahora,
        estado_documento: 'aprobada',
        ruta_archivo: path.join(BOLETA, 'expediente-gr-e2e.enc'),
        nombre_expediente: 'Alumno_Prueba_E2E_Baja_2099999999.pdf',
      },
    });

    const docBaja = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: usuario.id,
        tipo_documento: 'expediente_baja',
        fecha_creacion: ahora,
        estado_documento: 'en_revision',
        ruta_archivo: path.join(BOLETA, 'expediente-baja-e2e.enc'),
      },
    });

    // 9) Reporte mensual colgando del documento y de la solicitud: su revisión (firma) debe
    //    desaparecer también, y es una fila de un TERCERO (el profesor).
    const docReporte = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: usuario.id,
        tipo_documento: 'reporte_mensual',
        fecha_creacion: ahora,
        estado_documento: 'aprobada',
        ruta_archivo: path.join(BOLETA, 'Reportes', 'reporte-mensual-1.enc'),
      },
    });

    const reporte = await tx.reporte_mensual.create({
      data: {
        solicitud_registro_id: solicitud.id,
        documento_id: docReporte.id,
        num_reporte: 1,
        actividades_mes: '[E2E] Actividades del mes de prueba.',
        dias_laborados: 12,
        horas_reportadas: 48,
        estado_reporte: 'aprobado_coordinador',
      },
    });

    const profesorUsuario = await tx.profesor.findUnique({ where: { id: PROFESOR_ID } });
    await tx.revision_reporte_mensual.create({
      data: {
        reporte_mensual_id: reporte.id,
        usuario_id: profesorUsuario.usuario_id, // firma del PROFESOR sobre el reporte del alumno
        tipo_revisor: 'profesor',
        estado: 'aprobado',
        ruta_archivo: path.join(BOLETA, 'Reportes', 'reporte-mensual-1.enc'),
        hash_documento: 'e2e0000000000000000000000000000000000000000000000000000000000000',
        token_tsa: '[E2E] sello de tiempo ficticio',
        fecha: ahora,
      },
    });

    // 10) Solicitud de baja PENDIENTE (origen alumno: ADM-11, con expediente)
    const baja = await tx.solicitud_baja.create({
      data: {
        alumno_id: alumno.boleta,
        solicitante_id: usuario.id,
        coordinador_id: null,
        documento_id: docBaja.id,
        estado: 'pendiente',
        motivo: '[E2E] Solicito mi baja del servicio social por motivos de prueba automatizada.',
        fecha: ahora,
        fecha_respuesta: null,
        comentario: null,
      },
    });

    // 11) Notificación propia del alumno (debe morir con él)
    await tx.notificacion.create({
      data: {
        usuario_id: usuario.id,
        tipo: 'info',
        mensaje: '[E2E] Notificación de prueba del alumno E2E.',
        ruta_relacionada: '/alumno/horas',
        fecha_creacion: ahora,
      },
    });

    return {
      usuarioId: usuario.id, boleta: alumno.boleta, ofertaId: oferta.id,
      solicitudRegistroId: solicitud.id, bajaId: baja.id,
      documentos: [docGr.id, docBaja.id, docReporte.id],
      reporteId: reporte.id,
      actividades: actividades.map((a) => a.id),
      bitacoras: bitacoras.map((b) => b.id),
    };
  });

  const archivos = crearArchivosFicticios();

  console.log('Creado:');
  console.log('  usuario.id            :', creado.usuarioId);
  console.log('  correo                :', CORREO);
  console.log('  alumno.boleta         :', creado.boleta);
  console.log('  oferta_servicio.id    :', creado.ofertaId, '(nueva, exclusiva del E2E)');
  console.log('  solicitud_registro.id :', creado.solicitudRegistroId);
  console.log('  solicitud_baja.id     :', creado.bajaId, '(pendiente, con expediente)');
  console.log('  documento.id          :', creado.documentos.join(', '));
  console.log('  reporte_mensual.id    :', creado.reporteId);
  console.log('  actividad.id          :', creado.actividades.join(', '));
  console.log('  bitacora.id           :', creado.bitacoras.join(', '));
  console.log('\nArchivos ficticios en', CARPETA_ALUMNO + ':');
  for (const a of archivos) console.log('  ', a);
  console.log('\nContraseña del alumno E2E:', PASSWORD);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error en el seed E2E:', e);
  await prisma.$disconnect();
  process.exit(1);
});

module.exports = { BOLETA, CORREO, PROFESOR_ID, CARPETA_ALUMNO };
