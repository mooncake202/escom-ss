// Datos e imágenes FICTICIOS para las pruebas del generador de PDF. Todo se construye en memoria (sin archivos).

const crypto = require('crypto');
const zlib = require('zlib');

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunkPng(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'latin1'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

/**
 * PNG RGBA con un trazo tipo rúbrica sobre fondo transparente (ficticio). `ancho` x `alto` en píxeles.
 */
function crearPng(ancho, alto, [r, g, b] = [20, 40, 140]) {
  const pixeles = Buffer.alloc(ancho * alto * 4);
  const poner = (x, y) => {
    if (x < 0 || y < 0 || x >= ancho || y >= alto) return;
    const i = (y * ancho + x) * 4;
    pixeles[i] = r; pixeles[i + 1] = g; pixeles[i + 2] = b; pixeles[i + 3] = 255;
  };
  for (let t = 0; t < 1; t += 0.0005) {
    const x = t * (ancho - 20) + 10;
    const y = alto / 2 + Math.sin(t * 22) * alto * 0.28 * (1 - t * 0.5) + Math.cos(t * 7) * alto * 0.12;
    for (let dx = -2; dx <= 2; dx += 1) for (let dy = -2; dy <= 2; dy += 1) if (dx * dx + dy * dy <= 5) poner(Math.round(x + dx), Math.round(y + dy));
  }
  return pngRgba(ancho, alto, pixeles);
}

// PNG RGBA a partir de los píxeles ya calculados (ancho * alto * 4 bytes).
function pngRgba(ancho, alto, pixeles) {
  const tamanoFila = ancho * 4 + 1;
  const filas = Buffer.alloc(tamanoFila * alto);
  for (let y = 0; y < alto; y += 1) pixeles.copy(filas, y * tamanoFila + 1, y * ancho * 4, (y + 1) * ancho * 4);

  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8; // bits por canal
  cabecera[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunkPng('IHDR', cabecera),
    chunkPng('IDAT', zlib.deflateSync(filas)),
    chunkPng('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * PNG RGBA de ruido aleatorio: no se comprime, así que su tamaño en bytes es ≈ ancho * alto * 4 (para probar límites de tamaño).
 */
function crearPngRuido(ancho, alto) {
  return pngRgba(ancho, alto, crypto.randomBytes(ancho * alto * 4));
}

// JPEG válido de 40x16 px (621 bytes), generado una sola vez con una biblioteca de imágenes.
const JPEG_PEQUENO = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQACgDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUDBgcE/8QAKRAAAgEDAwQCAAcAAAAAAAAAAQIDBAURAAYSISIxQRMUBxUyM1Fhwf/EABcBAAMBAAAAAAAAAAAAAAAAAAACAwH/xAAiEQEAAQIEBwAAAAAAAAAAAAABAAIhAzFhoRITUbHh8PH/2gAMAwEAAhEDEQA/AN8mmip4JJ55EihjUu8jsFVVAySSfAA96z2T8RLtPBU3227fep2tSzqj1OSs8sYDiSWND5VTw8+gc+W+NjV7WuO591vU7k+H8it8gNBbon5JUNj92XoM4yRxP9jxkyXGGGKngjggjSKGNQiRooVVUDAAA8AD1q5y8MucS7ee0W7pILdcaO726CvoKhKilnXlHIngj/CD0IPUEEHU800VPBJPPIkUMal3kdgqqoGSST4AHvVKrtoVliv0N82ZHTU5lZIbhbGPxU88eccxgdjKDnIH8kAnKu0j2qtzeGs3Q6XKqCqfqDP0oXAYEpEf1HDnufkfY49AMaKMyq2/uvyAvSdtuvjXW4yR0lvqTbkVsXGTCRzN2FfiBPJ1IZu/AXt6Fs50ab6NSUciNP/Z',
  'base64',
);

// Resultado con la forma de prepararReporteMensual (ya generable) con datos ficticios.
function resultadoEjemplo(cambios = {}) {
  const base = {
    puedeGenerar: true,
    motivosBloqueo: [],
    alumno: {
      nombreCompleto: 'ANA MARÍA GARCÍA LÓPEZ',
      carreraNombre: 'Ingeniería en Inteligencia Artificial',
      boleta: '2022630001',
      creditosTexto: '85.5 %',
      telefono: '5512345678',
      correoPersonal: 'ana.garcia.lopez@example.com',
    },
    profesor: { nombreCompleto: 'LUIS ENRIQUE TORRES VEGA' },
    servicio: { programa: 'Programa de Desarrollo de Sistemas de Información para Apoyo a la Gestión Académica' },
    reporte: { numero: 3, periodo: { inicioTexto: '16 de septiembre de 2025', finTexto: '15 de octubre de 2025' } },
  };
  return {
    ...base,
    ...cambios,
    alumno: { ...base.alumno, ...(cambios.alumno ?? {}) },
    profesor: { ...base.profesor, ...(cambios.profesor ?? {}) },
    servicio: { ...base.servicio, ...(cambios.servicio ?? {}) },
    reporte: { ...base.reporte, ...(cambios.reporte ?? {}) },
  };
}

const ACTIVIDADES_EJEMPLO = [
  'Diseñé e implementé el módulo de consulta de reportes mensuales, incluyendo las validaciones de los datos del alumno y la integración con el servicio de bitácoras aprobadas.',
  'Participé en las reuniones semanales de seguimiento con el responsable directo para revisar el avance de las actividades asignadas y definir los entregables del siguiente periodo.',
  'Elaboré pruebas unitarias para las funciones de cálculo de periodos, cubriendo casos límite como cambios de año y días inhábiles del calendario institucional.',
  'Documenté la API del módulo y preparé los diagramas de secuencia solicitados por coordinación, con ¿qué? ¡y ñandú! en el texto.',
].join('\n');

module.exports = { crearPng, crearPngRuido, JPEG_PEQUENO, resultadoEjemplo, ACTIVIDADES_EJEMPLO };
