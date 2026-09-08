// test-cu-gr-04.js
//
// Prueba CU-GR-04 (GET /registro/info-siss, POST /registro/confirmar-siss)
// de punta a punta: registra un alumno nuevo, hace que el profesor.test lo
// acepte, avanza al alumno a registro_SISS (CU-GR-03), y desde ahí prueba
// los endpoints reales de CU-GR-04 — incluyendo casos de error.
//
// REQUIERE que el stack esté corriendo y que ya hayas corrido los 4 seeds
// (usuarios, profesores, ofertas, periodos), y que la oferta "Sistema de
// gestión de bibliotecas escolares" siga perteneciendo a profesor.test con
// cupos disponibles.
//
// CÓMO CORRERLO:
//   node test-cu-gr-04.js
//   (o dentro del contenedor, ver test-cu-gr-01.js para la variante)

const BASE_URL = process.env.BASE_URL || 'http://localhost/api';
const PROFESOR_CORREO = 'profesor.test@ipn.mx';
const PROFESOR_PASSWORD = '12345678';
const OFERTA_NOMBRE = 'Sistema de gestión de bibliotecas escolares'; // pertenece a profesor.test

function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}
function nuevaBoleta() {
  return `20${randomDigits(2)}63${randomDigits(4)}`;
}
function nuevoCorreo() {
  return `alumtest${randomDigits(4)}@alumno.ipn.mx`;
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

let pasaron = 0;
let total = 0;
function check(nombre, condicion, detalle) {
  total++;
  if (condicion) {
    pasaron++;
    console.log(`✅ ${nombre}`);
  } else {
    console.log(`❌ ${nombre}`);
    if (detalle) console.log(`    ${detalle}`);
  }
}

async function main() {
  console.log(`Probando contra: ${BASE_URL}\n`);

  // ── 0. Referencias (periodo, oferta de profesor.test) ──────────────────
  const periodosRes = await fetchJSON(`${BASE_URL}/periodos`);
  const ofertasRes = await fetchJSON(`${BASE_URL}/ofertas`);
  const periodo = periodosRes.body[0];
  const oferta = ofertasRes.body.find(o => o.titulo === OFERTA_NOMBRE);

  if (!periodo) throw new Error('No hay periodos — corre los seeds primero.');
  if (!oferta) throw new Error(`No se encontró la oferta "${OFERTA_NOMBRE}" — revisa el seed de ofertas.`);

  console.log(`Usando periodo id=${periodo.id}, oferta id=${oferta.id} ("${oferta.titulo}")\n`);

  // ── 1. Registrar un alumno nuevo para esta oferta (CU-GR-01) ────────────
  const correoAlumno = nuevoCorreo();
  const boletaAlumno = nuevaBoleta();
  const registroPayload = {
    correoInst: correoAlumno,
    nombres: 'LAURA',
    apellidos: 'MENDEZ RUIZ',
    telefono: '5512345678',
    boleta: boletaAlumno,
    correoPersonal: '',
    carrera: 'ISC',
    creditos: 85,
    semestre: 8,
    tipoLiberacion: '',
    periodo: periodo.id,
    oferta: oferta.id,
    motivacion: 'Quiero participar porque me interesa mucho el área y aportar mis habilidades.',
    password: 'Passw0rd!',
    confirmarPassword: 'Passw0rd!',
  };
  const registro = await fetchJSON(`${BASE_URL}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registroPayload),
  });
  check('0. Setup — registro del alumno de prueba (201)', registro.status === 201, `status=${registro.status} body=${JSON.stringify(registro.body)}`);

  // ── 2. Login del profesor y aceptar la solicitud (CU-GR-02) ─────────────
  const loginProfesor = await fetchJSON(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correoInst: PROFESOR_CORREO, password: PROFESOR_PASSWORD }),
  });
  check('0. Setup — login de profesor.test (200)', loginProfesor.status === 200, JSON.stringify(loginProfesor.body));
  const tokenProfesor = loginProfesor.body.token;

  const solicitudes = await fetchJSON(`${BASE_URL}/profesor/solicitudes`, { headers: authHeaders(tokenProfesor) });
  const solicitud = solicitudes.body.find(s => s.boleta === boletaAlumno);
  check('0. Setup — la solicitud del alumno aparece en la lista del profesor', !!solicitud, JSON.stringify(solicitudes.body));

  const decision = await fetchJSON(`${BASE_URL}/profesor/solicitudes/${solicitud.id}/decidir`, {
    method: 'POST',
    headers: authHeaders(tokenProfesor),
    body: JSON.stringify({ decision: 'aceptar' }),
  });
  check('0. Setup — el profesor acepta la solicitud (200)', decision.status === 200, JSON.stringify(decision.body));

  // ── 3. Login del alumno y avanzar a registro_SISS (CU-GR-03) ────────────
  const loginAlumno = await fetchJSON(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correoInst: correoAlumno, password: 'Passw0rd!' }),
  });
  check(
    '0. Setup — login del alumno regresa estado_solicitud = aceptada_por_profesor',
    loginAlumno.body?.usuario?.estado_solicitud === 'aceptada_por_profesor',
    JSON.stringify(loginAlumno.body)
  );
  const tokenAlumno = loginAlumno.body.token;

  const continuarSiss = await fetchJSON(`${BASE_URL}/registro/continuar-siss`, {
    method: 'POST',
    headers: authHeaders(tokenAlumno),
  });
  check(
    '0. Setup — continuar-siss avanza a registro_SISS (200)',
    continuarSiss.status === 200 && continuarSiss.body.estado_solicitud === 'registro_SISS',
    JSON.stringify(continuarSiss.body)
  );

  // ═══════════════════════════════════════════════════════════════════════
  // A PARTIR DE AQUÍ, LAS PRUEBAS REALES DE CU-GR-04
  // ═══════════════════════════════════════════════════════════════════════

  // ── 1. GET /registro/info-siss sin token → 401 ──────────────────────────
  const sinToken = await fetchJSON(`${BASE_URL}/registro/info-siss`);
  check('1. GET /registro/info-siss sin token (401)', sinToken.status === 401, JSON.stringify(sinToken.body));

  // ── 2. GET /registro/info-siss con el alumno correcto → datos reales ────
  const info = await fetchJSON(`${BASE_URL}/registro/info-siss`, { headers: authHeaders(tokenAlumno) });
  check('2. GET /registro/info-siss responde 200', info.status === 200, JSON.stringify(info.body));
  check(
    `2b. "programa" coincide con oferta.programa_SISS ("${oferta.titulo}")`,
    !!info.body.programa && info.body.programa.length > 0,
    `programa recibido: "${info.body.programa}"`
  );
  check(
    `2c. "actividad" coincide con oferta.nombre_SISS`,
    info.body.actividad === OFERTA_NOMBRE,
    `esperado: "${OFERTA_NOMBRE}", recibido: "${info.body.actividad}"`
  );
  check('2d. "fechaInicio" viene presente', !!info.body.fechaInicio, JSON.stringify(info.body));

  // ── 3. Un alumno que NO está en registro_SISS no puede consultar esto ───
  const correoAlumno2 = nuevoCorreo();
  const boletaAlumno2 = nuevaBoleta();
  await fetchJSON(`${BASE_URL}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...registroPayload, correoInst: correoAlumno2, boleta: boletaAlumno2 }),
  });
  const loginAlumno2 = await fetchJSON(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correoInst: correoAlumno2, password: 'Passw0rd!' }),
  });
  const infoAlumno2 = await fetchJSON(`${BASE_URL}/registro/info-siss`, { headers: authHeaders(loginAlumno2.body.token) });
  check(
    '3. GET /registro/info-siss con alumno en espera_respuesta_de_profesor (409)',
    infoAlumno2.status === 409,
    JSON.stringify(infoAlumno2.body)
  );

  // ── 4. POST /registro/confirmar-siss sin token → 401 ────────────────────
  const confirmarSinToken = await fetchJSON(`${BASE_URL}/registro/confirmar-siss`, { method: 'POST' });
  check('4. POST /registro/confirmar-siss sin token (401)', confirmarSinToken.status === 401, JSON.stringify(confirmarSinToken.body));

  // ── 5. POST /registro/confirmar-siss con el alumno correcto → avanza ────
  const confirmar = await fetchJSON(`${BASE_URL}/registro/confirmar-siss`, {
    method: 'POST',
    headers: authHeaders(tokenAlumno),
  });
  check(
    '5. POST /registro/confirmar-siss responde 200 y avanza a adjuntar_documentacion_inicial',
    confirmar.status === 200 && confirmar.body.estado_solicitud === 'adjuntar_documentacion_inicial',
    JSON.stringify(confirmar.body)
  );

  // ── 6. RN-GR-24: no se puede confirmar dos veces ────────────────────────
  const confirmarOtraVez = await fetchJSON(`${BASE_URL}/registro/confirmar-siss`, {
    method: 'POST',
    headers: authHeaders(tokenAlumno),
  });
  check('6. Confirmar SISS una segunda vez falla (409)', confirmarOtraVez.status === 409, JSON.stringify(confirmarOtraVez.body));

  // ── 7. Ya avanzado, info-siss tampoco debe funcionar (ya no está en ese paso) ──
  const infoDespues = await fetchJSON(`${BASE_URL}/registro/info-siss`, { headers: authHeaders(tokenAlumno) });
  check('7. GET /registro/info-siss después de confirmar (409, ya no aplica)', infoDespues.status === 409, JSON.stringify(infoDespues.body));

  console.log('\nPara verificar en BD (registro_siss debe ser 1):');
  console.log(`  docker compose exec mariadb mysql -u escomuser -p escom_ss -e "SELECT alumno_id, estado_solicitud, registro_siss FROM solicitud_registro WHERE alumno_id='${boletaAlumno}';"`);

  console.log(`\n${pasaron}/${total} casos pasaron.`);
  console.log(`\nLimpieza sugerida al terminar:`);
  console.log(`  DELETE FROM usuario WHERE correo_institucional IN ('${correoAlumno}', '${correoAlumno2}');`);
  if (pasaron !== total) process.exit(1);
}

main().catch((e) => {
  console.error('❌ Error al correr las pruebas:', e.message);
  process.exit(1);
});
