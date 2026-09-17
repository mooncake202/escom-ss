// seed-demo-registro.js
//
// Seed PERSISTENTE (sin script de borrado hermano — se queda para siempre,
// mismo criterio que seed-maestro-gr.js, hasta que se borre a mano) para
// tener profesores/ofertas de demostración REALES sobre los que un alumno
// se registre EN VIVO desde el navegador (CU-GR-01), mostrando de paso la
// lógica de cupos por profesor en acción.
//
// Este script SOLO crea profesor(es) y oferta(s) — ningún alumno: el
// registro de alumnos se hace en vivo durante la demo. Reutiliza el
// coordinador ya existente coordinador.test@ipn.mx (de seed-test-users.js)
// como dueño de las ofertas, en vez de crear uno nuevo — el coordinador
// nunca es visible en el flujo de GR-01 ni en el de aceptación del profesor.
//
// Requisitos antes de correr:
//   - Debe existir ya la característica "Investigador" en el catálogo
//     (correr antes backend/src/lib/seedCaracteristicas.js).
//   - Debe existir ya coordinador.test@ipn.mx (correr antes
//     backend/src/lib/seed-test-users.js si no existe).
//
// Idempotencia: si cualquiera de los 2 correos de profesor ya existe, el
// script aborta con mensaje claro antes de tocar nada (mismo patrón que
// seed-test-users.js / seed-maestro-gr.js).
//
// Cómo correr (dentro del contenedor del backend):
//   docker compose exec backend node backend/src/modules/gr/seeds/seed-demo-registro.js

const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');

const PASSWORD_PLANO = '12345678';
const CORREO_COORDINADOR_REUTILIZADO = 'coordinador.test@ipn.mx';

const PROFESOR_DEMO_1 = {
  correo_institucional: 'profesor.demo1@ipn.mx',
  nombre: 'Profesor',
  apellidos: 'Demo Uno',
  departamento: 'Computación',
  telefono_personal: '5510000001',
  horario_atencion: 'Lunes a viernes 10:00-12:00',
  cubiculo: 'ESCOM-201',
  cupos_totales: 3,
};

const PROFESOR_DEMO_2 = {
  correo_institucional: 'profesor.demo2@ipn.mx',
  nombre: 'Profesor',
  apellidos: 'Demo Dos',
  departamento: 'Computación',
  telefono_personal: '5510000002',
  horario_atencion: 'Lunes a viernes 12:00-14:00',
  cubiculo: 'ESCOM-202',
  cupos_totales: 3,
};

const OFERTA_1 = {
  nombre_proyecto: 'Desarrollo de Sistema de Gestión Bibliotecaria',
  nombre_SISS: 'Desarrollo de Sistema de Gestión Bibliotecaria',
  programa_SISS: 'Programa de Modernización de Bibliotecas ESCOM',
  tipo_oferta: 'individual',
  descripcion_actividades: 'Desarrollo y mantenimiento de un sistema web para la gestión del acervo, préstamos y devoluciones de la biblioteca escolar.',
  // Individual = un solo lugar, por definición — nunca más de 1 cupo.
  cupos_ofertados: 1,
  cupos_investigador: null,
  cupos_disponibles: 1,
};

const OFERTA_2A = {
  nombre_proyecto: 'Soporte Técnico y Mantenimiento de Equipo de Cómputo',
  nombre_SISS: 'Soporte Técnico y Mantenimiento de Equipo de Cómputo',
  programa_SISS: 'Programa de Soporte a Laboratorios ESCOM',
  tipo_oferta: 'individual',
  descripcion_actividades: 'Diagnóstico, mantenimiento preventivo/correctivo y soporte técnico al equipo de cómputo de los laboratorios de la escuela.',
  cupos_ofertados: 1,
  cupos_investigador: null,
  cupos_disponibles: 1,
};

const OFERTA_2B = {
  nombre_proyecto: 'Plataforma de Análisis de Datos Académicos para ESCOM',
  nombre_SISS: 'Plataforma de Análisis de Datos Académicos para ESCOM',
  programa_SISS: 'Programa de Analítica Institucional ESCOM',
  tipo_oferta: 'proyecto',
  descripcion_actividades: 'Diseño e implementación de dashboards y reportes de indicadores académicos (deserción, aprobación, egreso) para apoyar decisiones de la dirección.',
  cupos_ofertados: 4,
  cupos_investigador: 4,
  cupos_disponibles: 4,
};

async function main() {
  console.log('🔎 Verificando que los correos de profesor no existan ya...');
  const correosProfesores = [PROFESOR_DEMO_1.correo_institucional, PROFESOR_DEMO_2.correo_institucional];
  const existentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correosProfesores } },
    select: { correo_institucional: true },
  });
  if (existentes.length > 0) {
    throw new Error(
      `Ya existe(n): ${existentes.map((u) => u.correo_institucional).join(', ')}. ` +
      'No se insertó nada. Bórralos primero o ajusta los correos en este script.'
    );
  }

  console.log('🔎 Verificando requisitos previos (característica Investigador, coordinador reutilizado)...');
  const caracteristicaInvestigador = await prisma.caracteristica.findFirst({ where: { nombre: 'Investigador' } });
  if (!caracteristicaInvestigador) {
    throw new Error('No existe la característica Investigador en el catálogo. Corre primero backend/src/lib/seedCaracteristicas.js.');
  }
  const coordinador = await prisma.coordinador.findFirst({
    where: { usuario: { correo_institucional: CORREO_COORDINADOR_REUTILIZADO } },
  });
  if (!coordinador) {
    throw new Error(`No existe el coordinador ${CORREO_COORDINADOR_REUTILIZADO}. Corre primero backend/src/lib/seed-test-users.js.`);
  }

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const resultado = await prisma.$transaction(async (tx) => {
    // ── Profesor Demo 1 — simple, sin Investigador ──────────────────────
    const usuario1 = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_DEMO_1.correo_institucional, contrasena: hash, nombre: PROFESOR_DEMO_1.nombre, apellidos: PROFESOR_DEMO_1.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesor1 = await tx.profesor.create({
      data: {
        usuario_id: usuario1.id, departamento: PROFESOR_DEMO_1.departamento, telefono_personal: PROFESOR_DEMO_1.telefono_personal,
        horario_atencion: PROFESOR_DEMO_1.horario_atencion, cubiculo: PROFESOR_DEMO_1.cubiculo, cupos_totales: PROFESOR_DEMO_1.cupos_totales,
      },
    });
    const oferta1 = await tx.oferta_servicio.create({
      data: { profesor_id: profesor1.id, coordinador_id: coordinador.id, estado_oferta: 'Aprobada', fecha_registro: ahora, ...OFERTA_1 },
    });

    // ── Profesor Demo 2 — con Investigador, 2 ofertas distintas ─────────
    const usuario2 = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_DEMO_2.correo_institucional, contrasena: hash, nombre: PROFESOR_DEMO_2.nombre, apellidos: PROFESOR_DEMO_2.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesor2 = await tx.profesor.create({
      data: {
        usuario_id: usuario2.id, departamento: PROFESOR_DEMO_2.departamento, telefono_personal: PROFESOR_DEMO_2.telefono_personal,
        horario_atencion: PROFESOR_DEMO_2.horario_atencion, cubiculo: PROFESOR_DEMO_2.cubiculo, cupos_totales: PROFESOR_DEMO_2.cupos_totales,
      },
    });
    await tx.solicitud_caracteristica.create({
      data: {
        profesor_id: profesor2.id, caracteristica_id: caracteristicaInvestigador.id,
        justificacion: 'Asignada por seed-demo-registro para demostrar el respaldo de cupos investigador.',
        estado: 'aprobado', fecha: ahora, fecha_respuesta: ahora,
      },
    });
    const oferta2A = await tx.oferta_servicio.create({
      data: { profesor_id: profesor2.id, coordinador_id: coordinador.id, estado_oferta: 'Aprobada', fecha_registro: ahora, ...OFERTA_2A },
    });
    const oferta2B = await tx.oferta_servicio.create({
      data: { profesor_id: profesor2.id, coordinador_id: coordinador.id, estado_oferta: 'Aprobada', fecha_registro: ahora, ...OFERTA_2B },
    });

    return { profesor1, oferta1, profesor2, oferta2A, oferta2B };
  });

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📋 REPORTE — seed-demo-registro (datos PERSISTENTES)');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`\nContraseña de ambos profesores: ${PASSWORD_PLANO}\n`);

  const filas = [
    { profesor: 'Demo 1', correo: PROFESOR_DEMO_1.correo_institucional, cupos: PROFESOR_DEMO_1.cupos_totales, investigador: 'No', oferta: `${OFERTA_1.nombre_proyecto} (individual, ${OFERTA_1.cupos_disponibles} disp.)` },
    { profesor: 'Demo 2', correo: PROFESOR_DEMO_2.correo_institucional, cupos: PROFESOR_DEMO_2.cupos_totales, investigador: 'Sí', oferta: `${OFERTA_2A.nombre_proyecto} (individual, ${OFERTA_2A.cupos_disponibles} disp.)` },
    { profesor: '', correo: '', cupos: '', investigador: '', oferta: `${OFERTA_2B.nombre_proyecto} (proyecto, cupos_investigador=${OFERTA_2B.cupos_investigador}, ${OFERTA_2B.cupos_disponibles} disp.)` },
  ];

  console.log('Profesor | Correo                  | Cupos totales | Investigador | Oferta');
  console.log('---------|-------------------------|---------------|--------------|--------------------------------------------------------------');
  filas.forEach((f) => {
    console.log(`${f.profesor.padEnd(8)} | ${f.correo.padEnd(23)} | ${String(f.cupos).padEnd(13)} | ${f.investigador.padEnd(12)} | ${f.oferta}`);
  });

  console.log(`\nProfesor 1 -> id: ${resultado.profesor1.id} | Oferta 1 -> id: ${resultado.oferta1.id}`);
  console.log(`Profesor 2 -> id: ${resultado.profesor2.id} | Oferta 2A -> id: ${resultado.oferta2A.id} | Oferta 2B -> id: ${resultado.oferta2B.id}`);
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ No se insertó nada.');
    console.error('   Motivo:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
