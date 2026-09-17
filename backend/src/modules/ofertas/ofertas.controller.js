const ofertasService = require('./ofertas.service');
const prisma = require('../../lib/prisma');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const { emitirAUsuario } = require('../../sockets/socket.server');

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

// CU-PRO-01: Solicitar registro de oferta (profesor)
async function solicitarRegistroOferta(req, res) {
  try {
    const {
      nombre_proyecto,
      descripcion_actividades,
      tipo_oferta,
      cupos_ofertados,
      carreras,
    } = req.body;

    const profesor = await prisma.profesor.findUnique({
      where: { usuario_id: req.usuario.sub },
      include: { usuario: true },
    });
    if (!profesor) {
      return res.status(404).json({ message: 'Perfil de profesor no encontrado.' });
    }
    const profesor_id = profesor.id;

    if (!nombre_proyecto || !descripcion_actividades || !tipo_oferta) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    if (!['individual', 'proyecto'].includes(tipo_oferta)) {
      return res.status(400).json({ message: "tipo_oferta debe ser 'individual' o 'proyecto'." });
    }

    if (!Array.isArray(carreras) || carreras.length === 0) {
      return res.status(400).json({ message: 'Debe seleccionar al menos un perfil de carrera.' });
    }

    let dataOferta = {
      nombre_proyecto,
      descripcion_actividades,
      tipo_oferta,
      estado_oferta: 'pendiente_revision',
      fecha_registro: new Date(),
    };

    if (tipo_oferta === 'individual') {
      dataOferta.cupos_disponibles = 1;
    } else {
      const cupos = parseInt(cupos_ofertados, 10);
      if (!Number.isInteger(cupos) || cupos < 2) {
        return res.status(400).json({ message: 'Para modalidad proyecto, cupos_ofertados debe ser un entero mayor o igual a 2.' });
      }
      dataOferta.cupos_ofertados = cupos;
      dataOferta.cupos_disponibles = cupos;

      const esInvestigador = await prisma.solicitud_caracteristica.findFirst({
        where: {
          profesor_id,
          estado: 'aprobada',
          caracteristica: { nombre: 'Investigador' },
        },
      });
      if (esInvestigador) {
        dataOferta.cupos_investigador = cupos;
      }
    }

    const carrerasEncontradas = await prisma.carrera.findMany({
      where: { nombre: { in: carreras } },
    });

    if (carrerasEncontradas.length !== carreras.length) {
      return res.status(400).json({ message: 'Una o más carreras seleccionadas no son válidas.' });
    }

    const coordinador = await prisma.coordinador.findFirst();
    if (!coordinador) {
      return res.status(500).json({ message: 'No hay coordinador registrado en el sistema.' });
    }

    const nuevaOferta = await prisma.oferta_servicio.create({
      data: {
        ...dataOferta,
        profesor: { connect: { id: profesor_id } },
        coordinador: { connect: { id: coordinador.id } },
        deseo_de_carrera: {
          create: carrerasEncontradas.map((c) => ({ carrera: { connect: { id: c.id } } })),
        },
      },
    });

    await crearNotificacion({
      usuarioId: coordinador.usuario_id,
      tipo: 'info',
      mensaje: `Nueva solicitud de oferta: "${nuevaOferta.nombre_proyecto}" (${profesor.usuario.nombre} ${profesor.usuario.apellidos}).`,
      rutaRelacionada: `/coordinacion/ofertas?destacar=${nuevaOferta.id}`,
    });

    try {
      emitirAUsuario(coordinador.usuario_id, 'oferta:nueva', { ofertaId: nuevaOferta.id });
    } catch (err) {
      console.error('Error al emitir oferta:nueva:', err.message);
    }

    return res.status(201).json({
      message: 'Oferta registrada exitosamente. Queda sujeta a revisión de coordinador.',
      oferta: nuevaOferta,
    });

  } catch (err) {
    console.error('[CU-PRO-01]', err);
    return res.status(500).json({ message: 'Error al registrar la oferta. Intenta nuevamente.' });
  }
}

// CU-PRO-02: Revisar solicitud de oferta (coordinador)
async function postDecidirOferta(req, res) {
  try {
    const { decision, motivoRechazo, programaSISS, actividadSISS } = req.body;
    const ofertaId = parseInt(req.params.id, 10);
    const resultado = await ofertasService.decidirOferta(ofertaId, decision, motivoRechazo, { programaSISS, actividadSISS });
    return res.status(200).json({ message: 'Decisión registrada correctamente.', oferta: resultado });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('[CU-PRO-02]', err);
    return res.status(status).json({ message });
  }
}

// CU-PRO-02 (listado): ofertas pendientes de revisión (coordinador)
async function getOfertasPendientes(req, res) {
  try {
    const pendientes = await ofertasService.listarOfertasPendientes();
    return res.status(200).json(pendientes);
  } catch (err) {
    console.error('[CU-PRO-02 listado]', err);
    return res.status(500).json({ message: 'No se pudieron cargar las solicitudes pendientes.' });
  }
}

// CU-PRO-05: Consultar mis ofertas (profesor)
async function getMisOfertas(req, res) {
  try {
    const profesor = await prisma.profesor.findUnique({
      where: { usuario_id: req.usuario.sub },
    });
    if (!profesor) {
      return res.status(404).json({ message: 'Perfil de profesor no encontrado.' });
    }
    const ofertas = await ofertasService.listarMisOfertas(profesor.id);
    return res.status(200).json(ofertas);
  } catch (err) {
    console.error('[CU-PRO-05]', err);
    return res.status(500).json({ message: 'No se pudieron cargar tus ofertas.' });
  }
}

// CU-PRO-03: Consultar ofertas (coordinador)
async function getConsultarOfertas(req, res) {
  try {
    const { vista, busqueda, tipo, estado } = req.query;
    const resultado = await ofertasService.consultarOfertas({
      vista,
      busqueda,
      tipoOferta: tipo,
      estadoOferta: estado,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('[CU-PRO-03]', err);
    return res.status(status).json({ message });
  }
}

// CU-PRO-05 (Flujo A): Corregir y reenviar oferta rechazada
async function postReenviarOferta(req, res) {
  try {
    const profesor = await prisma.profesor.findUnique({ where: { usuario_id: req.usuario.sub } });
    if (!profesor) {
      return res.status(404).json({ message: 'Perfil de profesor no encontrado.' });
    }
    const ofertaId = parseInt(req.params.id, 10);
    const actualizada = await ofertasService.reenviarOferta(ofertaId, profesor.id, req.body);
    return res.status(200).json({ message: 'Oferta reenviada exitosamente.', oferta: actualizada });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('[CU-PRO-05 reenviar]', err);
    return res.status(status).json({ message });
  }
}
// CU-PRO-04: Cerrar oferta manualmente (profesor)
async function postCerrarOferta(req, res) {
  try {
    const profesor = await prisma.profesor.findUnique({ where: { usuario_id: req.usuario.sub } });
    if (!profesor) {
      return res.status(404).json({ message: 'Perfil de profesor no encontrado.' });
    }
    const ofertaId = parseInt(req.params.id, 10);
    const actualizada = await ofertasService.cerrarOfertaManual(ofertaId, profesor.id);
    return res.status(200).json({ message: 'Oferta cerrada exitosamente.', oferta: actualizada });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('[CU-PRO-04 cerrar]', err);
    return res.status(status).json({ message });
  }
}

module.exports = { 
  getOfertas, 
  getPerfiles, 
  solicitarRegistroOferta, 
  postDecidirOferta, 
  getOfertasPendientes, 
  getMisOfertas, 
  getConsultarOfertas, 
  postReenviarOferta,
  postCerrarOferta
};