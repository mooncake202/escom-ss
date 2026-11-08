// seed-demo-ah.js
//
// Crea cuentas de demo para el módulo de Actividades y Horas, reutilizando
// el profesor/oferta dedicados que dejó seed-maestro-gr.js (GR). Cada
// alumno se crea DIRECTO como alumno_asignado (mismo patrón atómico de
// gr-coordinador.service.js: usuario.rol + solicitud_registro.estado_solicitud
// juntos), sin pasar por el flujo completo de GR, porque el objetivo aquí
// es demostrar AH, no GR. La actividad se asigna con la función real del
// servicio (crearActividad); la bitácora pendiente de revisión se inserta
// directo (no hay forma realista de simular 4 horas reales transcurridas
// en un seed).
//
// Requiere que seed-maestro-gr.js ya se haya corrido antes (usa su profesor
// y su oferta B dedicados).

const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');
const ahProfesorService = require('../ah-profesor.service');

const PASSWORD_PLANO = '12345678';
const CARRERA_NOMBRE = 'ISC';

const PROFESOR_CORREO = 'profesor.seedmaestrogr@ipn.mx';
const OFERTA_B_NOMBRE = '[SEED-MAESTRO-GR] Oferta general';

const ALUMNOS = [
  { n: 1, nombre: 'ANDREA', apellido: 'AH INICIO', conActividad: false },
  { n: 2, nombre: 'LUIS', apellido: 'AH BITACORA APROBAR', conActividad: true, bitacora: 'pendiente' },
  { n: 3, nombre: 'KAREN', apellido: 'AH BITACORA RECHAZAR', conActividad: true, bitacora: 'pendiente' },
  { n: 4, nombre: 'DIEGO', apellido: 'AH SIN ACTIVIDADES', conActividad: false },
];

function boletaDe(n) {
  return `2099` + `64` + String(n).padStart(4, '0');
}
function correoDe(n) {
  return `seedah${String(n).padStart(4, '0')}@alumno.ipn.mx`;
}

async function crearAlumnoAsignadoDirecto({ n, nombre, apellido, ofertaId, carreraId, periodoId }) {
  const boleta = boletaDe(n);
  const correo = correoDe(n);
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
  if (existente) {
    console.log(`↷ ${correo} ya existe — se omite creación.`);
    const alumno = await prisma.alumno.findUnique({ where: { usuario_id: existente.id }, include: { solicitud_registro: true } });
    return { usuarioId: existente.id, solicitudId: alumno.solicitud_registro.id, boleta: alumno.boleta, correo };
  }

  const { usuarioId, solicitudId } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: {
        rol: 'alumno_asignado',
        correo_institucional: correo,
        nombre,
        apellidos: apellido,
        contrasena: hash,
        fecha_creacion: ahora,
      },
    });
    await tx.alumno.create({
      data: {
        boleta,
        usuario_id: usuarioCreado.id,
        celular: `56${String(n).padStart(8, '0')}`,
        carrera: CARRERA_NOMBRE,
        creditos: '85.00',
        semestre: 8,
        correo_personal: `${correo.split('@')[0]}.personal@gmail.com`,
      },
    });
    const solicitudCreada = await tx.solicitud_registro.create({
      data: {
        alumno_id: boleta,
        carrera_id: carreraId,
        dictamen: null,
        periodo_registro_id: periodoId,
        oferta_id: ofertaId,
        motivacion_oferta: `Motivación de prueba (seed-demo-ah) para el alumno ${boleta}.`,
        estado_solicitud: 'alumno_asignado',
        estado_anterior: 'expediente_pendiente_revision',
        fecha_aplicacion: ahora,
      },
    });
    await tx.cumulo_horas_y_faltas.create({
      data: { alumno_id: boleta, horas_acumuladas: 0, horas_rechazadas: 0, faltas_acumuladas: 0, faltas_consecutivas: 0 },
    });
    return { usuarioId: usuarioCreado.id, solicitudId: solicitudCreada.id };
  });

  console.log(`✅ Creado alumno_asignado directo: ${boleta} / ${correo}`);
  return { usuarioId, solicitudId, boleta, correo };
}

function proximoDiaHabil(diasAdelante) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diasAdelante);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function diaHabilDesde(fechaBase, diasAdelante) {
  const d = new Date(fechaBase);
  d.setUTCHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diasAdelante);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

async function main() {
  const profesorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESOR_CORREO } });
  if (!profesorUsuario) {
    console.error(`❌ No existe el profesor ${PROFESOR_CORREO}. Corre primero seed-maestro-gr.js.`);
    process.exit(1);
  }
  const oferta = await prisma.oferta_servicio.findFirst({ where: { nombre_proyecto: OFERTA_B_NOMBRE } });
  if (!oferta) {
    console.error(`❌ No existe la oferta "${OFERTA_B_NOMBRE}". Corre primero seed-maestro-gr.js.`);
    process.exit(1);
  }
  const carrera = await prisma.carrera.findFirst({ where: { nombre: CARRERA_NOMBRE } });

  const resultados = [];
  for (const cfg of ALUMNOS) {
    const alumno = await crearAlumnoAsignadoDirecto({
      n: cfg.n, nombre: cfg.nombre, apellido: cfg.apellido,
      ofertaId: oferta.id, carreraId: carrera.id, periodoId: oferta ? (await prisma.solicitud_registro.findFirst({ where: { oferta_id: oferta.id }, select: { periodo_registro_id: true } }))?.periodo_registro_id : null,
    });

    if (cfg.conActividad) {
      const solicitudConPeriodo = await prisma.solicitud_registro.findUnique({
        where: { id: alumno.solicitudId },
        include: { periodo_registro: { include: { evento_calendario: true } } },
      });
      const fechaInicioPeriodo = solicitudConPeriodo.periodo_registro.evento_calendario.fecha_inicio;
      const actividad = await ahProfesorService.crearActividad(profesorUsuario.id, alumno.solicitudId, {
        titulo: 'Actividad de prueba (demo)',
        descripcion: 'Actividad generada para la demostración del módulo de Actividades y Horas.',
        entregable_esperado: 'Reporte de avance de la actividad.',
        fecha_limite: diaHabilDesde(fechaInicioPeriodo, 10).toISOString().slice(0, 10),
      });
      console.log(`  ✅ Actividad asignada (id=${actividad.id}) a ${alumno.boleta}`);

      if (cfg.bitacora === 'pendiente') {
        const fecha = proximoDiaHabil(-1); // ayer hábil, para que no choque con "hoy" si se usa el sistema en vivo después
        const horaInicio = new Date(fecha); horaInicio.setUTCHours(9, 0, 0, 0);
        const horaFin = new Date(fecha); horaFin.setUTCHours(13, 0, 0, 0);
        const bitacora = await prisma.bitacora.create({
          data: {
            solicitud_registro_id: alumno.solicitudId,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            horas_contabilizadas: 4,
            estado: 'pendiente_revision',
            fecha_registro: fecha,
            fecha_revision: null,
          },
        });
        console.log(`  ✅ Bitácora pendiente de revisión creada (id=${bitacora.id})`);
      }
    }
    resultados.push({ ...alumno, apellido: cfg.apellido });
  }

  console.log('\n📋 Reporte final — seed-demo-ah');
  console.log(`   Contraseña de todos: ${PASSWORD_PLANO}\n`);
  resultados.forEach((r) => console.log(`${r.boleta} | ${r.correo} | ${r.apellido}`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error en seed-demo-ah:', e);
  process.exit(1);
});
