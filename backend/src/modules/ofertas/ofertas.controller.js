const ofertasService = require('./ofertas.service');

async function getOfertas(req, res) {
  try {
    const ofertas = await ofertasService.listarOfertasDisponibles();
    return res.status(200).json(ofertas);
  } catch (err) {
    console.error('Error al listar ofertas:', err);
    return res.status(500).json({ message: 'No se pudieron cargar las ofertas.' });
  }
}

async function getPerfiles(req, res) {
  try {
    const perfiles = await ofertasService.listarPerfilesDisponibles();
    return res.status(200).json(perfiles);
  } catch (err) {
    console.error('Error al listar perfiles:', err);
    return res.status(500).json({ message: 'No se pudieron cargar los perfiles.' });
  }
}

module.exports = { getOfertas, getPerfiles };
