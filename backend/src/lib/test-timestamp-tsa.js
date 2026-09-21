const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { solicitarSelloTiempo, construirSolicitud } = require('./timestampTsa');

// Experimento AISLADO (no forma parte de ningún módulo). Corre dentro del contenedor del backend:
//   docker exec escom_backend node backend/src/lib/test-timestamp-tsa.js
//
// Prueba 1: pide UN sello a FreeTSA y lo valida con nuestro parser (hash, nonce, genTime).
// Prueba 2: verifica ese TimeStampResp con OpenSSL (verificador independiente de nuestro parser):
//           firma CMS, cadena de confianza y correspondencia TSR ↔ TSQ, más controles negativos.
//
// Opciones (FreeTSA limita a ~1 petición cada 15 s; con estas se evita repetirla mientras se ajusta la prueba):
//   --conservar        no borra el directorio temporal y muestra su ruta
//   --reusar=<dir>     salta la petición y verifica el muestra.tsq / muestra.tsr que ya hay en <dir>

// Certificados oficiales de FreeTSA (https://freetsa.org/index_en.php), descargados una sola vez.
const DIR_CERTS = path.join(__dirname, 'fixtures-tsa', 'freetsa');
const CERTIFICADOS = {
  'cacert.pem': '2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438',
  'tsa.crt': '8bfb0305bb64e2571ca507552ef3245cb1c2fee8728e0ff8689225081ea13467',
};

const opcion = (nombre) => process.argv.find((a) => a === `--${nombre}` || a.startsWith(`--${nombre}=`));
const rutaCert = (nombre) => path.join(DIR_CERTS, nombre);

// Invoca OpenSSL sin shell. Nunca lanza: regresa { codigo, salida } con stdout y stderr juntos.
function openssl(args) {
  return new Promise((resolve) => {
    execFile('openssl', args, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ codigo: error ? (typeof error.code === 'number' ? error.code : 1) : 0, salida: `${stdout}${stderr}`.trim() });
    });
  });
}

const verificar = ({ tsr, tsq, ca = rutaCert('cacert.pem'), tsa = rutaCert('tsa.crt') }) => openssl([
  'ts', '-verify', '-in', tsr,
  ...(tsq ? ['-queryfile', tsq] : []),
  ...(ca ? ['-CAfile', ca] : []),
  ...(tsa ? ['-untrusted', tsa] : []),
]);

const resultados = [];
function control(nombre, cumple, detalle) {
  resultados.push({ nombre, cumple });
  console.log(`  ${cumple ? 'PASS' : 'FAIL'}  ${nombre}`);
  if (detalle) console.log(`        ${detalle.split('\n').join('\n        ')}`);
}
// Línea que resume el resultado (ignora el ruido de configuración/avisos de OpenSSL).
const ultimaLinea = (texto) => {
  const lineas = texto.split('\n').filter(Boolean);
  return lineas.find((l) => /Verification:|error:/.test(l)) ?? lineas.slice(-1)[0] ?? '(sin salida)';
};
const confiable = (r) => r.codigo === 0 && /Verification: OK/.test(r.salida);

// Copia del TSR con UN byte alterado: se invierte solo su bit menos significativo, así un dígito del genTime
// sigue siendo un dígito válido y el rechazo se debe a la firma, no a un formato roto.
function conByteAlterado(buffer, posicion) {
  const copia = Buffer.from(buffer);
  copia[posicion] ^= 0x01;
  return copia;
}

async function main() {
  const dirTemporal = opcion('reusar')
    ? path.resolve(opcion('reusar').split('=')[1])
    : fs.mkdtempSync(path.join(os.tmpdir(), 'tsa-prueba-'));
  const tsq = path.join(dirTemporal, 'muestra.tsq');
  const tsr = path.join(dirTemporal, 'muestra.tsr');

  try {
    // ── Prueba 1: obtener el sello (única petición a FreeTSA) ──
    if (opcion('reusar')) {
      console.log(`Reutilizando muestra.tsq / muestra.tsr de ${dirTemporal} (sin petición a FreeTSA)`);
    } else {
      const hashHex = crypto.createHash('sha256').update(Buffer.from('prueba reportes escom-ss')).digest('hex');
      console.log('=== PRUEBA 1: petición real a FreeTSA ===');
      console.log('Hash SHA-256 usado :', hashHex);
      const { token, fecha, solicitud } = await solicitarSelloTiempo(hashHex);
      fs.writeFileSync(tsq, Buffer.from(solicitud, 'base64'));
      fs.writeFileSync(tsr, Buffer.from(token, 'base64'));
      console.log('Petición exitosa   : sí');
      console.log('TSQ enviado        :', Buffer.from(solicitud, 'base64').length, 'bytes DER');
      console.log('Tamaño del token   :', token.length, 'caracteres (base64) —', Buffer.from(token, 'base64').length, 'bytes DER');
      console.log('Fecha del token    :', fecha.toISOString(), '(UTC) |',
        fecha.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }), '(México)');
    }

    // ── Prueba 2: verificación criptográfica local con OpenSSL ──
    console.log('\n=== PRUEBA 2: verificación con OpenSSL (sin más peticiones a FreeTSA) ===');
    console.log('OpenSSL            :', (await openssl(['version'])).salida);
    for (const [nombre, sha] of Object.entries(CERTIFICADOS)) {
      const real = crypto.createHash('sha256').update(fs.readFileSync(rutaCert(nombre))).digest('hex');
      if (real !== sha) throw new Error(`${nombre} no coincide con el SHA-256 publicado por FreeTSA (${real}).`);
    }
    console.log('Certificados       : cacert.pem y tsa.crt coinciden con el SHA-256 publicado por FreeTSA');

    const bufferTsr = fs.readFileSync(tsr);

    console.log('\n--- openssl ts -reply -in muestra.tsr -text ---');
    const texto = await openssl(['ts', '-reply', '-in', tsr, '-text']);
    console.log(texto.salida);
    control('OpenSSL reconoce el TSR (estado concedido)', texto.codigo === 0 && /Status: Granted/.test(texto.salida));

    console.log('\n--- Verificación positiva ---');
    console.log('$ openssl ts -verify -in muestra.tsr -queryfile muestra.tsq -CAfile cacert.pem -untrusted tsa.crt');
    const positiva = await verificar({ tsr, tsq });
    console.log(positiva.salida);
    control('TSR correcto + TSQ correcto + CA de FreeTSA → Verification: OK', confiable(positiva));

    console.log('\n--- Controles negativos (todos deben FALLAR) ---');
    // 1) Alterar un byte del TSR: dentro del TSTInfo firmado (el genTime) y en la propia firma (último byte).
    const genTime = bufferTsr.toString('latin1').match(/\d{14}Z/);
    const posGenTime = genTime ? bufferTsr.indexOf(Buffer.from(genTime[0], 'latin1')) + 13 : -1;
    const alterados = [
      ['un byte del genTime firmado', posGenTime],
      ['el último byte (la firma CMS)', bufferTsr.length - 1],
    ];
    for (const [descripcion, posicion] of alterados) {
      const archivo = path.join(dirTemporal, 'alterado.tsr');
      fs.writeFileSync(archivo, conByteAlterado(bufferTsr, posicion));
      const r = await verificar({ tsr: archivo, tsq });
      control(`TSR con ${descripcion} alterado → no verifica`, posicion >= 0 && !confiable(r), `[${r.codigo}] ${ultimaLinea(r.salida)}`);
    }

    // 2) Un TSQ distinto (otro hash y otro nonce) no corresponde a este TSR.
    const otra = construirSolicitud(crypto.createHash('sha256').update('otro contenido').digest('hex'));
    const tsqOtro = path.join(dirTemporal, 'otro.tsq');
    fs.writeFileSync(tsqOtro, otra.der);
    const distinto = await verificar({ tsr, tsq: tsqOtro });
    control('TSQ distinto → no verifica', !confiable(distinto), `[${distinto.codigo}] ${ultimaLinea(distinto.salida)}`);

    // 3) Sin la CA de FreeTSA como ancla de confianza. Con -untrusted tsa.crt la cadena existe, pero no es confiable.
    const sinCa = await verificar({ tsr, tsq, ca: null });
    control('Sin -CAfile (solo el almacén por defecto de OpenSSL) → no es confiable', !confiable(sinCa), `[${sinCa.codigo}] ${ultimaLinea(sinCa.salida)}`);

    const caAjena = path.join(dirTemporal, 'ca-ajena.pem');
    await openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(dirTemporal, 'ca-ajena.key'),
      '-out', caAjena, '-days', '1', '-subj', '/CN=CA ajena de prueba']);
    const ajena = await verificar({ tsr, tsq, ca: caAjena });
    control('Con una CA que no es la de FreeTSA → no es confiable', !confiable(ajena), `[${ajena.codigo}] ${ultimaLinea(ajena.salida)}`);

    // Informativo (NO es criterio de éxito): el token trae su propia cadena porque la solicitud llevó certReq=true.
    console.log('\n--- Informativo: sin -untrusted tsa.crt (efecto de certReq=true) ---');
    const sinUntrusted = await verificar({ tsr, tsq, tsa: null });
    console.log(`[${sinUntrusted.codigo}] ${ultimaLinea(sinUntrusted.salida)}`);
  } catch (err) {
    console.log('Error              :', err.message);
    if (err.codigo) console.log('Código             :', err.codigo);
    resultados.push({ nombre: 'ejecución', cumple: false });
  } finally {
    if (opcion('conservar') || opcion('reusar')) console.log(`\nArchivos temporales conservados en: ${dirTemporal}`);
    else fs.rmSync(dirTemporal, { recursive: true, force: true });
  }

  const fallidos = resultados.filter((r) => !r.cumple);
  console.log(`\nResumen: ${resultados.length - fallidos.length}/${resultados.length} controles correctos`);
  if (fallidos.length > 0) process.exitCode = 1;
}

main();
