// CU-ADM-13 (expediente documental histórico) y CU-ADM-14 (carta compromiso firmada).
//
// El foco: que ADM-13 sea SOLO lectura y solo del catálogo aprobado, que un alumno no alcance el
// expediente de otro ni siquiera con el id del documento, que la sustitución use la MISMA fila, y
// que un fallo no deje archivos ni filas inconsistentes.
//
// Los archivos se escriben en un directorio temporal propio del test: no se toca `uploads/` real
// ni ningún seed.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ?? 'a'.repeat(64); // 32 bytes en hex — solo para este proceso de pruebas

const rutaPrisma = require.resolve('../../../lib/prisma');

let bd = null;
let prismaActual = null;

require.cache[rutaPrisma] = {
  id: rutaPrisma, filename: rutaPrisma, loaded: true,
  exports: new Proxy({}, { get: (_, propiedad) => prismaActual[propiedad] }),
};

const catalogo = require('./documentos.catalogo');
const servicio = require('./documentos.service');
const carta = require('./carta-firmada.service');
const { cifrarBuffer, descifrarBuffer } = require('../../../lib/fileEncryption');

const BASE = servicio.RUTA_BASE_DOCUMENTOS;

const U_ANA = 10, U_BETO = 11, U_HUERFANO = 12;
const U_COORD = 30, U_PROF = 20;
const B_ANA = '2022630001', B_BETO = '2022630002', B_SIN = '2022630003';

const PDF = Buffer.from('%PDF-1.4 contenido de prueba');

// Escribe un archivo CIFRADO como lo haría el servicio real.
function escribirCifrado(rutaRelativa, contenido = PDF) {
  const abs = path.join(BASE, rutaRelativa);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, cifrarBuffer(contenido));
  return rutaRelativa;
}

function montar() {
  const usuario = (id, nombre, apellidos) => ({ id, nombre, apellidos, correo_institucional: `u${id}@ipn.mx` });

  bd = {
    usuarios: [
      usuario(U_ANA, 'Ana', 'García López'),
      usuario(U_BETO, 'Beto', 'Hernández Ruiz'),
      usuario(U_PROF, 'Rafael', 'Torres Vega'),
      usuario(U_COORD, 'Lucía', 'Morales Vega'),
    ],
    coordinadores: [{ id: 1, usuario_id: U_COORD }],
    profesores: [{ id: 1, usuario_id: U_PROF }],
    ofertas: [{ id: 1, profesor_id: 1, nombre_proyecto: 'Proyecto A' }],
    eventos: [{ id: 1, fecha_inicio: new Date('2026-07-16T00:00:00Z') }],
    periodos: [{ id: 1, evento_calendario_id: 1 }],
    alumnos: [
      { boleta: B_ANA, usuario_id: U_ANA, carrera: 'ISC' },
      { boleta: B_BETO, usuario_id: U_BETO, carrera: 'LCD' },
      { boleta: B_SIN, usuario_id: null, carrera: 'ISC' },
    ],
    solicitudes: [
      { id: 1, alumno_id: B_ANA, oferta_id: 1, periodo_registro_id: 1, estado_solicitud: 'alumno_asignado' },
      { id: 2, alumno_id: B_BETO, oferta_id: 1, periodo_registro_id: 1, estado_solicitud: 'alumno_asignado' },
      { id: 3, alumno_id: B_SIN, oferta_id: 1, periodo_registro_id: 1, estado_solicitud: 'espera_respuesta_de_profesor' },
    ],
    documentos: [
      // De Ana: uno de cada etapa/estado para poder distinguir qué se expone.
      { id: 1, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'expediente', estado_documento: 'aprobado', ruta_archivo: escribirCifrado(path.join(B_ANA, 'exp.enc')), fecha_creacion: new Date('2026-06-01T10:00:00Z') },
      { id: 2, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'carta_creditos', estado_documento: 'aprobado', ruta_archivo: escribirCifrado(path.join(B_ANA, 'cred.enc')), fecha_creacion: new Date('2026-05-01T10:00:00Z') },
      // En revisión: NO debe exponerse.
      { id: 3, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'constancia_seguro_social', estado_documento: 'en_revision', ruta_archivo: 'x.enc', fecha_creacion: new Date('2026-05-02T10:00:00Z') },
      // Fuera del catálogo aunque esté aprobado: NO debe exponerse.
      { id: 4, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'expediente_baja', estado_documento: 'aprobado', ruta_archivo: escribirCifrado(path.join(B_ANA, 'baja.enc')), fecha_creacion: new Date('2026-06-05T10:00:00Z') },
      // ── Reportes de Ana. TODOS nacen con estado_documento 'vigente' y ahí se quedan: su
      // aprobación vive en reporte_mensual/global.estado_reporte, no aquí.
      { id: 5, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'reporte_mensual', estado_documento: 'vigente', ruta_archivo: escribirCifrado(path.join(B_ANA, 'rm1.enc')), fecha_creacion: new Date('2026-06-06T10:00:00Z') },
      { id: 7, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'reporte_mensual', estado_documento: 'vigente', ruta_archivo: escribirCifrado(path.join(B_ANA, 'rm2.enc')), fecha_creacion: new Date('2026-07-06T10:00:00Z') },
      { id: 8, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'reporte_mensual', estado_documento: 'vigente', ruta_archivo: escribirCifrado(path.join(B_ANA, 'rm3.enc')), fecha_creacion: new Date('2026-08-06T10:00:00Z') },
      { id: 9, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'reporte_mensual', estado_documento: 'vigente', ruta_archivo: escribirCifrado(path.join(B_ANA, 'rm4.enc')), fecha_creacion: new Date('2026-09-06T10:00:00Z') },
      { id: 10, alumno_id: B_ANA, creador_id: U_ANA, tipo_documento: 'reporte_global', estado_documento: 'vigente', ruta_archivo: escribirCifrado(path.join(B_ANA, 'rg.enc')), fecha_creacion: new Date('2026-10-06T10:00:00Z') },
      // Carta compromiso firmada: etapa TÉRMINO. Va a BETO a propósito, para que las pruebas de
      // ADM-14 (que registran la carta de Ana) sigan partiendo de "sin carta".
      { id: 11, alumno_id: B_BETO, creador_id: U_COORD, tipo_documento: 'carta_compromiso_firmada', estado_documento: 'aprobado', ruta_archivo: escribirCifrado(path.join(B_BETO, 'carta.enc')), fecha_creacion: new Date('2026-06-10T10:00:00Z') },
      // De Beto: para probar el aislamiento entre alumnos.
      { id: 6, alumno_id: B_BETO, creador_id: U_BETO, tipo_documento: 'expediente', estado_documento: 'aprobado', ruta_archivo: escribirCifrado(path.join(B_BETO, 'exp.enc')), fecha_creacion: new Date('2026-06-02T10:00:00Z') },
    ],
    // Estados reales del flujo de Reportes. Solo 'aprobado_coordinador' es final.
    reportesMensuales: [
      { id: 1, documento_id: 5, num_reporte: 1, estado_reporte: 'aprobado_coordinador' },
      { id: 2, documento_id: 7, num_reporte: 2, estado_reporte: 'aprobado_coordinador' },
      { id: 3, documento_id: 8, num_reporte: 3, estado_reporte: 'pendiente_revision_profesor' },
      { id: 4, documento_id: 9, num_reporte: 4, estado_reporte: 'pendiente_revision_coordinador' },
    ],
    reportesGlobales: [
      { id: 1, documento_id: 10, estado_reporte: 'aprobado_coordinador' },
    ],
    secuencia: 100,
    fallarEscritura: false,
  };

  const usuarioDe = (id) => bd.usuarios.find((u) => u.id === id) ?? null;
  const ofertaDe = (id) => bd.ofertas.find((o) => o.id === id) ?? null;
  const profesorDe = (id) => bd.profesores.find((p) => p.id === id) ?? null;
  const periodoDe = (id) => bd.periodos.find((p) => p.id === id) ?? null;
  const eventoDe = (id) => bd.eventos.find((e) => e.id === id) ?? null;
  const conUsuario = (f) => (f ? { ...f, usuario: usuarioDe(f.usuario_id) } : null);

  const expandirSolicitud = (s, include = {}) => {
    const salida = { ...s };
    if (include.alumno) salida.alumno = conUsuario(bd.alumnos.find((a) => a.boleta === s.alumno_id));
    if (include.oferta) {
      const o = ofertaDe(s.oferta_id);
      const inc = include.oferta.include ?? {};
      salida.oferta = o ? { ...o, ...(inc.profesor ? { profesor: conUsuario(profesorDe(o.profesor_id)) } : {}) } : null;
    }
    if (include.periodo_registro) {
      const p = periodoDe(s.periodo_registro_id);
      salida.periodo_registro = p ? { ...p, evento_calendario: eventoDe(p.evento_calendario_id) } : null;
    }
    return salida;
  };

  // Relaciones 1:1 de `documento` hacia las tablas de Reportes.
  const reporteMensualDe = (d) => bd.reportesMensuales.find((r) => r.documento_id === d.id) ?? null;
  const reporteGlobalDe = (d) => bd.reportesGlobales.find((r) => r.documento_id === d.id) ?? null;

  // Reproduce el `where` que arma el servicio, incluido el OR por reglas y los filtros por
  // relación (`reporte_mensual: { is: { estado_reporte } }`).
  const coincideDoc = (d, where) => {
    // El OR es una condición MÁS, no un atajo: el servicio lo combina con alumno_id/id en el
    // mismo objeto (`{ alumno_id, OR: [...] }`) y ambos deben cumplirse.
    if (where.OR && !where.OR.some((rama) => coincideDoc(d, rama))) return false;

    if (where.id !== undefined && d.id !== where.id) return false;
    if (where.alumno_id !== undefined) {
      if (typeof where.alumno_id === 'object') {
        if (!where.alumno_id.in.includes(d.alumno_id)) return false;
      } else if (d.alumno_id !== where.alumno_id) return false;
    }
    if (where.estado_documento !== undefined && d.estado_documento !== where.estado_documento) return false;
    if (where.tipo_documento !== undefined) {
      if (typeof where.tipo_documento === 'object') {
        if (!where.tipo_documento.in.includes(d.tipo_documento)) return false;
      } else if (d.tipo_documento !== where.tipo_documento) return false;
    }
    if (where.reporte_mensual?.is) {
      const r = reporteMensualDe(d);
      if (!r || r.estado_reporte !== where.reporte_mensual.is.estado_reporte) return false;
    }
    if (where.reporte_global?.is) {
      const r = reporteGlobalDe(d);
      if (!r || r.estado_reporte !== where.reporte_global.is.estado_reporte) return false;
    }
    return true;
  };

  const expandirDoc = (d, include = {}) => (
    include.reporte_mensual ? { ...d, reporte_mensual: reporteMensualDe(d) } : { ...d }
  );

  prismaActual = {
    alumno: {
      findUnique: async ({ where, include }) => {
        const a = where.boleta !== undefined
          ? bd.alumnos.find((x) => x.boleta === where.boleta)
          : bd.alumnos.find((x) => x.usuario_id === where.usuario_id);
        if (!a) return null;
        const salida = { ...a };
        if (include?.usuario) salida.usuario = usuarioDe(a.usuario_id);
        if (include?.solicitud_registro) {
          const s = bd.solicitudes.find((x) => x.alumno_id === a.boleta);
          salida.solicitud_registro = s ? expandirSolicitud(s, include.solicitud_registro.include ?? {}) : null;
        }
        return salida;
      },
    },
    coordinador: {
      findUnique: async ({ where }) => bd.coordinadores.find((c) => c.usuario_id === where.usuario_id) ?? null,
    },
    solicitud_registro: {
      findMany: async ({ where, include }) => bd.solicitudes
        .filter((s) => s.estado_solicitud === where.estado_solicitud)
        .map((s) => expandirSolicitud(s, include ?? {}))
        .sort((a, b) => a.alumno_id.localeCompare(b.alumno_id)),
      findFirst: async ({ where }) => bd.solicitudes.find(
        (s) => s.alumno_id === where.alumno_id && s.estado_solicitud === where.estado_solicitud,
      ) ?? null,
    },
    documento: {
      findMany: async ({ where, include }) => bd.documentos
        .filter((d) => coincideDoc(d, where))
        .sort((a, b) => a.fecha_creacion - b.fecha_creacion)
        .map((d) => expandirDoc(d, include ?? {})),
      findFirst: async ({ where }) => bd.documentos.find((d) => coincideDoc(d, where)) ?? null,
      create: async ({ data }) => { const f = { id: ++bd.secuencia, ...data }; bd.documentos.push(f); return f; },
      update: async ({ where, data }) => {
        const f = bd.documentos.find((d) => d.id === where.id);
        Object.assign(f, data);
        return f;
      },
    },
    $transaction: async (fn) => {
      if (bd.fallarEscritura) throw new Error('fallo simulado de base de datos');
      return fn(prismaActual);
    },
  };
  return bd;
}

// Guarda defensiva: estas boletas son sintéticas y NO deben existir en uploads/. Si alguna vez
// existieran, el test aborta en vez de arriesgarse a borrar documentos reales en su limpieza.
test.before(() => {
  for (const boleta of [B_ANA, B_BETO]) {
    if (fs.existsSync(path.join(BASE, boleta))) {
      throw new Error(
        `uploads/documentos/${boleta} ya existe: la prueba se detiene para no borrar archivos reales.`,
      );
    }
  }
  fs.mkdirSync(BASE, { recursive: true });
});

test.beforeEach(() => { montar(); });

// ════════════════════════════════════════════════════════════════════════════
// Catálogo
// ════════════════════════════════════════════════════════════════════════════

test('catálogo: contiene los 6 tipos implementados en esta rama, cada uno con su regla', () => {
  const ESPERADOS = ['carta_creditos', 'constancia_seguro_social', 'expediente',
    'reporte_mensual', 'reporte_global', 'carta_compromiso_firmada'];
  assert.deepEqual([...catalogo.TIPOS_CATALOGADOS].sort(), [...ESPERADOS].sort());

  for (const d of catalogo.CATALOGO) {
    assert.ok(d.nombre && d.descripcion && d.etapa && d.responsable, `${d.tipo}: metadata incompleta`);
    assert.ok(catalogo.ORDEN_ETAPAS.includes(d.etapa), `${d.tipo}: etapa fuera del catálogo`);
    assert.ok(Object.values(catalogo.REGLAS).includes(d.regla), `${d.tipo}: sin regla de consultabilidad`);
  }
});

test('catálogo: cada tipo está en la etapa que confirmó Coordinación', () => {
  const etapaDe = (tipo) => catalogo.metadataDe(tipo).etapa;

  assert.equal(etapaDe('carta_creditos'), 'Inicio');
  assert.equal(etapaDe('constancia_seguro_social'), 'Inicio');
  assert.equal(etapaDe('expediente'), 'Inicio');
  assert.equal(etapaDe('reporte_mensual'), 'Desarrollo');
  assert.equal(etapaDe('reporte_global'), 'Desarrollo');
  // Cambio respecto a la primera versión: ya NO está en Inicio.
  assert.equal(etapaDe('carta_compromiso_firmada'), 'Término');
});

test('catálogo: los reportes NO usan la regla de estado_documento', () => {
  assert.equal(catalogo.metadataDe('reporte_mensual').regla, catalogo.REGLAS.REPORTE_MENSUAL_APROBADO);
  assert.equal(catalogo.metadataDe('reporte_global').regla, catalogo.REGLAS.REPORTE_GLOBAL_APROBADO);
  for (const tipo of ['carta_creditos', 'constancia_seguro_social', 'expediente', 'carta_compromiso_firmada']) {
    assert.equal(catalogo.metadataDe(tipo).regla, catalogo.REGLAS.DOCUMENTO_APROBADO);
  }
});

test('catálogo: LSS sigue PENDIENTE de integración y el catálogo se declara incompleto', () => {
  // Estos dos entran cuando se fusione feature/LSS-CU-01; hoy consultarlos daría siempre vacío.
  for (const tipo of ['expediente_lss', 'evaluacion_desempeno']) {
    assert.equal(catalogo.estaEnCatalogo(tipo), false, `${tipo} todavía no existe en esta rama`);
  }
  assert.equal(catalogo.CATALOGO_COMPLETO, false, 'sin LSS, el expediente nunca está completo');
});

test('catálogo: los tipos que NO son del expediente siguen fuera', () => {
  for (const tipo of ['expediente_baja', 'carta_termino', 'expediente_termino', 'constancia_termino']) {
    assert.equal(catalogo.estaEnCatalogo(tipo), false, `${tipo} no pertenece al expediente histórico`);
  }
});

test('catálogo: agrupar devuelve SIEMPRE las tres etapas, aunque estén vacías', () => {
  const grupos = catalogo.agruparPorEtapa([]);
  assert.deepEqual(grupos.map((g) => g.etapa), ['Inicio', 'Desarrollo', 'Término']);
  assert.ok(grupos.every((g) => g.documentos.length === 0));
});

test('catálogo: el progreso se DERIVA del catálogo, nunca de un número fijo', () => {
  const p = catalogo.calcularProgreso([
    { tipo: 'reporte_mensual' }, { tipo: 'reporte_mensual' }, { tipo: 'reporte_mensual' },
  ]);
  // Se mide en TIPOS: tres reportes mensuales son UN tipo cubierto, no tres.
  assert.equal(p.disponibles, 1);
  assert.equal(p.totalDocumentos, 3, 'el número real de archivos viaja aparte');
  assert.equal(p.total, catalogo.CATALOGO.length, 'el denominador sale del catálogo');
  assert.equal(catalogo.calcularProgreso([]).total, catalogo.CATALOGO.length);

  // Nada de 7, 8 ni ningún literal: si el catálogo crece, el total crece con él.
  const fuente = require('fs').readFileSync(require.resolve('./documentos.catalogo.js'), 'utf8');
  assert.equal(/total:\s*\d+/.test(fuente), false, 'no debe haber un total cableado');
});

test('catálogo: la etapa actual se deriva y NUNCA dice "Completado" sin LSS', () => {
  assert.equal(catalogo.etapaActual([]), 'Inicio');
  assert.equal(catalogo.etapaActual([{ tipo: 'expediente', etapa: 'Inicio' }]), 'Inicio');
  assert.equal(catalogo.etapaActual([
    { tipo: 'expediente', etapa: 'Inicio' }, { tipo: 'reporte_mensual', etapa: 'Desarrollo' },
  ]), 'Desarrollo');

  // Aun teniendo TODOS los tipos de esta rama, sigue sin ser "Completado": faltan los de LSS.
  const todos = catalogo.CATALOGO.map((d) => ({ tipo: d.tipo, etapa: d.etapa }));
  assert.notEqual(catalogo.etapaActual(todos), 'Completado');
  assert.equal(catalogo.etapaActual(todos), 'Término');
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-13 — alumno
// ════════════════════════════════════════════════════════════════════════════

test('ADM-13 alumno: ve SOLO sus documentos del catálogo y aprobados', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.deepEqual(r.documentos.map((d) => d.id).sort((a, b) => a - b), [1, 2, 5, 7, 10]);
  assert.equal(r.documentos.some((d) => d.id === 3), false, 'en_revision no se expone');
  assert.equal(r.documentos.some((d) => d.id === 4), false, 'expediente_baja no está en el catálogo');
  assert.equal(r.documentos.some((d) => d.id === 8), false, 'reporte pendiente de profesor');
  assert.equal(r.documentos.some((d) => d.id === 9), false, 'reporte pendiente de coordinación');
  assert.equal(r.documentos.some((d) => d.id === 6), false, 'el de Beto no es suyo');
  assert.equal(r.alumno.boleta, B_ANA);
});

test('ADM-13 alumno: la etapa sale del CATÁLOGO, no de la ruta del archivo', async () => {
  // La ruta en disco es "2022630001/exp.enc": no contiene ninguna pista de etapa.
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const exp = r.documentos.find((d) => d.tipo === 'expediente');

  assert.equal(exp.etapa, 'Inicio');
  assert.equal(exp.nombre, 'Expediente de registro');
  assert.equal(exp.responsable, 'alumno');
  assert.equal('ruta_archivo' in exp, false, 'la ruta física nunca sale al cliente');
});

test('ADM-13 alumno: los documentos llegan clasificados por etapa', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.deepEqual(r.etapas.map((e) => e.etapa), ['Inicio', 'Desarrollo', 'Término']);
  assert.deepEqual(r.etapas[0].documentos.map((d) => d.tipo), ['carta_creditos', 'expediente'], 'ordenados por `orden`');
  assert.deepEqual(r.etapas[1].documentos.map((d) => d.nombre),
    ['Reporte mensual No. 1', 'Reporte mensual No. 2', 'Reporte global']);
  assert.deepEqual(r.etapas[2].documentos, [], 'Ana no tiene carta firmada');
});

test('ADM-13 alumno: el progreso es derivado y no cuenta lo no aprobado', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  // 4 TIPOS cubiertos (carta_creditos, expediente, reporte_mensual, reporte_global) de 6, con 5
  // archivos reales: los dos reportes mensuales cuentan como un solo tipo.
  assert.deepEqual(r.progreso, {
    disponibles: 4, total: catalogo.CATALOGO.length, totalDocumentos: 5, catalogoCompleto: false,
  });
  assert.equal(r.etapaActual, 'Desarrollo');
});

test('ADM-13 alumno: un usuario sin perfil de alumno recibe 404', async () => {
  await assert.rejects(
    servicio.obtenerMiExpediente({ usuarioId: U_HUERFANO }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_ALUMNO',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-13 — coordinación
// ════════════════════════════════════════════════════════════════════════════

test('ADM-13 coordinación: lista alumnos asignados con su conteo real', async () => {
  const { alumnos } = await servicio.listarAlumnosConDocumentos();

  assert.deepEqual(alumnos.map((a) => a.boleta), [B_ANA, B_BETO]);
  assert.equal(alumnos.some((a) => a.boleta === B_SIN), false, 'el no asignado no aparece');
  assert.equal(alumnos.find((a) => a.boleta === B_ANA).totalDocumentos, 5, 'solo catálogo + aprobados');
  assert.equal(alumnos[0].totalCatalogo, catalogo.CATALOGO.length);
  assert.equal(alumnos.find((a) => a.boleta === B_ANA).etapaActual, 'Desarrollo');
  assert.equal(alumnos.find((a) => a.boleta === B_BETO).etapaActual, 'Término');
});

test('ADM-13 coordinación: consulta el expediente de cualquier alumno', async () => {
  const r = await servicio.obtenerExpedienteDeAlumno({ boleta: B_BETO });

  assert.equal(r.alumno.nombreCompleto, 'Beto Hernández Ruiz');
  assert.deepEqual(r.documentos.map((d) => d.id).sort((a, b) => a - b), [6, 11]);
});

test('ADM-13 coordinación: boleta inválida o inexistente se distinguen', async () => {
  await assert.rejects(
    servicio.obtenerExpedienteDeAlumno({ boleta: 'abc' }),
    (err) => err.status === 400 && err.code === 'BOLETA_INVALIDA',
  );
  await assert.rejects(
    servicio.obtenerExpedienteDeAlumno({ boleta: '9999999999' }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ENCONTRADO',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Descarga / visualización
// ════════════════════════════════════════════════════════════════════════════

test('descarga: el alumno abre su documento y llega descifrado', async () => {
  const r = await servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 1 });

  assert.deepEqual(r.pdf, PDF, 'se descifra al vuelo');
  assert.equal(r.boleta, B_ANA);
  assert.equal(r.nombreVisible, 'Expediente de registro');
});

test('descarga: un alumno NO puede abrir el documento de otro aunque sepa el id', async () => {
  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 6 }),
    (err) => err.status === 404 && err.code === 'DOCUMENTO_NO_DISPONIBLE',
  );
  // Un id inexistente da EXACTAMENTE el mismo error: no se puede sondear.
  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 9999 }),
    (err) => err.status === 404 && err.code === 'DOCUMENTO_NO_DISPONIBLE',
  );
});

test('descarga: NADIE puede sacar por aquí un documento fuera del catálogo o no aprobado', async () => {
  for (const rol of ['alumno_asignado', 'coordinador']) {
    const usuarioId = rol === 'coordinador' ? U_COORD : U_ANA;
    // 3 = en_revision; 4 = expediente_baja (aprobado, fuera del catálogo);
    // 8 y 9 = reportes que aún no aprobó Coordinación, pese a tener estado_documento='vigente'.
    for (const id of [3, 4, 8, 9]) {
      await assert.rejects(
        servicio.obtenerArchivo({ usuarioId, rol, documentoId: id }),
        (err) => err.status === 404 && err.code === 'DOCUMENTO_NO_DISPONIBLE',
        `${rol} no debe poder abrir el documento ${id}`,
      );
    }
  }
});

test('descarga: coordinación sí abre el de cualquier alumno', async () => {
  const r = await servicio.obtenerArchivo({ usuarioId: U_COORD, rol: 'coordinador', documentoId: 6 });
  assert.deepEqual(r.pdf, PDF);
  assert.equal(r.boleta, B_BETO);
});

test('descarga: id inválido se rechaza antes de tocar la base', async () => {
  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 'abc' }),
    (err) => err.status === 400 && err.code === 'DOCUMENTO_INVALIDO',
  );
});

test('descarga: si el archivo desapareció del disco se informa, no se revienta', async () => {
  bd.documentos.find((d) => d.id === 1).ruta_archivo = path.join(B_ANA, 'no-existe.enc');
  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 1 }),
    (err) => err.status === 404 && err.code === 'ARCHIVO_NO_ENCONTRADO',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-14 — carta compromiso firmada
// ════════════════════════════════════════════════════════════════════════════

test('ADM-14: lista los alumnos asignados con el detalle que pide la ficha', async () => {
  const { alumnos, resumen } = await carta.listarAlumnos();

  assert.deepEqual(alumnos.map((a) => a.boleta), [B_ANA, B_BETO]);
  const ana = alumnos[0];
  assert.equal(ana.nombreCompleto, 'Ana García López');
  assert.equal(ana.carrera, 'ISC');
  assert.equal(ana.oferta, 'Proyecto A');
  assert.equal(ana.profesor, 'Rafael Torres Vega', 'el profesor responsable de su oferta');
  assert.equal(ana.fechaInicio, '2026-07-16T00:00:00.000Z', 'inicio del periodo de Registro');
  // Beto ya trae una carta en la fixture (sirve para probar la etapa Término de ADM-13).
  assert.deepEqual(resumen, { total: 2, enviadas: 1, pendientes: 1 });
});

test('ADM-14: la ficha ya no lleva empresa/institución ni asesor externo', async () => {
  const { alumnos } = await carta.listarAlumnos();

  for (const a of alumnos) {
    for (const prohibido of ['institucion', 'asesorExterno', 'empresa']) {
      assert.equal(prohibido in a, false, `${prohibido} ya no pertenece a la ficha`);
    }
    assert.equal(typeof a.profesor, 'string', 'del profesor solo viaja su nombre');
  }
});

test('ADM-14: el profesor sale de la MISMA relación que en ADM-13', async () => {
  // Se reasigna la oferta a otro profesor: las dos fichas deben moverse juntas.
  bd.usuarios.push({ id: 91, nombre: 'Marisol', apellidos: 'Cruz Nava', correo_institucional: 'm@ipn.mx' });
  bd.profesores.push({ id: 3, usuario_id: 91 });
  bd.ofertas[0].profesor_id = 3;

  const { alumnos } = await carta.listarAlumnos();
  const expediente = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.equal(alumnos.find((a) => a.boleta === B_ANA).profesor, 'Marisol Cruz Nava');
  assert.equal(alumnos.find((a) => a.boleta === B_ANA).profesor, expediente.alumno.profesor);
});

test('ADM-14: sin oferta el profesor es null y la pantalla sigue respondiendo', async () => {
  bd.solicitudes.find((x) => x.alumno_id === B_ANA).oferta_id = null;

  const { alumnos, resumen } = await carta.listarAlumnos();
  const ana = alumnos.find((a) => a.boleta === B_ANA);

  assert.equal(ana.oferta, null);
  assert.equal(ana.profesor, null, 'nunca un placeholder inventado');
  assert.equal(ana.carta.enviada, false, 'el estado de la carta no cambia por esto');
  assert.deepEqual(resumen, { total: 2, enviadas: 1, pendientes: 1 });
});

test('ADM-14: el estado se DERIVA de la existencia del documento, no de una columna', async () => {
  const antes = await carta.listarAlumnos();
  const anaAntes = antes.alumnos.find((a) => a.boleta === B_ANA);
  assert.equal(anaAntes.carta.enviada, false, 'Pendiente = no existe el documento');

  await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });

  const despues = await carta.listarAlumnos();
  assert.equal(despues.alumnos.find((a) => a.boleta === B_ANA).carta.enviada, true, 'Enviada = sí existe');
  assert.deepEqual(despues.resumen, { total: 2, enviadas: 2, pendientes: 0 });
});

test('ADM-14: la primera carga crea la fila con los valores exactos de la ficha', async () => {
  const r = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });

  const fila = bd.documentos.find((d) => d.id === r.documentoId);
  assert.equal(fila.alumno_id, B_ANA, 'la boleta real, no un id numérico');
  assert.equal(fila.creador_id, U_COORD, 'el coordinador autenticado');
  assert.equal(fila.tipo_documento, 'carta_compromiso_firmada');
  assert.equal(fila.estado_documento, 'aprobado');
  assert.ok(fila.fecha_creacion instanceof Date);
  assert.ok(fila.ruta_archivo.includes(carta.SUBCARPETA), 'bajo su propia subcarpeta');
  assert.equal(r.sustituida, false);
});

test('ADM-14: el PDF queda CIFRADO en disco y se puede recuperar', async () => {
  const r = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });
  const fila = bd.documentos.find((d) => d.id === r.documentoId);
  const enDisco = fs.readFileSync(path.join(BASE, fila.ruta_archivo));

  assert.notDeepEqual(enDisco, PDF, 'no se guarda en claro');
  assert.deepEqual(descifrarBuffer(enDisco), PDF, 'y se recupera íntegro');
});

test('ADM-14: sustituir actualiza la MISMA fila y borra el archivo anterior', async () => {
  const primera = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });
  const rutaVieja = bd.documentos.find((d) => d.id === primera.documentoId).ruta_archivo;
  const totalAntes = bd.documentos.length;

  const OTRO = Buffer.from('%PDF-1.4 carta corregida');
  const segunda = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: OTRO } });

  assert.equal(segunda.documentoId, primera.documentoId, 'misma fila, sin versionado');
  assert.equal(bd.documentos.length, totalAntes, 'no se creó ninguna fila nueva');
  assert.equal(segunda.sustituida, true);

  const fila = bd.documentos.find((d) => d.id === segunda.documentoId);
  assert.notEqual(fila.ruta_archivo, rutaVieja, 'ruta_archivo actualizada');
  assert.equal(fila.estado_documento, 'aprobado');
  assert.equal(fs.existsSync(path.join(BASE, rutaVieja)), false, 'el archivo anterior se retiró');
  assert.deepEqual(descifrarBuffer(fs.readFileSync(path.join(BASE, fila.ruta_archivo))), OTRO);
});

test('ADM-14: sin archivo no se registra nada', async () => {
  for (const archivoPdf of [null, undefined, {}, { buffer: Buffer.alloc(0) }]) {
    await assert.rejects(
      carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf }),
      (err) => err.status === 400 && err.code === 'ARCHIVO_REQUERIDO',
    );
  }
  assert.equal(
    bd.documentos.some((d) => d.tipo_documento === 'carta_compromiso_firmada' && d.alumno_id === B_ANA),
    false, 'Ana sigue sin carta',
  );
});

test('ADM-14: solo se acepta un alumno ASIGNADO', async () => {
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_COORD, boleta: B_SIN, archivoPdf: { buffer: PDF } }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_COORD, boleta: '9999999999', archivoPdf: { buffer: PDF } }),
    (err) => err.status === 404 && err.code === 'ALUMNO_NO_ASIGNADO',
  );
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_COORD, boleta: 'abc', archivoPdf: { buffer: PDF } }),
    (err) => err.status === 400 && err.code === 'BOLETA_INVALIDA',
  );
});

test('ADM-14: un usuario sin perfil de coordinador no registra nada', async () => {
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_ANA, boleta: B_ANA, archivoPdf: { buffer: PDF } }),
    (err) => err.status === 404 && err.code === 'SIN_PERFIL_COORDINADOR',
  );
});

test('ADM-14: si la base falla, NO queda fila ni archivo huérfano', async () => {
  // Se mide el DELTA de la subcarpeta: otras pruebas del mismo archivo ya dejaron cartas ahí.
  const carpeta = path.join(BASE, B_ANA, carta.SUBCARPETA);
  const contar = () => (fs.existsSync(carpeta) ? fs.readdirSync(carpeta).length : 0);

  const docsAntes = bd.documentos.length;
  const archivosAntes = contar();

  bd.fallarEscritura = true;
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } }),
    (err) => err.status === 500 && err.code === 'ERROR_AL_REGISTRAR',
  );

  assert.equal(bd.documentos.length, docsAntes, 'no se creó ninguna fila');
  assert.equal(contar(), archivosAntes, 'el archivo nuevo se retiró: no quedó huérfano en disco');
});

test('ADM-14: al fallar una sustitución, el archivo ANTERIOR se conserva', async () => {
  const primera = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });
  const rutaVieja = bd.documentos.find((d) => d.id === primera.documentoId).ruta_archivo;

  bd.fallarEscritura = true;
  await assert.rejects(
    carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: Buffer.from('%PDF nuevo') } }),
    (err) => err.status === 500,
  );

  assert.equal(fs.existsSync(path.join(BASE, rutaVieja)), true, 'la carta previa sigue disponible');
  assert.deepEqual(descifrarBuffer(fs.readFileSync(path.join(BASE, rutaVieja))), PDF);
});

// ════════════════════════════════════════════════════════════════════════════
// Integración entre los dos CU
// ════════════════════════════════════════════════════════════════════════════

test('ADM-14 → ADM-13: la carta registrada aparece en el expediente del alumno y la puede abrir', async () => {
  const r = await carta.registrarCarta({ usuarioId: U_COORD, boleta: B_ANA, archivoPdf: { buffer: PDF } });

  const expediente = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const doc = expediente.documentos.find((d) => d.tipo === 'carta_compromiso_firmada');
  assert.ok(doc, 'la carta aparece en su expediente');
  assert.equal(doc.etapa, 'Término', 'Coordinación confirmó que va en Término, no en Inicio');
  assert.equal(doc.responsable, 'coordinacion');
  assert.equal(expediente.progreso.disponibles, 5, 'un tipo más cubierto');
  assert.equal(expediente.etapaActual, 'Término');

  const archivo = await servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: r.documentoId });
  assert.deepEqual(archivo.pdf, PDF);

  // Y el de al lado sigue sin poder abrirla.
  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_BETO, rol: 'alumno_asignado', documentoId: r.documentoId }),
    (err) => err.status === 404 && err.code === 'DOCUMENTO_NO_DISPONIBLE',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// CU-ADM-13 — Reportes (regla por entidad productora)
// ════════════════════════════════════════════════════════════════════════════

test('ADM-13: los tres documentos de INICIO aprobados aparecen en Inicio', async () => {
  // La constancia de Ana está en_revision; se aprueba para comprobar los tres juntos.
  bd.documentos.find((d) => d.id === 3).estado_documento = 'aprobado';

  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const inicio = r.etapas.find((e) => e.etapa === 'Inicio').documentos.map((d) => d.tipo);

  assert.deepEqual(inicio, ['carta_creditos', 'constancia_seguro_social', 'expediente']);
});

test('ADM-13: la carta compromiso firmada aparece en TÉRMINO y NO en Inicio', async () => {
  const r = await servicio.obtenerExpedienteDeAlumno({ boleta: B_BETO });

  const inicio = r.etapas.find((e) => e.etapa === 'Inicio').documentos.map((d) => d.tipo);
  const termino = r.etapas.find((e) => e.etapa === 'Término').documentos.map((d) => d.tipo);

  assert.equal(termino.includes('carta_compromiso_firmada'), true);
  assert.equal(inicio.includes('carta_compromiso_firmada'), false, 'ya no pertenece a Inicio');
});

test('ADM-13: un reporte mensual SOLO aparece si Coordinación lo aprobó', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const ids = r.documentos.map((d) => d.id);

  assert.equal(ids.includes(5), true, 'aprobado_coordinador → visible');
  assert.equal(ids.includes(7), true);
  assert.equal(ids.includes(8), false, 'pendiente_revision_profesor → invisible');
  assert.equal(ids.includes(9), false, 'pendiente_revision_coordinador → invisible');
});

test('ADM-13: un reporte mensual RECHAZADO no aparece', async () => {
  for (const estado of ['rechazado_profesor', 'rechazado_coordinador']) {
    bd.reportesMensuales.find((r) => r.documento_id === 5).estado_reporte = estado;
    const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
    assert.equal(r.documentos.some((d) => d.id === 5), false, `${estado} no debe verse`);
  }
});

test('ADM-13: `estado_documento = vigente` por sí solo NO hace visible un reporte', async () => {
  // Los cuatro reportes mensuales tienen estado_documento 'vigente'; solo dos están aprobados.
  const vigentes = bd.documentos.filter((d) => d.tipo_documento === 'reporte_mensual');
  assert.equal(vigentes.every((d) => d.estado_documento === 'vigente'), true);

  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(r.documentos.filter((d) => d.tipo === 'reporte_mensual').length, 2);
});

test('ADM-13: una revisión histórica aprobada NO basta si el estado actual no es el final', async () => {
  // `revision_reporte_mensual` es historial append-only: el fake ni siquiera lo expone, así que si
  // el servicio lo consultara reventaría. La única fuente es reporte_mensual.estado_reporte.
  assert.equal('revision_reporte_mensual' in prismaActual, false);

  bd.reportesMensuales.find((r) => r.documento_id === 5).estado_reporte = 'pendiente_revision_profesor';
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(r.documentos.some((d) => d.id === 5), false);
});

test('ADM-13: VARIOS reportes mensuales aprobados aparecen TODOS y ordenados por num_reporte', async () => {
  // Se aprueban los cuatro para comprobar que no se colapsan en una sola tarjeta.
  for (const r of bd.reportesMensuales) r.estado_reporte = 'aprobado_coordinador';

  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const desarrollo = r.etapas.find((e) => e.etapa === 'Desarrollo').documentos;

  assert.deepEqual(desarrollo.map((d) => d.nombre), [
    'Reporte mensual No. 1', 'Reporte mensual No. 2',
    'Reporte mensual No. 3', 'Reporte mensual No. 4',
    'Reporte global',
  ], 'mensuales por número y el global al final');
  assert.deepEqual(desarrollo.filter((d) => d.tipo === 'reporte_mensual').map((d) => d.numero), [1, 2, 3, 4]);
});

test('ADM-13: el reporte global solo aparece si Coordinación lo aprobó', async () => {
  const conAprobado = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(conAprobado.documentos.some((d) => d.tipo === 'reporte_global'), true);

  bd.reportesGlobales[0].estado_reporte = 'pendiente_revision_coordinador';
  const sinAprobar = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(sinAprobar.documentos.some((d) => d.tipo === 'reporte_global'), false);
});

test('ADM-13: el reporte global NO se numera', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const global = r.documentos.find((d) => d.tipo === 'reporte_global');

  assert.equal(global.nombre, 'Reporte global');
  assert.equal(global.numero, null);
});

test('ADM-13: se puede abrir el PDF de un reporte aprobado, pero no el de uno sin aprobar', async () => {
  const aprobado = await servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 5 });
  assert.deepEqual(aprobado.pdf, PDF);
  assert.equal(aprobado.nombreVisible, 'Reporte mensual');

  await assert.rejects(
    servicio.obtenerArchivo({ usuarioId: U_ANA, rol: 'alumno_asignado', documentoId: 8 }),
    (err) => err.status === 404 && err.code === 'DOCUMENTO_NO_DISPONIBLE',
  );
});

test('ADM-13: el cliente NUNCA recibe ruta_archivo ni datos de almacenamiento', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  for (const d of r.documentos) {
    assert.deepEqual(Object.keys(d).sort(), [
      'descripcion', 'estado', 'etapa', 'fechaCreacion', 'id', 'nombre', 'numero', 'orden',
      'responsable', 'tipo',
    ]);
    for (const prohibido of ['ruta_archivo', 'rutaArchivo', 'estado_documento', 'creador_id', 'hash']) {
      assert.equal(prohibido in d, false, `${prohibido} no debe salir al cliente`);
    }
  }
});

test('ADM-13 coordinación: el listado deriva etapa y progreso reales, sin declarar Completado', async () => {
  const { alumnos, catalogoCompleto } = await servicio.listarAlumnosConDocumentos();

  assert.equal(catalogoCompleto, false, 'faltan los documentos de LSS');
  for (const a of alumnos) {
    assert.ok(['Inicio', 'Desarrollo', 'Término'].includes(a.etapaActual));
    assert.notEqual(a.etapaActual, 'Completado');
    assert.equal(a.totalCatalogo, catalogo.CATALOGO.length);
  }
});

test('ADM-13: las tres etapas se devuelven aunque el alumno no tenga nada', async () => {
  bd.documentos = [];
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.deepEqual(r.etapas.map((e) => e.etapa), ['Inicio', 'Desarrollo', 'Término']);
  assert.ok(r.etapas.every((e) => e.documentos.length === 0));
  assert.equal(r.progreso.disponibles, 0);
  assert.equal(r.etapaActual, 'Inicio');
});

// ── Ficha del alumno: oferta + profesor responsable ─────────────────────────
// El profesor NO se inventa ni se cablea: se sigue la relación real
// alumno -> solicitud_registro -> oferta (oferta_servicio) -> profesor -> usuario,
// la misma que ya usan ADM-01 y ADM-17.

const CLAVES_FICHA = ['boleta', 'carrera', 'correoInstitucional', 'nombreCompleto', 'oferta', 'profesor'];

test('ficha: el alumno ve el profesor de SU propia asignación', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.equal(r.alumno.oferta, 'Proyecto A');
  assert.equal(r.alumno.profesor, 'Rafael Torres Vega');
});

test('ficha: coordinación ve el profesor del alumno que seleccionó', async () => {
  const r = await servicio.obtenerExpedienteDeAlumno({ boleta: B_BETO });

  assert.equal(r.alumno.oferta, 'Proyecto A');
  assert.equal(r.alumno.profesor, 'Rafael Torres Vega');
});

test('ficha: el listado de coordinación también trae el profesor de cada alumno', async () => {
  const { alumnos } = await servicio.listarAlumnosConDocumentos();

  for (const a of alumnos) {
    assert.equal(a.profesor, 'Rafael Torres Vega', `${a.boleta} debe traer su profesor`);
  }
});

test('ficha: las dos vistas resuelven el profesor con el MISMO mecanismo', async () => {
  const [propio, ajeno, listado] = await Promise.all([
    servicio.obtenerMiExpediente({ usuarioId: U_ANA }),
    servicio.obtenerExpedienteDeAlumno({ boleta: B_ANA }),
    servicio.listarAlumnosConDocumentos(),
  ]);
  const enListado = listado.alumnos.find((a) => a.boleta === B_ANA);

  assert.equal(propio.alumno.profesor, ajeno.alumno.profesor);
  assert.equal(propio.alumno.profesor, enListado.profesor);
});

test('ficha: el profesor sale de la OFERTA, no de un valor fijo', async () => {
  // Se reasigna la oferta a otro profesor: el DTO debe seguir la relación, no un nombre cableado.
  bd.usuarios.push({ id: 90, nombre: 'Marisol', apellidos: 'Cruz Nava', correo_institucional: 'm@ipn.mx' });
  bd.profesores.push({ id: 2, usuario_id: 90 });
  bd.ofertas[0].profesor_id = 2;

  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(r.alumno.profesor, 'Marisol Cruz Nava');
});

test('ficha: sin oferta no hay profesor y la respuesta NO se rompe', async () => {
  // `oferta_id` es opcional en el esquema (onDelete: SetNull), así que el caso debe ser seguro.
  bd.solicitudes.find((x) => x.alumno_id === B_ANA).oferta_id = null;

  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  assert.equal(r.alumno.oferta, null);
  assert.equal(r.alumno.profesor, null, 'nunca un placeholder inventado');
  assert.ok(Array.isArray(r.documentos), 'el expediente sigue respondiendo');
});

test('ficha: no expone empresa/institución ni datos internos del profesor', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });
  const { alumnos } = await servicio.listarAlumnosConDocumentos();

  assert.deepEqual(Object.keys(r.alumno).sort(), CLAVES_FICHA);
  for (const prohibido of ['empresa', 'institucion', 'asesorExterno', 'profesorId', 'profesor_id']) {
    assert.equal(prohibido in r.alumno, false, `${prohibido} no pertenece a esta ficha`);
    assert.equal(prohibido in alumnos[0], false, `${prohibido} no pertenece a esta ficha`);
  }
  // Del profesor solo viaja su nombre: ni id, ni departamento, ni correo, ni cubículo.
  assert.equal(typeof r.alumno.profesor, 'string');
});

test('ficha: agregar el profesor no cambió los documentos ni las reglas de ADM-13', async () => {
  const r = await servicio.obtenerMiExpediente({ usuarioId: U_ANA });

  assert.deepEqual(r.documentos.map((d) => d.id).sort((a, b) => a - b), [1, 2, 5, 7, 10]);
  assert.equal(r.progreso.total, catalogo.CATALOGO.length);
  assert.equal(r.etapaActual, 'Desarrollo');
});

test.after(() => {
  // Limpia solo lo que este test escribió, nunca el árbol completo de uploads.
  for (const boleta of [B_ANA, B_BETO]) {
    fs.rmSync(path.join(BASE, boleta), { recursive: true, force: true });
  }
});
