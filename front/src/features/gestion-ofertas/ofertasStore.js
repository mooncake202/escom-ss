let _ofertas = [];
let _nextId = 100;

export function addOferta(oferta) {
  _ofertas.push({
    ...oferta,
    id: _nextId++,
    fechaRegistro: new Date().toISOString().split("T")[0],
    estatus: "en_revision",
    cuposOcupados: 0,
    cuposDisponibles: oferta.cupos,
    alumnosActivos: 0,
    alumnos: [],
  });
}

export function getOfertas() {
  return [..._ofertas];
}