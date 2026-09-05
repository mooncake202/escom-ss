const BASE_URL = "/api";

function servicioNoDisponible() {
  const error = new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  error.code = "SERVICIO_NO_DISPONIBLE";
  return error;
}

/**
 * Envuelve fetch() + el parseo de JSON en un solo lugar.
 *
 * La idea clave: no importa qué status code regrese un intermediario caído
 * (nginx, el túnel de Cloudflare, cualquier proxy futuro) — 500, 502, 503,
 * 504, 521, 522, lo que sea — nuestra propia API SIEMPRE contesta JSON,
 * incluso en sus propios errores. Si el cuerpo NO se puede parsear como
 * JSON, es 100% seguro que la respuesta no vino de nuestro backend, sino de
 * algún intermediario reportando que no pudo llegar hasta él. Eso es
 * justo el Flujo de Excepción E2 de la ficha — sin tener que adivinar ni
 * mantener una lista de códigos de status.
 */
async function fetchJSON(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    // Falla de red real, ni siquiera hubo respuesta (sin conexión, DNS, etc.)
    throw servicioNoDisponible();
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    // Respuesta no-JSON (HTML de error de nginx/Cloudflare/cualquier proxy).
    throw servicioNoDisponible();
  }

  return { res, json };
}

export async function getOfertas() {
  const { res, json } = await fetchJSON(`${BASE_URL}/ofertas`);
  if (!res.ok) throw new Error("Error al obtener ofertas");
  return json;
}

export async function getPeriodos() {
  const { res, json } = await fetchJSON(`${BASE_URL}/periodos`);
  if (!res.ok) throw new Error("Error al obtener periodos");
  return json;
}

/**
 * RF-GR-02 / paso 2 de la ficha: chequeo temprano de correo, al terminar
 * el paso 1 del formulario (no hasta el envío final).
 * @returns {Promise<boolean>} true si el correo SÍ está disponible.
 */
export async function verificarCorreoDisponible(correo) {
  const { res, json } = await fetchJSON(`${BASE_URL}/registro/verificar-correo?correo=${encodeURIComponent(correo)}`);
  if (!res.ok) throw new Error(json.message || "No se pudo verificar el correo.");
  return json.disponible;
}

export async function postRegistro(data) {
  const { res, json } = await fetchJSON(`${BASE_URL}/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = new Error(json.message || "Error en el servidor");
    if (json.code) error.code = json.code; // ej. OFERTA_SIN_CUPOS
    throw error;
  }
  return json;
}