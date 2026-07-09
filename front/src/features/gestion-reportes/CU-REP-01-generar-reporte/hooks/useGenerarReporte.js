import { useState, useMemo } from "react";

const ALUMNO = {
  nombre:   "García López Ana",
  boleta:   "2022630001",
  carrera:  "Ingeniería en Sistemas Computacionales (ISC)",
  semestre: "Octavo",
  telefono: "55 1234 5678",
  correo:   "agarcia0001@alumno.ipn.mx",
};

// Día de inicio del servicio social (del CU-REG-01)
// Día 1-5  → un solo mes
// Día 6+   → dos meses
const DIA_INICIO_SERVICIO  = 16;
const MES_INICIO_SERVICIO  = 4;  // 4 = Mayo
const ANIO_INICIO_SERVICIO = 2025;

// Número del último reporte generado (0 = ninguno aún)
const ULTIMO_NUMERO_REPORTE = 4;

// Periodos ya reportados — el siguiente será Mayo 2025
const PERIODOS_CON_REPORTE = ["2025-01", "2025-02", "2025-03", "2025-04"];

// Firma guardada (null = primer reporte, string = ya tiene firma)
const FIRMA_GUARDADA = null;

// ── Mock días inhábiles (de CU-ADM-10) ──────────────────────
export const DIAS_INHABILES = new Set([
  "01-01", "02-05", "03-21", "05-01", "09-16", "11-02", "11-20", "12-25",
  "2025-04-17", "2025-04-18",
]);

// ── Mock bitácoras registradas — deben coincidir con mayo/junio 2025 ──
const BITACORAS_REGISTRADAS = new Set([
  // Mayo 2025 — desde día 1 (para probar regla un-mes)
  "2025-05-02", "2025-05-05", "2025-05-06", "2025-05-07", "2025-05-08", "2025-05-09",
  "2025-05-12", "2025-05-13", "2025-05-14", "2025-05-15", "2025-05-16",
  "2025-05-19", "2025-05-20", "2025-05-21", "2025-05-22", "2025-05-23",
  "2025-05-26", "2025-05-27", "2025-05-28", "2025-05-29", "2025-05-30",
  // Junio 2025 — primeros 15 días (para probar regla dos-meses)
  "2025-06-02", "2025-06-03", "2025-06-04", "2025-06-05", "2025-06-06",
  "2025-06-09", "2025-06-10", "2025-06-11", "2025-06-12", "2025-06-13",
]);

const AVANCES_ACTIVIDADES = [
  { titulo: "Análisis de requerimientos",  porcentaje: 60 },
  { titulo: "Diseño de base de datos",     porcentaje: 60 },
  { titulo: "Investigación de frameworks", porcentaje: 65 },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function esInhabil(year, month, day, inhabiles) {
  const dow = new Date(year, month, day).getDay();
  if (dow === 0 || dow === 6) return true;
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  if (inhabiles.has(`${mm}-${dd}`)) return true;
  if (inhabiles.has(`${year}-${mm}-${dd}`)) return true;
  return false;
}


function calcularDiasConBitacora(year, month, bitacoras, diaDesde = 1, diaHasta = null) {
  const totalDias = new Date(year, month + 1, 0).getDate();
  const limite    = diaHasta ?? totalDias;
  const dias      = new Set();

  bitacoras.forEach(fecha => {
    const [y, m, d] = fecha.split("-").map(Number);
    if (y === year && m - 1 === month && d >= diaDesde && d <= limite) {
      dias.add(d);
    }
  });
  return dias;
}

function calcularPeriodo() {
  const diaInicio = DIA_INICIO_SERVICIO;
  const esUnMes   = diaInicio >= 1 && diaInicio <= 5;

  const ultimoPeriodo = PERIODOS_CON_REPORTE[PERIODOS_CON_REPORTE.length - 1];
  const [uy, um]      = ultimoPeriodo.split("-").map(Number);
  const siguienteMes  = um === 12 ? 0 : um;
  const siguienteAnio = um === 12 ? uy + 1 : uy;

  if (esUnMes) {
    return {
      tipo: "un-mes",
      meses: [{ year: siguienteAnio, month: siguienteMes }],
      fechaInicio: `1 de ${MESES[siguienteMes]} de ${siguienteAnio}`,
      fechaFin:    `${new Date(siguienteAnio, siguienteMes + 1, 0).getDate()} de ${MESES[siguienteMes]} de ${siguienteAnio}`,
    };
  }

  const mes2  = siguienteMes === 11 ? 0 : siguienteMes + 1;
  const anio2 = siguienteMes === 11 ? siguienteAnio + 1 : siguienteAnio;

  return {
    tipo: "dos-meses",
    meses: [
      { year: siguienteAnio, month: siguienteMes },
      { year: anio2,         month: mes2 },
    ],
    fechaInicio: `${diaInicio} de ${MESES[siguienteMes]} de ${siguienteAnio}`,
    fechaFin:    `15 de ${MESES[mes2]} de ${anio2}`,
    diaInicioServicio: diaInicio,
    dia15SegundoMes:   15,
  };
}

export function useGenerarReporte() {
  const periodo         = useMemo(() => calcularPeriodo(), []);
  const numeroReporte   = ULTIMO_NUMERO_REPORTE + 1;
  const tituloAuto      = `Reporte mensual de actividades No. ${numeroReporte}`;
  const esPrimerReporte = !FIRMA_GUARDADA;

  const [paso, setPaso]               = useState(1);
  const [enviado, setEnviado]         = useState(false);
  const [mesActivo, setMesActivo]     = useState(0);
  const [actividades, setActividades] = useState("");
  const [firma, setFirma]             = useState(null);
  const [firmaUrl, setFirmaUrl]       = useState(FIRMA_GUARDADA);
  const [errores, setErrores]         = useState({});

  const diasConBitacoraPorMes = useMemo(() =>
  periodo.meses.map(({ year, month }, idx) => {
    if (periodo.tipo === "un-mes") {
      return calcularDiasConBitacora(year, month, BITACORAS_REGISTRADAS, 1);
    }
    // Dos meses: primer mes desde diaInicio, segundo mes hasta día 15
    if (idx === 0) return calcularDiasConBitacora(year, month, BITACORAS_REGISTRADAS, periodo.diaInicioServicio);
    return calcularDiasConBitacora(year, month, BITACORAS_REGISTRADAS, 1, periodo.dia15SegundoMes);
  }),
[periodo]);

  const totalDiasLaborados = useMemo(() =>
    diasConBitacoraPorMes.reduce((acc, dias) => acc + dias.size, 0),
  [diasConBitacoraPorMes]);

  const totalHoras = totalDiasLaborados * 4;

  const fechaGeneracion = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });

  function handleActividadesChange(e) {
    setActividades(e.target.value);
    if (errores.actividades) setErrores(prev => ({ ...prev, actividades: null }));
  }

  function handleFirmaChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setErrores(prev => ({ ...prev, firma: "Solo se aceptan imágenes PNG o JPG." }));
      return;
    }
    setFirma(file);
    setFirmaUrl(URL.createObjectURL(file));
    setErrores(prev => ({ ...prev, firma: null }));
  }

  function irPaso2() {
    if (!actividades.trim()) {
      setErrores({ actividades: "Las actividades realizadas son obligatorias." });
      return;
    }
    setErrores({});
    setPaso(3);
  }

  function irPaso3() {
    if (!firmaUrl) {
      setErrores({ firma: "La firma es obligatoria para el primer reporte." });
      return;
    }
    setErrores({});
    setPaso(4);
  }

  function datosPDF() {
    return {
      numeroReporte,
      fechaGeneracion,
      periodoTexto: `del ${periodo.fechaInicio} al ${periodo.fechaFin}`,
      alumno:       ALUMNO,
      actividades,
      firmaUrl,
    };
  }

  function handleEnviar() {
    setEnviado(true);
  }

  return {
    alumno: ALUMNO, periodo, mesActivo, setMesActivo,
    diasConBitacoraPorMes, totalDiasLaborados, totalHoras,
    tituloAuto, numeroReporte,
    avances: AVANCES_ACTIVIDADES,
    esPrimerReporte,
    paso, setPaso,
    enviado, handleEnviar,
    actividades, handleActividadesChange,
    firma, firmaUrl, handleFirmaChange,
    errores, irPaso2, irPaso3, datosPDF,
    fechaGeneracion,
  };
}