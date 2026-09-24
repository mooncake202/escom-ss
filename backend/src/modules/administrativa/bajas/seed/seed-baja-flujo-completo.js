// Seed de UN alumno listo para recorrer a mano el flujo COMPLETO de baja:
//
//   alumno asignado → (ADM-11) solicita baja + expediente → pendiente
//                   → (ADM-12) Marcar en revisión        → en_revision
//                   → (ADM-12) Aprobar                   → aprobada
//                   → (CU-GR-13) modificar solicitud y postularse a otra oferta
//
// Nace SIN solicitud_baja a propósito: el primer paso del recorrido es que el propio alumno la cree
// desde ADM-11. Para probar los demás estados de la máquina ya está seed-e2e-bajas.js, que siembra
// los siete escenarios.
//
// AISLAMIENTO: prefijo de boleta 2095 y los correos 'bajaflujo2095@alumno.ipn.mx' /
// 'baja.flujo.profesor*@ipn.mx', que no colisionan con ningún otro seed (ver seed-bajas.shared.js).
// NO toca al alumno del seed de Reportes (2096630001, "SEEDREP01 ALUMNO UNO"), ni a los escenarios
// de seed-e2e-bajas.js (2099999xxx).
//
// Trae su servicio social con avance REAL (bitácoras, actividad, reporte firmado, expediente de GR y
// rúbrica) para que al aprobar la baja se pueda comprobar que:
//   - el avance se elimina y el cúmulo se reinicia;
//   - los archivos de Reportes/ y Rubrica/ desaparecen y el expediente de la baja se conserva;
//   - la oferta recupera exactamente 1 lugar;
//   - el alumno conserva su cuenta, vuelve a 'alumno_sin_asignar' y puede entrar a CU-GR-13.
//
// Idempotente: si los usuarios de este seed existen, los borra (cascada) y los vuelve a crear.
// Limpia además el correo del formato anterior ('baja.flujo@alumno.ipn.mx', que el login rechazaba) y,
// por si acaso, cualquier alumno que ya tuviera esta boleta.
//
// Uso:  node backend/src/modules/administrativa/bajas/seed/seed-baja-flujo-completo.js

require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');
const {
  PASSWORD_PLANO, PERIODO_ID,
  carpetaDe, escribirArchivoCifrado, borrarCarpetaDeAlumno,
  limpiarUsuariosDePrueba, limpiarAlumnoPorBoleta, validarCorreosDeSeed,
  crearProfesorBase, crearOfertaAprobada, crearAlumnoAsignado,
} = require('./seed-bajas.shared');

const PREFIJO = '[BAJA-FLUJO]';

// El correo del ALUMNO debe ser LETRAS + 4 DÍGITOS + @alumno.ipn.mx, o el login lo rechaza (ver el
// formato documentado en seed-bajas.shared.js). Los 4 dígitos son el prefijo de boleta de este seed.
const ALUMNO = {
  correo: 'bajaflujo2095@alumno.ipn.mx',
  nombre: 'Valeria',
  apellidos: 'Flujo Completo',
  boleta: '2095630001',
};

const PROFESOR = {
  correo: 'baja.flujo.profesor@ipn.mx',
  nombre: 'Ricardo',
  apellidos: 'Flujo Profesor',
  cubiculo: 'BAJA-FLUJO-1',
};

// Una SEGUNDA oferta, de otro profesor, para que al volver a CU-GR-13 haya a dónde postularse sin
// tener que reutilizar la oferta que acaba de abandonar.
const PROFESOR_DESTINO = {
  correo: 'baja.flujo.profesor2@ipn.mx',
  nombre: 'Norma',
  apellidos: 'Flujo Destino',
  cubiculo: 'BAJA-FLUJO-2',
};

const CORREOS = [ALUMNO.correo, PROFESOR.correo, PROFESOR_DESTINO.correo];

// Correos con los que este seed se ejecutó ANTES de corregir el formato. Se limpian igual, para que
// una reejecución no deje usuarios huérfanos que además no pueden iniciar sesión.
const CORREOS_LEGADO = ['baja.flujo@alumno.ipn.mx'];

const ahora = new Date();
const dia = (offset) => new Date(Date.UTC(2026, 8, 10 + offset));
const hora = (offset, h) => new Date(Date.UTC(2026, 8, 10 + offset, h, 0, 0));

async function main() {
  console.log(`═══ SEED ${PREFIJO} — alumno para el flujo completo de baja ═══\n`);

  // Antes de escribir nada: si un correo no pasara el formato del login, el seed crearía un usuario
  // inutilizable. Mejor fallar aquí que descubrirlo al intentar entrar.
  validarCorreosDeSeed({
    alumnos: [ALUMNO.correo],
    profesores: [PROFESOR.correo, PROFESOR_DESTINO.correo],
  });

  // Limpieza en tres pasadas, de lo más específico a lo más general:
  //   1. los correos actuales;
  //   2. los correos de la ejecución anterior, con el formato viejo;
  //   3. la boleta, que cubre cualquier otra variante con la que se haya sembrado.
  const borrados = await limpiarUsuariosDePrueba([...CORREOS, ...CORREOS_LEGADO]);
  if (borrados > 0) console.log(`Se eliminaron ${borrados} usuarios de ejecuciones previas de este seed.`);

  if (await limpiarAlumnoPorBoleta(ALUMNO.boleta)) {
    console.log(`Se eliminó un alumno previo con la boleta ${ALUMNO.boleta}.`);
  }
  borrarCarpetaDeAlumno(ALUMNO.boleta);
  if (borrados > 0) console.log('');

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);

  // Los archivos se escriben ANTES para tener sus rutas relativas; si la transacción fallara, la
  // limpieza de la siguiente ejecución los retira.
  const rutaExpedienteGr = escribirArchivoCifrado(ALUMNO.boleta, 'expediente-gr.enc',
    `CONTENIDO FICTICIO ${PREFIJO} — expediente de GR (${ALUMNO.boleta})\n`.repeat(40));
  const rutaReporte = escribirArchivoCifrado(ALUMNO.boleta, path.join('Reportes', 'reporte-mensual-1.enc'),
    `CONTENIDO FICTICIO ${PREFIJO} — reporte mensual 1 (${ALUMNO.boleta})\n`.repeat(60));
  const rutaRubrica = escribirArchivoCifrado(ALUMNO.boleta, path.join('Rubrica', 'rubrica.enc'),
    `CONTENIDO FICTICIO ${PREFIJO} — rubrica (${ALUMNO.boleta})\n`.repeat(20));

  const creado = await prisma.$transaction(async (tx) => {
    // 1) Profesor responsable y su oferta (la que el alumno abandonará).
    const profesor = await crearProfesorBase(tx, { ...PROFESOR, hash });
    const oferta = await crearOfertaAprobada(tx, {
      profesorId: profesor.profesorId,
      nombreProyecto: `${PREFIJO} Proyecto actual del alumno`,
    });

    // 2) Oferta de DESTINO para el retorno a CU-GR-13.
    const profesorDestino = await crearProfesorBase(tx, { ...PROFESOR_DESTINO, hash });
    const ofertaDestino = await crearOfertaAprobada(tx, {
      profesorId: profesorDestino.profesorId,
      nombreProyecto: `${PREFIJO} Proyecto de destino (para reenviar en GR-13)`,
      disponibles: 3,
    });

    // 3) El alumno, ya asignado y con su servicio en curso.
    const alumno = await crearAlumnoAsignado(tx, {
      ...ALUMNO,
      ofertaId: oferta.id,
      hash,
      motivacion: `${PREFIJO} Motivación de prueba para el flujo completo de baja.`,
    });

    // 4) Avance del servicio: lo que la baja aprobada debe eliminar.
    const actividad = await tx.actividad.create({
      data: {
        solicitud_registro_id: alumno.solicitudRegistroId,
        titulo: `${PREFIJO} Levantamiento de requisitos`,
        descripcion: 'Actividad de prueba del flujo de bajas.',
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
          solicitud_registro_id: alumno.solicitudRegistroId,
          hora_inicio: hora(i, 14),
          hora_fin: hora(i, 18),
          horas_contabilizadas: 4,
          estado: i < 2 ? 'aprobada' : 'pendiente_revision',
          fecha_registro: dia(i),
          fecha_revision: i < 2 ? hora(i + 1, 10) : null,
          revisado_por_id: i < 2 ? profesor.profesorId : null,
        },
      }));
    }

    await tx.registro_bitacora_actividades.create({
      data: {
        bitacora_id: bitacoras[0].id,
        actividad_id: actividad.id,
        porcentaje_avance_registrado: 40,
        descripcion: `${PREFIJO} Avance registrado en la bitácora de prueba.`,
        evidencia: `${PREFIJO} Evidencia ficticia del avance.`,
      },
    });

    // 5) Documentos del expediente: el de GR y el PDF del reporte mensual.
    const docGr = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: alumno.usuarioId,
        tipo_documento: 'expediente',
        fecha_creacion: ahora,
        estado_documento: 'aprobado',
        ruta_archivo: rutaExpedienteGr,
        nombre_expediente: `${ALUMNO.apellidos}_${ALUMNO.boleta}.pdf`,
      },
    });

    const docReporte = await tx.documento.create({
      data: {
        alumno_id: alumno.boleta,
        creador_id: alumno.usuarioId,
        tipo_documento: 'reporte_mensual',
        fecha_creacion: ahora,
        // Los reportes nacen y permanecen 'vigente': su aprobación vive en reporte_mensual.
        estado_documento: 'vigente',
        ruta_archivo: rutaReporte,
      },
    });

    const reporte = await tx.reporte_mensual.create({
      data: {
        solicitud_registro_id: alumno.solicitudRegistroId,
        documento_id: docReporte.id,
        num_reporte: 1,
        actividades_mes: `${PREFIJO} Actividades del mes de prueba.`,
        dias_laborados: 12,
        horas_reportadas: 48,
        estado_reporte: 'aprobado_coordinador',
      },
    });

    // Firma del PROFESOR sobre el reporte: es una fila de un TERCERO y debe caer con el reporte.
    await tx.revision_reporte_mensual.create({
      data: {
        reporte_mensual_id: reporte.id,
        usuario_id: profesor.usuarioId,
        tipo_revisor: 'profesor',
        estado: 'aprobado',
        ruta_archivo: rutaReporte,
        hash_documento: 'bajaflujo'.padEnd(64, '0'),
        token_tsa: `${PREFIJO} sello de tiempo ficticio`,
        fecha: ahora,
      },
    });

    // 6) La rúbrica vive en `usuario`, no en `documento`: su ruta debe acompañar al archivo, o al
    //    borrarlo el siguiente servicio daría un 500 al pedirla.
    await tx.usuario.update({
      where: { id: alumno.usuarioId },
      data: {
        rubrica_imagen: rutaRubrica,
        rubrica_ip: '127.0.0.1',
        rubrica_fecha_registro: ahora,
      },
    });

    return {
      alumno, profesor, profesorDestino,
      ofertaId: oferta.id,
      ofertaDestinoId: ofertaDestino.id,
      documentos: [docGr.id, docReporte.id],
      reporteId: reporte.id,
      actividadId: actividad.id,
      bitacoras: bitacoras.map((b) => b.id),
    };
  }, { timeout: 30000 });

  console.log('ALUMNO DE PRUEBA');
  console.log('  correo      :', ALUMNO.correo);
  console.log('  contraseña  :', PASSWORD_PLANO);
  console.log('  rol         : alumno_asignado');
  console.log('  nombre      :', `${ALUMNO.nombre} ${ALUMNO.apellidos}`);
  console.log('  boleta      :', ALUMNO.boleta);
  console.log('  usuario.id  :', creado.alumno.usuarioId);
  console.log('  solicitud_registro.id:', creado.alumno.solicitudRegistroId, '(estado: alumno_asignado)');

  console.log('\nPROFESOR RESPONSABLE (oferta actual)');
  console.log('  correo      :', PROFESOR.correo, '/ contraseña:', PASSWORD_PLANO);
  console.log('  profesor.id :', creado.profesor.profesorId, '· cupos_totales: 3 (Profesor base)');
  console.log('  oferta.id   :', creado.ofertaId, '· cupos_disponibles: 2 de 3');

  console.log('\nOFERTA DE DESTINO (para el reenvío en CU-GR-13)');
  console.log('  correo prof.:', PROFESOR_DESTINO.correo, '/ contraseña:', PASSWORD_PLANO);
  console.log('  oferta.id   :', creado.ofertaDestinoId, '· cupos_disponibles: 3 de 3');

  console.log('\nAVANCE SEMBRADO (lo que la baja aprobada debe eliminar)');
  console.log('  documento.id       :', creado.documentos.join(', '));
  console.log('  reporte_mensual.id :', creado.reporteId, '(con la firma del profesor)');
  console.log('  actividad.id       :', creado.actividadId);
  console.log('  bitacora.id        :', creado.bitacoras.join(', '));
  console.log('  cúmulo             : 48 horas, 4 rechazadas, 2 faltas');
  console.log('  archivos en        :', carpetaDe(ALUMNO.boleta));
  console.log('                       expediente-gr.enc, Reportes/, Rubrica/');

  console.log('\nRECORRIDO MANUAL');
  console.log('  1. Entra como el alumno → /alumno/solicitar-baja: captura motivo y sube un PDF.');
  console.log('     Queda en "pendiente". El dashboard muestra el aviso de Coordinación revisando.');
  console.log('  2. Entra como coordinador → /coordinacion/gestionar-bajas: abre la solicitud,');
  console.log('     pulsa "Ver expediente PDF" y luego "Marcar en revisión".');
  console.log('     "Aprobar" NO debe aparecer hasta este punto.');
  console.log('  3. El alumno recibe la notificación y su dashboard muestra el aviso informativo');
  console.log('     (sin acción). ADM-11 pasa a vista de seguimiento, sin formulario.');
  console.log('  4. Coordinación pulsa "Aprobar solicitud": se ejecuta la baja definitiva.');
  console.log('  5. Al alumno se le cierra la sesión. Vuelve a entrar: ya es alumno_sin_asignar y');
  console.log('     cae en la pantalla con "Modificar solicitud y reenviar" (CU-GR-13).');
  console.log(`  6. Reenvía eligiendo la oferta ${creado.ofertaDestinoId} y queda en espera del profesor.`);

  console.log('\nPeriodo de registro reutilizado:', PERIODO_ID);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(`Error en el seed ${PREFIJO}:`, e);
  await prisma.$disconnect();
  process.exit(1);
});

module.exports = { PREFIJO, ALUMNO, PROFESOR, PROFESOR_DESTINO, CORREOS, CORREOS_LEGADO };
