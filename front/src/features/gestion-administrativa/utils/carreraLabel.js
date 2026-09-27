// Etiquetas de carrera para Administrativa. FUENTE ÚNICA del módulo.
//
// Los códigos reales son los de la tabla `carrera` (VARCHAR(3)): ISC, IA, LCD. El nombre largo no
// existe en BD, así que vive aquí. Este módulo NUNCA decide qué carreras existen —eso es de la
// tabla— y NUNCA devuelve un valor que vuelva al backend: es solo presentación.
//
// Separación que sostiene este módulo:
//   · valor LÓGICO (lo que hay en `alumno.carrera` y en `carrera.nombre`):  IA
//   · sigla de PRESENTACIÓN (lo que ve el usuario):                         IIA
//
// Nada de aquí vuelve al backend: ADM no recibe la carrera en ningún cuerpo de petición y
// `alumno.carrera` es inmutable desde este módulo.
//
// ENTRADA LEGADO tolerada: `IIA` se acepta como equivalente de `IA` porque hay bases que todavía la
// guardan así. Se retira cuando ninguna la emita — mismo criterio que CARRERAS_ALIAS_LEGADO en
// backend/src/modules/reportes/reportes.shared.js.
const ALIAS_ENTRADA = Object.freeze({ IIA: "IA" });

// Claves = códigos LÓGICOS. Las etiquetas conservan el estilo corto que ya usaban estas pantallas.
const CARRERA_LABEL = Object.freeze({
  ISC: "Ing. Sistemas Computacionales",
  IA: "Ing. Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
});

// Sigla con la que se MUESTRA cada código lógico.
const SIGLA_PRESENTACION = Object.freeze({ IA: "IIA" });

// `hasOwn` y no `??`: con acceso directo, un código como '__proto__' devolvería un miembro heredado
// de Object.prototype en vez de undefined.
const enClave = (mapa, clave) => (clave !== null && clave !== undefined && Object.hasOwn(mapa, clave));
const aLogico = (codigo) => (enClave(ALIAS_ENTRADA, codigo) ? ALIAS_ENTRADA[codigo] : codigo);

// Nombre largo. Fallback de 3 niveles (el de CU-ADM-17): etiqueta → código crudo → "—".
export const etiquetaCarrera = (codigo) => {
  if (codigo === null || codigo === undefined) return "—";
  const logico = aLogico(codigo);
  return enClave(CARRERA_LABEL, logico) ? CARRERA_LABEL[logico] : codigo;
};

// Sigla de PRESENTACIÓN, para los sitios compactos (chips y subtítulos) que siempre mostraron el
// código corto. Devuelve `IIA` para el lógico `IA`: es una sigla para pintar, NO el código real.
export const siglaCarrera = (codigo) => {
  if (codigo === null || codigo === undefined) return "—";
  const logico = aLogico(codigo);
  if (!enClave(CARRERA_LABEL, logico)) return codigo;
  return enClave(SIGLA_PRESENTACION, logico) ? SIGLA_PRESENTACION[logico] : logico;
};
