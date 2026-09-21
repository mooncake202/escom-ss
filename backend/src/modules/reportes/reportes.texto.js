// Texto que se imprimirá en los PDF de Reportes: normalización y validación contra la fuente embebida.
// Un carácter sin glifo se rechaza con un error claro: el PDF lo dibujaría mal o lo sustituiría sin avisar.
//
// Sin límite de longitud: se calibra con la plantilla oficial. Los saltos de línea se conservan
// (actividades = una por línea).

const { tieneGlifo } = require('./reportes.fuentes');

const CODIGOS_ERROR = Object.freeze({
  TEXTO_INVALIDO: 'TEXTO_INVALIDO',
  TEXTO_VACIO: 'TEXTO_VACIO',
  ACTIVIDADES_VACIAS: 'ACTIVIDADES_VACIAS',
  CARACTERES_NO_SOPORTADOS: 'CARACTERES_NO_SOPORTADOS',
});

// Máximo de caracteres que se listan en el mensaje de error.
const MAX_CARACTERES_EN_MENSAJE = 10;

function crearError(mensaje, code, extra = {}) {
  return Object.assign(new Error(mensaje), { status: 400, code, ...extra });
}

const formatoCodigo = (codigo) => `U+${codigo.toString(16).toUpperCase().padStart(4, '0')}`;

// Separadores de línea que no son \n: CRLF, CR, NEL, LS y PS.
const SALTOS_DE_LINEA = /\r\n|[\r\u0085\u2028\u2029]/g;
// Espacios Unicode (NBSP, espacios tipográficos, ideográfico…) → espacio normal.
const ESPACIOS_UNICODE = /\p{Zs}/gu;
// Controles (NUL, escape, DEL, C1…) y caracteres de formato invisibles (ancho cero, BOM, guion blando, marcas bidi).
const NO_IMPRIMIBLES = /[\p{Cc}\p{Cf}]/gu;

/**
 * Deja el texto listo para imprimir:
 *  - Unicode NFC (una "ñ" o "á" escrita como letra + acento combinado se compone);
 *  - saltos de línea unificados a \n; tabuladores y espacios Unicode → espacio;
 *  - se ELIMINAN controles y caracteres de formato invisibles;
 *  - cada línea sin espacios en los extremos ni espacios repetidos.
 * Los saltos de línea se conservan (también las líneas en blanco intermedias).
 */
function normalizarTexto(texto) {
  if (typeof texto !== 'string') throw crearError('El texto debe ser una cadena.', CODIGOS_ERROR.TEXTO_INVALIDO);

  const limpio = texto
    .normalize('NFC')
    .replace(SALTOS_DE_LINEA, '\n')
    .replace(/\t/g, ' ')
    .replace(ESPACIOS_UNICODE, ' ')
    .replace(NO_IMPRIMIBLES, (c) => (c === '\n' ? c : ''));

  return limpio
    .split('\n')
    .map((linea) => linea.replace(/ {2,}/g, ' ').trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/**
 * Caracteres del texto SIN glifo en la fuente (únicos, en orden de aparición): [{ caracter, codigo }].
 * `caracter` es null cuando no es imprimible (privado, sin asignar, sustituto suelto). Asume texto normalizado.
 */
function encontrarCaracteresNoSoportados(texto) {
  const vistos = new Set();
  const encontrados = [];
  for (const caracter of texto) {
    if (caracter === '\n') continue;
    const punto = caracter.codePointAt(0);
    if (vistos.has(punto) || tieneGlifo(punto)) continue;
    vistos.add(punto);
    const imprimible = !/[\p{Co}\p{Cn}\p{Cs}]/u.test(caracter);
    encontrados.push({ caracter: imprimible ? caracter : null, codigo: formatoCodigo(punto) });
  }
  return encontrados;
}

function errorPorCaracteres(caracteres, etiqueta) {
  const mostrados = caracteres.slice(0, MAX_CARACTERES_EN_MENSAJE)
    .map(({ caracter, codigo }) => (caracter ? `"${caracter}" (${codigo})` : codigo));
  const resto = caracteres.length - mostrados.length;
  const lista = mostrados.join(', ') + (resto > 0 ? ` y ${resto} más` : '');
  return crearError(
    `${etiqueta} contiene caracteres que no se pueden imprimir en el reporte: ${lista}. Quítalos o reemplázalos.`,
    CODIGOS_ERROR.CARACTERES_NO_SOPORTADOS,
    { caracteres },
  );
}

function exigirSoportado(texto, etiqueta) {
  const caracteres = encontrarCaracteresNoSoportados(texto);
  if (caracteres.length > 0) throw errorPorCaracteres(caracteres, etiqueta);
}

/**
 * Texto de una sola línea (nombres, programa, correo…): los saltos se vuelven espacios.
 * Regresa el texto normalizado o lanza error (vacío, no es texto, caracteres sin glifo).
 */
function validarTextoLinea(texto, etiqueta = 'El texto') {
  const normalizado = normalizarTexto(texto).replace(/\n+/g, ' ').trim();
  if (normalizado === '') throw crearError(`${etiqueta} no puede estar vacío.`, CODIGOS_ERROR.TEXTO_VACIO);
  exigirSoportado(normalizado, etiqueta);
  return normalizado;
}

/**
 * Actividades realizadas: una actividad por línea (el alumno no escribe la numeración). Las líneas en blanco se
 * descartan. Regresa { texto, lineas }; sin límite de longitud.
 */
function validarActividades(texto) {
  if (texto === null || texto === undefined) {
    throw crearError('Las actividades realizadas son obligatorias.', CODIGOS_ERROR.ACTIVIDADES_VACIAS);
  }
  const lineas = normalizarTexto(texto).split('\n').filter((linea) => linea !== '');
  if (lineas.length === 0) {
    throw crearError('Las actividades realizadas son obligatorias.', CODIGOS_ERROR.ACTIVIDADES_VACIAS);
  }
  const normalizado = lineas.join('\n');
  exigirSoportado(normalizado, 'Las actividades');
  return { texto: normalizado, lineas };
}

module.exports = {
  CODIGOS_ERROR,
  normalizarTexto,
  encontrarCaracteresNoSoportados,
  validarTextoLinea,
  validarActividades,
};
