// Prisma falso para probar el módulo de Profesor de Reportes: un grafo en memoria de reportes mensuales con alumno,
// solicitud, oferta y revisiones. Aplica los `where` de las consultas (incluida la propiedad por oferta.profesor_id),
// así que una consulta sin filtro de propiedad devolvería reportes ajenos. SIN el modelo `bitacora`: cualquier consulta
// a bitácoras falla (los días y horas de un reporte salen del propio reporte).
//
// Solo lectura, salvo con `escritura: true` (aprobar/rechazar): entonces admite UPDATE condicional de reporte y documento,
// crear revisiones y transacciones con reversa (una a la vez, como el bloqueo de filas de InnoDB). Nunca hay borrado ni
// modificación de revisiones: el historial es append-only y una operación así falla el test.

const utc = (iso) => new Date(`${iso}T00:00:00.000Z`);
const instante = (iso) => new Date(iso);

// Coincidencia recursiva: los objetos anidados se buscan en la relación del mismo nombre; { in: [...] } es el operador de Prisma.
function coincide(fila, where) {
  return Object.entries(where ?? {}).every(([campo, esperado]) => {
    if (esperado !== null && typeof esperado === 'object' && !(esperado instanceof Date)) {
      if (Array.isArray(esperado.in)) return esperado.in.includes(fila[campo]);
      return fila[campo] != null && coincide(fila[campo], esperado);
    }
    return fila[campo] === esperado;
  });
}

/**
 * Reporte mensual con todo lo que consultan los servicios. `profesorId` es el dueño de la oferta del alumno.
 */
function reporteMensual({
  id,
  numero = 1,
  estado = 'pendiente_revision_profesor',
  profesorId = 1,
  solicitudId = 1000 + id,
  boleta = `20226300${String(id).padStart(2, '0')}`,
  nombre = 'ANA',
  apellidos = 'GARCIA LOPEZ',
  fechaInicio = '2026-07-16',
  fechaFin = '2027-02-17',
  sinPeriodo = false,
  actividades = `Actividades del reporte ${id}.`,
  diasLaborados = 4,
  horasReportadas = 13,
  envio = '2026-08-16T15:00:00.000Z',
  revisiones,
  documentoFecha = null,
  alumnoUsuarioId = 200 + id,
  carrera = 'IIA',
  profesorUsuarioId = 300 + profesorId,
  profesorNombre = 'LUIS',
  profesorApellidos = 'TORRES VEGA',
  hashAlumno = null, // hash_documento de la firma del alumno
  rutaArchivo = `${boleta}/reporte-${id}.pdf`, // relativa a la carpeta de documentos; null = sin archivo
} = {}) {
  return {
    id,
    solicitud_registro_id: solicitudId,
    documento_id: 5000 + id,
    num_reporte: numero,
    actividades_mes: actividades,
    dias_laborados: diasLaborados,
    horas_reportadas: horasReportadas,
    estado_reporte: estado,
    solicitud_registro: {
      id: solicitudId,
      alumno: { boleta, carrera, usuario_id: alumnoUsuarioId, usuario: { nombre, apellidos } },
      oferta: { id: 10 + profesorId, profesor_id: profesorId, profesor: { usuario_id: profesorUsuarioId, usuario: { nombre: profesorNombre, apellidos: profesorApellidos } } },
      periodo_registro: sinPeriodo ? null : { evento_calendario: { fecha_inicio: utc(fechaInicio), fecha_fin: fechaFin ? utc(fechaFin) : null } },
    },
    documento: { id: 5000 + id, ruta_archivo: rutaArchivo, fecha_creacion: documentoFecha ? instante(documentoFecha) : null },
    revision_reporte_mensual: revisiones ?? (envio ? [{ id: 9000 + id, tipo_revisor: 'alumno', estado: 'aprobado', hash_documento: hashAlumno, fecha: instante(envio), usuario: { nombre, apellidos } }] : []),
  };
}

/**
 * Reporte global con la misma forma que el mensual pero con las columnas del global (sin número, días ni horas;
 * `actividades_resumen` y `revision_reporte_global`). Sus ids de documento y de revisión no chocan con los del mensual.
 */
function reporteGlobal(opciones = {}) {
  const { num_reporte, dias_laborados, horas_reportadas, actividades_mes, revision_reporte_mensual, documento, ...fila } = reporteMensual({
    rutaArchivo: undefined, ...opciones, numero: 1,
  });
  const rutaPorOmision = `${fila.solicitud_registro.alumno.boleta}/global-${fila.id}.pdf`;
  return {
    ...fila,
    documento_id: 7000 + fila.id,
    actividades_resumen: opciones.actividades ?? `Resumen de actividades del servicio ${fila.id}.`,
    documento: { ...documento, id: 7000 + fila.id, ruta_archivo: 'rutaArchivo' in opciones ? opciones.rutaArchivo : rutaPorOmision },
    revision_reporte_global: revision_reporte_mensual.map((r) => ({ ...r, id: r.id + 500, reporte_global_id: fila.id })),
  };
}

const ESCRITURAS = new Set([
  'reporte_mensual.updateMany', 'reporte_global.updateMany', 'documento.updateMany',
  'revision_reporte_mensual.create', 'revision_reporte_global.create', '$transaction',
]);

/**
 * Alumno con su solicitud, periodo oficial, oferta y profesor, como lo devuelve alumno.findUnique (CU-REP-04). Los valores por
 * omisión coinciden con los de reporteMensual (mismo periodo oficial y mismo profesor).
 */
function alumnoGrafo({
  usuarioId = 201, boleta = '2022630001', nombre = 'ANA', apellidos = 'GARCIA LOPEZ', carrera = 'IIA',
  correoPersonal = 'ana.garcia@example.com', celular = '5512345678', creditos = '85.50', semestre = 8,
  programa = 'Programa SISS de prueba', solicitudId = 1001, fechaInicio = '2026-07-16', fechaFin = '2027-02-17',
  profesorUsuarioId = 301, profesorNombre = 'LUIS', profesorApellidos = 'TORRES VEGA', sinOferta = false, sinPeriodo = false,
} = {}) {
  return {
    usuario_id: usuarioId,
    boleta,
    carrera,
    semestre,
    celular,
    creditos,
    correo_personal: correoPersonal,
    usuario: { nombre, apellidos, correo_institucional: 'agarcia@alumno.ipn.mx', rubrica_imagen: null },
    solicitud_registro: {
      id: solicitudId,
      periodo_registro: sinPeriodo ? null : { evento_calendario: { fecha_inicio: utc(fechaInicio), fecha_fin: fechaFin ? utc(fechaFin) : null } },
      oferta: sinOferta ? null : {
        id: 11, nombre_proyecto: 'Proyecto X', programa_SISS: programa,
        profesor: { usuario_id: profesorUsuarioId, usuario: { nombre: profesorNombre, apellidos: profesorApellidos } },
      },
    },
  };
}

/**
 * `profesores`: { usuario_id → profesor_id }. `usuarios`: { usuario_id → { rubrica_imagen } }. `coordinadores`: usuario_id[].
 * `globales`: reportes globales (reporteGlobal()). `alumnos`: { usuario_id → alumnoGrafo() }. `fallos`: { 'modelo.operacion': Error } falla esa operación. Devuelve { prisma, operaciones, reportes } (los mismos objetos que se pasan: reflejan lo que se escribió).
 */
function crearBdProfesor({ profesores = { 50: 1 }, reportes = [], globales = [], escritura = false, usuarios = {}, coordinadores = [], alumnos = {}, fallos = {} } = {}) {
  const operaciones = [];
  const documentos = () => [...reportes, ...globales].map((r) => r.documento);
  let siguienteRevision = 100000;
  let cola = Promise.resolve();

  // Identidad para la BD falsa de rúbricas (reportes.rubricas.js: rol + boleta o correo, nunca del cliente) —
  // derivada de lo que YA describen `alumnos`/`profesores` y las filas de reportes/globales (alumno de la
  // solicitud, profesor de la oferta), para que las pruebas no tengan que repetirlo en `usuarios`.
  const boletaPorUsuarioId = {};
  for (const [usuarioId, fila] of Object.entries(alumnos)) if (fila?.boleta) boletaPorUsuarioId[usuarioId] = fila.boleta;
  const esProfesor = new Set(Object.keys(profesores).map(Number));
  for (const fila of [...reportes, ...globales]) {
    const al = fila.solicitud_registro?.alumno;
    if (al?.usuario_id != null && al?.boleta) boletaPorUsuarioId[al.usuario_id] = al.boleta;
    const pr = fila.solicitud_registro?.oferta?.profesor;
    if (pr?.usuario_id != null) esProfesor.add(pr.usuario_id);
  }

  // Un modelo de reporte (mensual o global) sobre su lista, y el de sus revisiones (append-only: solo `create`).
  const modeloReporte = (lista) => ({
    findMany: async ({ where }) => lista.filter((r) => coincide(r, where)),
    findFirst: async ({ where }) => lista.find((r) => coincide(r, where)) ?? null,
    updateMany: async ({ where, data }) => {
      const filas = lista.filter((r) => coincide(r, where));
      filas.forEach((f) => Object.assign(f, data));
      return { count: filas.length };
    },
  });
  const modeloRevision = (lista, fk, relacion) => ({
    create: async ({ data }) => {
      const reporte = lista.find((r) => r.id === data[fk]);
      if (!reporte) throw new Error('Violación de llave foránea: reporte inexistente');
      const fila = { id: siguienteRevision += 1, ...data };
      reporte[relacion].push(fila);
      return fila;
    },
  });

  const modelos = {
    profesor: {
      findUnique: async ({ where }) => (where.usuario_id in profesores ? { id: profesores[where.usuario_id], usuario_id: where.usuario_id } : null),
    },
    // CU-REP-04: los datos del alumno para el PDF (`alumnos`: { usuario_id → alumnoGrafo() }).
    alumno: {
      findUnique: async ({ where }) => alumnos[where.usuario_id] ?? null,
    },
    usuario: {
      findUnique: async ({ where }) => {
        const boleta = boletaPorUsuarioId[where.id];
        const conocido = where.id in usuarios || boleta !== undefined || esProfesor.has(where.id);
        if (!conocido) return null;
        const identidad = boleta !== undefined
          ? { rol: 'alumno_asignado', correo_institucional: null, alumno: { boleta } }
          : { rol: 'profesor', correo_institucional: `profesor${where.id}@ipn.mx`, alumno: null };
        return { id: where.id, rubrica_imagen: null, ...identidad, ...usuarios[where.id] };
      },
    },
    coordinador: {
      findMany: async () => coordinadores.map((usuario_id) => ({ usuario_id })),
      findUnique: async ({ where }) => (coordinadores.includes(where.usuario_id) ? { id: where.usuario_id, usuario_id: where.usuario_id } : null),
    },
    reporte_mensual: modeloReporte(reportes),
    reporte_global: modeloReporte(globales),
    documento: {
      findFirst: async ({ where }) => documentos().find((d) => coincide(d, where)) ?? null,
      updateMany: async ({ where, data }) => {
        const filas = documentos().filter((d) => coincide(d, where));
        filas.forEach((f) => Object.assign(f, data));
        return { count: filas.length };
      },
    },
    revision_reporte_mensual: modeloRevision(reportes, 'reporte_mensual_id', 'revision_reporte_mensual'),
    revision_reporte_global: modeloRevision(globales, 'reporte_global_id', 'revision_reporte_global'),
    // Transacción con reversa: si falla, el estado vuelve a como estaba (en el mismo objeto, para que las pruebas lo vean).
    $transaction: async (fn) => {
      const turno = cola;
      let liberar;
      cola = new Promise((resolver) => { liberar = resolver; });
      await turno;
      const respaldo = [reportes, globales].map((lista) => lista.map((r) => structuredClone(r)));
      try {
        return await fn(prisma);
      } catch (err) {
        [reportes, globales].forEach((lista, n) => lista.forEach((r, i) => { for (const k of Object.keys(r)) delete r[k]; Object.assign(r, respaldo[n][i]); }));
        throw err;
      } finally {
        liberar();
      }
    },
  };

  const registrar = (nombre, funcion) => (...args) => {
    operaciones.push(nombre);
    if (!escritura && ESCRITURAS.has(nombre)) throw new Error(`Escritura no permitida en esta prueba: ${nombre}`);
    if (fallos[nombre]) throw fallos[nombre];
    return funcion(...args);
  };

  const prisma = new Proxy({}, {
    get(_, modelo) {
      if (typeof modelo !== 'string') return undefined;
      if (!(modelo in modelos)) throw new Error(`Modelo no permitido en Profesor: ${modelo}`);
      if (modelo === '$transaction') return registrar('$transaction', modelos.$transaction);
      return new Proxy(modelos[modelo], {
        get(objetivo, operacion) {
          if (!(operacion in objetivo)) throw new Error(`Operación no permitida: ${modelo}.${String(operacion)}`);
          return registrar(`${modelo}.${operacion}`, objetivo[operacion]);
        },
      });
    },
  });
  return { prisma, operaciones, reportes, globales };
}

module.exports = { reporteMensual, reporteGlobal, crearBdProfesor, alumnoGrafo, utc };
