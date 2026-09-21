// Limpieza del fixture de integración de CU-REP-01. Borra SOLO lo identificado por correos, boleta y
// nombres exclusivos de seed-reportes-rep01.constants.js, incluidos los datos que las pruebas
// posteriores hayan creado sobre esos usuarios (reportes, revisiones, documentos, notificaciones, sesiones).
//
// USO:
//   docker compose exec backend node backend/src/modules/reportes/seed/limpiar-seed-reportes-rep01.js

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const C = require('./seed-reportes-rep01.constants');

async function localizarFixture() {
  const usuarios = await prisma.usuario.findMany({
    where: { correo_institucional: { in: C.CORREOS } },
    select: { id: true, correo_institucional: true },
  });
  const usuarioIds = usuarios.map((u) => u.id);

  const alumno = await prisma.alumno.findUnique({ where: { boleta: C.BOLETA }, select: { boleta: true, usuario_id: true } });
  if (alumno && !usuarioIds.includes(alumno.usuario_id)) {
    throw new Error(`La boleta ${C.BOLETA} pertenece a un usuario que no es del fixture. No se borró nada.`);
  }

  const [solicitud, ofertas, eventos] = await Promise.all([
    alumno ? prisma.solicitud_registro.findUnique({ where: { alumno_id: C.BOLETA }, select: { id: true } }) : null,
    prisma.oferta_servicio.findMany({ where: { nombre_proyecto: C.OFERTA.nombreProyecto }, select: { id: true } }),
    prisma.evento_calendario.findMany({ where: { nombre: { in: C.NOMBRES_EVENTOS } }, select: { id: true } }),
  ]);
  const ofertaIds = ofertas.map((o) => o.id);
  const eventoIds = eventos.map((e) => e.id);
  const periodos = await prisma.periodo_registro.findMany({ where: { evento_calendario_id: { in: eventoIds } }, select: { id: true } });
  const periodoIds = periodos.map((p) => p.id);

  // El SetNull de las FK dejaría a otros alumnos sin oferta/periodo: si los hay, se aborta.
  const ajenas = await prisma.solicitud_registro.count({
    where: {
      alumno_id: { not: C.BOLETA },
      OR: [{ oferta_id: { in: ofertaIds } }, { periodo_registro_id: { in: periodoIds } }],
    },
  });
  if (ajenas > 0) {
    throw new Error(`${ajenas} solicitud(es) de otros alumnos usan la oferta o el periodo del fixture. No se borró nada.`);
  }

  return { usuarios, usuarioIds, alumno, solicitudId: solicitud?.id ?? null, ofertaIds, eventoIds, periodoIds };
}

// Orden seguro de FK: hojas primero, usuarios al final.
async function borrar(tx, f) {
  const conteos = [];
  const paso = async (tabla, operacion) => {
    const { count } = await operacion;
    conteos.push([tabla, count]);
  };

  const reportes = f.solicitudId ? { reporte_mensual: { solicitud_registro_id: f.solicitudId } } : null;
  const revisiones = [...(reportes ? [reportes] : []), { usuario_id: { in: f.usuarioIds } }];

  await paso('revision_reporte_mensual', tx.revision_reporte_mensual.deleteMany({ where: { OR: revisiones } }));
  await paso('reporte_mensual', tx.reporte_mensual.deleteMany({ where: { solicitud_registro_id: f.solicitudId ?? -1 } }));
  await paso('documento', tx.documento.deleteMany({ where: { alumno_id: C.BOLETA } }));
  await paso('notificacion', tx.notificacion.deleteMany({ where: { usuario_id: { in: f.usuarioIds } } }));
  await paso('inicio_sesion', tx.inicio_sesion.deleteMany({ where: { usuario_id: { in: f.usuarioIds } } }));
  await paso('registro_bitacora_actividades', tx.registro_bitacora_actividades.deleteMany({
    where: { bitacora: { solicitud_registro_id: f.solicitudId ?? -1 } },
  }));
  await paso('bitacora', tx.bitacora.deleteMany({ where: { solicitud_registro_id: f.solicitudId ?? -1 } }));
  await paso('actividad', tx.actividad.deleteMany({ where: { solicitud_registro_id: f.solicitudId ?? -1 } }));
  await paso('cumulo_horas_y_faltas', tx.cumulo_horas_y_faltas.deleteMany({ where: { alumno_id: C.BOLETA } }));
  await paso('solicitud_registro', tx.solicitud_registro.deleteMany({ where: { alumno_id: C.BOLETA } }));
  await paso('alumno', tx.alumno.deleteMany({ where: { boleta: C.BOLETA } }));
  await paso('deseo_de_carrera', tx.deseo_de_carrera.deleteMany({ where: { oferta_id: { in: f.ofertaIds } } }));
  await paso('oferta_servicio', tx.oferta_servicio.deleteMany({ where: { id: { in: f.ofertaIds } } }));
  await paso('periodo_registro', tx.periodo_registro.deleteMany({ where: { id: { in: f.periodoIds } } }));
  await paso('evento_calendario', tx.evento_calendario.deleteMany({ where: { id: { in: f.eventoIds } } }));
  await paso('profesor', tx.profesor.deleteMany({ where: { usuario_id: { in: f.usuarioIds }, cubiculo: C.PERFIL_PROFESOR.cubiculo } }));
  await paso('coordinador', tx.coordinador.deleteMany({ where: { usuario_id: { in: f.usuarioIds } } }));
  await paso('usuario', tx.usuario.deleteMany({ where: { id: { in: f.usuarioIds } } }));

  return conteos;
}

// Solo se borran los archivos que citan filas de documento del alumno del fixture, y solo dentro de
// su carpeta. Todavía no existe otra forma segura de atribuir archivos físicos a este fixture:
// los que no estén referenciados en BD no se tocan; se avisan.
function borrarArchivosDelFixture(rutasArchivo) {
  const carpeta = path.resolve(C.RUTA_BASE_DOCUMENTOS, C.BOLETA);
  let borrados = 0;

  for (const ruta of rutasArchivo) {
    const destino = path.resolve(C.RUTA_BASE_DOCUMENTOS, ruta);
    if (!destino.startsWith(carpeta + path.sep)) {
      console.warn(`  ! Se omite "${ruta}": queda fuera de ${carpeta}.`);
      continue;
    }
    try {
      fs.unlinkSync(destino);
      borrados++;
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`  ! No se pudo borrar "${ruta}": ${err.message}`);
    }
  }

  try {
    fs.rmdirSync(carpeta); // solo funciona si quedó vacía
  } catch (err) {
    if (err.code === 'ENOTEMPTY') {
      console.warn(`  ! ${carpeta} conserva archivos que ningún documento del fixture referencia; revísalos a mano:`);
      fs.readdirSync(carpeta).forEach((archivo) => console.warn(`      ${archivo}`));
    } else if (err.code !== 'ENOENT') {
      console.warn(`  ! No se pudo quitar la carpeta: ${err.message}`);
    }
  }
  return borrados;
}

async function main() {
  const fixture = await localizarFixture();
  const hayAlgo = fixture.usuarioIds.length > 0 || fixture.alumno || fixture.ofertaIds.length > 0 || fixture.eventoIds.length > 0;
  if (!hayAlgo) {
    console.log(`\nNo hay datos del fixture ${C.PREFIJO}. No se borró nada.\n`);
    return;
  }

  const documentos = await prisma.documento.findMany({ where: { alumno_id: C.BOLETA }, select: { ruta_archivo: true } });
  const conteos = await prisma.$transaction((tx) => borrar(tx, fixture), { timeout: 60000, maxWait: 10000 });

  console.log(`\nFixture ${C.PREFIJO} eliminado (orden de borrado):`);
  conteos.forEach(([tabla, n]) => console.log(`  ${String(n).padStart(3)}  ${tabla}`));

  const archivos = borrarArchivosDelFixture(documentos.map((d) => d.ruta_archivo));
  console.log(`  archivos físicos borrados: ${archivos}\n`);
}

main()
  .catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
