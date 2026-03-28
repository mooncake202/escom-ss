const BASE_URL = "http://localhost:3000";

export async function getOfertas() {
  const res = await fetch(`${BASE_URL}/ofertas`);
  if (!res.ok) throw new Error("Error al obtener ofertas");
  return res.json();
}

export async function postRegistro(data) {
  const res = await fetch(`${BASE_URL}/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje || "Error en el servidor");
  return json;
}



export async function getPeriodos() {
  const res = await fetch(`${BASE_URL}/periodos`);
  if (!res.ok) throw new Error("Error al obtener periodos");
  return res.json();

}


