// test-cu-gr-01.js
//
// Prueba CU-GR-01 (POST /registro) mandando una serie de casos reales a la
// API — sin necesidad de llenar el formulario a mano en el navegador.
//
// REQUIERE que el stack esté corriendo (docker compose up) y que ya hayas
// corrido: seed-test-users.js, seed-profesores-test.js, seed-ofertas-servicio.js,
// seed-periodos-servicio-social.js.
//
// CÓMO CORRERLO:
//   Opción A (recomendada) — directo en tu máquina Windows, fuera de Docker,
//   apuntando a nginx igual que tu curl de prueba anterior:
//     node test-cu-gr-01.js
//
//   Opción B — si "node" no se reconoce en tu terminal de Windows, corre
//   dentro del contenedor backend, apuntando directo a Express (sin nginx,
//   por eso sin /api):
//     docker compose exec -e BASE_URL=http://localhost:3000/ backend node backend/src/lib/test-cu-gr-01.js
//
// Cada caso crea datos nuevos con boleta/correo aleatorios para no chocar
// entre corridas (excepto los casos de "duplicado", que reusan a propósito
// los del primer caso exitoso).

const BASE_URL = process.env.BASE_URL || 'http://localhost/api';

function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function nuevaBoleta() {
  const anio = '20' + randomDigits(2); // 2000-2099
  return `${anio}63${randomDigits(4)}`;
}

function nuevoCorreo() {
  return `alumtest${randomDigits(4)}@alumno.ipn.mx`;
}

async function obtenerReferenciasValidas() {
  const [periodosRes, ofertasRes] = await Promise.all([
    fetch(`${BASE_URL}/periodos`),
    fetch(`${BASE_URL}/ofertas`),
  ]);

  const periodos = await periodosRes.json();
  const ofertas = await ofertasRes.json();

  if (!Array.isArray(periodos) || periodos.length === 0) {
    throw new Error('No hay periodos disponibles — corre seed-periodos-servicio-social.js primero.');
  }
  if (!Array.isArray(ofertas) || ofertas.length === 0) {
    throw new Error('No hay ofertas disponibles — corre seed-ofertas-servicio.js primero.');
  }

  return { periodoId: periodos[0].id, ofertaId: ofertas[0].id };
}

function payloadBase({ periodoId, ofertaId }) {
  return {
    correoInst: nuevoCorreo(),
    nombres: 'JUAN',
    apellidos: 'PEREZ GOMEZ',
    telefono: '5512345678',
    boleta: nuevaBoleta(),
    correoPersonal: '',
    carrera: 'ISC',
    creditos: 85,
    semestre: 8,
    tipoLiberacion: '',
    periodo: periodoId,
    oferta: ofertaId,
    motivacion: 'Quiero participar porque me interesa mucho el área y aportar mis habilidades.',
    password: 'Passw0rd!',
    confirmarPassword: 'Passw0rd!',
  };
}

async function postRegistro(payload) {
  const res = await fetch(`${BASE_URL}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function verificar(nombre, { status, body }, statusEsperado, textoEsperadoEnMensaje) {
  const statusOk = status === statusEsperado;
  const mensaje = body.message || '';
  const textoOk = !textoEsperadoEnMensaje || mensaje.toLowerCase().includes(textoEsperadoEnMensaje.toLowerCase());
  const paso = statusOk && textoOk;

  console.log(`${paso ? '✅' : '❌'} ${nombre}`);
  if (!paso) {
    console.log(`    esperaba status ${statusEsperado}${textoEsperadoEnMensaje ? ` con "${textoEsperadoEnMensaje}" en el mensaje` : ''}`);
    console.log(`    recibió status ${status} — mensaje: "${mensaje}"`);
  }
  return paso;
}

async function main() {
  console.log(`Probando contra: ${BASE_URL}\n`);

  const refs = await obtenerReferenciasValidas();
  console.log(`Usando periodo id=${refs.periodoId}, oferta id=${refs.ofertaId}\n`);

  let pasaron = 0;
  let total = 0;
  const check = (nombre, resultado, status, texto) => {
    total++;
    if (verificar(nombre, resultado, status, texto)) pasaron++;
  };

  // ── 1. Caso válido completo ─────────────────────────────────────────────
  const payloadValido = payloadBase(refs);
  check(
    '1. Registro válido completo (201)',
    await postRegistro(payloadValido),
    201
  );

  // ── 2. Correo duplicado (reusa el correo del caso 1) ────────────────────
  check(
    '2. Correo institucional duplicado (409)',
    await postRegistro({ ...payloadBase(refs), correoInst: payloadValido.correoInst }),
    409,
    'correo'
  );

  // ── 3. Boleta duplicada (reusa la boleta del caso 1) ────────────────────
  check(
    '3. Boleta duplicada (409)',
    await postRegistro({ ...payloadBase(refs), boleta: payloadValido.boleta }),
    409,
    'boleta'
  );

  // ── 4. Dictamen créditos fuera de rango (75%, tope real es 70%) ─────────
  check(
    '4. Dictamen créditos con 75% (fuera del rango 60-70%, debe fallar)',
    await postRegistro({ ...payloadBase(refs), tipoLiberacion: 'creditos', creditos: 75, semestre: 8 }),
    400,
    '60% y 70%'
  );

  // ── 5. Dictamen créditos con semestre insuficiente ──────────────────────
  check(
    '5. Dictamen créditos con semestre 4 (mínimo es 6, debe fallar)',
    await postRegistro({ ...payloadBase(refs), tipoLiberacion: 'creditos', creditos: 65, semestre: 4 }),
    400,
    'semestre'
  );

  // ── 6. Dictamen electiva justo en el límite 96.01 (debe pasar la validación de crédito) ──
  check(
    '6. Dictamen electiva con exactamente 96.01% (límite exacto, debe ser válido -> 201)',
    await postRegistro({ ...payloadBase(refs), tipoLiberacion: 'electiva', creditos: 96.01, semestre: 9 }),
    201
  );

  // ── 7. Dictamen electiva por debajo del límite ──────────────────────────
  check(
    '7. Dictamen electiva con 96.00% (debajo del límite, debe fallar)',
    await postRegistro({ ...payloadBase(refs), tipoLiberacion: 'electiva', creditos: 96.00, semestre: 9 }),
    400,
    '96.01'
  );

  // ── 8. Sin dictamen, créditos insuficientes ─────────────────────────────
  check(
    '8. Sin dictamen, 69% de créditos (falta 1% para 70%, debe fallar)',
    await postRegistro({ ...payloadBase(refs), creditos: 69 }),
    400,
    '70%'
  );

  // ── 9. Un solo apellido (deben ser exactamente dos) ─────────────────────
  check(
    '9. Apellido único en vez de dos (debe fallar)',
    await postRegistro({ ...payloadBase(refs), apellidos: 'GARCIA' }),
    400,
    'dos apellidos'
  );

  // ── 10. Boleta con formato inválido ─────────────────────────────────────
  check(
    '10. Boleta con formato inválido (debe fallar)',
    await postRegistro({ ...payloadBase(refs), boleta: '1234567890' }),
    400,
    'boleta'
  );

  // ── 11. Teléfono empieza en 0 ────────────────────────────────────────────
  check(
    '11. Teléfono que inicia en 0 (debe fallar)',
    await postRegistro({ ...payloadBase(refs), telefono: '0512345678' }),
    400,
    '0 ni 1'
  );

  // ── 12. Contraseñas no coinciden ────────────────────────────────────────
  check(
    '12. Confirmar contraseña distinta (debe fallar)',
    await postRegistro({ ...payloadBase(refs), confirmarPassword: 'OtraClave1!' }),
    400,
    'no coinciden'
  );

  // ── 13. Correo institucional con dominio incorrecto ─────────────────────
  check(
    '13. Correo @ipn.mx en vez de @alumno.ipn.mx (debe fallar)',
    await postRegistro({ ...payloadBase(refs), correoInst: 'prueba1234@ipn.mx' }),
    400,
    'alumno.ipn.mx'
  );

  console.log(`\n${pasaron}/${total} casos pasaron.`);
  if (pasaron !== total) process.exit(1);
}

main().catch((e) => {
  console.error('❌ Error al correr las pruebas:', e.message);
  process.exit(1);
});
