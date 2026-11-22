// _datos.js — amd-pro-rep (Sol: PRO, REP, ADM)
//
// Lista central de TODO lo que este seed crea o reserva. La usan:
//   - _limpieza.js  → para saber qué carpetas de uploads/ son mías (antes de crearlas)
//   - index.js      → para separar mis filas de las de Karen en la huella
//   - verificar.js  → para revisar mis casos
//
// Convenciones (backend/src/seeds/README.md): sufijos desde 1901 (Karen usa
// 0101–1801), boleta (2018–2022)63NNNN, correo de profesor sin números ni
// puntos, contraseña única JAjaja1818#.

const PASSWORD = 'JAjaja1818#';

const CORREO_COORDINADOR_CREADOR = 'coordinadorherrera@ipn.mx';
const CORREOS_COORDINADORES = ['coordinadorherrera@ipn.mx', 'coordinadorvillagran@ipn.mx'];

// `departamento` debe ser uno de DEPARTAMENTOS_VALIDOS (lib/validators.js).
// `caracteristica`: nombre del enum NombreCaracteristica, o null = profesor de base.
const PROFESORES = {
  P1: {
    clave: 'P1', rolDemo: 'Casos de Reportes (REP)',
    nombre: 'ROBERTO', apellidos: 'LOZANO MEDINA', correo: 'profesorlozano@ipn.mx',
    departamento: 'Sistemas Computacionales', telefono: '5539174826',
    cubiculo: 'ESCOM-201', horario: 'Lunes a viernes 10:00-12:00',
    caracteristica: 'Jefe_de_departamento', cuposEsperados: 6,
  },
  P2: {
    clave: 'P2', rolDemo: 'Casos de Ofertas (PRO)',
    nombre: 'ELENA', apellidos: 'SALINAS CORONA', correo: 'profesorsalinas@ipn.mx',
    departamento: 'Ciencias Básicas', telefono: '5587203615',
    cubiculo: 'ESCOM-202', horario: 'Lunes a viernes 12:00-14:00',
    caracteristica: null, cuposEsperados: 3,
  },
  P3: {
    clave: 'P3', rolDemo: 'Bajas y anuncios (ADM)',
    nombre: 'HÉCTOR', apellidos: 'AGUIRRE BECERRIL', correo: 'profesoraguirre@ipn.mx',
    departamento: 'Inteligencia Artificial', telefono: '5562948307',
    cubiculo: 'ESCOM-203', horario: 'Lunes a viernes 16:00-18:00',
    caracteristica: null, cuposEsperados: 3,
  },
};

// Fecha de alta de mis 3 profesores (decisión de Sol). Ninguna pantalla la
// muestra; solo ordena la lista de usuarios (usuarios.service.js:195). Es
// anterior a la primera oferta (S6, 09-feb). 3-feb (el 2 es festivo).
const FECHA_CREACION_PROFESORES = '2026-02-03T16:00:00.000Z';

// ── Catálogo SISS (front/.../CU-PRO-02-.../DecisionPanel.jsx:7-24) ───────
const PROGRAMA = {
  ISC: 'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL',
  ACADEMICA: 'ESCOM - S.S. PARA APOYO AL AREA ACADÉMICA',
  ADMINISTRATIVA: 'ESCOM - S.S. PARA APOYO AL ÁREA ADMINISTRATIVA',
  CIC: 'ESCOM - S.S. PARA APOYO AL ÁREA DE CIENCIAS E INGENIERÍA DE LA COMPUTACIÓN',
};
const ACTIVIDAD = {
  ISC: 'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES',
  ACADEMICA: 'AYUDAR A LAS NECESIDADES ACADÉMICAS DE LA ESCOM',
  DEPARTAMENTO: 'AYUDAR ACTIVIDADES PROPIAS DEL DEPARTAMENTO',
  ADMINISTRATIVA: 'AYUDAR A LAS NECESIDADES DEL ÁREA ADMINISTRATIVA DE LA ESCOM',
  CIC: 'AYUDAR A LAS NECESIDADES DEL ÁREA DE CIENCIAS E ING. DE LA COMPUTACIÓN EN LA ESCOM',
};

const CORREO_HERRERA = 'coordinadorherrera@ipn.mx';
const CORREO_VILLAGRAN = 'coordinadorvillagran@ipn.mx';

// ── Ofertas (Parte 2) ─────────────────────────────────────────────────────
// Se identifican por profesor + título. `estadoFinal`:
//   pendiente_revision | aprobada | rechazada | cerrada | concluida
// Fechas:
//   - P2: fechas fijas pasadas (`registro`, `decision`, `cierre`/`conclusion`).
//   - P1/P3: `periodoInicio` (periodo oficial que usarán sus alumnos); el
//     registro se calcula 15 días hábiles antes de su fecha_max_expediente y la
//     decisión 2 días hábiles después del registro.
// `cierre` no tiene columna en la BD (cerrarOfertaManual no guarda fecha); se
// usa solo para validar la cadena de fechas.
const OFERTAS = [
  // P2 SALINAS — caso 7 (todos los estados)
  {
    clave: 'S1', profesor: 'P2', estadoFinal: 'pendiente_revision', registro: '2026-11-19',
    titulo: 'Asistente virtual para dudas de inscripción', tipo: 'proyecto', cupos: 2, carreras: ['ISC', 'IA'],
    descripcion: 'Diseñar y entrenar un asistente conversacional que responda las preguntas frecuentes de inscripción y reinscripción. Los alumnos recopilarán las dudas reales de ventanilla, construirán la base de respuestas y probarán el asistente con estudiantes de primer semestre.',
  },
  {
    clave: 'S2', profesor: 'P2', estadoFinal: 'pendiente_revision', registro: '2026-11-20',
    titulo: 'Tablero de asistencia a asesorías de Ciencias Básicas', tipo: 'individual', carreras: ['LCD'],
    descripcion: 'Registrar la asistencia a las asesorías de Cálculo, Álgebra y Probabilidad, limpiar los datos de los últimos dos semestres y construir un tablero que muestre horarios con mayor demanda y temas más consultados.',
  },
  {
    clave: 'S3', profesor: 'P2', estadoFinal: 'aprobada', registro: '2026-11-09', decision: '2026-11-11', revisor: CORREO_HERRERA,
    titulo: 'Banco de reactivos para exámenes de Cálculo', tipo: 'individual', carreras: ['ISC', 'LCD'],
    programa: PROGRAMA.ACADEMICA, actividad: ACTIVIDAD.ACADEMICA,
    descripcion: 'Capturar, clasificar por tema y nivel de dificultad, y revisar la redacción de los reactivos de los exámenes departamentales de Cálculo, para integrarlos en un banco consultable por la academia.',
  },
  {
    clave: 'S4', profesor: 'P2', estadoFinal: 'rechazada', registro: '2026-11-04', decision: '2026-11-06', revisor: CORREO_VILLAGRAN,
    titulo: 'Apoyo general en laboratorio', tipo: 'proyecto', cupos: 3, carreras: ['ISC'],
    descripcion: 'Apoyo en el laboratorio de Ciencias Básicas.',
    motivoRechazo: 'La descripción no detalla las actividades que realizará cada alumno ni el entregable esperado, y se solicitan 3 cupos para tareas que corresponden a una sola persona. Describe las actividades por alumno y ajusta el número de cupos.',
  },
  {
    clave: 'S5', profesor: 'P2', estadoFinal: 'cerrada', registro: '2026-09-14', decision: '2026-09-17', cierre: '2026-10-20', revisor: CORREO_HERRERA,
    titulo: 'Captura de calificaciones históricas de Álgebra', tipo: 'individual', carreras: ['ISC'],
    programa: PROGRAMA.ADMINISTRATIVA, actividad: ACTIVIDAD.ADMINISTRATIVA,
    descripcion: 'Capturar en hoja de cálculo las actas de calificaciones de Álgebra Lineal de 2018 a 2022 y validar los promedios contra los registros de la academia.',
  },
  {
    clave: 'S6', profesor: 'P2', estadoFinal: 'concluida', registro: '2026-02-09', decision: '2026-02-11', conclusion: '2026-10-30', revisor: CORREO_VILLAGRAN,
    titulo: 'Material didáctico de Matemáticas Discretas', tipo: 'individual', carreras: ['ISC'],
    programa: PROGRAMA.ACADEMICA, actividad: ACTIVIDAD.ACADEMICA,
    descripcion: 'Elaborar guías de ejercicios resueltos y presentaciones para los temas de lógica, conjuntos y grafos de Matemáticas Discretas, revisadas por la academia.',
  },

  // P1 LOZANO — para los 6 alumnos de REP (Parte 3); 1+2+1+2 = 6 cupos
  {
    clave: 'L1', profesor: 'P1', estadoFinal: 'aprobada', periodoInicio: '2026-04-16', revisor: CORREO_HERRERA, alumnos: ['2301'],
    titulo: 'Sistema de seguimiento de egresados', tipo: 'individual', carreras: ['ISC', 'LCD'],
    programa: PROGRAMA.ISC, actividad: ACTIVIDAD.ISC,
    descripcion: 'Desarrollar un módulo web para registrar la situación laboral de los egresados, con encuestas periódicas y reportes por generación para el departamento.',
  },
  {
    clave: 'L2', profesor: 'P1', estadoFinal: 'aprobada', periodoInicio: '2026-07-01', revisor: CORREO_HERRERA, alumnos: ['2101', '2201'],
    titulo: 'Migración del portal departamental', tipo: 'proyecto', cupos: 2, carreras: ['ISC'],
    programa: PROGRAMA.ISC, actividad: ACTIVIDAD.DEPARTAMENTO,
    descripcion: 'Migrar el portal del departamento a un gestor de contenidos actual: inventario de páginas, rediseño de la navegación, migración de contenidos y pruebas de accesibilidad.',
  },
  {
    clave: 'L3', profesor: 'P1', estadoFinal: 'aprobada', periodoInicio: '2026-10-01', revisor: CORREO_HERRERA, alumnos: ['2001'],
    titulo: 'Inventario de equipo de laboratorios', tipo: 'individual', carreras: ['ISC', 'IA'],
    programa: PROGRAMA.ADMINISTRATIVA, actividad: ACTIVIDAD.DEPARTAMENTO,
    descripcion: 'Levantar el inventario físico del equipo de cómputo de los laboratorios, etiquetarlo y cargarlo a un sistema con historial de mantenimiento y reportes de fallas.',
  },
  {
    clave: 'L4', profesor: 'P1', estadoFinal: 'aprobada', periodoInicio: '2026-10-16', revisor: CORREO_HERRERA, alumnos: ['1901', '2401'],
    titulo: 'Automatización de constancias internas', tipo: 'proyecto', cupos: 2, carreras: ['ISC'],
    programa: PROGRAMA.ADMINISTRATIVA, actividad: ACTIVIDAD.ADMINISTRATIVA,
    descripcion: 'Automatizar la generación de constancias internas del departamento a partir de plantillas y datos de control escolar, con folio y bitácora de emisión.',
  },

  // P3 AGUIRRE — para los 3 alumnos de bajas (Parte 4)
  {
    clave: 'A1', profesor: 'P3', estadoFinal: 'aprobada', periodoInicio: '2026-11-03', revisor: CORREO_VILLAGRAN, alumnos: ['2501', '2601', '2701'],
    titulo: 'Clasificación de imágenes para el acervo fotográfico', tipo: 'proyecto', cupos: 3, carreras: ['IA', 'LCD'],
    programa: PROGRAMA.CIC, actividad: ACTIVIDAD.CIC,
    descripcion: 'Etiquetar el acervo fotográfico histórico de la escuela y entrenar un modelo de clasificación de imágenes por evento y año, con un buscador para el área de difusión.',
  },
];

// Sufijos reservados para mis alumnos (partes 2–4). Se reservan desde ya para
// que la limpieza pueda reconocer carpetas huérfanas de corridas anteriores.
const SUFIJOS_ALUMNOS = ['1901', '2001', '2101', '2201', '2301', '2401', '2501', '2601', '2701'];

// ── Parte 3: solicitud de característica de P1 (caso "ya no puede aprobarse") ──
// Se crea con el servicio real ANTES de asignarle alumnos (entonces cabe: 0 ≤ 4);
// cuando la Parte 3 le ocupa 6 cupos, coordinación ya no puede aprobarla (6 > 4).
// Fecha: 21-sep-2026, cuando P1 tenía 3 alumnos (2301, 2101, 2201) y sí cabía.
const SOLICITUD_CARACTERISTICA_P1 = {
  profesor: 'P1',
  caracteristica: 'Investigador',
  fecha: '2026-09-21',
  justificacion: 'En enero dejo la jefatura del departamento y me incorporo de tiempo completo al proyecto de investigación en visión por computadora del posgrado, por lo que solicito cambiar mi característica a Investigador.',
};

// ── Parte 3: texto de actividades de cada reporte enviado ─────────────────
// Un elemento por párrafo (REP numera/separa cada renglón como un párrafo). Primera
// persona, tono formal, coherente con la oferta y con las actividades/bitácoras del
// periodo. Límite: no de caracteres (columna TEXT) sino de ESPACIO: a 10 pt fijos el
// texto debe caber en el recuadro de una página (reportes.pdf.js:625-660; si no,
// 422 ACTIVIDADES_EXCEDEN_ESPACIO). Los rechazados que aún no se corrigen conservan
// el texto que provocó el rechazo:
//   2101 R3 repite el texto de agosto (motivo: "repiten el resumen de agosto")
//   2201 R2 es demasiado general (motivo: "la descripción es muy general")
const P2101_AGOSTO = [
  'Durante las semanas de agosto posteriores al periodo vacacional retomé el rediseño de la navegación del portal departamental. Con base en el inventario elaborado en julio, agrupé las páginas existentes en cinco secciones principales (Departamento, Docencia, Posgrado, Servicios y Contacto) y propuse un nuevo menú que reduce de cuatro a dos el número de clics necesarios para llegar a la información más consultada.',
  'Elaboré los diagramas de navegación y un prototipo navegable del menú principal, que presenté al profesor responsable para su revisión. A partir de sus observaciones ajusté los nombres de las secciones para que fueran claros para los alumnos de nuevo ingreso.',
  'Por último, documenté en la carpeta del proyecto las decisiones de diseño y la correspondencia entre las páginas actuales y su nueva ubicación, que servirá como guía para la migración de contenidos.',
];

const TEXTOS_REPORTES = {
  2101: [
    // R1 · julio · inventario de páginas y contenidos
    [
      'Durante julio inicié mi servicio social en el proyecto de migración del portal departamental. Mi primera actividad fue levantar el inventario completo del sitio actual: recorrí todas las secciones y registré en una hoja de cálculo cada página, su dirección, su responsable, la fecha de su última actualización y los archivos que contiene.',
      'Identifiqué 148 páginas y 312 documentos descargables, de los cuales 41 páginas tenían información desactualizada y 27 enlaces estaban rotos. Clasifiqué cada página según su prioridad de migración y marqué los contenidos que deben revisarse con las áreas responsables antes de trasladarse.',
      'Al cierre del mes entregué al profesor responsable el inventario validado y un resumen de hallazgos, que será la base para el rediseño de la navegación.',
    ],
    // R2 · agosto · rediseño de la navegación
    P2101_AGOSTO,
    // R3 · septiembre · RECHAZADO por coordinación: repite el texto de agosto (sin corregir)
    P2101_AGOSTO,
    // R4 · octubre · migración de contenidos
    [
      'En octubre comencé la migración de contenidos al nuevo gestor del portal. Configuré la estructura de secciones definida en el rediseño y trasladé las páginas de prioridad alta: la presentación del departamento, la planta docente, los horarios de asesorías y los avisos para alumnos.',
      'Durante la migración actualicé los textos con la información vigente proporcionada por las áreas, sustituí los documentos obsoletos y corregí los enlaces rotos detectados en el inventario. En total migré 63 páginas y 120 documentos, y verifiqué que cada uno se visualizara correctamente en computadora y en teléfono celular.',
      'Llevé un registro de las páginas migradas y de los pendientes, que revisé semanalmente con el profesor responsable para priorizar el trabajo de noviembre.',
    ],
  ],
  2201: [
    // R1 · julio · inventario de páginas y contenidos
    [
      'En julio me incorporé al proyecto de migración del portal departamental. Junto con mi compañera de proyecto me encargué del inventario de la sección de Posgrado y de la de Servicios: revisé cada página, sus documentos descargables y los formularios en línea, y registré su estado en la hoja de cálculo compartida del proyecto.',
      'Detecté formularios que todavía enviaban la información a cuentas de correo que ya no existen y avisos de convocatorias vencidas. Elaboré una lista de estos problemas con una propuesta de solución para cada uno, que revisé con el profesor responsable.',
      'Además, investigué las opciones de gestores de contenido compatibles con el servidor institucional y redacté una comparación breve de sus ventajas, que se tomó en cuenta para elegir la plataforma.',
    ],
    // R2 · agosto · RECHAZADO por el profesor: demasiado general (sin corregir)
    [
      'Apoyé en las actividades del proyecto del portal.',
      'Trabajé en el rediseño y en las tareas que me asignó el profesor.',
    ],
    // R3 · septiembre · rediseño de la navegación (continuación)
    [
      'Durante septiembre trabajé en el rediseño de la navegación de las secciones de Posgrado y Servicios del portal. Diseñé las páginas tipo para convocatorias, trámites y formatos descargables, cuidando que tuvieran una estructura uniforme: descripción, requisitos, fechas importantes y contacto del área responsable.',
      'Construí en el nuevo gestor las plantillas de estas páginas y las probé con contenido real de dos convocatorias vigentes. También rediseñé los formularios en línea para que la información llegue a las cuentas institucionales correctas, y verifiqué su funcionamiento con el personal del área de Servicios.',
      'Presenté al profesor responsable el avance del rediseño y documenté las plantillas para que el resto del equipo las utilice en la migración.',
    ],
    // R4 · octubre · migración de contenidos
    [
      'En octubre migré al nuevo gestor los contenidos de las secciones de Posgrado y Servicios usando las plantillas diseñadas en septiembre. Trasladé 48 páginas, 15 formularios y los documentos asociados, y actualicé las fechas y requisitos de los trámites con la información vigente que me proporcionaron las áreas.',
      'Al terminar cada sección realicé pruebas de los formularios y de los enlaces, y corregí los errores encontrados. También preparé una guía breve para que el personal de las áreas pueda publicar avisos sin apoyo técnico.',
      'Registré el avance en la bitácora del proyecto y acordé con el profesor responsable las pruebas de accesibilidad que realizaré en noviembre.',
    ],
  ],
  2301: [
    // R1 · 16 abr–15 may · levantamiento de requerimientos
    [
      'Durante este primer periodo inicié mi servicio social en el proyecto del Sistema de seguimiento de egresados. Me reuní con el profesor responsable y con el personal del departamento para conocer cómo se lleva actualmente el registro de egresados, que se realiza en hojas de cálculo aisladas por generación.',
      'Levanté los requerimientos del sistema mediante entrevistas y la revisión de los formatos existentes: los datos que se deben capturar, los indicadores de inserción laboral que solicita la escuela y los reportes que necesita el departamento. Con esta información redacté el documento de requerimientos y los casos de uso principales.',
      'Al final del periodo presenté el documento al profesor responsable, quien lo aprobó con observaciones menores que ya incorporé.',
    ],
    // R2 · 18 may–15 jun · requerimientos y análisis de datos existentes
    [
      'En este periodo continué con el levantamiento de requerimientos, ahora enfocado en la información histórica. Reuní las hojas de cálculo de las generaciones 2018 a 2024, unifiqué sus columnas y detecté registros duplicados, correos inválidos y campos vacíos.',
      'Realicé un análisis exploratorio de los datos para identificar qué información es confiable y cuál debe solicitarse de nuevo a los egresados. Con los resultados propuse los indicadores que mostrará el sistema, como el porcentaje de egresados empleados, el tiempo para conseguir empleo y el sector en que trabajan.',
      'Documenté el proceso de limpieza de datos para que pueda repetirse con las generaciones futuras.',
    ],
    // R3 · 16 jun–15 jul · diseño de la base de datos y encuestas
    [
      'Durante este periodo diseñé la base de datos del sistema de seguimiento de egresados. Elaboré el modelo entidad-relación con las tablas de egresados, generaciones, encuestas, respuestas y empleos, y lo revisé con el profesor responsable hasta su aprobación.',
      'También comencé el diseño de la encuesta de seguimiento: definí las preguntas sobre situación laboral, relación del empleo con la carrera y satisfacción con la formación recibida, cuidando que fueran breves y comparables entre generaciones.',
      'Creé la base de datos en el servidor de desarrollo y cargué los datos históricos ya depurados para probar el modelo.',
    ],
    // R4 · 16 jul–14 ago · encuestas (periodo con vacaciones)
    [
      'En este periodo, que incluyó el receso de verano, concluí el diseño de las encuestas del sistema. Aplicué una prueba piloto con quince egresados voluntarios de la generación 2023 y, con base en sus comentarios, ajusté la redacción de seis preguntas y eliminé dos que resultaban repetitivas.',
      'Definí las reglas de envío de la encuesta: se aplicará a los seis meses, al año y a los tres años del egreso, con un recordatorio automático por correo. Documenté estas reglas y el diseño final de la encuesta para su desarrollo en el siguiente periodo.',
    ],
    // R5 · 17 ago–15 sep · desarrollo del módulo de encuestas
    [
      'Durante este periodo desarrollé el módulo de encuestas en línea del sistema. Programé el formulario de la encuesta, el registro de respuestas en la base de datos y el acceso de los egresados mediante un enlace personal enviado a su correo.',
      'Implementé las validaciones de cada pregunta y la opción de guardar la encuesta para terminarla después. Realicé pruebas con datos ficticios y corregí los errores encontrados en el guardado de respuestas parciales.',
      'Presenté el avance al profesor responsable y acordamos las pruebas con usuarios reales para el siguiente periodo.',
    ],
    // R6 · 16 sep–15 oct · desarrollo (continuación) y pruebas
    [
      'En este periodo concluí el desarrollo del módulo de encuestas e incorporé el panel de administración, desde el cual el personal del departamento puede consultar las respuestas, filtrarlas por generación y exportarlas a hoja de cálculo.',
      'Realicé pruebas con veinte egresados de la generación 2024, quienes respondieron la encuesta desde su teléfono celular y su computadora. Corregí problemas de visualización en pantallas pequeñas y mejoré los mensajes de error de los campos obligatorios.',
      'Documenté el manual de uso del panel de administración y lo revisé con el personal que operará el sistema.',
    ],
    // R7 · 16 oct–13 nov · reportes por generación y pruebas finales (480 h el 28-oct)
    [
      'En este último periodo desarrollé los reportes por generación del sistema de seguimiento de egresados: indicadores de empleo, tiempo para conseguir el primer trabajo y relación del empleo con la carrera, con gráficas y la opción de descargarlos en PDF.',
      'Realicé las pruebas finales del sistema completo con el profesor responsable y con el personal del departamento, corregí las últimas observaciones y entregué el código, el manual técnico y el manual de usuario.',
      'Con estas actividades concluí el proyecto y completé las 480 horas de mi servicio social el 28 de octubre de 2026.',
    ],
  ],
};

// ── Parte 4: solicitud de característica de P2 (sí aprobable en vivo) ────
const SOLICITUD_CARACTERISTICA_P2 = {
  profesor: 'P2',
  caracteristica: 'Investigador',
  fecha: '2026-11-18',
  justificacion: 'A partir de este semestre participo como investigadora en el proyecto SIP de enseñanza de las matemáticas con herramientas digitales, por lo que solicito la característica de Investigador.',
};

// ── Parte 4: alumnos de bajas (profesor P3, oferta A1, periodo 3-nov) ────
// `bajas.pasos`: historia sembrada con los servicios reales, en orden; cada paso con su fecha y hora (México).
const ALUMNOS_BAJAS = [
  {
    sufijo: '2501', caso: 'Baja rechazada en su historial + amonestación (sin leer)', oferta: 'A1', profesor: 'P3',
    correoInst: 'dominguez2501@alumno.ipn.mx', nombres: 'SANTIAGO', apellidos: 'DOMINGUEZ PEREA',
    telefono: '5564309182', boleta: '2021632501', correoPersonal: 'santiago.dominguez.personal@gmail.com',
    carrera: 'IA', creditos: '79.00', semestre: 7,
    motivacion: 'Me interesa la visión por computadora y quiero practicar con un conjunto de imágenes real.',
    periodoInicio: '2026-11-03',
    bitacoras: { hasta: '2026-11-20', faltas: ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09'] },
    baja: {
      pasos: [
        { accion: 'profesor_solicita', fecha: '2026-11-09', hora: '10:00', motivo: 'El alumno acumula cuatro inasistencias sin justificar desde el inicio del servicio y no ha respondido a los avisos.' },
        { accion: 'alumno_adjunta', fecha: '2026-11-10', hora: '11:00' },
        { accion: 'coordinacion_rechaza', fecha: '2026-11-12', hora: '12:00', comentario: 'El alumno justificó sus inasistencias con constancia médica; continúa en el servicio y el profesor dará seguimiento.' },
        { accion: 'profesor_amonesta', fecha: '2026-11-13', hora: '10:30', observaciones: 'Te recuerdo que debes avisar con anticipación cualquier inasistencia y registrar tu bitácora el mismo día.' },
      ],
      estadoFinal: 'rechazada',
    },
  },
  {
    sufijo: '2601', caso: 'Baja pedida por la alumna con expediente, pendiente de coordinación', oferta: 'A1', profesor: 'P3',
    correoInst: 'castro2601@alumno.ipn.mx', nombres: 'RENATA', apellidos: 'CASTRO LEYVA',
    telefono: '5550826741', boleta: '2020632601', correoPersonal: 'renata.castro.personal@gmail.com',
    carrera: 'LCD', creditos: '83.00', semestre: 8,
    motivacion: 'Quiero aplicar técnicas de ciencia de datos en un acervo histórico y aprender a etiquetar datos a gran escala.',
    periodoInicio: '2026-11-03',
    bitacoras: { hasta: '2026-11-18' },
    baja: {
      pasos: [
        { accion: 'alumno_solicita', fecha: '2026-11-18', hora: '13:00', motivo: 'Por motivos familiares cambio de residencia fuera de la Ciudad de México a partir de diciembre y no podré continuar con el servicio de forma presencial.' },
      ],
      estadoFinal: 'pendiente',
    },
  },
  {
    sufijo: '2701', caso: 'Baja pedida por el profesor, expediente adjunto, en revisión', oferta: 'A1', profesor: 'P3',
    correoInst: 'zamora2701@alumno.ipn.mx', nombres: 'EMILIO', apellidos: 'ZAMORA AVILA',
    telefono: '5597154063', boleta: '2021632701', correoPersonal: 'emilio.zamora.personal@gmail.com',
    carrera: 'IA', creditos: '81.00', semestre: 8,
    motivacion: 'Me interesa entrenar modelos de clasificación de imágenes y documentar el proceso para el área de difusión.',
    periodoInicio: '2026-11-03',
    bitacoras: { hasta: '2026-11-09' },
    baja: {
      pasos: [
        { accion: 'profesor_solicita', fecha: '2026-11-10', hora: '10:00', motivo: 'El alumno informó que no puede continuar por incompatibilidad de horario con su nuevo empleo.' },
        { accion: 'alumno_adjunta', fecha: '2026-11-11', hora: '11:00' },
        { accion: 'coordinacion_turna', fecha: '2026-11-13', hora: '12:00' },
      ],
      estadoFinal: 'en_revision',
    },
  },
];

// ── Parte 4: anuncios de profesor (ninguno de coordinación) ──────────────
// `vistoPor`: sufijos de los alumnos que ya lo vieron; el resto lo tiene sin leer.
const ANUNCIOS = [
  {
    profesor: 'P1', fecha: '2026-11-03', hora: '09:00', vistoPor: ['1901', '2001', '2101', '2201', '2301', '2401'],
    titulo: 'Reunión de seguimiento del viernes 6 de noviembre',
    contenido: 'Los espero el viernes 6 de noviembre a las 12:00 en el cubículo ESCOM-201 para revisar el avance de cada proyecto. Traigan su bitácora al día.',
  },
  {
    profesor: 'P1', fecha: '2026-11-17', hora: '09:00', vistoPor: [],
    titulo: 'Recordatorio: revisen el plazo de su reporte mensual',
    contenido: 'Revisen en "Mis reportes" la fecha límite de su reporte mensual: tienen 5 días hábiles a partir de que cierra su periodo. Si tienen bitácoras pendientes de revisión, avísenme para revisarlas a tiempo.',
  },
  {
    profesor: 'P3', fecha: '2026-11-04', hora: '09:00', vistoPor: ['2601', '2701'],
    titulo: 'Reunión de arranque del proyecto',
    contenido: 'Bienvenidos al proyecto de clasificación del acervo fotográfico. Nos vemos el jueves 5 de noviembre a las 16:00 en el cubículo ESCOM-203 para repartir los lotes de imágenes.',
  },
];

// ── Parte 4: carta compromiso firmada (ADM-14) ya enviada por coordinación ─
// En ADM-13 sale en la etapa "Término" (documentos.catalogo.js:126-135, RN-ADM-47):
// solo 2301, que está por terminar, fechada después de su R7 validado (19-nov).
// 2101 y 2201 quedan pendientes; 1901 la sube coordinación en vivo
// (PDF de ejemplo fuera del repo: ~/escom-ss-respaldos/demo/carta-firmada-1901.pdf).
const CARTAS_FIRMADAS = [
  { sufijo: '2301', fecha: '2026-11-20', hora: '12:30' },
];

// ── Parte 3: alumnos de REP (profesor P1) ────────────────────────────────
// `reportes`: estado final de cada reporte mensual, en orden (R1, R2, …).
//   AC = aprobado por coordinación · RC = rechazado por coordinación
//   PC = pendiente de coordinación · RP = rechazado por profesor · PP = pendiente de profesor
// `bitacoras`: rango y reglas para sembrarlas (solo días hábiles, 4 h).
const ALUMNOS = [
  {
    sufijo: '1901', caso: 'Genera su Reporte 1 en vivo (día 5 de 5)', oferta: 'L4', profesor: 'P1',
    correoInst: 'ortega1901@alumno.ipn.mx', nombres: 'JIMENA', apellidos: 'ORTEGA SALAZAR',
    telefono: '5571936428', boleta: '2020631901', correoPersonal: 'jimena.ortega.personal@gmail.com',
    carrera: 'ISC', creditos: '84.00', semestre: 8,
    motivacion: 'Me interesa automatizar trámites del departamento; ya hice un proyecto similar con plantillas y generación de PDF en la materia de Ingeniería de Software.',
    periodoInicio: '2026-10-16', rubrica: '2026-11-17',
    bitacoras: { hasta: '2026-11-20' },
    reportes: [],
  },
  {
    sufijo: '2001', caso: 'Reporte de octubre vencido sin enviar', oferta: 'L3', profesor: 'P1',
    correoInst: 'mejia2001@alumno.ipn.mx', nombres: 'RODRIGO', apellidos: 'MEJIA CARRILLO',
    telefono: '5548271093', boleta: '2021632001', correoPersonal: 'rodrigo.mejia.personal@gmail.com',
    carrera: 'IA', creditos: '78.00', semestre: 7,
    motivacion: 'Quiero apoyar en el inventario de los laboratorios porque paso mucho tiempo en ellos y conozco las fallas más comunes del equipo.',
    periodoInicio: '2026-10-01', rubrica: '2026-11-03',
    // AH lo bloquea desde el 9-nov (plazo vencido): sin bitácoras desde entonces.
    bitacoras: { hasta: '2026-11-06' },
    reportes: [],
  },
  {
    sufijo: '2101', caso: 'R3 rechazado por coordinación · R4 pendiente de coordinación', oferta: 'L2', profesor: 'P1',
    correoInst: 'espinoza2101@alumno.ipn.mx', nombres: 'PAOLA', apellidos: 'ESPINOZA TREJO',
    telefono: '5593047162', boleta: '2020632101', correoPersonal: 'paola.espinoza.personal@gmail.com',
    carrera: 'ISC', creditos: '86.00', semestre: 8,
    motivacion: 'Tengo experiencia con gestores de contenido y me gustaría aplicar lo aprendido en Tecnologías para la Web en un portal real.',
    periodoInicio: '2026-07-01',
    bitacoras: { hasta: '2026-11-20' },
    reportes: ['AC', 'AC', 'RC', 'PC'],
    rechazos: {
      3: 'Las actividades descritas repiten el resumen de agosto. Describe lo realizado del 1 al 30 de septiembre (migración de las secciones de posgrado y pruebas de accesibilidad), en congruencia con tus bitácoras.',
    },
  },
  {
    sufijo: '2201', caso: 'R2 rechazado por profesor · R4 pendiente de profesor', oferta: 'L2', profesor: 'P1',
    correoInst: 'padilla2201@alumno.ipn.mx', nombres: 'MIGUEL ANGEL', apellidos: 'PADILLA VILLA',
    telefono: '5536819274', boleta: '2021632201', correoPersonal: 'miguel.padilla.personal@gmail.com',
    carrera: 'ISC', creditos: '80.00', semestre: 7,
    motivacion: 'Quiero participar en la migración del portal para mejorar mis habilidades en desarrollo web y accesibilidad.',
    periodoInicio: '2026-07-01',
    bitacoras: { hasta: '2026-11-20' },
    reportes: ['AC', 'RP', 'AC', 'PP'],
    rechazos: {
      2: 'La descripción es muy general. Indica qué secciones del portal migraste en agosto y qué pruebas realizaste; debe coincidir con tus bitácoras del periodo.',
    },
  },
  {
    sufijo: '2301', caso: '480 horas, R1–R7 aprobados, global por generar', oferta: 'L1', profesor: 'P1',
    correoInst: 'rojas2301@alumno.ipn.mx', nombres: 'XIMENA', apellidos: 'ROJAS MARQUEZ',
    telefono: '5582640519', boleta: '2019632301', correoPersonal: 'ximena.rojas.personal@gmail.com',
    carrera: 'LCD', creditos: '92.00', semestre: 9,
    motivacion: 'Me interesa el análisis de datos de egresados; quiero aplicar lo que aprendí en Minería de Datos para medir la inserción laboral.',
    periodoInicio: '2026-04-16',
    bitacoras: { hasta480: true },
    reportes: ['AC', 'AC', 'AC', 'AC', 'AC', 'AC', 'AC'],
  },
  {
    sufijo: '2401', caso: 'Bitácora pendiente de revisión → no puede generar su Reporte 1', oferta: 'L4', profesor: 'P1',
    correoInst: 'hernandez2401@alumno.ipn.mx', nombres: 'BRUNO', apellidos: 'HERNANDEZ GALVAN',
    telefono: '5527058346', boleta: '2021632401', correoPersonal: 'bruno.hernandez.personal@gmail.com',
    carrera: 'ISC', creditos: '76.00', semestre: 7,
    motivacion: 'Busco un proyecto donde pueda programar automatizaciones; el de constancias internas encaja con lo que he hecho en Python.',
    periodoInicio: '2026-10-16', rubrica: '2026-11-17',
    // Falta algunos días; la del 12-nov queda pendiente de revisión.
    bitacoras: { hasta: '2026-11-19', faltas: ['2026-10-20', '2026-10-29', '2026-11-05', '2026-11-10'], pendiente: '2026-11-12' },
    reportes: [],
  },
];

const CORREOS_PROFESORES = Object.values(PROFESORES).map((p) => p.correo);

// Boleta (2018–2022)63<sufijo mío>
const REGEX_BOLETA_MIA = new RegExp(`^20(18|19|20|21|22)63(${SUFIJOS_ALUMNOS.join('|')})$`);
// Correo de alumno: letras + <sufijo mío>@alumno.ipn.mx
const REGEX_CORREO_ALUMNO_MIO = new RegExp(`^[a-z]+(${SUFIJOS_ALUMNOS.join('|')})@alumno\\.ipn\\.mx$`);

function esBoletaMia(boleta) {
  return REGEX_BOLETA_MIA.test(String(boleta));
}

function esCorreoMio(correo) {
  const c = String(correo).toLowerCase();
  return CORREOS_PROFESORES.includes(c) || REGEX_CORREO_ALUMNO_MIO.test(c);
}

module.exports = {
  PASSWORD,
  CORREO_COORDINADOR_CREADOR,
  CORREOS_COORDINADORES,
  PROFESORES,
  CORREOS_PROFESORES,
  SUFIJOS_ALUMNOS,
  ALUMNOS,
  TEXTOS_REPORTES,
  SOLICITUD_CARACTERISTICA_P1,
  SOLICITUD_CARACTERISTICA_P2,
  ALUMNOS_BAJAS,
  ANUNCIOS,
  CARTAS_FIRMADAS,
  FECHA_CREACION_PROFESORES,
  PROGRAMA,
  ACTIVIDAD,
  OFERTAS,
  esBoletaMia,
  esCorreoMio,
};
