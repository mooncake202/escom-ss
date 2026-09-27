// Presentación de la carrera en Ofertas. SOLO para pintar: nada de aquí vuelve al backend.
//
// Separación que sostiene este módulo:
//   · valor LÓGICO (lo que hay en `carrera.nombre`, lo que viaja en el payload): IA
//   · sigla de PRESENTACIÓN (lo que ve el profesor):                             IIA
//
// El selector obtiene las opciones de GET /ofertas/perfiles y envía el `nombre` LITERAL del
// catálogo; estas funciones solo deciden cómo se dibuja. Si alguien usara su salida para construir
// el payload, se reintroduciría el fallo que esto evita.
//
// TOLERANCIA TEMPORAL: se aceptan `IA` y `IIA` como entrada y ambas se muestran como `IIA`, para
// que las pantallas se vean bien tanto con la BD ya estandarizada en `IA` como con la local, que
// todavía tiene `IIA`. Cuando todas las bases estén en `IA`, la entrada `IIA` deja de ocurrir y
// esta tolerancia puede retirarse.
const SIGLA_PRESENTACION = Object.freeze({ IA: "IIA" });

const NOMBRE_LARGO = Object.freeze({
  ISC: "Ingeniería en Sistemas Computacionales",
  LCD: "Licenciatura en Ciencia de Datos",
  IA: "Ingeniería en Inteligencia Artificial",
  // Entrada legado tolerada: mismo nombre que IA, porque es la misma carrera.
  IIA: "Ingeniería en Inteligencia Artificial",
});

// Sigla que se muestra. Para los sitios compactos (chips) donde no cabe el nombre largo.
export const siglaPresentacion = (codigo) => {
  if (codigo === null || codigo === undefined) return "—";
  return Object.hasOwn(SIGLA_PRESENTACION, codigo) ? SIGLA_PRESENTACION[codigo] : codigo;
};

// Etiqueta completa "SIGLA — Nombre largo". Un código fuera del catálogo se muestra tal cual: se
// prefiere una etiqueta pobre a ocultarle una opción al profesor.
export const etiquetaPresentacion = (codigo) => {
  if (codigo === null || codigo === undefined) return "—";
  const nombre = Object.hasOwn(NOMBRE_LARGO, codigo) ? NOMBRE_LARGO[codigo] : null;
  return nombre ? `${siglaPresentacion(codigo)} — ${nombre}` : codigo;
};
