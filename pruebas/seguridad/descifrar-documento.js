// Descifra un documento almacenado (AES-256-GCM, lib/fileEncryption.js) y escribe el PDF en claro.
// Solo lee el archivo cifrado; nunca lo modifica. Imprime el SHA-256 del PDF en claro para compararlo con hash_documento.
//
// Requiere ENCRYPTION_KEY (ya está en el entorno del contenedor):
//   docker exec -u node -w /app/backend escom_backend node /app/pruebas/seguridad/descifrar-documento.js <cifrado> <salida.pdf>

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Vive en pruebas/seguridad/ (fuera del backend): el cifrado se carga desde backend/.
const { descifrarBuffer } = require(path.join(__dirname, '../../backend/src/lib/fileEncryption'));

function main() {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada || !salida) throw new Error('Uso: node descifrar-documento.js <archivo_cifrado> <salida.pdf>');
  if (path.resolve(entrada) === path.resolve(salida)) throw new Error('La salida no puede ser el archivo original.');

  const pdf = descifrarBuffer(fs.readFileSync(entrada));
  // 'wx': no sobrescribe un archivo existente.
  fs.writeFileSync(salida, pdf, { flag: 'wx', mode: 0o600 });

  console.log(`PDF descifrado: ${path.resolve(salida)} (${pdf.length} bytes)`);
  console.log(`SHA-256: ${crypto.createHash('sha256').update(pdf).digest('hex')}`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
