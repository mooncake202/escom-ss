// generar-plantilla-v2.js — HERRAMIENTA DE MANTENIMIENTO, no runtime.
//
// Construye assets/plantilla-evaluacion-v2.pdf: toma
// assets/plantilla-evaluacion.pdf (copia DIRECTA del PDF real exportado
// desde Microsoft Word — "Reporte-Desempeno-Base.pdf" en la raíz del
// proyecto, SIN pasar por LibreOffice) y le agrega un AcroForm real
// (8 TextField + 28 CheckBox) más 2 textos fijos ("ESCOM").
//
// HISTORIAL — por qué ya NO se usa LibreOffice para la base:
// la conversión automática vía `soffice --headless --convert-to pdf`
// (ver docker-compose.yml, sigue instalado por si se necesita para otra
// cosa) introdujo corrupción visual real: encabezados de tabla cortados
// a media palabra ("FACTOR"/"PARÁMETRO" partidos en 2 líneas) y
// reflow a una 2a página que obligaba a recortar y redibujar 2
// leyendas del pie a mano. El usuario proporcionó en su lugar un PDF
// exportado DIRECTO desde Word (Reporte-Desempeno-Base.pdf,
// Producer: "Microsoft® Word para Microsoft 365"), estructuralmente
// limpio, 1 sola página, sin esos defectos — confirmado visualmente.
// Ya no hace falta recortar página 2 ni redibujar leyendas: el PDF
// base ya trae "Nombre, Cargo y Firma de Responsable Directo" y
// "Sello de la dependencia" en su posición real, en la única página.
//
// POR QUÉ EXISTE ESTE ARCHIVO (contexto general): mover el "dónde va
// cada cosa" a metadata del propio PDF (con nombre autoexplicativo) en
// vez de constantes JS + dibujo manual — mucho más robusto, sin lógica
// de dibujo custom que se pueda romper (ver commits anteriores: el
// enfoque de dibujar a mano con pdf-lib.drawText tuvo bugs reales de
// centrado/zona invertida).
//
// CUÁNDO VOLVER A CORRER ESTO: si el formato oficial cambia alguna vez.
// Pasos:
//   1. Reemplazar Reporte-Desempeno-Base.pdf (raíz del proyecto) con el
//      PDF nuevo exportado DIRECTO desde Word (NO LibreOffice — ver
//      historial arriba) y copiarlo a assets/plantilla-evaluacion.pdf.
//   2. Recalibrar TODAS las coordenadas de abajo contra el PDF nuevo —
//      generar una grilla de referencia (líneas cada 10pt, etiquetas
//      cada 50pt, dibujada con pdf-lib sobre la plantilla), renderizar
//      con `pdftoppm -png -r 300`, y leer las coordenadas exactas
//      cruzando esa grilla con `pdftotext -bbox` sobre el mismo
//      archivo (las etiquetas fijas del formato dan el ancla exacta).
//      NO reutilizar las coordenadas de abajo a ciegas.
//   3. Correr: docker compose exec backend node backend/src/modules/lss/scripts/generar-plantilla-v2.js
//   4. Verificar visualmente el resultado antes de reemplazar el asset
//      en uso.
//
// CONVENCIÓN DE COORDENADAS: todas las "y" de abajo están medidas DESDE
// ARRIBA de la página (como pdftotext/HTML) — el helper `rect()` hace la
// conversión a la convención de pdf-lib (desde abajo) aquí mismo.

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb, drawLine } = require('pdf-lib');

const RUTA_ENTRADA = path.join(__dirname, '../assets/plantilla-evaluacion.pdf');
const RUTA_SALIDA = path.join(__dirname, '../assets/plantilla-evaluacion-v2.pdf');

const PAGINA = { ancho: 612, alto: 792 };

// ── Campos de texto — {x, yTop, ancho, alto} ───────────────────────
// Calibrados con pdftotext -bbox + grilla de referencia sobre
// Reporte-Desempeno-Base.pdf (exportado directo de Word).
const CAMPOS_TEXTO = {
  // "Prestador:" termina en x=130.05, y=89.78-100.64.
  campo_nombre: { x: 135, yTop: 88, ancho: 285, alto: 14 },
  // "Boleta:" termina en x=459.98, misma fila.
  campo_boleta: { x: 464, yTop: 88, ancho: 110, alto: 14 },
  // "Carrera:" termina en x=334.6, y=109.7-120.56.
  campo_carrera: { x: 339, yTop: 108, ancho: 235, alto: 14 },
  // "Social:" termina en x=235.93, y=129.5-140.36.
  campo_periodo_inicio: { x: 240, yTop: 128, ancho: 104, alto: 14, tamañoFuente: 7 },
  // "al:" termina en x=357.42, misma fila.
  campo_periodo_fin: { x: 361, yTop: 128, ancho: 213, alto: 14, tamañoFuente: 7 },
  // Caja visible de "Observaciones:" (label y=605.86-616.72) — confirmada
  // con grilla: borde superior ≈600, borde inferior ≈630 (antes de
  // "Nombre de la Dependencia:", y=633.82). SIN tamañoFuente fijo a
  // propósito: pdf-lib auto-ajusta (computeFontSize) para que el texto
  // NUNCA se salga de esta caja sin importar qué tan largo sea —
  // confirmado en el código fuente de layoutMultilineText.
  campo_observaciones: { x: 105, yTop: 600, ancho: 455, alto: 30, multilinea: true },
  // "PUNTOS" (de "SUMA TOTAL DE PUNTOS") termina en x=523.45, y=575.38-582.62
  // — mismo centro-x que la columna de casillas (546).
  campo_suma_total: { x: 529, yTop: 574, ancho: 44, alto: 13, centrado: true, tamañoFuente: 9 },
  // Zona IZQUIERDA del pie (firma del profesor) — encima de la línea de
  // firma (confirmada con grilla en x:33-245, y≈745; caption real
  // "Nombre, Cargo y Firma..." ya viene impresa en la base, y=747.96).
  campo_nombre_profesor: { x: 33, yTop: 733, ancho: 212, alto: 11, tamañoFuente: 7, centrado: true },
};

// ── Casillas de puntaje (28) — {yCentro} DESDE ARRIBA ──────────────
// Centro-x confirmado con pdftotext -bbox: las 28 palabras de puntaje
// caen todas en xMin≈540.8-542.6/xMax≈549.8-551.6 → centro ≈546.2,
// fijo para las 28. Y-centro por fila: promedio yMin/yMax de cada
// palabra 100/95/90/85 real de la tabla (orden de documento limpio en
// esta base — sin el desorden que sí tenía la conversión LibreOffice).
// El orden de FACTORES coincide con FACTORES_EVALUACION en lss.shared.js.
const X_CASILLA = 546.2;
const FACTORES = [
  { slug: 'calidad_trabajo', niveles: { 100: 190.6, 95: 203.2, 90: 215.9, 85: 228.6 } },
  { slug: 'aplicacion_conocimientos', niveles: { 100: 243.9, 95: 257.1, 90: 269.7, 85: 282.3 } },
  { slug: 'adquisicion_conocimientos', niveles: { 100: 300.8, 95: 313.5, 90: 326.2, 85: 339.8 } },
  { slug: 'disciplina', niveles: { 100: 354.4, 95: 367.5, 90: 380.2, 85: 392.8 } },
  { slug: 'presentacion_personal', niveles: { 100: 408.7, 95: 420.3, 90: 434.0, 85: 446.6 } },
  { slug: 'iniciativa', niveles: { 100: 466.7, 95: 479.4, 90: 492.0, 85: 504.7 } },
  { slug: 'relaciones_interpersonales', niveles: { 100: 524.1, 95: 537.3, 90: 550.1, 85: 562.8 } },
];
const TAMAÑO_CASILLA = 11;

// ── Zonas de imagen (rúbrica / sello) — confirmadas con la grilla
// contra la base real: la referencia visual es Sello de la dependencia
// a la DERECHA (caja con borde dibujado, x:403-565, y:655-758), Nombre/
// Firma del profesor a la IZQUIERDA (sin caja, solo línea de firma en
// x:33-245, y≈745). ZONA_RUBRICA agrandada (antes alto:52) — crece hacia
// arriba, hacia donde antes estaba la leyenda "Nombre, Cargo y Firma..."
// (ahora borrada, ver LEYENDAS_A_BORRAR), sin invadir la zona del sello.
const ZONA_RUBRICA = { x: 33, yTop: 660, ancho: 210, alto: 82 }; // IZQUIERDA — profesor, agrandada (crece hacia arriba).
const ZONA_SELLO = { x: 410, yTop: 660, ancho: 148, alto: 85 }; // DERECHA — dentro de la caja de sello.

// "Unidad Académica:" y "Nombre de la Dependencia:" son SIEMPRE "ESCOM"
// (todo el sistema es exclusivo de ESCOM) — texto fijo, no AcroForm.
const TEXTOS_FIJOS_ESCOM = [
  { x: 123, yTop: 119, texto: 'ESCOM' }, // "Académica:" termina x=118.37, y=109.7-120.56.
  { x: 158, yTop: 643, texto: 'ESCOM' }, // "Dependencia:" termina x=153.38, y=633.82-644.68.
];

// Ajuste 4: el usuario pidió quitar estas 2 leyendas (ya no aportan nada
// una vez que la rúbrica/sello real ocupan visualmente ese espacio) —
// bbox exactos medidos con pdftotext -bbox sobre la base real, cubiertos
// con un rectángulo blanco sin borde.
const LEYENDAS_A_BORRAR = [
  { x: 30, yTop: 745, ancho: 195, alto: 15 }, // "Nombre, Cargo y Firma de Responsable Directo" (x:33-221, y:748-758).
  { x: 400, yTop: 745, ancho: 170, alto: 17 }, // "Sello de la dependencia" (x:403-565... en realidad 444-551, y:748-759 — margen extra por seguridad).
];

async function main() {
  const bytes = fs.readFileSync(RUTA_ENTRADA);
  const doc = await PDFDocument.load(bytes);

  if (doc.getPageCount() !== 1) {
    throw new Error(`La plantilla de entrada debería tener 1 sola página (tiene ${doc.getPageCount()}) — confirma con pdfinfo antes de continuar.`);
  }
  const pagina = doc.getPage(0);
  const { width, height } = pagina.getSize();
  if (Math.round(width) !== PAGINA.ancho || Math.round(height) !== PAGINA.alto) {
    throw new Error(`La plantilla de entrada no tiene el tamaño esperado (${width}x${height}).`);
  }

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  // Convierte {x, yTop, ancho, alto} (medido desde arriba) al rectángulo
  // {x, y, width, height} que pide pdf-lib (y = borde INFERIOR, medido
  // desde abajo).
  const rect = (c) => ({ x: c.x, y: height - c.yTop - c.alto, width: c.ancho, height: c.alto });

  // 8 TextField — fondo y borde TRANSPARENTES a propósito (backgroundColor/
  // borderColor: undefined, con la CLAVE presente en el objeto — pdf-lib
  // solo aplica blanco/negro por defecto si la clave no existe). Así se ve
  // idéntico a la base: lo que ya está impreso (líneas, etc.) sigue
  // visible, el texto se dibuja encima, sin tapar nada de más.
  Object.entries(CAMPOS_TEXTO).forEach(([nombre, c]) => {
    const campo = form.createTextField(nombre);
    if (c.multilinea) campo.enableMultiline();
    if (c.centrado) campo.setAlignment(1); // 1 = centrado (pdf-lib: 0 izq, 1 centro, 2 der)
    campo.addToPage(pagina, {
      ...rect(c), font, textColor: rgb(0, 0, 0),
      backgroundColor: undefined, borderColor: undefined, borderWidth: 0,
    });
    // IMPORTANTE: addToPage() genera una apariencia inicial con el campo
    // VACÍO y hornea el tamaño de fuente resultante en /DA — con texto
    // vacío, pdf-lib "auto-ajusta" maximizando el tamaño para llenar el
    // alto de la caja (¡terminaba guardando 25pt!), y ese tamaño quedaba
    // fijo para siempre salvo que se sobreescriba explícitamente. Por eso
    // SIEMPRE hay que llamar setFontSize aquí — con el valor fijo pedido,
    // o con 0 (auto real) cuando no se pidió uno, nunca dejarlo "tal cual".
    campo.setFontSize(c.tamañoFuente || 0);
  });

  // 28 CheckBox — también transparentes (círculo original queda intacto,
  // sin necesidad de mover ni borrar el número que ya está impreso ahí).
  // La apariencia por defecto de pdf-lib dibuja una palomita "✔"; el
  // usuario pidió una "X" real — se reemplaza con un appearance provider
  // custom (drawLine, API pública de pdf-lib) que dibuja 2 líneas
  // cruzadas, sin fondo/borde. Se define AQUÍ (build-time, casilla sin
  // marcar) para los 2 estados (on/off) — en runtime (lss.pdf.js) solo se
  // llama .check() + form.flatten(), que reutiliza esta apariencia ya
  // guardada en vez de la palomita por defecto (validado con una prueba
  // de 2 fases: construir sin marcar → recargar → marcar → flatten).
  const dibujarX = (field, widget) => {
    const r = widget.getRectangle();
    const pad = 1.5;
    const ops = [
      ...drawLine({ start: { x: pad, y: pad }, end: { x: r.width - pad, y: r.height - pad }, thickness: 1.2, color: rgb(0, 0, 0) }),
      ...drawLine({ start: { x: pad, y: r.height - pad }, end: { x: r.width - pad, y: pad }, thickness: 1.2, color: rgb(0, 0, 0) }),
    ];
    return { normal: { on: ops, off: [] } };
  };

  FACTORES.forEach((factor) => {
    Object.entries(factor.niveles).forEach(([valor, yCentro]) => {
      const nombre = `factor_${factor.slug}_${valor}`;
      const casilla = form.createCheckBox(nombre);
      casilla.addToPage(pagina, {
        x: X_CASILLA - TAMAÑO_CASILLA / 2,
        y: height - yCentro - TAMAÑO_CASILLA / 2,
        width: TAMAÑO_CASILLA,
        height: TAMAÑO_CASILLA,
        backgroundColor: undefined, borderColor: undefined, borderWidth: 0,
      });
      casilla.updateAppearances(dibujarX);
    });
  });

  // Textos fijos "ESCOM".
  TEXTOS_FIJOS_ESCOM.forEach(({ x, yTop, texto }) => {
    pagina.drawText(texto, { x, y: height - yTop, size: 9, font, color: rgb(0, 0, 0) });
  });

  // Ajuste 4: borra las 2 leyendas del pie (rectángulo blanco sin borde,
  // sobre el bbox medido de cada una).
  LEYENDAS_A_BORRAR.forEach((z) => {
    pagina.drawRectangle({ x: z.x, y: height - z.yTop - z.alto, width: z.ancho, height: z.alto, color: rgb(1, 1, 1), borderWidth: 0 });
  });

  // updateFieldAppearances:false — por defecto doc.save() recalcula y
  // vuelve a hornear la apariencia (y el /DA) de cada campo usando su
  // texto ACTUAL, que aquí está vacío. Eso pisaba el fontSize:0 (auto)
  // de campo_observaciones con el mismo tamaño gigante de siempre (25pt,
  // el que llena la caja con una sola línea vacía). Sin este flag, el
  // campo se guarda tal cual quedó configurado arriba, y el auto-ajuste
  // real solo ocurre en runtime (lss.pdf.js), cuando ya hay texto real.
  fs.writeFileSync(RUTA_SALIDA, await doc.save({ updateFieldAppearances: false }));
  console.log(`✅ Plantilla con AcroForm generada: ${RUTA_SALIDA}`);
  console.log(`   Campos de texto: ${Object.keys(CAMPOS_TEXTO).length}`);
  console.log(`   Casillas: ${FACTORES.length * 4}`);
}

main().catch((e) => {
  console.error('❌ Error al generar la plantilla v2:', e);
  process.exit(1);
});
