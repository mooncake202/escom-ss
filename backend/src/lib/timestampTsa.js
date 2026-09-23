const crypto = require('crypto');
const asn1js = require('asn1js');
const { TimeStampReq } = require('@xevolab/timestamping-token');

// Cliente RFC 3161 (sello de tiempo de confianza) contra una TSA pública.
// @xevolab/timestamping-token es una librería de TSA (lado servidor): aquí solo se usa para CONSTRUIR
// el TimeStampReq. Para LEER el TimeStampResp que regresa FreeTSA no trae nada, así que se decodifica
// con asn1js (su propia dependencia). El módulo no toca disco ni BD y no imprime nada.
const URL_FREETSA = 'https://freetsa.org/tsr';
// FreeTSA acepta como máximo una petición cada ~15 segundos por IP.
const TIMEOUT_MS = 15000;
const CONTENT_TYPE_SOLICITUD = 'application/timestamp-query';

const OID_SIGNED_DATA = '1.2.840.113549.1.7.2';      // el token es un CMS SignedData
const OID_TST_INFO = '1.2.840.113549.1.9.16.1.4';    // y lo firmado es un TSTInfo

// PKIStatus (RFC 3161 §2.4.2): 0 = granted, 1 = grantedWithMods; cualquier otro valor es rechazo.
const NOMBRES_ESTADO = ['concedido', 'concedido con modificaciones', 'rechazado', 'en espera', 'aviso de revocación', 'notificación de revocación'];
// PKIFailureInfo: posición del bit → motivo (solo los que define RFC 3161).
const MOTIVOS_FALLA = {
  0: 'badAlg (algoritmo de hash no aceptado)',
  2: 'badRequest (solicitud no permitida)',
  5: 'badDataFormat (formato de solicitud inválido)',
  14: 'timeNotAvailable (la TSA no tiene hora confiable)',
  15: 'unacceptedPolicy (política no aceptada)',
  16: 'unacceptedExtension (extensión no aceptada)',
  17: 'addInfoNotAvailable (información adicional no disponible)',
  25: 'systemFailure (falla interna de la TSA)',
};

/**
 * Error con un `codigo` estable para que quien lo llame decida qué hacer sin
 * parsear el mensaje (mismo criterio que el resto del backend: message legible,
 * nunca un stack de ASN.1). Códigos: HASH_INVALIDO, TSA_SIN_CONEXION, TSA_TIMEOUT,
 * TSA_HTTP, TSA_RECHAZADO, TSA_ALGORITMO_NO_ACEPTADO, TSA_RESPUESTA_INVALIDA,
 * TSA_HASH_DISTINTO, TSA_NONCE_DISTINTO.
 */
class ErrorTsa extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.name = 'ErrorTsa';
    this.codigo = codigo;
  }
}

/**
 * Arma el TimeStampReq (DER) para un hash SHA-256 en hexadecimal.
 * - Lleva un nonce aleatorio: la TSA debe devolverlo, así se comprueba que la respuesta
 *   corresponde a ESTA petición. Se fuerza positivo y sin ceros a la izquierda (INTEGER DER).
 * - certReq = true: el token incluye la cadena de certificados de la TSA, necesaria después
 *   para verificarlo sin volver a pedirla.
 */
function construirSolicitud(hashHex) {
  if (typeof hashHex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hashHex)) {
    throw new ErrorTsa('El hash debe ser un SHA-256 en hexadecimal (64 caracteres).', 'HASH_INVALIDO');
  }
  const hash = Buffer.from(hashHex, 'hex');
  const nonce = crypto.randomBytes(8);
  nonce[0] = (nonce[0] & 0x7f) | 0x01;

  const solicitud = new TimeStampReq({
    version: 1,
    messageImprint: { hashAlgorithm: 'SHA256', hashedMessage: hash },
    nonce,
    certReq: true,
  });
  return { der: solicitud.buffer, hash, nonce };
}

// ── Lectura del TimeStampResp (ASN.1 DER) ────────────────────

function invalida(detalle) {
  return new ErrorTsa(`La respuesta de la TSA no es un TimeStampResp válido (${detalle}).`, 'TSA_RESPUESTA_INVALIDA');
}

function decodificar(bytes, donde) {
  const copia = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const resultado = asn1js.fromBER(copia);
  if (resultado.offset === -1) throw invalida(`no se pudo decodificar ${donde}`);
  return resultado.result;
}

const hijos = (nodo) => (nodo && Array.isArray(nodo.valueBlock?.value) ? nodo.valueBlock.value : []);

// Quita ceros a la izquierda (un INTEGER puede venir con relleno) para comparar nonces.
const sinCeros = (bytes) => {
  let i = 0;
  while (i < bytes.length - 1 && bytes[i] === 0) i += 1;
  return Buffer.from(bytes).subarray(i);
};

function bytesDeOctetString(nodo) {
  if (!(nodo instanceof asn1js.OctetString)) throw invalida('se esperaba un OCTET STRING');
  return nodo.valueBlock.isConstructed
    ? Buffer.concat(hijos(nodo).map((parte) => Buffer.from(parte.valueBlock.valueHexView)))
    : Buffer.from(nodo.valueBlock.valueHexView);
}

// Bits activos de un BIT STRING (bit 0 = el más significativo del primer byte).
function bitsActivos(nodo) {
  const bytes = Buffer.from(nodo.valueBlock.valueHexView);
  const activos = [];
  for (let bit = 0; bit < bytes.length * 8; bit += 1) {
    if (bytes[bit >> 3] & (0x80 >> (bit & 7))) activos.push(bit);
  }
  return activos;
}

function leerEstado(nodoEstado) {
  if (!(nodoEstado instanceof asn1js.Sequence)) throw invalida('falta PKIStatusInfo');
  const [entero, ...resto] = hijos(nodoEstado);
  if (!(entero instanceof asn1js.Integer)) throw invalida('PKIStatusInfo sin estado');

  const texto = hijos(resto.find((n) => n instanceof asn1js.Sequence))
    .map((n) => n.valueBlock.value)
    .filter((t) => typeof t === 'string')
    .join(' ');
  const falla = resto.find((n) => n instanceof asn1js.BitString);
  return { estado: entero.valueBlock.valueDec, texto, bitsFalla: falla ? bitsActivos(falla) : [] };
}

/**
 * Valida y lee la respuesta binaria de la TSA. `hash` y `nonce` son los de la solicitud original.
 * Regresa { token, fecha }: `token` es el TimeStampResp COMPLETO en base64 (el .tsr que entiende
 * `openssl ts -verify`), `fecha` es el genTime que la TSA firmó dentro del token.
 */
function interpretarRespuesta(bytesRespuesta, { hash, nonce }) {
  const respuesta = decodificar(bytesRespuesta, 'la respuesta');
  if (!(respuesta instanceof asn1js.Sequence)) throw invalida('no es una SEQUENCE');
  const [nodoEstado, nodoToken] = hijos(respuesta);

  const { estado, texto, bitsFalla } = leerEstado(nodoEstado);
  if (estado !== 0 && estado !== 1) {
    const motivos = bitsFalla.map((b) => MOTIVOS_FALLA[b] ?? `bit ${b}`).join(', ');
    const detalle = [texto, motivos].filter(Boolean).join(' — ');
    const codigo = bitsFalla.includes(0) ? 'TSA_ALGORITMO_NO_ACEPTADO' : 'TSA_RECHAZADO';
    throw new ErrorTsa(
      `La TSA no concedió el sello (estado ${estado}: ${NOMBRES_ESTADO[estado] ?? 'desconocido'})${detalle ? `: ${detalle}` : ''}.`,
      codigo,
    );
  }

  // timeStampToken = ContentInfo { SignedData { encapContentInfo { TSTInfo } } }
  if (!(nodoToken instanceof asn1js.Sequence)) throw invalida('la respuesta no trae token');
  const [oidToken, contenido] = hijos(nodoToken);
  if (oidToken?.valueBlock?.toString() !== OID_SIGNED_DATA) throw invalida('el token no es SignedData');
  const signedData = hijos(contenido)[0];
  const encapsulado = hijos(signedData)[2];
  const [oidTst, envoltura] = hijos(encapsulado);
  if (oidTst?.valueBlock?.toString() !== OID_TST_INFO) throw invalida('el token no contiene un TSTInfo');

  const tst = decodificar(bytesDeOctetString(hijos(envoltura)[0]), 'el TSTInfo');
  const [, , imprint, , genTime, ...opcionales] = hijos(tst);
  if (!(genTime instanceof asn1js.GeneralizedTime)) throw invalida('el TSTInfo no trae genTime');

  const hashRespondido = hijos(imprint)[1];
  if (!hashRespondido || !bytesDeOctetString(hashRespondido).equals(hash)) {
    throw new ErrorTsa('El sello devuelto por la TSA corresponde a un hash distinto al enviado.', 'TSA_HASH_DISTINTO');
  }
  const nonceRespondido = opcionales.find((n) => n instanceof asn1js.Integer);
  if (!nonceRespondido || !sinCeros(nonceRespondido.valueBlock.valueHexView).equals(sinCeros(nonce))) {
    throw new ErrorTsa('El nonce de la respuesta no coincide con el de la solicitud.', 'TSA_NONCE_DISTINTO');
  }

  return { token: Buffer.from(bytesRespuesta).toString('base64'), fecha: genTime.toDate() };
}

/**
 * Pide a la TSA un sello de tiempo para un hash SHA-256 (hex, 64 caracteres, p. ej. el resultado de
 * crypto.createHash('sha256').update(buffer).digest('hex')).
 * Regresa { token, fecha, solicitud } (ver interpretarRespuesta) o lanza ErrorTsa con un mensaje claro.
 * `solicitud` es el TimeStampReq DER exacto que se envió, en base64: INSTRUMENTACIÓN DE PRUEBA para poder
 * verificar el token con `openssl ts -verify -queryfile`. Aún no se decide guardarlo en BD.
 */
async function solicitarSelloTiempo(hashHex, { url = URL_FREETSA, timeoutMs = TIMEOUT_MS } = {}) {
  const { der, hash, nonce } = construirSolicitud(hashHex);

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': CONTENT_TYPE_SOLICITUD },
      body: der,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ErrorTsa(`La TSA no respondió en ${timeoutMs} ms.`, 'TSA_TIMEOUT');
    }
    throw new ErrorTsa(`No se pudo conectar con la TSA (${url}): ${err.cause?.code || err.cause?.message || err.message}.`, 'TSA_SIN_CONEXION');
  }

  if (!respuesta.ok) {
    const cuerpo = (await respuesta.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 200);
    throw new ErrorTsa(
      `La TSA respondió HTTP ${respuesta.status}${cuerpo ? `: ${cuerpo}` : ''}. FreeTSA limita a una petición cada ~15 segundos.`,
      'TSA_HTTP',
    );
  }

  const sello = interpretarRespuesta(Buffer.from(await respuesta.arrayBuffer()), { hash, nonce });
  return { ...sello, solicitud: der.toString('base64') };
}

module.exports = { solicitarSelloTiempo, construirSolicitud, interpretarRespuesta, ErrorTsa };
