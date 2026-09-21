// Utilidades puras de CU-REP-04: revisan en pantalla lo mismo que el backend exige (que las actividades cambien de verdad).
// El servidor es la autoridad: si difieren, responde SIN_CAMBIOS_EN_ACTIVIDADES y la pantalla lo muestra.

// Saltos de línea que no son \n: CRLF, CR, NEL, LS y PS. Espacios Unicode → espacio normal; controles y caracteres de
// formato invisibles se eliminan (igual que el backend).
const SALTOS_DE_LINEA = /\r\n|[\r\x85\p{Zl}\p{Zp}]/gu;
const ESPACIOS_UNICODE = /\p{Zs}/gu;
const NO_IMPRIMIBLES = /[\p{Cc}\p{Cf}]/gu;

/** Texto como lo compara el servidor: NFC, saltos de línea unificados, sin espacios repetidos ni líneas vacías. */
export function normalizarActividades(texto) {
  return String(texto ?? "")
    .normalize("NFC")
    .replace(SALTOS_DE_LINEA, "\n")
    .replace(/\t/g, " ")
    .replace(ESPACIOS_UNICODE, " ")
    .replace(NO_IMPRIMIBLES, (c) => (c === "\n" ? c : ""))
    .split("\n")
    .map((linea) => linea.replace(/ {2,}/g, " ").trim())
    .filter((linea) => linea !== "")
    .join("\n");
}

/** Hay corrección real cuando el contenido cambia; saltos de línea, líneas vacías o espacios de más no cuentan. */
export const hayCambioReal = (original, nuevo) => normalizarActividades(original) !== normalizarActividades(nuevo);
