import { useState, useEffect } from "react";

export function useSolicitudesPendientes() {
  const [solicitudes, setSolicitudes]   = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
    fetch(`api/profesor/${usuario.id}/solicitudes`)
      .then(r => r.json())
      .then(data => setSolicitudes(data.map(s => ({ ...s, estado: "PendienteProfesor" }))))
      .catch(console.error);
  }, []);

  const verDetalle = (solicitud) => {
    setSeleccionada(solicitud);
    setResultado(null);
  };

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setResultado(null);
  };

  const decidir = async (id, decision) => {
    setLoading(true);
    try {
      const res = await fetch(`api/profesor/solicitudes/${id}/decidir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error("Error al procesar");

      const nombre = solicitudes.find(s => s.id === id)?.nombre ?? "";
      setSolicitudes(prev => prev.filter(s => s.id !== id));
      setResultado({ tipo: decision, nombre });
      setSeleccionada(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendientes = solicitudes.filter(s => s.estado === "PendienteProfesor");

  return { pendientes, seleccionada, loading, resultado, verDetalle, cerrarDetalle, decidir };
}