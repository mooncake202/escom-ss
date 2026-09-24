// Prueba AISLADA y NO DESTRUCTIVA del flujo real del expediente de baja (CU-ADM-11 → CU-ADM-12).
//
// Verifica lo que el E2E destructivo no pudo comprobar: que el expediente subido por el alumno se
// cifra de verdad en disco y que Coordinación lo recupera íntegro.
//
// Recorre el camino COMPLETO por HTTP, sin atajos:
//   POST /bajas/alumno            (multipart, como el navegador)  → multer → cifrarBuffer → disco
//   GET  /bajas/:id/expediente    (coordinador)                   → descifrarBuffer → PDF
//
// NO aprueba la solicitud y NO ejecuta la baja: el usuario temporal se elimina al final como
// limpieza explícita de esta prueba, no a través del flujo de bajas.
//
// El alumno temporal usa @example.com (dominio reservado por la IANA para pruebas): aunque algo
// intentara enviarle correo, nunca saldría de la máquina.
//
// Uso: node backend/src/modules/administrativa/bajas/seed/prueba-expediente-aislada.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');

const API = 'http://localhost:3000';
const BOLETA = '2098888888';
const CORREO = 'e2e.expediente@example.com';
const PASSWORD = '12345678';
const COORDINADOR = 'coordinador.test@ipn.mx';

const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../../uploads/documentos');
const CARPETA = path.join(RUTA_BASE_DOCUMENTOS, BOLETA);

const creado = { usuarioId: null, bajaId: null, documentoId: null, rutaArchivo: null };
let fallos = 0;

const chk = (etiqueta, cond, detalle = '') => {
  if (!cond) fallos++;
  console.log(`  ${cond ? '✅' : '❌'} ${etiqueta}${detalle ? ' — ' + detalle : ''}`);
};

const login = async (correo) => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo_institucional: correo, contrasena: PASSWORD }),
  });
  const j = await r.json();
  if (!j.token) throw new Error(`login ${correo}: ${j.message}`);
  return j.token;
};

// PDF mínimo pero real, con bytes aleatorios para que la comparación byte a byte sea significativa.
function construirPdf() {
  const relleno = crypto.randomBytes(512).toString('base64');
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n`
    + `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n`
    + `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n`
    + `% carga aleatoria de prueba: ${relleno}\n`
    + `trailer<</Root 1 0 R>>\n%%EOF\n`, 'utf8');
}

async function limpiar() {
  console.log('\n═══ LIMPIEZA ═══');
  // Borrado explícito y acotado, en orden de dependencia. NO pasa por el flujo de bajas.
  if (creado.bajaId) {
    await prisma.solicitud_baja.deleteMany({ where: { id: creado.bajaId } });
    console.log('  solicitud_baja id=' + creado.bajaId + ' eliminada');
  }
  if (creado.documentoId) {
    await prisma.documento.deleteMany({ where: { id: creado.documentoId } });
    console.log('  documento id=' + creado.documentoId + ' eliminado');
  }
  await prisma.alumno.deleteMany({ where: { boleta: BOLETA } });
  if (creado.usuarioId) {
    await prisma.usuario.deleteMany({ where: { id: creado.usuarioId } });
    console.log('  alumno ' + BOLETA + ' y usuario id=' + creado.usuarioId + ' eliminados');
  }
  if (fs.existsSync(CARPETA)) {
    fs.rmSync(CARPETA, { recursive: true, force: true });
  }
  console.log('  carpeta ' + BOLETA + '/: ' + (fs.existsSync(CARPETA) ? '❌ sigue existiendo' : 'eliminada ✅'));

  const restos = {
    usuario: await prisma.usuario.count({ where: { correo_institucional: CORREO } }),
    alumno: await prisma.alumno.count({ where: { boleta: BOLETA } }),
    solicitud_baja: await prisma.solicitud_baja.count({ where: { alumno_id: BOLETA } }),
    documento: await prisma.documento.count({ where: { alumno_id: BOLETA } }),
  };
  console.log('  restos:', JSON.stringify(restos), Object.values(restos).every((v) => v === 0) ? '✅ ninguno' : '❌');
}

(async () => {
  console.log('═══ PRUEBA AISLADA DEL EXPEDIENTE (no destructiva) ═══\n');

  try {
    // ── 1. Alumno temporal (sin oferta ni solicitud_registro: no toca ningún cupo) ──
    console.log('1) Alumno temporal');
    await prisma.usuario.deleteMany({ where: { correo_institucional: CORREO } }); // por si quedó de una corrida previa
    const usuario = await prisma.usuario.create({
      data: {
        rol: 'alumno_asignado', correo_institucional: CORREO,
        nombre: 'E2E Expediente', apellidos: 'Prueba Aislada',
        contrasena: await bcrypt.hash(PASSWORD, 10),
        fecha_creacion: new Date(), intentos_fallidos: 0, cuenta_bloqueada: false,
      },
    });
    creado.usuarioId = usuario.id;
    await prisma.alumno.create({
      data: { boleta: BOLETA, usuario_id: usuario.id, celular: '5500000000', carrera: 'ISC', creditos: 80, semestre: 8 },
    });
    console.log(`   usuario.id=${usuario.id} · boleta=${BOLETA} · ${CORREO}`);

    // ── 2. Subida real por HTTP ──
    console.log('\n2) POST /bajas/alumno (multipart real)');
    const pdfOriginal = construirPdf();
    const sha256Original = crypto.createHash('sha256').update(pdfOriginal).digest('hex');
    console.log(`   PDF original: ${pdfOriginal.length} bytes · sha256 ${sha256Original.slice(0, 16)}…`);

    const tokenAlumno = await login(CORREO);
    const form = new FormData();
    form.append('motivo', '[E2E] Prueba aislada del expediente.');
    form.append('expediente', new Blob([pdfOriginal], { type: 'application/pdf' }), 'expediente.pdf');

    const subida = await fetch(`${API}/bajas/alumno`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + tokenAlumno }, body: form,
    });
    const sj = await subida.json();
    chk(`HTTP ${subida.status} (esperado 201)`, subida.status === 201, JSON.stringify(sj).slice(0, 120));
    if (subida.status !== 201) throw new Error('la subida falló');
    creado.bajaId = sj.id;

    const doc = await prisma.documento.findFirst({ where: { alumno_id: BOLETA, tipo_documento: 'expediente_baja' } });
    creado.documentoId = doc?.id ?? null;
    creado.rutaArchivo = doc?.ruta_archivo ?? null;
    chk('documento creado con tipo expediente_baja', doc?.tipo_documento === 'expediente_baja');
    chk('estado_documento = en_revision', doc?.estado_documento === 'en_revision', doc?.estado_documento);
    chk('ruta en la raíz de <boleta>/, NO en Reportes/',
      doc?.ruta_archivo?.startsWith(BOLETA + path.sep) && !doc.ruta_archivo.includes('Reportes'), doc?.ruta_archivo);

    // ── 3. El archivo en disco NO puede ser el PDF en claro ──
    console.log('\n3) Archivo físico');
    const enDisco = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, doc.ruta_archivo));
    console.log(`   ${doc.ruta_archivo} · ${enDisco.length} bytes`);
    chk('NO empieza con la cabecera %PDF', !enDisco.subarray(0, 5).equals(Buffer.from('%PDF-')),
      'primeros bytes: ' + enDisco.subarray(0, 8).toString('hex'));
    chk('los bytes difieren del PDF original', !enDisco.equals(pdfOriginal));
    chk('no contiene el relleno en claro', !enDisco.includes(pdfOriginal.subarray(120, 180)));
    chk('pesa más que el original (IV + tag de AES-GCM)', enDisco.length > pdfOriginal.length,
      `${pdfOriginal.length} → ${enDisco.length} (+${enDisco.length - pdfOriginal.length})`);

    // ── 4. Descarga por Coordinación ──
    console.log('\n4) GET /bajas/:id/expediente (coordinador)');
    const tokenCoord = await login(COORDINADOR);
    const descarga = await fetch(`${API}/bajas/${creado.bajaId}/expediente`, {
      headers: { Authorization: 'Bearer ' + tokenCoord },
    });
    chk(`HTTP ${descarga.status} (esperado 200)`, descarga.status === 200);
    chk('Content-Type application/pdf', (descarga.headers.get('content-type') ?? '').includes('application/pdf'),
      descarga.headers.get('content-type'));
    chk('Content-Disposition con la boleta', (descarga.headers.get('content-disposition') ?? '').includes(BOLETA),
      descarga.headers.get('content-disposition'));

    const descargado = Buffer.from(await descarga.arrayBuffer());
    const sha256Descargado = crypto.createHash('sha256').update(descargado).digest('hex');
    console.log(`   descargado: ${descargado.length} bytes · sha256 ${sha256Descargado.slice(0, 16)}…`);
    chk('MISMO TAMAÑO que el original', descargado.length === pdfOriginal.length,
      `${pdfOriginal.length} vs ${descargado.length}`);
    chk('IDÉNTICO BYTE POR BYTE al PDF original', descargado.equals(pdfOriginal));
    chk('sha256 coincide', sha256Descargado === sha256Original);

    // ── 5. No se aprobó nada ──
    console.log('\n5) La solicitud sigue intacta (no se aprobó)');
    const baja = await prisma.solicitud_baja.findUnique({ where: { id: creado.bajaId } });
    chk('estado sigue pendiente', baja?.estado === 'pendiente', baja?.estado);
    chk('el alumno temporal sigue existiendo', (await prisma.usuario.count({ where: { id: creado.usuarioId } })) === 1);
  } catch (err) {
    fallos++;
    console.error('\n💥 Error durante la prueba:', err.message);
  } finally {
    await limpiar();
  }

  console.log('\n' + (fallos === 0
    ? '✅ El expediente se cifra en disco y Coordinación lo recupera íntegro.'
    : `❌ ${fallos} comprobación(es) fallaron.`));
  await prisma.$disconnect();
  process.exit(fallos === 0 ? 0 : 1);
})();
