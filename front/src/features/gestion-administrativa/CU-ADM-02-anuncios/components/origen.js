// Color de acento por origen del anuncio, compartido por la tarjeta y el detalle.
// `origen` es el enum OrigenAnuncio del esquema: 'coordinador' | 'profesor'.
export const colorOrigen = (origen) => (origen === "coordinador" ? "#4A90D9" : "#a78bfa");
