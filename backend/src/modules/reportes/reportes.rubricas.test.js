// Rúbrica del alumno (CU-REP-01, fase 4): BD falsa en memoria y carpeta temporal real; sin BD, Redis ni TSA.

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');

const {
  LIMITE_BYTES,
  LIMITES_IMAGEN,
  guardarRubrica,
  obtenerRubricaAlumno,
} = require('./reportes.rubricas');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { construirDatosPdf, generarPdfReporteMensual } = require('./reportes.pdf');
const { prepararReporteMensual } = require('./reportes-alumno.service');
const { crearPng, crearPngRuido, JPEG_PEQUENO, resultadoEjemplo, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');

const AHORA = new Date('2026-09-20T18:30:00.000Z');
const PNG = crearPng(400, 140);

// BD falsa: solo `usuario`, con la misma semántica condicional (WHERE rubrica_imagen IS NULL) que la real.
function crearBd({ usuarios = { 7: { id: 7, rubrica_imagen: null } }, antesDeActualizar, falloActualizar } = {}) {
  const llamadas = { findUnique: 0, updateMany: [] };
  const bd = {
    usuario: {
      findUnique: async ({ where }) => {
        llamadas.findUnique += 1;
        const u = usuarios[where.id];
        return u ? { id: u.id, rubrica_imagen: u.rubrica_imagen } : null;
      },
      updateMany: async ({ where, data }) => {
        llamadas.updateMany.push({ where, data });
        if (falloActualizar) throw falloActualizar;
        if (antesDeActualizar) await antesDeActualizar();
        const u = usuarios[where.id];
        if (!u || (where.rubrica_imagen === null && u.rubrica_imagen !== null)) return { count: 0 };
        Object.assign(u, data);
        return { count: 1 };
      },
    },
  };
  return { bd, usuarios, llamadas };
}

function carpetaTemporal(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'rubricas-test-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return base;
}

const archivosEn = (base) => fs.readdirSync(base, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name));

async function guardar(t, archivo, { escenario = crearBd(), base = carpetaTemporal(t), usuarioId = 7, ip = '187.190.10.20' } = {}) {
  const r = await guardarRubrica(usuarioId, archivo, { ip, prisma: escenario.bd, ahora: AHORA, rutaBase: base });
  return { r, base, ...escenario };
}

// ── Guardado ─────────────────────────────────────────────────

test('primera subida: guarda el PNG cifrado, registra ruta relativa, IP y fecha, y responde solo el estado', async (t) => {
  const { r, base, usuarios } = await guardar(t, { buffer: PNG });

  assert.deepEqual(r, { tieneRubrica: true, requiereSubirRubrica: false, fechaRegistro: AHORA.toISOString() });

  const usuario = usuarios[7];
  assert.match(usuario.rubrica_imagen, /^7\/[0-9a-f-]{36}\.enc$/, 'ruta relativa <usuario_id>/<uuid>');
  assert.equal(usuario.rubrica_ip, '187.190.10.20');
  assert.equal(usuario.rubrica_fecha_registro, AHORA);

  const archivos = archivosEn(base);
  assert.equal(archivos.length, 1);
  assert.equal(path.relative(base, archivos[0]).split(path.sep).join('/'), usuario.rubrica_imagen);

  // Nada de la ruta ni de los bytes sale en la respuesta.
  const texto = JSON.stringify(r);
  assert.equal(texto.includes(usuario.rubrica_imagen), false);
  assert.equal(texto.includes(path.basename(archivos[0])), false);
  assert.equal(texto.includes(base), false);
});

test('el archivo en disco está cifrado (no es la imagen) y al descifrarlo devuelve exactamente los bytes subidos', async (t) => {
  const { base } = await guardar(t, { buffer: PNG });
  const [archivo] = archivosEn(base);
  const enDisco = fs.readFileSync(archivo);

  assert.equal(enDisco.includes(Buffer.from('PNG')), false, 'no contiene la cabecera PNG');
  assert.equal(enDisco.includes(PNG.subarray(40, 80)), false, 'no contiene fragmentos de la imagen');
  assert.ok(enDisco.length > PNG.length, 'IV + authTag + datos');
  assert.deepEqual(descifrarBuffer(enDisco), PNG);
  if (process.platform !== 'win32') assert.equal(fs.statSync(archivo).mode & 0o077, 0, 'solo el propietario puede leerlo');
});

test('acepta también JPEG', async (t) => {
  const { base, usuarios } = await guardar(t, { buffer: JPEG_PEQUENO });
  assert.deepEqual(descifrarBuffer(fs.readFileSync(archivosEn(base)[0])), JPEG_PEQUENO);
  assert.ok(usuarios[7].rubrica_imagen);
});

test('acepta un Buffer de multer y no depende del nombre ni del tipo declarado por el cliente', async (t) => {
  const { usuarios } = await guardar(t, { buffer: Buffer.from(PNG), originalname: '../../etc/passwd.exe', mimetype: 'application/x-msdownload' });
  assert.ok(usuarios[7].rubrica_imagen.startsWith('7/'));
  assert.equal(usuarios[7].rubrica_imagen.includes('passwd'), false);
});

test('la IP se guarda solo si es válida para la columna (máx. 45 caracteres)', async (t) => {
  for (const ip of [null, '', 'x'.repeat(46), 12345]) {
    const { usuarios } = await guardar(t, { buffer: PNG }, { ip, escenario: crearBd() });
    assert.equal(usuarios[7].rubrica_ip, null, String(ip));
  }
  const v6 = await guardar(t, { buffer: PNG }, { ip: '::ffff:187.190.10.20', escenario: crearBd() });
  assert.equal(v6.usuarios[7].rubrica_ip, '::ffff:187.190.10.20');
});

// ── Validaciones ─────────────────────────────────────────────

async function rechazado(t, archivo, esperado, opciones = {}) {
  const escenario = crearBd();
  const base = carpetaTemporal(t);
  await assert.rejects(
    () => guardarRubrica(7, archivo, { prisma: escenario.bd, ahora: AHORA, rutaBase: base, ...opciones }),
    (err) => err.code === esperado.code && err.status === esperado.status,
  );
  assert.deepEqual(archivosEn(base), [], 'no queda ningún archivo');
  assert.equal(escenario.llamadas.updateMany.length, 0, 'no se toca la BD');
  assert.equal(escenario.usuarios[7].rubrica_imagen, null);
}

test('sin archivo → 400 RUBRICA_REQUERIDA', async (t) => {
  for (const archivo of [undefined, null, {}, { buffer: Buffer.alloc(0) }, { buffer: 'texto' }]) {
    await rechazado(t, archivo, { code: 'RUBRICA_REQUERIDA', status: 400 });
  }
});

test('más de 3 MB → 413 RUBRICA_MUY_GRANDE', async (t) => {
  assert.equal(LIMITE_BYTES, 3 * 1024 * 1024);
  await rechazado(t, { buffer: Buffer.concat([PNG, Buffer.alloc(LIMITE_BYTES)]) }, { code: 'RUBRICA_MUY_GRANDE', status: 413 });
  await rechazado(t, { buffer: Buffer.alloc(LIMITE_BYTES + 1) }, { code: 'RUBRICA_MUY_GRANDE', status: 413 });
});

test('el límite es de 3 MB exactos: con 3 MB ya no es "muy grande" (se evalúa como imagen) y una imagen válida de más de 1 MB se acepta', async (t) => {
  // Exactamente 3 MB de basura pasa la comprobación de tamaño y cae en la validación de imagen.
  await rechazado(t, { buffer: Buffer.alloc(LIMITE_BYTES) }, { code: 'IMAGEN_INVALIDA', status: 422 });

  const grande = crearPngRuido(700, 700); // ≈ 1.96 MB, incompresible
  assert.ok(grande.length > 1024 * 1024 && grande.length < LIMITE_BYTES, `${grande.length} bytes`);
  const { base, usuarios } = await guardar(t, { buffer: grande });
  assert.ok(usuarios[7].rubrica_imagen);
  assert.deepEqual(descifrarBuffer(fs.readFileSync(archivosEn(base)[0])), grande);
});

test('archivos que no son imagen o están dañados → 422 IMAGEN_INVALIDA (con las protecciones de la fase 3)', async (t) => {
  const corrupto = Buffer.from(PNG);
  corrupto.fill(0x00, 40, corrupto.length - 20);
  const malos = [
    Buffer.from('%PDF-1.7 no soy una imagen'),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    Buffer.from('MZ\u0090\u0000 ejecutable disfrazado'),
    Buffer.from(PNG.subarray(0, 60)),                       // PNG truncado (colgaba a pdf-lib)
    Buffer.from(PNG.subarray(0, PNG.length - 12)),          // sin IEND
    corrupto,                                               // CRC roto
    Buffer.from(JPEG_PEQUENO.subarray(0, 100)),
    Buffer.from(JPEG_PEQUENO.subarray(0, JPEG_PEQUENO.length - 40)),
    Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200)]),
  ];
  for (const buffer of malos) await rechazado(t, { buffer }, { code: 'IMAGEN_INVALIDA', status: 422 });
});

test('dimensiones excesivas → 422 IMAGEN_INVALIDA sin decodificar (límite propio de rúbricas)', async (t) => {
  assert.deepEqual({ ...LIMITES_IMAGEN }, { maxLado: 4000, maxPixeles: 8_000_000 });
  await rechazado(t, { buffer: crearPng(4100, 2) }, { code: 'IMAGEN_INVALIDA', status: 422 });   // lado
  await rechazado(t, { buffer: crearPng(3200, 3200) }, { code: 'IMAGEN_INVALIDA', status: 422 }); // píxeles
});

test('una imagen grande pero dentro de los límites sí se acepta', async (t) => {
  const { usuarios } = await guardar(t, { buffer: crearPng(2400, 800) });
  assert.ok(usuarios[7].rubrica_imagen);
});

// ── Solo la primera vez ──────────────────────────────────────

test('segunda subida → 409 RUBRICA_YA_REGISTRADA: no reemplaza, no escribe y no toca la BD', async (t) => {
  const escenario = crearBd();
  const base = carpetaTemporal(t);
  const primera = await guardar(t, { buffer: PNG }, { escenario, base });
  const rutaOriginal = escenario.usuarios[7].rubrica_imagen;
  const antes = fs.readFileSync(archivosEn(base)[0]);
  const actualizaciones = escenario.llamadas.updateMany.length;

  const otra = crearPng(300, 100, [200, 30, 30]);
  await assert.rejects(
    () => guardarRubrica(7, { buffer: otra }, { prisma: escenario.bd, ahora: new Date(AHORA.getTime() + 1000), rutaBase: base }),
    (err) => err.status === 409 && err.code === 'RUBRICA_YA_REGISTRADA',
  );
  assert.equal(primera.usuarios[7].rubrica_imagen, rutaOriginal);
  assert.equal(escenario.usuarios[7].rubrica_fecha_registro, AHORA);
  assert.equal(escenario.llamadas.updateMany.length, actualizaciones);
  assert.equal(archivosEn(base).length, 1);
  assert.deepEqual(fs.readFileSync(archivosEn(base)[0]), antes);
});

test('la segunda subida se rechaza con 409 aunque el archivo nuevo sea inválido (no se procesa nada)', async (t) => {
  const escenario = crearBd({ usuarios: { 7: { id: 7, rubrica_imagen: '7/existente.enc' } } });
  await assert.rejects(
    () => guardarRubrica(7, { buffer: Buffer.from('basura') }, { prisma: escenario.bd, rutaBase: carpetaTemporal(t) }),
    (err) => err.code === 'RUBRICA_YA_REGISTRADA',
  );
});

test('carrera: dos subidas simultáneas → una gana, la otra recibe 409 y borra su archivo', async (t) => {
  const base = carpetaTemporal(t);
  // Ambas pasan la comprobación previa; la BD condicional deja pasar solo a la primera que actualiza.
  let liberar;
  const barrera = new Promise((resolver) => { liberar = resolver; });
  let enEspera = 0;
  const escenario = crearBd({
    antesDeActualizar: async () => {
      enEspera += 1;
      if (enEspera === 2) liberar();
      await barrera;
    },
  });
  const otra = crearPng(300, 100, [200, 30, 30]);
  const resultados = await Promise.allSettled([
    guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base }),
    guardarRubrica(7, { buffer: otra }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base }),
  ]);

  const ganadoras = resultados.filter((x) => x.status === 'fulfilled');
  const perdedoras = resultados.filter((x) => x.status === 'rejected');
  assert.equal(ganadoras.length, 1);
  assert.equal(perdedoras.length, 1);
  assert.equal(perdedoras[0].reason.status, 409);
  assert.equal(perdedoras[0].reason.code, 'RUBRICA_YA_REGISTRADA');

  const archivos = archivosEn(base);
  assert.equal(archivos.length, 1, 'sin archivos huérfanos');
  assert.equal(path.relative(base, archivos[0]).split(path.sep).join('/'), escenario.usuarios[7].rubrica_imagen);
  const guardada = descifrarBuffer(fs.readFileSync(archivos[0]));
  assert.ok(guardada.equals(PNG) || guardada.equals(otra));
});

// ── Fallos ───────────────────────────────────────────────────

test('si falla la BD al guardar: se borra el archivo y el error se propaga', async (t) => {
  const base = carpetaTemporal(t);
  const escenario = crearBd({ falloActualizar: new Error('BD caída') });
  await assert.rejects(
    () => guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base }),
    /BD caída/,
  );
  assert.deepEqual(archivosEn(base), []);
  assert.equal(escenario.usuarios[7].rubrica_imagen, null);
});

test('si no se puede escribir el archivo: no se modifica la BD', async (t) => {
  const base = carpetaTemporal(t);
  fs.writeFileSync(path.join(base, '7'), 'esto es un archivo, no una carpeta'); // impide crear uploads/rubricas/7/
  const escenario = crearBd();
  await assert.rejects(() => guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base }));
  assert.equal(escenario.llamadas.updateMany.length, 0);
  assert.equal(escenario.usuarios[7].rubrica_imagen, null);
});

test('usuario inexistente → 404', async (t) => {
  await assert.rejects(
    () => guardarRubrica(999, { buffer: PNG }, { prisma: crearBd().bd, rutaBase: carpetaTemporal(t) }),
    (err) => err.status === 404,
  );
});

test('guardar la rúbrica no crea documento, reporte ni revisión ni calcula hash o sello de tiempo', async (t) => {
  const tocadas = [];
  const { bd } = crearBd();
  const espia = new Proxy(bd, { get: (obj, prop) => { tocadas.push(String(prop)); return obj[prop]; } });
  await guardarRubrica(7, { buffer: PNG }, { prisma: espia, ahora: AHORA, rutaBase: carpetaTemporal(t) });
  assert.deepEqual([...new Set(tocadas)], ['usuario']);
});

// ── Reutilización ────────────────────────────────────────────

test('obtenerRubricaAlumno: null si aún no hay rúbrica; después devuelve exactamente la imagen subida', async (t) => {
  const escenario = crearBd();
  const base = carpetaTemporal(t);
  assert.equal(await obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base }), null);

  await guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base });
  const leida = await obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base });
  assert.ok(Buffer.isBuffer(leida));
  assert.ok(leida.equals(PNG));
  // Reutilizable cuantas veces haga falta, sin volver a subirla.
  assert.ok((await obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base })).equals(PNG));
});

test('obtenerRubricaAlumno: cada alumno lee solo la suya', async (t) => {
  const escenario = crearBd({ usuarios: { 7: { id: 7, rubrica_imagen: null }, 8: { id: 8, rubrica_imagen: null } } });
  const base = carpetaTemporal(t);
  const otra = crearPng(300, 100, [200, 30, 30]);
  await guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, rutaBase: base });
  await guardarRubrica(8, { buffer: otra }, { prisma: escenario.bd, rutaBase: base });
  assert.ok((await obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base })).equals(PNG));
  assert.ok((await obtenerRubricaAlumno(8, { prisma: escenario.bd, rutaBase: base })).equals(otra));
});

test('obtenerRubricaAlumno: archivo ausente, alterado o ruta fuera de su carpeta → 500 RUBRICA_NO_DISPONIBLE', async (t) => {
  const silencio = t.mock.method(console, 'error', () => {});
  const base = carpetaTemporal(t);
  const escenario = crearBd({ usuarios: { 7: { id: 7, rubrica_imagen: null }, 8: { id: 8, rubrica_imagen: null } } });
  await guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, rutaBase: base });
  await guardarRubrica(8, { buffer: PNG }, { prisma: escenario.bd, rutaBase: base });
  const comprobar = () => assert.rejects(
    () => obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base }),
    (err) => err.status === 500 && err.code === 'RUBRICA_NO_DISPONIBLE' && !/\.enc|uploads|passwd/.test(err.message),
  );

  // Alterado en disco: la autenticación GCM lo detecta.
  const archivo = path.join(base, escenario.usuarios[7].rubrica_imagen);
  const bytes = fs.readFileSync(archivo);
  bytes[bytes.length - 1] ^= 0x01;
  fs.writeFileSync(archivo, bytes);
  await comprobar();

  // Ausente.
  fs.rmSync(archivo);
  await comprobar();

  // Rutas que se salen de su carpeta (otro usuario, subir niveles, absoluta).
  for (const ruta of [escenario.usuarios[8].rubrica_imagen, '7/../8/x.enc', '../../etc/passwd', '/etc/passwd', '7']) {
    escenario.usuarios[7].rubrica_imagen = ruta;
    await comprobar();
  }
  assert.ok(silencio.mock.callCount() >= 3);
});

test('integración con la fase 1: al guardar la rúbrica, firma.requiereSubirRubrica pasa a false', async (t) => {
  const escenario = crearBd();
  const base = carpetaTemporal(t);
  const prismaReporte = (usuario) => ({
    alumno: {
      findUnique: async () => ({
        boleta: '2022630001', carrera: 'IIA', semestre: 8, celular: '5512345678', creditos: '85.50', correo_personal: 'ana@example.com',
        usuario: { nombre: 'ANA', apellidos: 'GARCIA LOPEZ', correo_institucional: 'a@alumno.ipn.mx', rubrica_imagen: usuario.rubrica_imagen },
        solicitud_registro: { id: 42, periodo_registro: null, oferta: null },
      }),
    },
    reporte_mensual: { findMany: async () => [] },
    evento_calendario: { findMany: async () => [] },
    bitacora: { findMany: async () => [] },
    actividad: { findMany: async () => [] },
    registro_bitacora_actividades: { findMany: async () => [] },
  });

  const antes = await prepararReporteMensual(7, { prisma: prismaReporte(escenario.usuarios[7]), ahora: AHORA });
  assert.deepEqual(antes.firma, { tieneRubrica: false, requiereSubirRubrica: true });

  await guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base });
  const despues = await prepararReporteMensual(7, { prisma: prismaReporte(escenario.usuarios[7]), ahora: AHORA });
  assert.deepEqual(despues.firma, { tieneRubrica: true, requiereSubirRubrica: false });
  assert.equal(JSON.stringify(despues).includes(escenario.usuarios[7].rubrica_imagen), false, 'la ruta no se expone');
});

test('integración con la fase 3: la rúbrica guardada se estampa en el PDF del reporte (una página)', async (t) => {
  const escenario = crearBd();
  const base = carpetaTemporal(t);
  await guardarRubrica(7, { buffer: PNG }, { prisma: escenario.bd, ahora: AHORA, rutaBase: base });
  const rubricaAlumno = await obtenerRubricaAlumno(7, { prisma: escenario.bd, rutaBase: base });

  const pdf = await generarPdfReporteMensual(construirDatosPdf(resultadoEjemplo(), ACTIVIDADES_EJEMPLO), { rubricaAlumno });
  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 1);
  let imagenes = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && !o.dict.has(PDFName.of('SMaskInData'))
      && o.dict.get(PDFName.of('ColorSpace')) !== PDFName.of('DeviceGray')) imagenes += 1;
  }
  assert.equal(imagenes, 3, 'logo IPN + logo ESCOM + rúbrica');
});
