const crypto = require('crypto');

// AES-256-GCM: cifra Y autentica — si alguien altera el archivo en el disco
// sin la llave correcta, descifrarBuffer() lanza un error en vez de
// regresar datos corruptos silenciosamente.
const ALGORITMO = 'aes-256-gcm';
const LONGITUD_IV = 12;       // recomendado para GCM
const LONGITUD_AUTH_TAG = 16;

function obtenerLlave() {
  const llaveHex = process.env.ENCRYPTION_KEY;
  if (!llaveHex || llaveHex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY no está configurada correctamente. Debe ser una cadena de 64 caracteres hexadecimales (32 bytes) — genera una con: openssl rand -hex 32'
    );
  }
  return Buffer.from(llaveHex, 'hex');
}

/**
 * Cifra un buffer (los bytes crudos de un archivo) y regresa un solo buffer
 * listo para escribir a disco: [IV (12 bytes)][authTag (16 bytes)][datos cifrados].
 * No hace falta guardar el IV/authTag en la base de datos — viajan pegados
 * al propio archivo.
 */
function cifrarBuffer(bufferOriginal) {
  const iv = crypto.randomBytes(LONGITUD_IV); // distinto en cada archivo, nunca se reutiliza
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerLlave(), iv);

  const cifrado = Buffer.concat([cipher.update(bufferOriginal), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, cifrado]);
}

/**
 * Hace lo inverso: recibe el buffer completo tal como se guardó en disco
 * (IV + authTag + datos cifrados) y regresa el buffer original del archivo.
 * Lanza un error si la llave es incorrecta o el archivo fue alterado.
 */
function descifrarBuffer(bufferCompleto) {
  const iv = bufferCompleto.subarray(0, LONGITUD_IV);
  const authTag = bufferCompleto.subarray(LONGITUD_IV, LONGITUD_IV + LONGITUD_AUTH_TAG);
  const cifrado = bufferCompleto.subarray(LONGITUD_IV + LONGITUD_AUTH_TAG);

  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerLlave(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cifrado), decipher.final()]);
}

/**
 * Genera un nombre de archivo seguro y aleatorio para guardar en disco —
 * NUNCA se usa el nombre original que sube el alumno (podría venir
 * manipulado, ej. "../../../etc/passwd.pdf" — un ataque real llamado path
 * traversal). Este nombre es el que se guarda en documento.ruta_archivo.
 */
function generarNombreSeguro(extension = 'pdf') {
  return `${crypto.randomUUID()}.${extension}`;
}

module.exports = { cifrarBuffer, descifrarBuffer, generarNombreSeguro };
