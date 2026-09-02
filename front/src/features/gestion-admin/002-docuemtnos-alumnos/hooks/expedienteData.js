// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Datos en duro: Expediente de documentos por alumno
// ============================================================

// Definición canónica de todos los documentos del proceso
export const DOCUMENTOS_PROCESO = [
  {
    key: "expediente_registro",
    nombre: "Expediente de registro",
    descripcion: "Documentación inicial que formaliza el inicio del servicio social.",
    etapa: "Inicio",
    orden: 1,
    icono: "📁",
    responsable: "alumno", // quién lo genera/sube
  },
  {
    key: "carta_compromiso",
    nombre: "Carta compromiso",
    descripcion: "Carta firmada por el alumno donde se compromete a cumplir el servicio social.",
    etapa: "Inicio",
    orden: 2,
    icono: "✍️",
    responsable: "alumno",
  },
  {
    key: "carta_compromiso_firmada",
    nombre: "Carta compromiso firmada",
    descripcion: "Carta compromiso con firma y sello de coordinación, devuelta al alumno.",
    etapa: "Inicio",
    orden: 3,
    icono: "📋",
    responsable: "coordinacion",
  },
  {
    key: "evaluacion_desempeno",
    nombre: "Evaluación de desempeño",
    descripcion: "Evaluación emitida por el asesor externo sobre el desempeño del alumno.",
    etapa: "Desarrollo",
    orden: 4,
    icono: "📊",
    responsable: "coordinacion",
  },
  {
    key: "carta_termino",
    nombre: "Carta término",
    descripcion: "Carta emitida por la empresa o institución confirmando la conclusión del servicio.",
    etapa: "Término",
    orden: 5,
    icono: "📨",
    responsable: "alumno",
  },
  {
    key: "expediente_termino",
    nombre: "Expediente de término",
    descripcion: "Expediente final que agrupa toda la documentación de conclusión.",
    etapa: "Término",
    orden: 6,
    icono: "🗂️",
    responsable: "alumno",
  },
  {
    key: "constancia_termino",
    nombre: "Constancia de término",
    descripcion: "Documento oficial emitido por coordinación que certifica la conclusión del servicio social.",
    etapa: "Término",
    orden: 7,
    icono: "🏅",
    responsable: "coordinacion",
  },
];

// Estado posible de cada documento por alumno
// estado: "pendiente" | "enviado" | "aprobado" | "rechazado"
export const ALUMNOS_EXPEDIENTE = [
  {
    id: 1,
    nombre: "García López Juan Carlos",
    boleta: "2021630412",
    carrera: "Ingeniería en Sistemas Computacionales",
    carreraCorta: "ISC",
    oferta: "Sistema Web para Control Escolar",
    empresa: "ESCOM - IPN",
    profesor: "Dr. Torres Vega",
    fechaInicio: "2026-02-01",
    documentos: {
      expediente_registro: {
        estado: "aprobado",
        nombreArchivo: "expediente_registro_garcia.pdf",
        fechaModificacion: "2026-02-03T10:00:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_garcia.pdf",
        fechaModificacion: "2026-02-05T09:30:00",
        comentario: null,
      },
      carta_compromiso_firmada: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_firmada_garcia.pdf",
        fechaModificacion: "2026-02-10T14:00:00",
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "enviado",
        nombreArchivo: "evaluacion_garcia.pdf",
        fechaModificacion: "2026-03-15T11:00:00",
        comentario: null,
      },
      carta_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      expediente_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      constancia_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
    },
  },
  {
    id: 2,
    nombre: "Ramírez Torres Ana Sofía",
    boleta: "2022630187",
    carrera: "Ingeniería en Inteligencia Artificial",
    carreraCorta: "IA",
    oferta: "Modelo Predictivo con ML",
    empresa: "DataSoft S.A. de C.V.",
    profesor: "Dr. Torres Vega",
    fechaInicio: "2026-02-15",
    documentos: {
      expediente_registro: {
        estado: "aprobado",
        nombreArchivo: "expediente_registro_ramirez.pdf",
        fechaModificacion: "2026-02-17T08:45:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "rechazado",
        nombreArchivo: "carta_compromiso_ramirez_v1.pdf",
        fechaModificacion: "2026-02-20T10:00:00",
        comentario: "Falta la firma del asesor externo en la página 2.",
      },
      carta_compromiso_firmada: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      carta_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      expediente_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      constancia_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
    },
  },
  {
    id: 3,
    nombre: "Mendoza Vargas Luis Alberto",
    boleta: "2020630098",
    carrera: "Ingeniería en Sistemas Computacionales",
    carreraCorta: "ISC",
    oferta: "App móvil para logística",
    empresa: "Logística Express MX",
    profesor: "Dra. Ruiz Méndez",
    fechaInicio: "2026-01-20",
    documentos: {
      expediente_registro: {
        estado: "aprobado",
        nombreArchivo: "expediente_registro_mendoza.pdf",
        fechaModificacion: "2026-01-22T09:00:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_mendoza.pdf",
        fechaModificacion: "2026-01-25T10:00:00",
        comentario: null,
      },
      carta_compromiso_firmada: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_firmada_mendoza.pdf",
        fechaModificacion: "2026-01-30T15:00:00",
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "aprobado",
        nombreArchivo: "evaluacion_mendoza.pdf",
        fechaModificacion: "2026-03-01T11:00:00",
        comentario: null,
      },
      carta_termino: {
        estado: "aprobado",
        nombreArchivo: "carta_termino_mendoza.pdf",
        fechaModificacion: "2026-03-28T09:30:00",
        comentario: null,
      },
      expediente_termino: {
        estado: "enviado",
        nombreArchivo: "expediente_termino_mendoza.pdf",
        fechaModificacion: "2026-04-01T10:00:00",
        comentario: null,
      },
      constancia_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
    },
  },
  {
    id: 4,
    nombre: "Herrera Sánchez Valeria",
    boleta: "2023630301",
    carrera: "Ingeniería en Sistemas Computacionales",
    carreraCorta: "ISC",
    oferta: "Sistema de Inventario en la Nube",
    empresa: "CloudBase Technologies",
    profesor: "Dra. Ruiz Méndez",
    fechaInicio: "2026-03-01",
    documentos: {
      expediente_registro: {
        estado: "enviado",
        nombreArchivo: "expediente_registro_herrera.pdf",
        fechaModificacion: "2026-03-03T08:00:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      carta_compromiso_firmada: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      carta_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      expediente_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      constancia_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
    },
  },
  {
    id: 5,
    nombre: "Cruz Domínguez Pedro Emmanuel",
    boleta: "2021630577",
    carrera: "Ingeniería en Inteligencia Artificial",
    carreraCorta: "IA",
    oferta: "Chatbot de atención al cliente",
    empresa: "TechServ S.A.",
    profesor: "M.C. Herrera López",
    fechaInicio: "2026-02-10",
    documentos: {
      expediente_registro: {
        estado: "aprobado",
        nombreArchivo: "expediente_registro_cruz.pdf",
        fechaModificacion: "2026-02-12T09:00:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_cruz.pdf",
        fechaModificacion: "2026-02-14T10:00:00",
        comentario: null,
      },
      carta_compromiso_firmada: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      carta_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      expediente_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
      constancia_termino: {
        estado: "pendiente",
        nombreArchivo: null,
        fechaModificacion: null,
        comentario: null,
      },
    },
  },
  {
    id: 6,
    nombre: "López Fuentes María Fernanda",
    boleta: "2022630254",
    carrera: "Ingeniería en Sistemas Computacionales",
    carreraCorta: "ISC",
    oferta: "Portal de trámites digitales",
    empresa: "GobiernoDigital CDMX",
    profesor: "M.C. Herrera López",
    fechaInicio: "2026-01-15",
    documentos: {
      expediente_registro: {
        estado: "aprobado",
        nombreArchivo: "expediente_registro_lopez.pdf",
        fechaModificacion: "2026-01-17T08:30:00",
        comentario: null,
      },
      carta_compromiso: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_lopez.pdf",
        fechaModificacion: "2026-01-20T09:00:00",
        comentario: null,
      },
      carta_compromiso_firmada: {
        estado: "aprobado",
        nombreArchivo: "carta_compromiso_firmada_lopez.pdf",
        fechaModificacion: "2026-01-25T14:00:00",
        comentario: null,
      },
      evaluacion_desempeno: {
        estado: "aprobado",
        nombreArchivo: "evaluacion_lopez.pdf",
        fechaModificacion: "2026-03-10T10:00:00",
        comentario: null,
      },
      carta_termino: {
        estado: "aprobado",
        nombreArchivo: "carta_termino_lopez.pdf",
        fechaModificacion: "2026-04-01T09:00:00",
        comentario: null,
      },
      expediente_termino: {
        estado: "aprobado",
        nombreArchivo: "expediente_termino_lopez.pdf",
        fechaModificacion: "2026-04-05T10:00:00",
        comentario: null,
      },
      constancia_termino: {
        estado: "aprobado",
        nombreArchivo: "constancia_termino_lopez.pdf",
        fechaModificacion: "2026-04-08T11:00:00",
        comentario: null,
      },
    },
  },
];

// Helpers
export function getProgreso(documentos) {
  const total = Object.keys(documentos).length;
  const completados = Object.values(documentos).filter(d => d.estado === "aprobado").length;
  return { completados, total, pct: Math.round((completados / total) * 100) };
}

export function getEtapaActual(documentos) {
  const orden = DOCUMENTOS_PROCESO;
  for (let i = orden.length - 1; i >= 0; i--) {
    const doc = documentos[orden[i].key];
    if (doc?.estado === "aprobado") {
      if (i === orden.length - 1) return "Completado";
      return orden[i + 1]?.etapa ?? orden[i].etapa;
    }
  }
  return "Inicio";
}
