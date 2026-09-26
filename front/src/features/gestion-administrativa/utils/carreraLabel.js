// Etiquetas de carrera para Administrativa. FUENTE ÚNICA del módulo.
//
// Los códigos reales son los de la tabla `carrera` (VARCHAR(3)): ISC, IIA, LCD. El nombre largo no
// existe en BD, así que vive aquí. Este módulo NUNCA decide qué carreras existen —eso es de la
// tabla— y NUNCA devuelve un valor que vuelva al backend: es solo presentación.
//
// ALIAS DE ENTRADA — `IA` se acepta como equivalente de `IIA` por un bug conocido de GR: su
// formulario de inscripción (CU-GR-01, utils/constants.js) ofrece `value: "IA"`, un código que ya
// no existe en el catálogo. Mientras ese bug viva, un alumno podría llegar con `IA` y Administrativa
// lo mostraría como código desconocido. SE RETIRA cuando GR deje de emitirlo — mismo criterio que
// CARRERAS_ALIAS_LEGADO en backend/src/modules/reportes/reportes.shared.js.
const ALIAS_ENTRADA = Object.freeze({ IA: "IIA" });

const CARRERA_LABEL = Object.freeze({
  ISC: "Ing. Sistemas Computacionales",
  IIA: "Ing. Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
});

const normalizar = (codigo) => ALIAS_ENTRADA[codigo] ?? codigo;

// Nombre largo. Fallback de 3 niveles (el de CU-ADM-17): etiqueta → código crudo → "—".
export const etiquetaCarrera = (codigo) => CARRERA_LABEL[normalizar(codigo)] ?? codigo ?? "—";

// Sigla ya normalizada, para los sitios compactos (chips y subtítulos) que siempre mostraron el
// código corto. Mismo fallback de 3 niveles: sigla conocida → código crudo → "—".
export const codigoCarrera = (codigo) => {
  if (codigo === null || codigo === undefined) return "—";
  const normalizado = normalizar(codigo);
  return CARRERA_LABEL[normalizado] ? normalizado : codigo;
};
