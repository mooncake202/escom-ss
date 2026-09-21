// Seed de integración de CU-REP-01 (Reportes). FIXTURE HISTÓRICO, NO un periodo oficial real.
//
// Si el fixture ya existe (parcial o completo) aborta sin escribir: primero corre
// limpiar-seed-reportes-rep01.js.


const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');
const { calcularDiaMexicoUTC } = require('../../../lib/fechas');
const { normalizarFechaISO } = require('../reportes.periodos');
const C = require('./seed-reportes-rep01.constants');

// Cualquier rastro del fixture (por correo, boleta o nombre exclusivo) impide sembrar.
async function detectarExistentes() {
  const [usuarios, alumno, eventos, ofertas, profesores] = await Promise.all([
    prisma.usuario.findMany({ where: { correo_institucional: { in: C.CORREOS } }, select: { correo_institucional: true } }),
    prisma.alumno.findUnique({ where: { boleta: C.BOLETA }, select: { boleta: true } }),
    prisma.evento_calendario.findMany({ where: { nombre: { in: C.NOMBRES_EVENTOS } }, select: { nombre: true } }),
    prisma.oferta_servicio.findMany({ where: { nombre_proyecto: C.OFERTA.nombreProyecto }, select: { id: true } }),
    prisma.profesor.findMany({ where: { cubiculo: C.PERFIL_PROFESOR.cubiculo }, select: { id: true } }),
  ]);

  return [
    ...usuarios.map((u) => `usuario ${u.correo_institucional}`),
    ...(alumno ? [`alumno con boleta ${alumno.boleta}`] : []),
    ...eventos.map((e) => `evento_calendario "${e.nombre}"`),
    ...ofertas.map((o) => `oferta_servicio id=${o.id}`),
    ...profesores.map((p) => `profesor id=${p.id} (cubículo ${C.PERFIL_PROFESOR.cubiculo})`),
  ];
}

async function sembrar(tx, { carrera, hash, ahora, hoy }) {
  const crearUsuario = (u) => tx.usuario.create({
    data: {
      rol: u.rol,
      correo_institucional: u.correo,
      contrasena: hash,
      nombre: u.nombre,
      apellidos: u.apellidos,
      intentos_fallidos: 0,
      cuenta_bloqueada: false,
      fecha_creacion: ahora,
    },
  });

  const usuarioCoordinador = await crearUsuario(C.USUARIOS.coordinador);
  const usuarioProfesor = await crearUsuario(C.USUARIOS.profesor);
  const usuarioAlumno = await crearUsuario(C.USUARIOS.alumno);

  const coordinador = await tx.coordinador.create({ data: { usuario_id: usuarioCoordinador.id } });
  const profesor = await tx.profesor.create({ data: { usuario_id: usuarioProfesor.id, ...C.PERFIL_PROFESOR } });
  const alumno = await tx.alumno.create({
    data: { boleta: C.BOLETA, usuario_id: usuarioAlumno.id, carrera: C.CARRERA_CODIGO, ...C.PERFIL_ALUMNO },
  });

  const crearEvento = (e) => tx.evento_calendario.create({
    data: {
      coordinador_id: coordinador.id,
      nombre: e.nombre,
      tipo: e.tipo,
      fecha_inicio: C.fechaUTC(e.fechaInicio),
      fecha_fin: e.fechaFin ? C.fechaUTC(e.fechaFin) : null,
    },
  });
  const eventoPeriodo = await crearEvento(C.EVENTOS.periodo);
  await crearEvento(C.EVENTOS.inhabil);
  await crearEvento(C.EVENTOS.vacacional);

  const periodo = await tx.periodo_registro.create({
    data: {
      evento_calendario_id: eventoPeriodo.id,
      anio: C.PERIODO_REGISTRO.anio,
      semestre: C.PERIODO_REGISTRO.semestre,
      fecha_max_expediente: C.fechaUTC(C.PERIODO_REGISTRO.fechaMaxExpediente),
    },
  });

  const oferta = await tx.oferta_servicio.create({
    data: {
      profesor_id: profesor.id,
      coordinador_id: coordinador.id,
      nombre_SISS: C.OFERTA.nombreSISS,
      programa_SISS: C.OFERTA.programaSISS,
      nombre_proyecto: C.OFERTA.nombreProyecto,
      tipo_oferta: 'proyecto',
      descripcion_actividades: C.OFERTA.descripcion,
      cupos_ofertados: C.OFERTA.cuposOfertados,
      cupos_disponibles: C.OFERTA.cuposDisponibles,
      estado_oferta: C.OFERTA.estadoOferta,
      fecha_registro: C.instanteUTC(C.OFERTA.fechaRegistro),
    },
  });
  await tx.deseo_de_carrera.create({ data: { oferta_id: oferta.id, carrera_id: carrera.id } });

  const solicitud = await tx.solicitud_registro.create({
    data: {
      alumno_id: alumno.boleta,
      carrera_id: carrera.id,
      periodo_registro_id: periodo.id,
      oferta_id: oferta.id,
      motivacion_oferta: C.SOLICITUD.motivacion,
      estado_solicitud: C.SOLICITUD.estadoSolicitud,
      estado_anterior: C.SOLICITUD.estadoAnterior,
      fecha_aplicacion: C.instanteUTC(C.SOLICITUD.fechaAplicacion),
      registro_siss: true,
      docs_iniciales: true,
      carta_compromiso: true,
      fecha_carta_compromiso: C.instanteUTC(C.SOLICITUD.fechaCartaCompromiso),
      expediente: true,
    },
  });

  const crearActividad = (a) => tx.actividad.create({
    data: {
      solicitud_registro_id: solicitud.id,
      titulo: a.titulo,
      descripcion: a.descripcion,
      entregable_esperado: a.entregable,
      fecha_limite: C.fechaUTC(a.fechaLimite),
      estado: a.estado,
      fecha_asignacion: C.instanteUTC(a.fechaAsignacion),
      porcentaje_progreso: a.porcentajeProgreso,
    },
  });
  const actividadAnalisis = await crearActividad(C.ACTIVIDADES.analisis);
  await crearActividad(C.ACTIVIDADES.diseno);

  for (const b of C.BITACORAS) {
    const creada = await tx.bitacora.create({
      data: {
        solicitud_registro_id: solicitud.id,
        hora_inicio: C.instanteUTC(b.horaInicio),
        hora_fin: C.instanteUTC(b.horaFin),
        horas_contabilizadas: b.horas,
        estado: b.estado,
        fecha_registro: C.fechaUTC(b.fecha),
        motivo_rechazo: b.motivoRechazo ?? null,
        fecha_revision: b.revision ? C.instanteUTC(b.revision) : null,
        revisado_por_id: b.revision ? profesor.id : null,
      },
    });
    await tx.registro_bitacora_actividades.create({
      data: {
        bitacora_id: creada.id,
        actividad_id: actividadAnalisis.id,
        descripcion: b.descripcion,
        porcentaje_avance_registrado: b.avance,
        evidencia: b.evidencia,
      },
    });
  }

  // fecha_ultima_evaluacion_faltas = hoy (México): sin esto el cron de AH cobraría faltas históricas.
  await tx.cumulo_horas_y_faltas.create({
    data: {
      alumno_id: alumno.boleta,
      horas_acumuladas: C.CUMULO.horasAcumuladas,
      horas_rechazadas: C.CUMULO.horasRechazadas,
      faltas_acumuladas: 0,
      faltas_consecutivas: 0,
      fecha_ultima_evaluacion_faltas: hoy,
    },
  });

  return { solicitudId: solicitud.id, periodoId: periodo.id, ofertaId: oferta.id };
}

async function main() {
  const hoy = calcularDiaMexicoUTC();
  const periodo = C.verificarConsistenciaFixture(normalizarFechaISO(hoy));

  const carrera = await prisma.carrera.findFirst({ where: { nombre: C.CARRERA_CODIGO } });
  if (!carrera) {
    throw new Error(`No existe la carrera ${C.CARRERA_CODIGO} en la tabla carrera. El seed no la crea: cárgala antes. No se insertó nada.`);
  }

  const existentes = await detectarExistentes();
  if (existentes.length > 0) {
    throw new Error(
      `El fixture ${C.PREFIJO} ya existe (parcial o completo):\n  - ${existentes.join('\n  - ')}\n` +
      'No se insertó nada. Ejecuta primero limpiar-seed-reportes-rep01.js.',
    );
  }

  const hash = await bcrypt.hash(C.PASSWORD_PLANO, 10);
  const ahora = new Date();
  const ids = await prisma.$transaction((tx) => sembrar(tx, { carrera, hash, ahora, hoy }), { timeout: 60000, maxWait: 10000 });

  console.log(`\nFixture ${C.PREFIJO} creado (FIXTURE HISTÓRICO DE INTEGRACIÓN, no es un periodo oficial).`);
  console.log(`  usuarios: 3 | alumno: ${C.BOLETA} | oferta id=${ids.ofertaId} | solicitud id=${ids.solicitudId} | periodo_registro id=${ids.periodoId}`);
  console.log(`  eventos: 3 | actividades: 2 | bitácoras: ${C.BITACORAS.length} | registros de avance: ${C.BITACORAS.length} | cúmulo: 1`);
  console.log(`  cúmulo: ${C.CUMULO.horasAcumuladas} h acumuladas, ${C.CUMULO.horasRechazadas} h rechazadas, faltas evaluadas hasta ${normalizarFechaISO(hoy)}`);
  console.log(`\nLogin alumno: ${C.USUARIOS.alumno.correo} / ${C.PASSWORD_PLANO}`);
  console.log(`Reporte #1 esperado: ${periodo.inicio} → ${periodo.fin} (${periodo.esquema}), ${C.ESPERADO_REPORTE_1.diasLaborados} días, ${C.ESPERADO_REPORTE_1.horas} h`);
  console.log('Al terminar las pruebas: limpiar-seed-reportes-rep01.js (mientras exista, AH acumulará faltas nocturnas).\n');
}

main()
  .catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
