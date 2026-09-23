import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  obtenerContextoCaracteristicas,
  crearSolicitudCaracteristica,
} from "@/services/caracteristicasService";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";

// Identificador de la opción "Sin característica adicional (Profesor base)". El backend espera
// caracteristicaId: null para esa solicitud, así que aquí se usa una clave aparte para poder
// distinguir "no he elegido nada" (null) de "elegí volver a base" (BASE).
export const OPCION_BASE = "base";

const RUTA = "/profesor/solicitar-modificacion";

// La notificación puede traer varios ids ("?destacar=3,7") cuando el dashboard agrupa avisos;
// basta con el primero para señalar esa solicitud.
function primerDestacado(valor) {
  const id = Number((valor ?? "").split(",")[0]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// El catálogo y la capacidad los manda el backend: aquí ya no hay datos fijos.
// Un profesor tiene 0 o 1 característica vigente, nunca varias.
export function useSolicitarModificacion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [llegaDestacado] = useState(() => primerDestacado(searchParams.get("destacar")));
  const destacadoAtendido = useRef(false);

  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [contexto, setContexto] = useState(null);
  const [destacado, setDestacado] = useState(null); // solicitud señalada al llegar desde su aviso
  const [intento, setIntento] = useState(0);

  const [seleccion, setSeleccion] = useState(null); // id numérico | OPCION_BASE | null
  const [justificacion, setJustificacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Al entrar se marcan como leídas SOLO las notificaciones propias de esta pantalla (mismo patrón
  // que CU-REP-06 y ADM-16). El endpoint únicamente alcanza filas del propio usuario.
  useEffect(() => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter((n) => n.ruta_relacionada?.startsWith(RUTA));
        return Promise.all(propias.map((n) => marcarNotificacionLeida(n.id)));
      })
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones de características:", err));
  }, []);

  // ?destacar=<id>: el aviso de resolución (aprobada o rechazada) apunta a la solicitud concreta.
  // Se señala en el historial, que es donde vive una vez resuelta. Se atiende UNA sola vez.
  const atenderDestacado = useEffectEvent((respuesta) => {
    if (!llegaDestacado || destacadoAtendido.current) return;
    destacadoAtendido.current = true;

    const encontrada = respuesta.historial.find((h) => h.id === llegaDestacado);
    if (encontrada) setDestacado(encontrada.id);
    navigate(RUTA, { replace: true }); // consumido: al refrescar ya no se vuelve a señalar
  });

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    obtenerContextoCaracteristicas().then(
      (respuesta) => {
        if (!vigente) return;
        setContexto(respuesta);
        setCarga({ estado: "listo", error: null });
        atenderDestacado(respuesta);
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() { setIntento((n) => n + 1); }

  function handleSeleccionar(clave) {
    setSeleccion(clave);
    if (errores.caracteristica) setErrores((prev) => ({ ...prev, caracteristica: null }));
  }

  function handleJustificacionChange(e) {
    setJustificacion(e.target.value);
    if (errores.justificacion) setErrores((prev) => ({ ...prev, justificacion: null }));
  }

  const opciones = contexto?.opciones ?? [];
  const opcionSeleccionada = seleccion === null
    ? null
    : opciones.find((o) => (seleccion === OPCION_BASE ? o.caracteristicaId === null : o.caracteristicaId === seleccion)) ?? null;

  // Capacidad que tendría el profesor si se aprobara: la calcula el backend por opción.
  const capacidadResultante = opcionSeleccionada?.capacidadResultante ?? null;
  // Reducir la capacidad por debajo de los alumnos ya asignados no se puede: ni el front lo envía
  // ni el backend lo aceptaría (y lo vuelve a comprobar al aprobar).
  const excedeOcupados = opcionSeleccionada !== null && opcionSeleccionada.viable === false;

  const tieneSolicitudPendiente = Boolean(contexto?.solicitudPendiente);
  const puedeEnviar = !tieneSolicitudPendiente
    && opcionSeleccionada !== null
    && !excedeOcupados
    && justificacion.trim() !== ""
    && !enviando;

  async function handleSubmit() {
    const e = {};
    if (opcionSeleccionada === null) e.caracteristica = "Debes seleccionar una opción.";
    if (justificacion.trim() === "") e.justificacion = "La justificación es obligatoria.";
    if (excedeOcupados) {
      e.caracteristica = `Con ese cambio tendrías ${opcionSeleccionada.capacidadResultante} cupos `
        + `y hoy ocupas ${contexto.profesor.ocupados}. Libera ${opcionSeleccionada.cuposALiberar} antes de solicitarlo.`;
    }
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setEnviando(true);
    setErrores({});
    try {
      await crearSolicitudCaracteristica({
        caracteristicaId: opcionSeleccionada.caracteristicaId, // null = volver a Profesor base
        justificacion: justificacion.trim(),
      });
      setEnviado(true);
    } catch (err) {
      // El backend es la autoridad: puede rechazar aunque el front creyera que se podía
      // (otra pendiente creada en otra pestaña, un alumno asignado hace un segundo...).
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  function handleCancelar() {
    navigate("/dashboard");
  }

  return {
    carga, recargar,
    profesor: contexto?.profesor ?? null,
    opciones,
    historial: contexto?.historial ?? [],
    destacado,
    solicitudPendiente: contexto?.solicitudPendiente ?? null,
    tieneSolicitudPendiente,
    seleccion, opcionSeleccionada, capacidadResultante, excedeOcupados,
    justificacion, errores, enviando, enviado, puedeEnviar,
    handleSeleccionar, handleJustificacionChange,
    handleSubmit, handleCancelar,
  };
}
