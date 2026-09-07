const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const {
  validarNombreOApellidos,
  validarCorreoInstitucionalAlumno,
  validarTelefono,
  validarBoleta,
  validarContrasena,
} = require('../../lib/validators');

const fs = require('fs');
const path = require('path');
const { cifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');

// backend/src/modules/gr -> subimos 3 niveles hasta backend/, ahí vive uploads/
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

function esPdfValido(buffer) {
  // Magic bytes reales de un PDF — nunca confiar solo en la extensión del nombre.
  return !!buffer && buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}


const CREDITOS_MIN_DEFAULT = 70;
const CREDITOS_MIN_DICTAMEN_CREDITOS = 60;
// El dictamen de créditos es específicamente para quien está por debajo del
// 70% normal, así que el input del frontend también topa en 70 — se refleja
// aquí para que el backend no confíe solo en esa validación del cliente.
const CREDITOS_MAX_DICTAMEN_CREDITOS = 70;
const SEMESTRE_MIN_DICTAMEN_CREDITOS = 6;
// RN-GR-03: alumno.creditos ahora es Decimal(5,2), ya no hace falta redondear.
const CREDITOS_MIN_DICTAMEN_ELECTIVA = 96.01;


const DICTAMEN_MAP = { creditos: 1, estancia: 2, electiva: 3 };

const DICTAMEN_LABEL = { 1: 'Dictamen de créditos', 2: 'Dictamen de estancia profesional', 3: 'Dictamen por electiva' };

function dictamenLabel(codigo) {
  return DICTAMEN_LABEL[codigo] || null;
}





// Reglas extra de GR (más estrictas que el validador compartido, confirmadas
// por el usuario) — no se meten en validators.js porque no aplican a
// profesor/coordinador.
const TELEFONO_PRIMER_DIGITO_REGEX = /^[2-9]/;
const DOS_APELLIDOS_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ]+\s[A-Za-zÀ-ÖØ-öø-ÿÑñ]+$/;

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

/**
 * RN-GR-02, RN-GR-03, Flujos Alternos A y B.
 * @returns {number|null} código numérico de dictamen para guardar en BD.
 */
function validarDictamenYCreditos(dictamenTexto, creditos, semestre) {
  if (!dictamenTexto) {
    if (creditos < CREDITOS_MIN_DEFAULT) {
      throw crearError(`Necesitas mínimo ${CREDITOS_MIN_DEFAULT}% de créditos para realizar tu servicio social.`);
    }
    return null;
  }

  if (!(dictamenTexto in DICTAMEN_MAP)) {
    throw crearError('El dictamen seleccionado no es válido.');
  }

  if (dictamenTexto === 'creditos') {
    // Flujo A — rango 60-70%, no solo mínimo.
    if (
      creditos < CREDITOS_MIN_DICTAMEN_CREDITOS ||
      creditos > CREDITOS_MAX_DICTAMEN_CREDITOS ||
      semestre < SEMESTRE_MIN_DICTAMEN_CREDITOS
    ) {
      throw crearError(
        `Con dictamen de créditos, tus créditos deben estar entre ${CREDITOS_MIN_DICTAMEN_CREDITOS}% y ${CREDITOS_MAX_DICTAMEN_CREDITOS}%, y debes estar en semestre ${SEMESTRE_MIN_DICTAMEN_CREDITOS} o superior.`
      );
    }
  } else if (dictamenTexto === 'electiva') {
    // Flujo B
    if (creditos < CREDITOS_MIN_DICTAMEN_ELECTIVA) {
      throw crearError('Con dictamen por electiva necesitas mínimo 96.01% de créditos.');
    }
  } else if (dictamenTexto === 'estancia') {
    // RN-GR-03: estancia profesional no modifica rangos.
    if (creditos < CREDITOS_MIN_DEFAULT) {
      throw crearError(`Necesitas mínimo ${CREDITOS_MIN_DEFAULT}% de créditos para realizar tu servicio social.`);
    }
  }

  return DICTAMEN_MAP[dictamenTexto];
}

/**
 * CU-GR-01 — Enviar solicitud de registro en oferta
 * @param {object} datos - todo lo capturado en los 4 pasos del formulario del frontend
 */
async function enviarSolicitudRegistro(datos) {
  const {
    correoInst, nombres, apellidos, telefono, boleta, correoPersonal,
    carrera, creditos, semestre, tipoLiberacion,
    periodo, oferta, motivacion,
    password, confirmarPassword,
  } = datos;

  // ── 1. Validaciones de formato ──────────────────────────────────────────
  validarCorreoInstitucionalAlumno(correoInst);

  validarNombreOApellidos(nombres, 'El nombre');
  validarNombreOApellidos(apellidos, 'Los apellidos');
  if (!DOS_APELLIDOS_REGEX.test((apellidos || '').trim())) {
    throw crearError('Debes ingresar exactamente dos apellidos (paterno y materno).');
  }

  validarTelefono(telefono, { requerido: true });
  if (!TELEFONO_PRIMER_DIGITO_REGEX.test(telefono)) {
    throw crearError('El número de celular no puede iniciar en 0 ni 1.');
  }

  validarBoleta(boleta);
  validarContrasena(password);

  if (password !== confirmarPassword) {
    throw crearError('Las contraseñas no coinciden.');
  }

  if (!motivacion || motivacion.trim().length < 20) {
    throw crearError('Describe tu motivo de postulación (mínimo 20 caracteres).');
  }

  if (!creditos || !semestre || isNaN(Number(creditos)) || isNaN(Number(semestre)) ) {
    throw crearError('Créditos y semestre son obligatorios y válidos.');
  }

  const dictamenNumerico = validarDictamenYCreditos(tipoLiberacion, Number(creditos), Number(semestre));

  // ── 2. Resolver catálogos (carrera, periodo, oferta) ────────────────────
  const carreraEncontrada = await prisma.carrera.findFirst({ where: { nombre: carrera } });
  if (!carreraEncontrada) {
    throw crearError('Selecciona una carrera válida.');
  }

  const periodoEncontrado = await prisma.periodo_registro.findUnique({ where: { id: Number(periodo) } });
  if (!periodoEncontrado) {
    throw crearError('El periodo seleccionado ya no está disponible. Selecciona otro.');
  }

  const ofertaEncontrada = await prisma.oferta_servicio.findUnique({
    where: { id: Number(oferta) },
    include: { profesor: true },
  });

  if (!ofertaEncontrada || ofertaEncontrada.estado_oferta !== 'Aprobada') {
    throw crearError('La oferta seleccionada ya no está disponible.');
  }

  // RF-GR-09 / Flujo Alterno 10.1: se revalida el cupo justo antes de crear la solicitud.
  // No se decrementa aquí — eso ocurre hasta CU-GR-02 al aceptar.
  if (ofertaEncontrada.cupos_disponibles <= 0) {
    throw crearError('Lo sentimos, el cupo se acaba de llenar. Selecciona otra oferta.', 409, 'OFERTA_SIN_CUPOS');
  }

  // ── 3. Duplicados (chequeo temprano para un mensaje de error más claro) ─
  const correoExistente = await prisma.usuario.findUnique({ where: { correo_institucional: correoInst } });
  if (correoExistente) {
    throw crearError('Este correo institucional ya está registrado.', 409);
  }

  const boletaExistente = await prisma.alumno.findUnique({ where: { boleta } });
  if (boletaExistente) {
    throw crearError('Esta boleta ya está registrada.', 409);
  }

  // ── 4. Transacción: usuario + alumno + solicitud_registro ───────────────
  const contrasenaHash = await bcrypt.hash(password, 10);
  const ahora = new Date();
  const nombreNormalizado = nombres.trim().toUpperCase();
  const apellidosNormalizados = apellidos.trim().toUpperCase();

  try {
    await prisma.$transaction(async (tx) => {
      const usuarioCreado = await tx.usuario.create({
        data: {
          rol: 'alumno_sin_asignar',
          correo_institucional: correoInst,
          nombre: nombreNormalizado,
          apellidos: apellidosNormalizados,
          contrasena: contrasenaHash,
          fecha_creacion: ahora,
          
        },
      });

      await tx.alumno.create({
        data: {
          boleta,
          usuario_id: usuarioCreado.id,
          celular: telefono,
          carrera,
          creditos: Number(creditos).toFixed(2),
          semestre: Number(semestre),
          correo_personal: correoPersonal || null,
        },
      });

      await tx.solicitud_registro.create({
        data: {
          alumno_id: boleta,
          carrera_id: carreraEncontrada.id,
          dictamen: dictamenNumerico,
          periodo_registro_id: periodoEncontrado.id,
          oferta_id: ofertaEncontrada.id,
          motivacion_oferta: motivacion,
          estado_solicitud: 'espera_respuesta_de_profesor',
          estado_anterior: null,
          fecha_aplicacion: ahora,
        },
      });
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw crearError('Este correo o boleta ya está registrado.', 409);
    }
    throw err;
  }

  






  return { mensaje: 'Tu solicitud fue enviada correctamente. Ya puedes iniciar sesión para ver el estado de tu proceso.' };
}

async function verificarCorreoDisponible(correoInst) {
  validarCorreoInstitucionalAlumno(correoInst);
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: correoInst } });
  return { disponible: !existente };
}

// ─────────────────────────────────────────────────────────────
// Vencimiento de plazo de expediente (RN-GR-04)
// ─────────────────────────────────────────────────────────────
// RN-GR-04 (Reloj 1: fecha_max_expediente) deja de aplicar en cuanto el
// alumno YA ENVIÓ su expediente — a partir de ahí entra un reloj distinto
// (RN-GR-05: fecha_inicio del periodo, "Reloj 2"), que se checará aparte
// cuando construyamos CU-GR-11. Por ahora estos 3 quedan sin ningún
// chequeo de vencimiento (hueco temporal controlado, mejor que aplicarles
// el reloj equivocado).
const ESTADOS_EXCLUIDOS_DE_VENCIMIENTO = [
  'rechazada_definitivamente',
  'modificar_reenviar',
  'alumno_asignado',
  'expediente_pendiente_revision',
  'expediente_con_correcciones',
  'expediente_aprobado',
];

// Estados en los que el profesor YA aceptó al alumno (por lo tanto ya se
// había decrementado cupos_disponibles en CU-GR-02) — si el plazo vence
// estando en cualquiera de estos, hay que liberar ese cupo de vuelta.
const ESTADOS_CON_CUPO_CONSUMIDO = [
  'registro_SISS',
  'adjuntar_documentacion_inicial',
  'SISS_y_documentacion_pendiente',
  'SISS_docs_aprobados',
  'corregir_docsini',
  'corregir_SISS',
  'descargar_carta_compromiso',
  'espera_confirmacion_carta_compromiso',
  'carta_compromiso_confirmada',
  'adjuntar_expediente',
  'expediente_pendiente_revision',
  'expediente_con_correcciones',
];

const MOTIVO_RECHAZO_VENCIMIENTO = 'Plazo de envío de expediente vencido';

/**
 * RN-GR-04: revisa si el plazo de envío de expediente del periodo de una
 * solicitud ya venció (antes de las 2:00 pm de ese día) y, si es así,
 * ejecuta el "borrado parcial" descrito en la ficha. Se llama desde 2
 * lugares que comparten esta misma lógica: el login (auth.service.js), y
 * más adelante el polling de las pantallas de espera.
 *
 * ⚠️ Todavía NO implementa RN-GR-05 (revisar contra la fecha de INICIO del
 * periodo para expediente_aprobado/expediente_con_correcciones) — queda
 * pendiente como regla aparte.
 *
 * @param {number} solicitudId
 * @returns {Promise<object|null>} la solicitud actualizada (si se aplicó el
 *   borrado), la solicitud sin cambios (si no venció nada), o null si no existe.
 */
async function verificarYAplicarVencimiento(solicitudId) {
  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: solicitudId },
    include: { periodo_registro: true },
  });

  if (!solicitud) return null;
  if (ESTADOS_EXCLUIDOS_DE_VENCIMIENTO.includes(solicitud.estado_solicitud)) return solicitud;
  if (!solicitud.periodo_registro) return solicitud;

  const fechaLimite = new Date(solicitud.periodo_registro.fecha_max_expediente);
  // RN-GR-04: antes de las 2:00 pm HORA DE MÉXICO de ese día.
  // fecha_max_expediente es @db.Date — Prisma la representa como medianoche
  // UTC, que ya "es" las 6pm del día ANTERIOR en México. Por eso NO se usa
  // setHours() (trabaja en hora local del proceso y movería el límite un
  // día completo antes sin avisar) — se construye directo en UTC:
  // 2:00 pm México (UTC-6, sin horario de verano desde 2022) = 20:00 UTC.
  const limite = new Date(Date.UTC(
    fechaLimite.getUTCFullYear(),
    fechaLimite.getUTCMonth(),
    fechaLimite.getUTCDate(),
    20, 0, 0, 0
  ));




  if (new Date() < limite) return solicitud;

  const cupoConsumido = ESTADOS_CON_CUPO_CONSUMIDO.includes(solicitud.estado_solicitud);

  const operaciones = [
    prisma.solicitud_registro.update({
      where: { id: solicitud.id },
      data: {
        estado_solicitud: 'rechazada_definitivamente',
        estado_anterior: solicitud.estado_solicitud,
        oferta_id: null,
        motivacion_oferta: null,
        tipo_rechazo: 'definitivo',
        motivo_rechazo: MOTIVO_RECHAZO_VENCIMIENTO,
        registro_siss: false,
        docs_iniciales: false,
        carta_compromiso: false,
        expediente: false,
      },
    }),
  ];

  if (cupoConsumido && solicitud.oferta_id) {
    operaciones.push(
      prisma.oferta_servicio.update({
        where: { id: solicitud.oferta_id },
        data: { cupos_disponibles: { increment: 1 } },
      })
    );
  }

  const [solicitudActualizada] = await prisma.$transaction(operaciones);
  return solicitudActualizada;
}

/**
 * Usado por el login y por el futuro endpoint de polling: dado un
 * usuario_id de alumno, revisa vencimiento y regresa su estado actual.
 */
async function obtenerEstadoActualPorUsuarioId(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró una solicitud de registro activa.', 404);
  }

  const solicitud = await verificarYAplicarVencimiento(alumno.solicitud_registro.id);

  return {
    estado_solicitud: solicitud.estado_solicitud,
    motivo_rechazo: solicitud.motivo_rechazo,
  };
}

// Estados desde los que se permite cambiar de oferta — RN-GR-17: "en los
// tres escenarios" (pendiente, rechazada por perfil, rechazada por cupos).
const ESTADOS_PERMITEN_CAMBIO_OFERTA = ['espera_respuesta_de_profesor', 'rechazada_por_profesor', 'rechazada_por_cupos'];

/**
 * CU-GR-03 — Cambiar de oferta (RN-GR-17 a RN-GR-20, RF-GR-32 a RF-GR-37)
 */
async function cambiarOferta(usuarioId, { ofertaId, motivacion }) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de registro.', 404);
  }

  const solicitud = alumno.solicitud_registro;

  if (!ESTADOS_PERMITEN_CAMBIO_OFERTA.includes(solicitud.estado_solicitud)) {
    throw crearError('No puedes cambiar de oferta en el estado actual de tu solicitud.', 409);
  }

  if (!motivacion || motivacion.trim().length < 20) {
    throw crearError('Describe tu motivo de postulación (mínimo 20 caracteres).');
  }

  const ofertaEncontrada = await prisma.oferta_servicio.findUnique({
    where: { id: Number(ofertaId) },
  });

  if (!ofertaEncontrada || ofertaEncontrada.estado_oferta !== 'Aprobada') {
    throw crearError('La oferta seleccionada ya no está disponible.');
  }

  // RF-GR-37 / Excepción E2: mismo patrón de revalidación que en CU-GR-01.
  if (ofertaEncontrada.cupos_disponibles <= 0) {
    throw crearError('Lo sentimos, esa oferta ya no tiene cupo disponible. Selecciona otra.', 409, 'OFERTA_SIN_CUPOS');
  }

  await prisma.solicitud_registro.update({
    where: { id: solicitud.id },
    data: {
      oferta_id: ofertaEncontrada.id,
      motivacion_oferta: motivacion,
      estado_solicitud: 'espera_respuesta_de_profesor',
      estado_anterior: null, // confirmado: se pierde el rastro a propósito, tal como dice la ficha
      tipo_rechazo: null,
      motivo_rechazo: null,
      fecha_aplicacion: new Date(),
    },
  });

    return { mensaje: 'Tu selección de oferta fue actualizada correctamente.', estado_solicitud: 'espera_respuesta_de_profesor' };
}

/**
 * CU-GR-03, Flujo D / Salida #5 — botón "Siguiente paso" cuando ya fue aceptado.
 */
async function continuarARegistroSISS(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de registro.', 404);
  }

  if (alumno.solicitud_registro.estado_solicitud !== 'aceptada_por_profesor') {
    throw crearError('Tu solicitud no está en el estado correcto para continuar.', 409);
  }

  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: {
      estado_solicitud: 'registro_SISS',
      estado_anterior: 'aceptada_por_profesor',
    },
  });

    return { mensaje: 'Avanzaste al registro en SISS.', estado_solicitud: 'registro_SISS' };
}

/**
 * CU-GR-04 — RN-GR-25: datos personalizados para las instrucciones de SISS.
 */
async function obtenerInfoSISS(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: {
      solicitud_registro: {
        include: {
          oferta: true,
          periodo_registro: { include: { evento_calendario: true } },
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de registro.', 404);
  }

  const solicitud = alumno.solicitud_registro;

  if (solicitud.estado_solicitud !== 'registro_SISS') {
    throw crearError('Tu solicitud no está en el paso de registro en SISS.', 409);
  }

  return {
    programa: solicitud.oferta?.programa_SISS ?? null,
    actividad: solicitud.oferta?.nombre_SISS ?? null,
    fechaInicio: solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
  };
}

/**
 * CU-GR-04 — RN-GR-24 / RN-GR-27: confirma el registro en SISS y avanza.
 */
async function confirmarRegistroSISS(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de registro.', 404);
  }

  if (alumno.solicitud_registro.estado_solicitud !== 'registro_SISS') {
    throw crearError('Tu solicitud no está en el paso correcto para confirmar esto.', 409);
  }

  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: {
      estado_solicitud: 'adjuntar_documentacion_inicial',
      estado_anterior: 'registro_SISS',
      registro_siss: true,
    },
  });

  return {
    mensaje: 'Tu registro en SISS ha sido confirmado. Ahora debes adjuntar tu documentación.',
    estado_solicitud: 'adjuntar_documentacion_inicial',
  };
}

/**
 * CU-GR-05 — Adjuntar documentación inicial
 */
async function adjuntarDocumentacionInicial(usuarioId, { cartaCreditos, seguroSocial }) {
  if (!cartaCreditos || !seguroSocial) {
    throw crearError('Debes adjuntar ambos documentos obligatorios.');
  }
  if (!esPdfValido(cartaCreditos.buffer) || !esPdfValido(seguroSocial.buffer)) {
    throw crearError('Alguno de los archivos no es un PDF válido.');
  }

  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'adjuntar_documentacion_inicial') {
    throw crearError('Tu solicitud no está en el paso de adjuntar documentación.', 409);
  }

  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, alumno.boleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });

  const rutaRelativaCarta = path.join(alumno.boleta, generarNombreSeguro());
  const rutaRelativaSeguro = path.join(alumno.boleta, generarNombreSeguro());

  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativaCarta), cifrarBuffer(cartaCreditos.buffer));
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativaSeguro), cifrarBuffer(seguroSocial.buffer));

  const ahora = new Date();
  const rutasViejasABorrar = [];

  try {
    await prisma.$transaction(async (tx) => {
      // Reutiliza la fila si ya existe (ej. Coordinador pidió corrección);
      // solo crea una nueva si es la primera vez que este alumno sube este tipo.
      for (const [tipoDocumento, rutaNueva] of [
        ['carta_creditos', rutaRelativaCarta],
        ['constancia_seguro_social', rutaRelativaSeguro],
      ]) {
        const existente = await tx.documento.findFirst({ where: { alumno_id: alumno.boleta, tipo_documento: tipoDocumento } });
        if (existente) {
          rutasViejasABorrar.push(existente.ruta_archivo);
          await tx.documento.update({
            where: { id: existente.id },
            data: { ruta_archivo: rutaNueva, estado_documento: 'en_revision', creador_id: usuarioId, fecha_creacion: ahora, aprobado_por_id: null },
          });
        } else {
          await tx.documento.create({
            data: { alumno_id: alumno.boleta, creador_id: usuarioId, tipo_documento: tipoDocumento, fecha_creacion: ahora, estado_documento: 'en_revision', ruta_archivo: rutaNueva },
          });
        }
      }

      await tx.solicitud_registro.update({
        where: { id: alumno.solicitud_registro.id },
        data: { estado_solicitud: 'SISS_y_documentacion_pendiente', estado_anterior: 'adjuntar_documentacion_inicial', docs_iniciales: true },
      });
    });
  } catch (err) {
    [rutaRelativaCarta, rutaRelativaSeguro].forEach((ruta) => { try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, ruta)); } catch {} });
    throw crearError('Ocurrió un error al procesar la solicitud.', 500);
  }

  rutasViejasABorrar.forEach((ruta) => { try { fs.unlinkSync(path.join(RUTA_BASE_DOCUMENTOS, ruta)); } catch {} });

  return { mensaje: 'Tu documentación fue enviada correctamente y será revisada por Coordinación.', estado_solicitud: 'SISS_y_documentacion_pendiente' };
}


async function continuarACartaCompromiso(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'SISS_docs_aprobados') {
    throw crearError('Tu solicitud no está en el paso correcto para continuar.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: { estado_solicitud: 'descargar_carta_compromiso', estado_anterior: 'SISS_docs_aprobados' },
  });
  return { mensaje: 'Avanzaste al paso de carta compromiso.', estado_solicitud: 'descargar_carta_compromiso' };
}

async function corregirDocumentacion(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'corregir_docsini') {
    throw crearError('Tu solicitud no está en el paso correcto para esto.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: { estado_solicitud: 'adjuntar_documentacion_inicial', estado_anterior: 'corregir_docsini' },
  });
  return { mensaje: 'Vuelve a adjuntar tu documentación.', estado_solicitud: 'adjuntar_documentacion_inicial' };
}

async function corregirRegistroSISS(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'corregir_SISS') {
    throw crearError('Tu solicitud no está en el paso correcto para esto.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: { estado_solicitud: 'registro_SISS', estado_anterior: 'corregir_SISS' },
  });
  return { mensaje: 'Vuelve a completar tu registro en SISS.', estado_solicitud: 'registro_SISS' };
}

/**
 * Botón "Modificar solicitud y reenviar" — el componente compartido
 * SolicitudRechazadaDefinitivamente lo usa desde CUALQUIER pantalla donde
 * pueda aparecer rechazada_definitivamente (GR-01, GR-03, GR-04, GR-05, GR-06...).
 */
async function iniciarModificarSolicitud(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'rechazada_definitivamente') {
    throw crearError('Tu solicitud no está en estado de rechazo definitivo.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: {
      estado_solicitud: 'modificar_reenviar',
      estado_anterior: 'rechazada_definitivamente',
      oferta_id: null,
      motivacion_oferta: null,
      tipo_rechazo: null,
      motivo_rechazo: null,
      registro_siss: false,
      docs_iniciales: false,
      periodo_registro_id: null,
    },
  });
  return { mensaje: 'Ya puedes modificar y reenviar tu solicitud.', estado_solicitud: 'modificar_reenviar' };
}

/**
 * RF-GR-61/62: lista de documentos del alumno — de propósito general,
 * reutilizable en futuras pantallas (GR-08, GR-10...), no exclusiva de este CU.
 */
async function obtenerMisDocumentos(usuarioId) {
  const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioId } });
  if (!alumno) throw crearError('No se encontró tu perfil de alumno.', 404);

  const documentos = await prisma.documento.findMany({
    where: { alumno_id: alumno.boleta },
    orderBy: { fecha_creacion: 'desc' },
  });

  return documentos.map((d) => ({
    id: d.id,
    tipoDocumento: d.tipo_documento,
    estadoDocumento: d.estado_documento,
    fechaCreacion: d.fecha_creacion,
  }));
}


async function confirmarCartaCompromiso(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'descargar_carta_compromiso') {
    throw crearError('Tu solicitud no está en el paso correcto para esto.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: { estado_solicitud: 'espera_confirmacion_carta_compromiso', estado_anterior: 'descargar_carta_compromiso' },
  });
  return { mensaje: 'Quedas en espera de que Coordinación confirme la recepción de tu carta.', estado_solicitud: 'espera_confirmacion_carta_compromiso' };
}

async function continuarAExpediente(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: { solicitud_registro: true },
  });
  if (!alumno || !alumno.solicitud_registro) throw crearError('No se encontró tu solicitud de registro.', 404);
  if (alumno.solicitud_registro.estado_solicitud !== 'carta_compromiso_confirmada') {
    throw crearError('Tu solicitud no está en el paso correcto para continuar.', 409);
  }
  await prisma.solicitud_registro.update({
    where: { id: alumno.solicitud_registro.id },
    data: { estado_solicitud: 'adjuntar_expediente', estado_anterior: 'carta_compromiso_confirmada' },
  });
  return { mensaje: 'Avanzaste al paso de expediente.', estado_solicitud: 'adjuntar_expediente' };
}


module.exports = {
  enviarSolicitudRegistro,
  verificarCorreoDisponible,
  verificarYAplicarVencimiento,
  obtenerEstadoActualPorUsuarioId,
  DICTAMEN_MAP, 
  dictamenLabel,
  cambiarOferta,
  continuarARegistroSISS,
  obtenerInfoSISS,
  confirmarRegistroSISS,
  adjuntarDocumentacionInicial,
  continuarACartaCompromiso,
  corregirDocumentacion,
  corregirRegistroSISS,
  iniciarModificarSolicitud,
  obtenerMisDocumentos,
  RUTA_BASE_DOCUMENTOS,
  confirmarCartaCompromiso,
  continuarAExpediente,

};



