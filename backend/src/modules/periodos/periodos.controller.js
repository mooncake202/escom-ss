const periodosService = require('./periodos.service');

async function getPeriodos(req, res) {
  try {
    const periodos = await periodosService.listarPeriodosVigentes();
    return res.status(200).json(periodos);
  } catch (err) {
    console.error('Error al listar periodos:', err);
    return res.status(500).json({ message: 'No se pudieron cargar los periodos.' });
  }
}

module.exports = { getPeriodos };
