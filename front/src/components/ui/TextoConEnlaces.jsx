// Renderiza texto plano detectando URLs y convirtiéndolas en <a> reales
// clickeables, SIN usar dangerouslySetInnerHTML en ningún punto — React
// escapa automáticamente cualquier contenido de texto que se le pase como
// hijo ({texto}), así que un mensaje con caracteres tipo <script> se
// muestra siempre como texto literal, nunca se interpreta como HTML.
// Patrón estándar y seguro de "linkify": partir el string por un regex de
// URL y alternar entre nodos de texto (escapados por React) y nodos <a>.

const URL_REGEX_SPLIT = /(https?:\/\/[^\s]+)/g;
// Regex separado (sin flag 'g') para probar cada parte — reutilizar la
// misma instancia global en .test() dentro de un loop es un bug clásico
// de JS (lastIndex queda con estado entre llamadas y da falsos negativos).
const URL_REGEX_TEST = /^https?:\/\/[^\s]+$/;

export function TextoConEnlaces({ texto, style }) {
  if (!texto) return null;

  const partes = texto.split(URL_REGEX_SPLIT);

  return (
    <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", ...style }}>
      {partes.map((parte, i) =>
        URL_REGEX_TEST.test(parte) ? (
          // eslint-disable-next-line react/no-array-index-key
          <a key={i} href={parte} target="_blank" rel="noopener noreferrer">
            {parte}
          </a>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <span key={i}>{parte}</span>
        )
      )}
    </p>
  );
}
