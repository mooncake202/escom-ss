import { useState } from "react";

// ── Días inhábiles (misma fuente que CU-REP-01) ───────────────
const INHABILES = new Set([
  "01-01", "02-05", "03-21", "05-01", "09-16", "11-02", "11-20", "12-25",
  "2025-04-14","2025-04-15","2025-04-16","2025-04-17","2025-04-18",
  "2025-07-21","2025-07-22","2025-07-23","2025-07-24","2025-07-25",
  "2025-07-28","2025-07-29","2025-07-30","2025-07-31","2025-08-01",
  "2025-12-22","2025-12-23","2025-12-24","2025-12-26","2025-12-29",
  "2025-12-30","2025-12-31","2026-01-02",
  "2026-04-02","2026-04-03","2026-04-06",
  "2025-02-03","2025-11-17","2025-05-12",
]);

export function esDiaInhabil(year, month, day) {
  const dow = new Date(year, month, day).getDay();
  if (dow === 0 || dow === 6) return true;
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  if (INHABILES.has(`${mm}-${dd}`)) return true;
  if (INHABILES.has(`${year}-${mm}-${dd}`)) return true;
  return false;
}

export function diasEnMes(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function primerDiaSemana(year, month) {
  return new Date(year, month, 1).getDay();
}

export function calcularDiasValidos(year, month) {
  const total = diasEnMes(year, month);
  const validos = new Set();
  for (let d = 1; d <= total; d++) {
    if (!esDiaInhabil(year, month, d)) validos.add(d);
  }
  return validos;
}

export const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const DIAS_SEMANA = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];

export const ALUMNO = {
  nombre:   "García López Ana",
  boleta:   "2022630001",
  carrera:  "Ingeniería en Sistemas Computacionales (ISC)",
  semestre: "Octavo",
  telefono: "55 1234 5678",
  correo:   "agarcia0001@alumno.ipn.mx",
};

// ── Mock del reporte rechazado (pre-carga del formulario) ─────
export const REPORTE_RECHAZADO = {
  id: 4,
  titulo: "Reporte Mensual de Actividades No. 4",
  periodoStr: "2025-05",  // año-mes
  actividades: "Se realizaron actividades de análisis de requerimientos y diseño de la base de datos del módulo de inventario.",
  observaciones: "Se presentaron contratiempos por la configuración del entorno de desarrollo.",
  comentarioRechazo: "Se detectó una actividad registrada que no está completa. Por favor revisa y corrige la descripción de actividades antes de reenviar el reporte.",
};

// ── Avances de actividades (mismo origen que CU-REP-01 mock) ──
export const AVANCES_MES = [
  { titulo: "Análisis de requerimientos", porcentaje: 60 },
  { titulo: "Diseño de base de datos",    porcentaje: 60 },
  { titulo: "Investigación de frameworks", porcentaje: 65 },
];

export function useModificarReenviarReporte() {
  const [y, m] = REPORTE_RECHAZADO.periodoStr.split("-").map(Number);
  const year  = y;
  const month = m - 1;

  const [paso, setPaso]                   = useState(1);
  const [seleccionados, setSeleccionados] = useState(() => calcularDiasValidos(year, month));
  const [form, setForm]                   = useState({
    titulo:        REPORTE_RECHAZADO.titulo,
    actividades:   REPORTE_RECHAZADO.actividades,
    observaciones: REPORTE_RECHAZADO.observaciones,
  });
  const [errores, setErrores]   = useState({});
  const [enviado, setEnviado]   = useState(false);

  const horasCalculadas = seleccionados.size * 4;

  function toggleDia(day) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  }

  function irAPaso2() {
    if (seleccionados.size === 0) { setErrores({ dias: "Selecciona al menos un día laborado." }); return; }
    setErrores({});
    setPaso(2);
  }

  function validarPaso2() {
    const e = {};
    if (!form.actividades.trim()) e.actividades = "Las actividades son obligatorias.";
    return e;
  }

  function irAPaso3() {
    const e = validarPaso2();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setErrores({});
    setPaso(3);
  }

  function confirmarReenvio() {
    setEnviado(true);
  }

  function datosPDF() {
    const ultimoDia = diasEnMes(year, month);
    return {
      numeroReporte:   REPORTE_RECHAZADO.id,
      fechaGeneracion: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }),
      periodoTexto:    `del 1 de ${MESES[month]} de ${year} al ${ultimoDia} de ${MESES[month]} de ${year}`,
      alumno:          ALUMNO,
      actividades:     form.actividades,
      firmaUrl:        null,
    };
  }

  return {
    alumno: ALUMNO,
    reporteRechazado: REPORTE_RECHAZADO,
    avancesMes: AVANCES_MES,
    year, month,
    paso, setPaso,
    seleccionados, toggleDia,
    form, handleChange,
    errores, setErrores,
    enviado,
    horasCalculadas,
    irAPaso2, irAPaso3,
    confirmarReenvio, datosPDF,
  };
}