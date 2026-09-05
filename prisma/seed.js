const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("../generated/prisma");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Sembrando datos...");

  // --- 1. Catálogo de carreras ---
  const carrerasData = ["ISC", "LCD", "IIA"];
  for (const nombre of carrerasData) {
    await prisma.carrera.upsert({
      where: { id: carrerasData.indexOf(nombre) + 1 },
      update: {},
      create: { nombre },
    });
  }
  const carreras = await prisma.carrera.findMany();
  const ISC = carreras.find((c) => c.nombre === "ISC");
  const LCD = carreras.find((c) => c.nombre === "LCD");

  // --- 2. Catálogo de características (los 4 del schema, según lo acordado) ---
  const caracteristicasData = [
    { nombre: "Presidente_de_academia", incremento_cupos: 2 },
    { nombre: "Coordinador", incremento_cupos: 2 },
    { nombre: "Jefe_de_departamento", incremento_cupos: 3 },
    { nombre: "Investigador", incremento_cupos: 0 }, // "cupos extra bajo solicitud", no es fijo
  ];
  for (const c of caracteristicasData) {
    const existe = await prisma.caracteristica.findFirst({ where: { nombre: c.nombre } });
    if (!existe) await prisma.caracteristica.create({ data: c });
  }
  const caracteristicaInvestigador = await prisma.caracteristica.findFirst({
    where: { nombre: "Investigador" },
  });

  // --- 3. Periodo escolar activo (varios CU lo requieren como precondición) ---
  let coordinadorTemp = await prisma.coordinador.findFirst();
  if (!coordinadorTemp) {
    const usuarioCoord = await prisma.usuario.create({
      data: {
        rol: "coordinador",
        correo_institucional: "coordinador.ss@ipn.mx",
        nombre: "Laura",
        apellidos: "Hernández Ríos",
        contrasena: "temporal", // TODO: hashear cuando exista el flujo de creación real de usuarios
        fecha_creacion: new Date(),
        rubrica_fecha_registro: new Date(),
      },
    });
    coordinadorTemp = await prisma.coordinador.create({
      data: { usuario_id: usuarioCoord.id },
    });
  }

  let evento = await prisma.evento_calendario.findFirst({ where: { tipo: "Periodo" } });
  if (!evento) {
    evento = await prisma.evento_calendario.create({
      data: {
        coordinador_id: coordinadorTemp.id,
        nombre: "Periodo 2026-B",
        tipo: "Periodo",
        fecha_inicio: new Date("2026-08-01"),
        fecha_fin: new Date("2026-12-15"),
      },
    });
  }
  let periodo = await prisma.periodo_registro.findFirst();
  if (!periodo) {
    periodo = await prisma.periodo_registro.create({
      data: {
        evento_calendario_id: evento.id,
        anio: "2026",
        semestre: "s02",
        fecha_max_expediente: new Date("2026-09-30"),
      },
    });
  }

  // --- 4. Profesores (helper para no repetir el patrón usuario+profesor) ---
  async function crearProfesorSiNoExiste(correo, nombre, apellidos, cupos_totales) {
    const existeUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
    if (existeUsuario) {
      return prisma.profesor.findUnique({ where: { usuario_id: existeUsuario.id } });
    }
    const usuario = await prisma.usuario.create({
      data: {
        rol: "profesor",
        correo_institucional: correo,
        nombre,
        apellidos,
        contrasena: "temporal",
        fecha_creacion: new Date(),
        rubrica_fecha_registro: new Date(),
      },
    });
    return prisma.profesor.create({
      data: {
        usuario_id: usuario.id,
        departamento: "Ingeniería en Sistemas Computacionales",
        telefono_personal: "5512345678",
        horario_atencion: "Lunes a viernes 10:00-12:00",
        cubiculo: "Edificio 3, cubículo 5",
        cupos_totales,
      },
    });
  }

  const profTorres = await crearProfesorSiNoExiste("torres.vega@ipn.mx", "Carlos", "Torres Vega", 3);
  const profRamirez = await crearProfesorSiNoExiste("ramirez.gutierrez@ipn.mx", "Ana", "Ramírez Gutiérrez", 2);
  const profMendoza = await crearProfesorSiNoExiste("mendoza.flores@ipn.mx", "Jorge", "Mendoza Flores", 3);

  // Marcar a Ramírez Gutiérrez como Investigador aprobada
  const yaTieneCaracteristica = await prisma.solicitud_caracteristica.findFirst({
    where: { profesor_id: profRamirez.id, caracteristica_id: caracteristicaInvestigador.id },
  });
  if (!yaTieneCaracteristica) {
    await prisma.solicitud_caracteristica.create({
      data: {
        profesor_id: profRamirez.id,
        caracteristica_id: caracteristicaInvestigador.id,
        justificacion: "Proyecto de investigación registrado ante SIP.",
        estado: "aprobada",
        fecha: new Date(),
        fecha_respuesta: new Date(),
      },
    });
  }

  // --- 5. Ofertas (helper) ---
  async function crearOfertaSiNoExiste(nombre_proyecto, resto) {
    const existe = await prisma.oferta_servicio.findFirst({ where: { nombre_proyecto } });
    if (existe) return existe;
    return prisma.oferta_servicio.create({ data: { nombre_proyecto, ...resto } });
  }

  const ofertaTorresIndividual = await crearOfertaSiNoExiste("Sistema de biblioteca digital", {
    profesor_id: profTorres.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Desarrollo de sistema de biblioteca digital",
    tipo_oferta: "individual",
    descripcion_actividades: "Desarrollo y pruebas del módulo de préstamos.",
    cupos_disponibles: 1,
    estado_oferta: "aprobada",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: ISC.id }] },
  });

  await crearOfertaSiNoExiste("Portal de trámites escolares", {
    profesor_id: profTorres.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Portal de trámites escolares en línea",
    tipo_oferta: "proyecto",
    descripcion_actividades: "Módulo de solicitud de constancias en línea.",
    cupos_ofertados: 2,
    cupos_disponibles: 2,
    estado_oferta: "pendiente_revision",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: ISC.id }, { carrera_id: LCD.id }] },
  });

  // Dos ofertas individuales aprobadas de Ramírez, consumiendo sus 2 cupos normales
  await crearOfertaSiNoExiste("Análisis de datos de laboratorio A", {
    profesor_id: profRamirez.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Análisis de datos de laboratorio A",
    tipo_oferta: "individual",
    descripcion_actividades: "Procesamiento de datos experimentales.",
    cupos_disponibles: 1,
    estado_oferta: "aprobada",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: LCD.id }] },
  });
  await crearOfertaSiNoExiste("Análisis de datos de laboratorio B", {
    profesor_id: profRamirez.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Análisis de datos de laboratorio B",
    tipo_oferta: "individual",
    descripcion_actividades: "Procesamiento de datos experimentales.",
    cupos_disponibles: 1,
    estado_oferta: "aprobada",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: LCD.id }] },
  });
  // Su proyecto de investigador, registrado con cupos en 0 (excepción RN-PRO-06)
  await crearOfertaSiNoExiste("Modelo predictivo de deserción escolar", {
    profesor_id: profRamirez.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Modelo predictivo de deserción escolar",
    tipo_oferta: "proyecto",
    descripcion_actividades: "Entrenamiento de modelo con datos históricos.",
    cupos_ofertados: 2,
    cupos_investigador: 2,
    cupos_disponibles: 2,
    estado_oferta: "aprobada",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: ISC.id }] },
  });

  await crearOfertaSiNoExiste("App de control de asistencia", {
    profesor_id: profMendoza.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Aplicación de control de asistencia",
    tipo_oferta: "individual",
    descripcion_actividades: "Desarrollo de app móvil de asistencia.",
    cupos_disponibles: 1,
    estado_oferta: "rechazada",
    motivo_rechazo: "Falta especificar el alcance tecnológico del proyecto.",
    fecha_registro: new Date(),
    deseo_de_carrera: { create: [{ carrera_id: ISC.id }] },
  });
  await crearOfertaSiNoExiste("Sistema de encuestas internas", {
    profesor_id: profMendoza.id,
    coordinador_id: coordinadorTemp.id,
    nombre_SISS: "Sistema de encuestas internas",
    tipo_oferta: "proyecto",
    descripcion_actividades: "Módulo de encuestas para el departamento.",
    cupos_ofertados: 3,
    cupos_disponibles: 0,
    estado_oferta: "concluida",
    fecha_registro: new Date("2026-02-01"),
    deseo_de_carrera: { create: [{ carrera_id: LCD.id }, { carrera_id: ISC.id }] },
  });

  // --- 6. Alumno con servicio activo, inscrito en la oferta individual de Torres ---
  let alumnoUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: "juan.perez@alumno.ipn.mx" } });
  if (!alumnoUsuario) {
    alumnoUsuario = await prisma.usuario.create({
      data: {
        rol: "alumno",
        correo_institucional: "juan.perez@alumno.ipn.mx",
        nombre: "Juan",
        apellidos: "Pérez López",
        contrasena: "temporal",
        fecha_creacion: new Date(),
        rubrica_fecha_registro: new Date(),
      },
    });
  }
  let alumno = await prisma.alumno.findUnique({ where: { usuario_id: alumnoUsuario.id } });
  if (!alumno) {
    alumno = await prisma.alumno.create({
      data: {
        boleta: "2021630001",
        usuario_id: alumnoUsuario.id,
        celular: "5598765432",
        carrera: "ISC",
        creditos: 90,
        semestre: 7,
      },
    });
  }

  const yaTieneSolicitud = await prisma.solicitud_registro.findUnique({ where: { alumno_id: alumno.boleta } });
  if (!yaTieneSolicitud) {
    await prisma.solicitud_registro.create({
      data: {
        alumno_id: alumno.boleta,
        carrera_id: ISC.id,
        periodo_registro_id: periodo.id,
        oferta_id: ofertaTorresIndividual.id,
        motivacion_oferta: "Interés en desarrollo backend y bases de datos.",
        estado_solicitud: "activo",
        estado_anterior: "activo",
        fecha_aplicacion: new Date(),
        registro_siss: true,
        docs_iniciales: true,
        carta_compromiso: true,
        expediente: true,
      },
    });
  }

  console.log("Seed completado sin errores.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });