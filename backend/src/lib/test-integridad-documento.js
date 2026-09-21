const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { TimeStampReq } = require('@xevolab/timestamping-token');
const { solicitarSelloTiempo, interpretarRespuesta, ErrorTsa } = require('./timestampTsa');
const { cifrarBuffer, descifrarBuffer } = require('./fileEncryption');

// PRUEBA 3 (experimento AISLADO, no forma parte de ningún módulo): la cadena documental que usará Reportes.
//
//   bufferOriginal ─┬─ SHA-256 (H1) ─ RFC 3161 / FreeTSA ─ token
//                   └─ cifrarBuffer ─ descifrarBuffer ─ mismo buffer ─ mismo SHA-256 (H2 = H1)
//
// Corre dentro del contenedor del backend (misma ENCRYPTION_KEY que la aplicación):
//   docker exec escom_backend node backend/src/lib/test-integridad-documento.js
//
// Hace UNA sola petición a FreeTSA. La verificación independiente del sello es OpenSSL; interpretarRespuesta
// es solo la comprobación de NUESTRO parser. No imprime ENCRYPTION_KEY, IV, authTag, nonce ni el TSQ.

// Certificados oficiales de FreeTSA (https://freetsa.org/index_en.php) ya guardados para la Prueba 2.
const DIR_CERTS = path.join(__dirname, 'fixtures-tsa', 'freetsa');
const CERTIFICADOS = {
  'cacert.pem': '2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438',
  'tsa.crt': '8bfb0305bb64e2571ca507552ef3245cb1c2fee8728e0ff8689225081ea13467',
};
const CA = path.join(DIR_CERTS, 'cacert.pem');
const TSA = path.join(DIR_CERTS, 'tsa.crt');

// Layout de fileEncryption.js: [IV 12 bytes][authTag 16 bytes][ciphertext].
const LONGITUD_CABECERA_CIFRADO = 12 + 16;

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

// Invoca OpenSSL sin shell. Nunca lanza: regresa { codigo, salida } con stdout y stderr juntos.
function openssl(args) {
  return new Promise((resolve) => {
    execFile('openssl', args, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ codigo: error ? (typeof error.code === 'number' ? error.code : 1) : 0, salida: `${stdout}${stderr}`.trim() });
    });
  });
}

const verificarTsr = ({ tsr, tsq, digest }) => openssl([
  'ts', '-verify', '-in', tsr,
  ...(tsq ? ['-queryfile', tsq] : ['-digest', digest]),
  '-CAfile', CA, '-untrusted', TSA,
]);
const esVerificacionOk = (r) => r.codigo === 0 && /Verification: OK/.test(r.salida);
const lineaResumen = (r) => r.salida.split('\n').find((l) => /Verification:|error:/.test(l)) ?? '(sin salida)';

// Copia del buffer con UN byte alterado (se invierte el bit menos significativo de la posición indicada).
function conUnByteAlterado(buffer, posicion) {
  const copia = Buffer.from(buffer);
  copia[posicion] ^= 0x01;
  return copia;
}

// ── Reporte ──────────────────────────────────────────────────

const resultados = [];

// Ejecuta una comprobación. `fn` devuelve líneas de detalle o lanza Error para marcarla como FALLO.
async function comprobar(nombre, fn) {
  try {
    const detalles = (await fn()) ?? [];
    resultados.push({ nombre, ok: true });
    console.log(`[OK] ${nombre}`);
    detalles.forEach((d) => console.log(`       ${d}`));
  } catch (err) {
    resultados.push({ nombre, ok: false });
    console.log(`[FALLO] ${nombre}`);
    console.log(`       ${err.message}`);
  }
}

const exigir = (condicion, mensaje) => { if (!condicion) throw new Error(mensaje); };

// ── Preflight: nada de esto contacta a FreeTSA (la petición está limitada a ~1 cada 15 s) ──

async function preflight() {
  const fallos = [];
  try {
    const prueba = Buffer.from('preflight');
    exigir(descifrarBuffer(cifrarBuffer(prueba)).equals(prueba), 'la ida y vuelta AES-GCM no devolvió el mismo buffer');
  } catch (err) {
    fallos.push(`ENCRYPTION_KEY / fileEncryption: ${err.message}`);
  }
  for (const [nombre, esperado] of Object.entries(CERTIFICADOS)) {
    try {
      exigir(sha256(fs.readFileSync(path.join(DIR_CERTS, nombre))) === esperado, 'no coincide con el SHA-256 publicado por FreeTSA');
    } catch (err) {
      fallos.push(`certificado ${nombre}: ${err.message}`);
    }
  }
  const version = await openssl(['version']);
  if (version.codigo !== 0) fallos.push('openssl no está disponible');
  return { fallos, version: version.salida };
}

async function main() {
  console.log('PRUEBA 3 — CADENA DOCUMENTAL\n');

  const { fallos, version } = await preflight();
  if (fallos.length > 0) {
    console.log('[FALLO] preflight (no se contactó a FreeTSA):');
    fallos.forEach((f) => console.log(`       ${f}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Entorno: Node ${process.version} | ${version}`);

  // El documento: UN solo Buffer definitivo. De él salen el hash para FreeTSA y la entrada de AES-256-GCM.
  const bufferOriginal = Buffer.from('documento de prueba reportes escom-ss');
  const H1 = sha256(bufferOriginal);
  console.log('\nSHA-256 original:');
  console.log(H1, '\n');

  const dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'integridad-'));
  const tsq = path.join(dirTemporal, 'muestra.tsq');
  const tsr = path.join(dirTemporal, 'muestra.tsr');
  const ctx = {};   // estado compartido entre comprobaciones

  try {
    // 1) Única petición real a FreeTSA.
    await comprobar('FreeTSA emitió sello para H1', async () => {
      const { token, fecha, solicitud } = await solicitarSelloTiempo(H1);
      ctx.tsqDer = Buffer.from(solicitud, 'base64');
      ctx.tsrDer = Buffer.from(token, 'base64');
      fs.writeFileSync(tsq, ctx.tsqDer);
      fs.writeFileSync(tsr, ctx.tsrDer);
      return [
        `token: ${token.length} caracteres base64 (${ctx.tsrDer.length} bytes DER)`,
        `genTime: ${fecha.toISOString()} (UTC) | ${fecha.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} (México)`,
      ];
    });

    // 2) Nuestro parser: el TSQ enviado llevaba H1 y el messageImprint firmado del token es H1.
    await comprobar('messageImprint coincide con H1 (parser propio)', async () => {
      exigir(ctx.tsrDer, 'no evaluada: FreeTSA no emitió sello');
      const enviado = new TimeStampReq().fromDER(ctx.tsqDer).request;
      exigir(Buffer.from(enviado.messageImprint.hashedMessage).toString('hex') === H1, 'el TSQ enviado no llevaba H1');
      ctx.nonce = Buffer.from(enviado.nonce);
      const sello = interpretarRespuesta(ctx.tsrDer, { hash: Buffer.from(H1, 'hex'), nonce: ctx.nonce });
      return [`TSQ enviado con H1; el token repite el mismo hash y el mismo nonce (genTime ${sello.fecha.toISOString()})`];
    });

    // 3) Verificación criptográfica independiente con OpenSSL.
    await comprobar('firma RFC 3161 verificada (OpenSSL)', async () => {
      exigir(ctx.tsrDer, 'no evaluada: FreeTSA no emitió sello');
      const conTsq = await verificarTsr({ tsr, tsq });
      exigir(esVerificacionOk(conTsq), `-queryfile: ${lineaResumen(conTsq)}`);
      const conH1 = await verificarTsr({ tsr, digest: H1 });
      exigir(esVerificacionOk(conH1), `-digest H1: ${lineaResumen(conH1)}`);
      return [
        'openssl ts -verify -in muestra.tsr -queryfile muestra.tsq -CAfile cacert.pem -untrusted tsa.crt → Verification: OK',
        'openssl ts -verify -in muestra.tsr -digest <H1> -CAfile cacert.pem -untrusted tsa.crt            → Verification: OK',
      ];
    });

    // 4) AES-256-GCM con fileEncryption.js TAL CUAL, sobre el MISMO bufferOriginal.
    await comprobar('AES-256-GCM cifró el buffer', async () => {
      ctx.bufferCifrado = cifrarBuffer(bufferOriginal);
      exigir(ctx.bufferCifrado.length === LONGITUD_CABECERA_CIFRADO + bufferOriginal.length, 'el layout [IV][authTag][ciphertext] no tiene el tamaño esperado');
      exigir(!ctx.bufferCifrado.includes(bufferOriginal), 'el texto plano aparece dentro del archivo cifrado');
      return [`${bufferOriginal.length} bytes planos → ${ctx.bufferCifrado.length} bytes cifrados (12 IV + 16 authTag + ${bufferOriginal.length} ciphertext)`];
    });

    // 5) Descifrado: el mismo buffer.
    await comprobar('AES-256-GCM recuperó exactamente el buffer original', async () => {
      exigir(ctx.bufferCifrado, 'no evaluada: el cifrado falló');
      ctx.bufferRecuperado = descifrarBuffer(ctx.bufferCifrado);
      exigir(bufferOriginal.equals(ctx.bufferRecuperado), 'el buffer descifrado no es idéntico al original');
      return [`bufferOriginal.equals(bufferRecuperado) === true (${ctx.bufferRecuperado.length} bytes)`];
    });

    // 6) H2 = H1.
    await comprobar('SHA-256 después de descifrar coincide con H1', async () => {
      exigir(ctx.bufferRecuperado, 'no evaluada: el descifrado falló');
      const H2 = sha256(ctx.bufferRecuperado);
      exigir(H2 === H1, `H2 (${H2}) no coincide con H1`);
      return [`H2 = ${H2}`];
    });

    // 7) Alteración del documento plano: un byte de una COPIA.
    const bufferAlterado = conUnByteAlterado(bufferOriginal, Math.floor(bufferOriginal.length / 2));
    const H3 = sha256(bufferAlterado);
    await comprobar('modificar 1 byte del documento cambia SHA-256', async () => {
      exigir(!bufferAlterado.equals(bufferOriginal), 'la copia no quedó alterada');
      exigir(H3 !== H1, 'H3 es igual a H1');
      let bytesDistintos = 0;
      for (let i = 0; i < bufferOriginal.length; i += 1) if (bufferOriginal[i] !== bufferAlterado[i]) bytesDistintos += 1;
      exigir(bytesDistintos === 1, `se esperaba 1 byte distinto y hay ${bytesDistintos}`);
      return [`H3 = ${H3}`, 'bytes distintos entre original y copia: 1'];
    });

    // 8) El token de H1 no corresponde a H3. Sin otra petición: parser propio + OpenSSL.
    await comprobar('token de H1 no corresponde al documento alterado', async () => {
      exigir(ctx.tsrDer, 'no evaluada: FreeTSA no emitió sello');
      let errorParser = null;
      try {
        interpretarRespuesta(ctx.tsrDer, { hash: Buffer.from(H3, 'hex'), nonce: ctx.nonce });
      } catch (err) {
        errorParser = err;
      }
      exigir(errorParser instanceof ErrorTsa && errorParser.codigo === 'TSA_HASH_DISTINTO',
        `el parser propio no rechazó H3 (${errorParser ? errorParser.codigo ?? errorParser.message : 'aceptó el hash'})`);
      const conH3 = await verificarTsr({ tsr, digest: H3 });
      exigir(!esVerificacionOk(conH3), 'OpenSSL aceptó el token para H3');
      return [
        'parser propio: rechaza H3 (TSA_HASH_DISTINTO)',
        `openssl ts -verify -digest <H3> → ${lineaResumen(conH3)}`,
      ];
    });

    // 9) Alteración del archivo cifrado: un byte de una COPIA, dentro del ciphertext. Solo pasa si descifrar lanza.
    await comprobar('modificar ciphertext hace fallar la autenticación GCM', async () => {
      exigir(ctx.bufferCifrado, 'no evaluada: el cifrado falló');
      exigir(ctx.bufferCifrado.length > LONGITUD_CABECERA_CIFRADO, 'no hay ciphertext que alterar');
      const posicion = LONGITUD_CABECERA_CIFRADO + Math.floor((ctx.bufferCifrado.length - LONGITUD_CABECERA_CIFRADO) / 2);
      const cifradoAlterado = conUnByteAlterado(ctx.bufferCifrado, posicion);
      exigir(!cifradoAlterado.equals(ctx.bufferCifrado), 'la copia cifrada no quedó alterada');
      let lanzo = false;
      try {
        descifrarBuffer(cifradoAlterado);
      } catch {
        lanzo = true;
      }
      exigir(lanzo, 'descifrarBuffer NO lanzó excepción con el ciphertext alterado');
      return [`byte ${posicion} alterado (después de los primeros ${LONGITUD_CABECERA_CIFRADO}); descifrarBuffer lanzó excepción`];
    });

    // Los buffers originales no se tocaron: todo se hizo sobre copias.
    exigir(sha256(bufferOriginal) === H1, 'bufferOriginal cambió durante la prueba');
    if (ctx.bufferCifrado) exigir(descifrarBuffer(ctx.bufferCifrado).equals(bufferOriginal), 'bufferCifrado cambió durante la prueba');
    console.log('\n(los buffers originales quedaron intactos: las alteraciones se hicieron sobre copias)');
  } catch (err) {
    resultados.push({ nombre: 'integridad de los buffers originales', ok: false });
    console.log(`\n[FALLO] ${err.message}`);
  } finally {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  }

  const correctas = resultados.filter((r) => r.ok).length;
  console.log(`\nResultado: ${correctas}/${resultados.length} comprobaciones correctas.`);
  const fallidas = resultados.filter((r) => !r.ok);
  if (fallidas.length > 0) {
    console.log('Fallaron:', fallidas.map((r) => r.nombre).join(' | '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`[FALLO] error inesperado: ${err.message}`);
  process.exitCode = 1;
});
