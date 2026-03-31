import { useState, useMemo, useEffect } from "react";
import { DIAS_INHABILES_INICIALES } from "@/data/diasInhabiles";

export const COORDINACION = { nombre: "Lic. Morales Vega" };
export const TIPOS        = ["Periodo de prestación", "Día inhábil", "Periodo vacacional"];
export const MESES        = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const DIAS_SEM     = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const HOY_ANIO = new Date().getFullYear();
export const ANIOS_DISPONIBLES = [HOY_ANIO - 1, HOY_ANIO, HOY_ANIO + 1];

let nextId = 10;

const EVENTOS_INICIALES = [
  {
    id: 1,
    tipo: "Periodo de prestación",
    nombre: "Periodo Ene–Jun 2026",
    fechaInicio: "2026-01-12",
    fechaTermino: "2026-06-30",
    fechaLimiteExpediente: "2026-06-15",
  },
  ...DIAS_INHABILES_INICIALES.map((d, i) => ({
    id: 100 + i,
    tipo: "Día inhábil",
    nombre: d.nombre,
    fecha: d.fecha,
    hora: "",
  })),
];

export const FORM_VACIO = {
  nombre: "", tipo: "",
  fecha: "", hora: "", semestre: "",
  fechaInicio: "", fechaTermino: "", fechaLimiteExpediente: "",
  fechaInicioVac: "", fechaFinVac: "",
};

export function getDiasEnMes(y, m)  { return new Date(y, m + 1, 0).getDate(); }
export function getPrimerDia(y, m)  { return new Date(y, m, 1).getDay(); }
export function toISO(y, m, d)      { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

export function esFinDeSemana(fechaISO) {
  const d = new Date(fechaISO + "T12:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function fechaPrincipal(ev) {
  if (ev.tipo === "Día inhábil")        return ev.fecha;
  if (ev.tipo === "Periodo vacacional") return ev.fechaInicioVac;
  return ev.fechaInicio;
}

export function fechasDeEvento(ev) {
  if (ev.tipo === "Día inhábil") return [ev.fecha];
  if (ev.tipo === "Periodo de prestación")
    return [ev.fechaInicio, ev.fechaTermino, ev.fechaLimiteExpediente].filter(Boolean);
  if (ev.tipo === "Periodo vacacional" && ev.fechaInicioVac && ev.fechaFinVac) {
    const fechas = [];
    const cur = new Date(ev.fechaInicioVac + "T12:00:00");
    const fin = new Date(ev.fechaFinVac    + "T12:00:00");
    while (cur <= fin) { fechas.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
    return fechas;
  }
  return [];
}

export function formatFechaHoraActual() {
  const now = new Date();
  return now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    + ", " + now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function useCalendarioInstitucional() {
  const hoy = new Date().toISOString().slice(0, 10);

  const [eventos, setEventos]     = useState(
    [...EVENTOS_INICIALES].sort((a, b) => fechaPrincipal(a).localeCompare(fechaPrincipal(b)))
  );
  const [mes, setMes]             = useState(new Date().getMonth());
  const [anio, setAnio]           = useState(new Date().getFullYear());
  const [diaSelec, setDiaSelec]   = useState(null);
  const [modo, setModo]           = useState(null);
  const [evActivo, setEvActivo]   = useState(null);
  const [form, setForm]           = useState(FORM_VACIO);
  const [errores, setErrores]     = useState({});
  const [toast, setToast]         = useState(null);
  const [ultimaMod, setUltimaMod] = useState("15 de enero de 2026, 10:00");
  const [tooltip, setTooltip]     = useState(null);
  const [filtroTipo, setFiltroTipo]   = useState("Todas");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  const evsPorFecha = useMemo(() => {
    const filtrados = filtroTipo === "Todas" ? eventos : eventos.filter(ev => ev.tipo === filtroTipo);
    return filtrados.reduce((acc, ev) => {
      fechasDeEvento(ev).forEach(f => { if (!acc[f]) acc[f] = []; acc[f].push(ev); });
      return acc;
    }, {});
  }, [eventos, filtroTipo]);

  const periodosPorFecha = useMemo(() => {
    if (filtroTipo !== "Todas" && filtroTipo !== "Periodo de prestación") return {};
    const info = {};
    eventos.filter(ev => ev.tipo === "Periodo de prestación").forEach(ev => {
      if (!ev.fechaInicio || !ev.fechaTermino) return;
      const cur = new Date(ev.fechaInicio + "T12:00:00");
      const fin = new Date(ev.fechaTermino + "T12:00:00");
      while (cur <= fin) {
        const iso = cur.toISOString().slice(0, 10);
        if (!info[iso]) info[iso] = { enRango: false, esInicio: false, esTermino: false, esLimite: false };
        info[iso].enRango = true;
        cur.setDate(cur.getDate() + 1);
      }
      if (info[ev.fechaInicio])  info[ev.fechaInicio].esInicio   = true;
      if (info[ev.fechaTermino]) info[ev.fechaTermino].esTermino = true;
      if (ev.fechaLimiteExpediente) {
        if (!info[ev.fechaLimiteExpediente])
          info[ev.fechaLimiteExpediente] = { enRango: false, esInicio: false, esTermino: false, esLimite: false };
        info[ev.fechaLimiteExpediente].esLimite = true;
      }
    });
    return info;
  }, [eventos, filtroTipo]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      if (filtroTipo !== "Todas" && ev.tipo !== filtroTipo) return false;
      if (ev.tipo === "Periodo de prestación" && (filtroDesde || filtroHasta)) {
        const pIn = ev.fechaInicio || ""; const pFin = ev.fechaTermino || "";
        if (filtroDesde && pFin && pFin < filtroDesde) return false;
        if (filtroHasta && pIn  && pIn  > filtroHasta) return false;
        return true;
      }
      const fp = fechaPrincipal(ev);
      if (filtroDesde && fp < filtroDesde) return false;
      if (filtroHasta && fp > filtroHasta) return false;
      return true;
    });
  }, [eventos, filtroTipo, filtroDesde, filtroHasta]);

  const hayFiltroActivo = filtroTipo !== "Todas" || filtroDesde || filtroHasta;

  const { mesMin, anioMin, mesMax, anioMax } = useMemo(() => {
    if (!hayFiltroActivo || eventosFiltrados.length === 0)
      return { mesMin: null, anioMin: null, mesMax: null, anioMax: null };
    const fechas = [];
    eventosFiltrados.forEach(ev => {
      if (ev.tipo === "Periodo de prestación") {
        if (ev.fechaInicio)           fechas.push(ev.fechaInicio);
        if (ev.fechaTermino)          fechas.push(ev.fechaTermino);
        if (ev.fechaLimiteExpediente) fechas.push(ev.fechaLimiteExpediente);
      } else if (ev.tipo === "Periodo vacacional") {
        if (ev.fechaInicioVac) fechas.push(ev.fechaInicioVac);
        if (ev.fechaFinVac)    fechas.push(ev.fechaFinVac);
      } else { if (ev.fecha) fechas.push(ev.fecha); }
    });
    if (fechas.length === 0) return { mesMin: null, anioMin: null, mesMax: null, anioMax: null };
    const sorted = [...fechas].sort();
    const [yMin, mMin] = sorted[0].split("-").map(Number);
    const [yMax, mMax] = sorted[sorted.length - 1].split("-").map(Number);
    return { anioMin: yMin, mesMin: mMin - 1, anioMax: yMax, mesMax: mMax - 1 };
  }, [hayFiltroActivo, eventosFiltrados]);

  useEffect(() => {
    if (!hayFiltroActivo) return;
    const fechas = [];
    eventosFiltrados.forEach(ev => {
      if (ev.tipo === "Periodo de prestación")      { if (ev.fechaInicio)    fechas.push(ev.fechaInicio); }
      else if (ev.tipo === "Periodo vacacional")    { if (ev.fechaInicioVac) fechas.push(ev.fechaInicioVac); }
      else                                          { if (ev.fecha)          fechas.push(ev.fecha); }
    });
    if (fechas.length === 0) return;
    const [y, m] = [...fechas].sort()[0].split("-").map(Number);
    setAnio(y); setMes(m - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroDesde, filtroHasta]);

  function irMesAnterior() {
    const dA = mes === 0 ? anio - 1 : anio; const dM = mes === 0 ? 11 : mes - 1;
    if (mesMin !== null && (dA < anioMin || (dA === anioMin && dM < mesMin))) return;
    setAnio(dA); setMes(dM);
  }
  function irMesSiguiente() {
    const dA = mes === 11 ? anio + 1 : anio; const dM = mes === 11 ? 0 : mes + 1;
    if (mesMax !== null && (dA > anioMax || (dA === anioMax && dM > mesMax))) return;
    setAnio(dA); setMes(dM);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name])     setErrores(prev => ({ ...prev, [name]: null }));
    if (errores.conflicto) setErrores(prev => ({ ...prev, conflicto: null }));
  }

  function validar() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre del evento es obligatorio.";
    if (!form.tipo)          e.tipo   = "El tipo de evento es obligatorio.";
    if (form.tipo === "Día inhábil") {
      if (!form.fecha) e.fecha = "La fecha es obligatoria.";
      else if (esFinDeSemana(form.fecha)) e.fecha = "No puedes registrar un evento en sábado o domingo.";
      if (!form.hora) e.hora = "La hora es obligatoria.";
    }
    if (form.tipo === "Periodo de prestación") {
      if (!form.semestre) e.semestre = "El semestre es obligatorio.";
      else if (!/^\d{4}-(01|02)$/.test(form.semestre)) e.semestre = "Formato: AAAA-01 o AAAA-02";
      if (!form.fechaInicio)  e.fechaInicio  = "La fecha de inicio es obligatoria.";
      if (!form.fechaTermino) e.fechaTermino = "La fecha de término es obligatoria.";
      if (form.fechaInicio && form.fechaTermino && form.fechaTermino < form.fechaInicio)
        e.fechaTermino = "La fecha de término debe ser posterior a la de inicio.";
    }
    if (form.tipo === "Periodo vacacional") {
      if (!form.fechaInicioVac) e.fechaInicioVac = "La fecha de inicio es obligatoria.";
      if (!form.fechaFinVac)    e.fechaFinVac    = "La fecha de fin es obligatoria.";
      if (form.fechaInicioVac && form.fechaFinVac && form.fechaFinVac < form.fechaInicioVac)
        e.fechaFinVac = "La fecha de fin debe ser posterior a la de inicio.";
    }
    return e;
  }

  function cancelar() { setModo(null); setEvActivo(null); setForm(FORM_VACIO); setErrores({}); }

  function abrirNuevo(fechaInicial = "") {
    setForm({ ...FORM_VACIO, fecha: fechaInicial });
    setErrores({}); setEvActivo(null); setModo("agregar");
  }

  function abrirEditar(ev) {
    setForm({
      nombre: ev.nombre, tipo: ev.tipo,
      fecha: ev.fecha || "", hora: ev.hora || "", semestre: ev.semestre || "",
      fechaInicio: ev.fechaInicio || "", fechaTermino: ev.fechaTermino || "",
      fechaLimiteExpediente: ev.fechaLimiteExpediente || "",
      fechaInicioVac: ev.fechaInicioVac || "", fechaFinVac: ev.fechaFinVac || "",
    });
    setErrores({}); setEvActivo(ev); setModo("editar");
    setDiaSelec(ev.tipo === "Día inhábil" ? ev.fecha : ev.fechaInicio);
  }

  function abrirEliminar(ev) { setEvActivo(ev); setModo("eliminar"); }

  function handleGuardar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    const nuevoEv =
      form.tipo === "Periodo de prestación"
        ? { tipo: form.tipo, nombre: form.nombre.trim(), semestre: form.semestre, fechaInicio: form.fechaInicio, fechaTermino: form.fechaTermino, fechaLimiteExpediente: form.fechaLimiteExpediente }
      : form.tipo === "Periodo vacacional"
        ? { tipo: form.tipo, nombre: form.nombre.trim(), fechaInicioVac: form.fechaInicioVac, fechaFinVac: form.fechaFinVac }
      : { tipo: form.tipo, nombre: form.nombre.trim(), fecha: form.fecha, hora: form.hora };

    if (modo === "agregar") {
      setEventos(prev => [...prev, { ...nuevoEv, id: nextId++ }].sort((a, b) => fechaPrincipal(a).localeCompare(fechaPrincipal(b))));
      mostrarToast("Evento agregado al calendario.");
    } else {
      setEventos(prev => prev.map(ev => ev.id === evActivo.id ? { ...nuevoEv, id: evActivo.id } : ev).sort((a, b) => fechaPrincipal(a).localeCompare(fechaPrincipal(b))));
      mostrarToast("Evento actualizado correctamente.");
    }
    setUltimaMod(formatFechaHoraActual());
    const fechaNav = form.tipo === "Día inhábil" ? form.fecha : form.tipo === "Periodo vacacional" ? form.fechaInicioVac : form.fechaInicio;
    setDiaSelec(fechaNav);
    if (fechaNav) { const [y, m] = fechaNav.split("-").map(Number); setAnio(y); setMes(m - 1); }
    cancelar();
  }

  function handleEliminar() {
    setEventos(prev => prev.filter(ev => ev.id !== evActivo.id));
    setUltimaMod(formatFechaHoraActual());
    mostrarToast(`"${evActivo.nombre}" eliminado.`, "danger");
    setDiaSelec(null); cancelar();
  }

  function handleClickDia(fechaISO) {
    if (modo === "eliminar") return;
    if (esFinDeSemana(fechaISO)) return;
    if (modo === "agregar" || modo === "editar") {
      setForm(prev => ({ ...prev, fecha: fechaISO }));
      if (errores.fecha) setErrores(prev => ({ ...prev, fecha: null }));
      return;
    }
    setDiaSelec(fechaISO);
    if (!evsPorFecha[fechaISO]) abrirNuevo(fechaISO);
  }

  return {
    hoy, eventos, eventosFiltrados, evsPorFecha, periodosPorFecha,
    mes, setMes, anio, setAnio, diaSelec,
    modo, evActivo, form, errores, toast, ultimaMod, tooltip, setTooltip,
    filtroTipo, setFiltroTipo, filtroDesde, setFiltroDesde, filtroHasta, setFiltroHasta,
    hayFiltroActivo,
    irMesAnterior, irMesSiguiente,
    handleChange, handleClickDia, handleGuardar, handleEliminar,
    abrirNuevo, abrirEditar, abrirEliminar, cancelar,
  };
}
