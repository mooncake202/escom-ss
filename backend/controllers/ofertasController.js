const prisma = require("../config/prisma");
const { calcularCuposDisponibles } = require("../services/cuposService");

// CU-PRO-01: Solicitar registro de oferta para servicio social
exports.solicitarRegistroOferta = async (req, res) => {
  try {
    const {
      profesor_id, // TODO: reemplazar por req.usuario.id cuando exista middleware de JWT
      nombre_proyecto,
      nombre_SISS,
      descripcion_actividades,
      tipo_oferta,
      cupos_ofertados, // solo aplica si tipo_oferta === 'proyecto'
      carreras, // array de nombres, ej. ['ISC', 'LCD']
    } = req.body;

    // --- RF-PRO-03 / RF-PRO-04: validar campos obligatorios ---
    if (!profesor_id || !nombre_proyecto || !nombre_SISS || !descripcion_actividades || !tipo_oferta) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios." });
    }

    // --- RN-PRO-02: tipo de oferta válido ---
    if (!["individual", "proyecto"].includes(tipo_oferta)) {
      return res.status(400).json({ mensaje: "tipo_oferta debe ser 'individual' o 'proyecto'." });
    }

    if (!Array.isArray(carreras) || carreras.length === 0) {
      return res.status(400).json({ mensaje: "Debe seleccionar al menos un perfil de carrera." });
    }

    // --- Calcular cupos disponibles del profesor y si es investigador ---
    const resultado = await calcularCuposDisponibles(profesor_id);
    if (!resultado) {
      return res.status(404).json({ mensaje: "Profesor no encontrado." });
    }
    const { cupos_disponibles_profesor, es_investigador } = resultado;

    // --- Construir los valores según modalidad ---
    let dataOferta = {
      nombre_SISS,
      nombre_proyecto,
      descripcion_actividades,
      tipo_oferta,
      estado_oferta: "pendiente_revision",
      fecha_registro: new Date(),
    };

    if (tipo_oferta === "individual") {
      // --- RN-PRO-03: cupo fijo de 1 ---
      if (cupos_disponibles_profesor < 1) {
        return res.status(400).json({
          mensaje: "No tienes cupos disponibles. Solicita modificación de características en Gestión Administrativa.",
        });
      }
      dataOferta.cupos_disponibles = 1;
    } else {
      // tipo_oferta === "proyecto"
      // --- RN-PRO-03 / Flujo alterno 4.1: mínimo 2 ---
      const cupos = parseInt(cupos_ofertados, 10);
      if (!Number.isInteger(cupos) || cupos < 2) {
        return res.status(400).json({ mensaje: "Para modalidad proyecto, cupos_ofertados debe ser un entero mayor o igual a 2." });
      }

      if (cupos > cupos_disponibles_profesor) {
        // --- RN-PRO-06 / Flujo alterno 4.2: excepción para Investigador ---
        if (es_investigador) {
          dataOferta.cupos_ofertados = cupos;
          dataOferta.cupos_investigador = cupos;
          dataOferta.cupos_disponibles = cupos;
        } else {
          return res.status(400).json({
            mensaje: "No tienes cupos disponibles suficientes. Solicita modificación de características en Gestión Administrativa.",
          });
        }
      } else {
        dataOferta.cupos_ofertados = cupos;
        dataOferta.cupos_disponibles = cupos;
      }
    }

    // --- Buscar el/los IDs de carrera seleccionados ---
    const carrerasEncontradas = await prisma.carrera.findMany({
      where: { nombre: { in: carreras } },
    });

    if (carrerasEncontradas.length !== carreras.length) {
      return res.status(400).json({ mensaje: "Una o más carreras seleccionadas no son válidas." });
    }

    // --- Coordinador asignado automáticamente (único coordinador del sistema por ahora) ---
    const coordinador = await prisma.coordinador.findFirst();
    if (!coordinador) {
      return res.status(500).json({ mensaje: "No hay coordinador registrado en el sistema." });
    }

    // --- Crear oferta + relaciones de carrera ---
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

    // --- RF-PRO-08: dejar explícito que está sujeta a autorización ---
    return res.status(201).json({
      mensaje: "Oferta registrada exitosamente. Queda sujeta a revisión de coordinador.",
      oferta: nuevaOferta,
    });

  } catch (err) {
    console.error("[CU-PRO-01]", err);
    // --- E1: error al registrar en base de datos ---
    return res.status(500).json({ mensaje: "Error al registrar la oferta. Intenta nuevamente." });
  }
};