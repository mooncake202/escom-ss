import { useEffect, useState } from "react";
import { obtenerMiProfesor } from "@/services/directorioService";

// Datos reales del profesor que supervisa al alumno. El vínculo lo deriva el backend
// (alumno → solicitud_registro asignada → oferta → profesor); aquí no se manda ningún id.
export function useContactoProfesor() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null, code: null });
  const [datos, setDatos] = useState(null);
  const [intento, setIntento] = useState(0);

  // El estado inicial ya es "cargando" y `recargar` lo repone antes de pedir de nuevo, así que el
  // efecto no necesita (ni debe) llamar a setState de forma síncrona en su cuerpo.
  useEffect(() => {
    let vigente = true;
    obtenerMiProfesor().then(
      (r) => {
        if (!vigente) return;
        setDatos(r);
        setCarga({ estado: "listo", error: null, code: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message, code: err.code ?? null }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const recargar = () => {
    setCarga({ estado: "cargando", error: null, code: null });
    setIntento((n) => n + 1);
  };

  // Los cuatro datos de contacto que la pantalla lista como filas. Se omiten los vacíos.
  const contactos = datos
    ? [
        ["Cubículo", datos.profesor.cubiculo],
        ["Horario de atención", datos.profesor.horarioAtencion],
        ["Teléfono personal", datos.profesor.telefonoPersonal],
      ].filter(([, valor]) => valor).map(([tipo, valor]) => ({ tipo, valor }))
    : [];

  return {
    carga, recargar,
    profesor: datos?.profesor ?? null,
    oferta: datos?.oferta ?? null,
    contactos,
    // 'SIN_ASIGNACION' distingue "todavía no te asignan" de un error real de red o servidor.
    sinAsignacion: carga.code === "SIN_ASIGNACION",
  };
}
