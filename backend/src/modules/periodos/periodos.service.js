const prisma = require('../../lib/prisma');

/**
 * RF-GR-03: periodos vigentes (fecha de inicio a futuro), con fecha límite de
 * expediente incluida para poder avisarle al alumno desde el registro (RN-GR-04/05).
 */
async function listarPeriodosVigentes() {
  const periodos = await prisma.periodo_registro.findMany({
    where: { evento_calendario: { fecha_inicio: { gte: new Date() } } },
    include: { evento_calendario: true },
    orderBy: { evento_calendario: { fecha_inicio: 'asc' } },
  });

  return periodos.map((p) => ({
    id: p.id,
    anio: p.anio,
    semestre: p.semestre,
    fechaInicio: p.evento_calendario.fecha_inicio,
    fechaFin: p.evento_calendario.fecha_fin,
    fechaLimiteExpediente: p.fecha_max_expediente,
  }));
}

module.exports = { listarPeriodosVigentes };
