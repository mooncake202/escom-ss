import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import {
  getEventosCalendario, crearEventoCalendario, actualizarInhabilCalendario, eliminarEventoCalendario,
} from "@/services/calendarioService";
import {
  eventoDeApi, coincideConSemestre, construirPayload, erroresDeApi, textoUltimaModificacion, diaSiguiente,
} from "./calendarioAdaptador";
import {
  rangoSemestre, ciclosDesdeHoy, limitesNavegacion, moverMes, mesInicial, acotarMes, ventanaInicioPeriodo,
} from "./calendarioNavegacion";

export { rangoSemestre, ciclosDesdeHoy, limitesNavegacion, moverMes, mesInicial, acotarMes, ventanaInicioPeriodo };

export const TIPOS            = ["Periodo de prestación", "Día inhábil", "Periodo vacacional"];
export const MESES            = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const DIAS_SEM         = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

export const FORM_VACIO = {
  nombre: "", tipo: "",
  fecha: "", hora: "",
  fechaInicio: "", fechaTermino: "", fechaLimiteExpediente: "",
  fechaInicioVac: "", fechaFinVac: "",
  anio: "", semestre: "",
};

export function getDiasEnMes(y, m) { return new Date(y, m + 1, 0).getDate(); }
export function getPrimerDia(y, m) { return new Date(y, m, 1).getDay(); }
export function toISO(y, m, d)     { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

export function esFinDeSemana(fechaISO) {
  const d = new Date(fechaISO + "T12:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
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

// Filtra por tipo y, si hay ciclo+semestre, por la semántica de coincideConSemestre.
export function filtrarEventos(eventos, { tipo, ciclo, periodo }) {
  const ventana = ciclo && periodo ? rangoSemestre(parseInt(ciclo), periodo) : null;
  return eventos.filter(ev => {
    if (tipo !== "Todas" && ev.tipo !== tipo) return false;
    if (!ventana) return true;
    return coincideConSemestre(ev, { ciclo, periodo, desde: ventana.desde, hasta: ventana.hasta });
  });
}

export function useCalendarioInstitucional() {
  const { usuario: sesion } = useSesion();
  // Solo el coordinador administra; el resto ve el calendario en solo lectura (el backend también lo exige).
  const puedeAdministrar = sesion?.rol === "coordinador";
  // El alumno asignado no recibe Periodos del backend: tampoco se le ofrece como filtro ni en la leyenda.
  const tiposVisibles = sesion?.rol === "alumno_asignado" ? TIPOS.filter(t => t !== "Periodo de prestación") : TIPOS;

  const [eventos, setEventos]     = useState([]);
  const [contexto, setContexto]   = useState(null);   // { hoy, horaActual } de México, según el backend
  const [ultimaModIso, setUltimaModIso] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mes, setMes]             = useState(new Date().getMonth());
  const [anio, setAnio]           = useState(new Date().getFullYear());
  const [diaSelec, setDiaSelec]   = useState(null);
  const [modo, setModo]           = useState(null);
  const [evActivo, setEvActivo]   = useState(null);
  const [form, setForm]           = useState(FORM_VACIO);
  const [errores, setErrores]     = useState({});
  const [toast, setToast]         = useState(null);
  const [tooltip, setTooltip]     = useState(null);
  const primeraCarga = useRef(true);
  const [resaltadoId, setResaltadoId] = useState(null);
  const temporizadorResaltado = useRef(null);

  // La fecha de negocio es la del backend (México); mientras no llega, "" no habilita ni marca nada.
  const hoy = contexto?.hoy ?? "";
  const cargando = cargandoDatos && !contexto;
  const ultimaMod = textoUltimaModificacion(ultimaModIso);
  // Periodos y vacaciones deben empezar después de hoy: se usa como fecha mínima del selector.
  const minFechaFutura = diaSiguiente(hoy);
  const ciclosDisponibles = useMemo(() => ciclosDesdeHoy(hoy), [hoy]);

  const cargar = useCallback(async () => {
    setCargandoDatos(true);
    setErrorCarga(null);
    try {
      const datos = await getEventosCalendario();
      setEventos(datos.eventos.map(eventoDeApi).filter(Boolean));
      setUltimaModIso(datos.ultimaModificacion ?? null);
      setContexto(datos.contexto);
      if (primeraCarga.current) {
        primeraCarga.current = false;
        const [y, m] = datos.contexto.hoy.split("-").map(Number);
        setAnio(y); setMes(m - 1);
      }
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Resalta ~3 s la fila recién creada de la lista y la acerca a la vista si no está visible.
  function resaltarEvento(id) {
    clearTimeout(temporizadorResaltado.current);
    setResaltadoId(id);
    temporizadorResaltado.current = setTimeout(() => setResaltadoId(null), 3000);
  }
  useEffect(() => {
    if (resaltadoId === null) return;
    document.getElementById(`evento-${resaltadoId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [resaltadoId]);
  useEffect(() => () => clearTimeout(temporizadorResaltado.current), []);

  // ── Filtros ─────────────────────────────────────────────────
  const [filtroTipo,   setFiltroTipo]   = useState("Todas");
  const [filtroCiclo,  setFiltroCiclo]  = useState("");   // "2027" | ""
  const [filtroPeriodo, setFiltroPeriodo] = useState(""); // "01" | "02" | ""

  const hayFiltroActivo = filtroTipo !== "Todas" || (filtroCiclo && filtroPeriodo);

  // Cambiar filtros reposiciona el calendario dentro del nuevo rango navegable (si lo hay).
  function aplicarFiltros(cambios) {
    const f = { tipo: filtroTipo, ciclo: filtroCiclo, periodo: filtroPeriodo, ...cambios };
    setFiltroTipo(f.tipo); setFiltroCiclo(f.ciclo); setFiltroPeriodo(f.periodo);
    const activo = f.tipo !== "Todas" || (f.ciclo && f.periodo);
    if (!activo) return;
    const nuevos = limitesNavegacion({
      ciclo: f.ciclo, periodo: f.periodo, hoy, hayFiltroActivo: activo,
      eventosFiltrados: filtrarEventos(eventos, f),
    });
    irMes(mesInicial(nuevos, hoy));
  }
  const cambiarFiltroTipo    = (tipo) => aplicarFiltros({ tipo });
  const cambiarFiltroCiclo   = (ciclo) => aplicarFiltros({ ciclo, periodo: "" });
  const cambiarFiltroPeriodo = (periodo) => aplicarFiltros({ periodo });
  const limpiarFiltros       = () => aplicarFiltros({ tipo: "Todas", ciclo: "", periodo: "" });

  // ── Derivados ────────────────────────────────────────────────
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

  const eventosFiltrados = useMemo(
    () => filtrarEventos(eventos, { tipo: filtroTipo, ciclo: filtroCiclo, periodo: filtroPeriodo }),
    [eventos, filtroTipo, filtroCiclo, filtroPeriodo],
  );

  const limites = useMemo(
    () => limitesNavegacion({ ciclo: filtroCiclo, periodo: filtroPeriodo, hayFiltroActivo, eventosFiltrados, hoy }),
    [filtroCiclo, filtroPeriodo, hayFiltroActivo, eventosFiltrados, hoy],
  );

  // ── Navegación ───────────────────────────────────────────────
  function irMes(destino) {
    if (!destino) return;
    setAnio(destino.anio); setMes(destino.mes);
  }
  function irMesAnterior()  { irMes(moverMes(anio, mes, -1, limites)); }
  function irMesSiguiente() { irMes(moverMes(anio, mes, 1, limites)); }
  function cambiarAnio(nuevo) { irMes(acotarMes(nuevo, mes, limites)); }

  // ── Form ─────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "anio" || name === "semestre") {
        const v = ventanaInicioPeriodo({ anio: next.anio, semestre: next.semestre, minFechaFutura });
        if (v && next.fechaInicio && (next.fechaInicio < v.minDate || next.fechaInicio > v.maxDate)) next.fechaInicio = "";
      }
      if ((name === "fechaInicio" || name === "anio" || name === "semestre") && next.fechaInicio && next.fechaTermino
        && next.fechaTermino <= next.fechaInicio) next.fechaTermino = "";
      return next;
    });
    if (errores[name])     setErrores(prev => ({ ...prev, [name]: null }));
    if (errores.conflicto) setErrores(prev => ({ ...prev, conflicto: null }));
    setConfirmando(false);
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
      if (!/^\d{4}$/.test(form.anio)) e.anio = "El ciclo es obligatorio.";
      if (!form.semestre)     e.semestre     = "El semestre es obligatorio.";
      if (!form.fechaInicio)  e.fechaInicio  = "La fecha de inicio es obligatoria.";
      if (!form.fechaTermino) e.fechaTermino = "La fecha de término es obligatoria.";
      if (form.fechaInicio && form.fechaTermino && form.fechaTermino <= form.fechaInicio)
        e.fechaTermino = "La fecha de término debe ser posterior a la de inicio.";
      if (!form.fechaLimiteExpediente) e.fechaLimiteExpediente = "El límite de entrega de expediente es obligatorio.";
    }
    if (form.tipo === "Periodo vacacional") {
      if (!form.fechaInicioVac) e.fechaInicioVac = "La fecha de inicio es obligatoria.";
      if (!form.fechaFinVac)    e.fechaFinVac    = "La fecha de fin es obligatoria.";
      if (form.fechaInicioVac && form.fechaFinVac && form.fechaFinVac <= form.fechaInicioVac)
        e.fechaFinVac = "La fecha de fin debe ser posterior a la de inicio.";
    }
    return e;
  }

  function volverAEditar() { setConfirmando(false); }

  function cancelar() { setModo(null); setEvActivo(null); setForm(FORM_VACIO); setErrores({}); setConfirmando(false); }

  function abrirNuevo(fechaInicial = "") {
    if (!puedeAdministrar || !contexto) return;
    setForm({ ...FORM_VACIO, fecha: fechaInicial });
    setErrores({}); setEvActivo(null); setModo("agregar");
  }

  function abrirEditar(ev) {
    if (!puedeAdministrar || !ev.editable) return;
    setForm({
      ...FORM_VACIO,
      nombre: ev.nombre, tipo: ev.tipo,
      fecha: ev.fecha || "", hora: ev.hora || "",
      fechaInicio: ev.fechaInicio || "", fechaTermino: ev.fechaTermino || "",
      fechaLimiteExpediente: ev.fechaLimiteExpediente || "",
      fechaInicioVac: ev.fechaInicioVac || "", fechaFinVac: ev.fechaFinVac || "",
    });
    setErrores({}); setEvActivo(ev); setModo("editar");
    setDiaSelec(ev.tipo === "Día inhábil" ? ev.fecha : ev.fechaInicio);
  }

  function abrirEliminar(ev) {
    if (!puedeAdministrar || !ev.eliminable) return;
    setEvActivo(ev); setModo("eliminar");
  }

  // Periodo y vacacional se publican con una confirmación previa; el día inhábil se guarda directo.
  async function handleGuardar() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    if (modo === "agregar" && form.tipo !== "Día inhábil" && !confirmando) { setConfirmando(true); return; }

    setGuardando(true);
    try {
      let idNuevo = null;
      if (modo === "agregar") idNuevo = (await crearEventoCalendario(construirPayload(form, true))).evento.id;
      else await actualizarInhabilCalendario(evActivo.id, construirPayload(form));

      mostrarToast(modo === "agregar" ? "Evento agregado al calendario." : "Evento actualizado correctamente.");
      const fechaNav = form.tipo === "Día inhábil" ? form.fecha : form.tipo === "Periodo vacacional" ? form.fechaInicioVac : form.fechaInicio;
      setDiaSelec(fechaNav);
      if (fechaNav) { const [y, m] = fechaNav.split("-").map(Number); irMes(acotarMes(y, m - 1, limites)); }
      cancelar();
      await cargar();
      if (idNuevo !== null) resaltarEvento(idNuevo);
    } catch (err) {
      setErrores(erroresDeApi(err, form.tipo));
      setConfirmando(false);
      if (err.status === 404 || err.status === 409) cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    setGuardando(true);
    try {
      await eliminarEventoCalendario(evActivo.id);
      mostrarToast(`"${evActivo.nombre}" eliminado.`, "danger");
      setDiaSelec(null); cancelar();
      await cargar();
    } catch (err) {
      mostrarToast(err.message, "danger");
      cancelar();
      if (err.status === 404 || err.status === 409) cargar();
    } finally {
      setGuardando(false);
    }
  }

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 6000);
  }

  // Un día anterior a la fecha de negocio del backend no inicia ni cambia un alta; sí puede seleccionarse.
  function handleClickDia(fechaISO) {
    if (modo === "eliminar") return;
    if (esFinDeSemana(fechaISO)) return;
    const esPasado = hoy !== "" && fechaISO < hoy;
    if (modo === "agregar" || modo === "editar") {
      if (esPasado) return;
      setForm(prev => ({ ...prev, fecha: fechaISO }));
      if (errores.fecha) setErrores(prev => ({ ...prev, fecha: null }));
      return;
    }
    setDiaSelec(fechaISO);
    if (!esPasado) abrirNuevo(fechaISO);
  }

  return {
    sesion, puedeAdministrar, tiposVisibles,
    hoy, minFechaFutura, eventos, eventosFiltrados, evsPorFecha, periodosPorFecha,
    cargando, errorCarga, recargar: cargar, guardando, confirmando, resaltadoId,
    mes, anio, cambiarAnio, ciclosDisponibles, diaSelec,
    modo, evActivo, form, errores, toast, ultimaMod, tooltip, setTooltip,
    filtroTipo, setFiltroTipo: cambiarFiltroTipo,
    filtroCiclo, setFiltroCiclo: cambiarFiltroCiclo,
    filtroPeriodo, setFiltroPeriodo: cambiarFiltroPeriodo,
    hayFiltroActivo, limpiarFiltros,
    irMesAnterior, irMesSiguiente,
    handleChange, handleClickDia, handleGuardar, handleEliminar,
    abrirNuevo, abrirEditar, abrirEliminar, cancelar, volverAEditar,
  };
}
