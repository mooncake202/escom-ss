import { useEffect, useState } from "react";
import {
  listarBitacorasPendientes,
  aprobarBitacora as aprobarBitacoraApi,
  rechazarBitacora as rechazarBitacoraApi,
} from "@/services/ahProfesorService";

export function useRevisarAvances() {
  const [pendientes, setPendientes]     = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [comentario, setComentario]     = useState("");
  const [modoRechazo, setModoRechazo]   = useState(false);
  const [filtroNombre, setFiltroNombre] = useState("");

  const cargar = async () => {
    try {
      const data = await listarBitacorasPendientes(filtroNombre);
      setPendientes(data);
    } catch (err) {
      console.error("No se pudieron cargar las bitácoras pendientes:", err);
    } finally {
      setCargando(false);
    }
  };

  // Refresca al cambiar el filtro (servidor filtra por nombre) y al montar.
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNombre]);

  const verDetalle = (b) => {
    setSeleccionada(b);
    setResultado(null);
    setErrorGeneral("");
    setComentario("");
    setModoRechazo(false);
  };

  const cerrar = () => {
    setSeleccionada(null);
    setModoRechazo(false);
    setComentario("");
  };

  // RN-AH-34, RN-AH-35, RN-AH-36, RN-AH-43, RN-AH-44
  const decidir = async (id, decision, actividadAdicional = null) => {
    if (decision === "rechazar" && !comentario.trim()) return;
    setLoading(true);
    setErrorGeneral("");

    const alumno = pendientes.find((b) => b.id === id)?.alumno.nombre ?? "";

    try {
      let respuesta;
      if (decision === "rechazar") {
        respuesta = await rechazarBitacoraApi(id, comentario.trim());
      } else {
        const esAdicional = decision === "aprobar-adicional";
        respuesta = await aprobarBitacoraApi(id, esAdicional ? actividadAdicional : null);
      }

      setResultado({
        tipo: decision === "aprobar-adicional" ? "aprobar-adicional" : decision,
        alumno,
        actividadAdicional: respuesta.actividadCreada ?? null,
      });
      setSeleccionada(null);
      setModoRechazo(false);
      setComentario("");
      await cargar();
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendientes, cargando, seleccionada, loading, resultado, errorGeneral,
    comentario, setComentario, modoRechazo, setModoRechazo,
    filtroNombre, setFiltroNombre,
    verDetalle, cerrar, decidir,
  };
}
