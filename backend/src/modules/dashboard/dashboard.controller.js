const dashboardService = require('./dashboard.service');

async function getResumen(req, res) {
  try {
    const { sub, rol } = req.usuario;

    let resumen;
    if (rol === 'alumno_asignado') resumen = await dashboardService.resumenAlumno(sub);
    else if (rol === 'profesor') resumen = await dashboardService.resumenProfesor(sub);
    else if (rol === 'coordinador') resumen = await dashboardService.resumenCoordinacion();
    else resumen = {};

    return res.status(200).json(resumen);
  } catch (err) {
    console.error('Error al generar resumen del dashboard:', err);
    return res.status(500).json({ message: 'No se pudo cargar el resumen del dashboard.' });
  }
}

module.exports = { getResumen };
