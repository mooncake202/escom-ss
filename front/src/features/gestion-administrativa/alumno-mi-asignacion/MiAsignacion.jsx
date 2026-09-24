import { useSearchParams }     from "react-router-dom";
import { useTheme, RADIUS }    from "@/themes/colors";
import { DashboardLayout }     from "@/components/layout/DashboardLayout";
import { PanelProfesor }       from "@/features/gestion-administrativa/CU-ADM-01-contacto-profesor/ContactoProfesor";
import { PanelEquipo }         from "@/features/gestion-administrativa/CU-ADM-03-contacto-equipo/ContactoEquipo";
import { useContactoProfesor } from "@/features/gestion-administrativa/CU-ADM-01-contacto-profesor/hooks/useContactoProfesor";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// "Mi asignación" — una sola entrada del menú para todo lo que el alumno tiene asignado.
//
// Es una unificación VISUAL: por dentro siguen siendo dos casos de uso con sus propios endpoints.
//   pestaña "Profesor responsable" → CU-ADM-01, GET /directorio/mi-profesor
//   pestaña "Mi equipo"            → CU-ADM-03, GET /directorio/mi-equipo
//
// Esta pantalla consume el hook de ADM-01 porque necesita `oferta.esProyecto` para saber si la
// segunda pestaña existe siquiera; el de ADM-03 vive dentro de su propio panel y solo se dispara al
// abrir esa pestaña. Ninguna respuesta se mezcla ni se reutiliza entre los dos.

const SECCION_PROFESOR = "profesor";
const SECCION_EQUIPO = "equipo";

function Aviso({ C, children }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem", textAlign: "center",
    }}>
      {children}
    </div>
  );
}

function Pestanas({ activa, onCambiar, C }) {
  const pestanas = [
    { id: SECCION_PROFESOR, label: "Profesor responsable" },
    { id: SECCION_EQUIPO, label: "Mi equipo" },
  ];

  return (
    <div style={{
      display: "flex", gap: 4, marginBottom: "1.25rem",
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: 4,
    }}>
      {pestanas.map(({ id, label }) => {
        const activo = activa === id;
        return (
          <button
            key={id}
            onClick={() => onCambiar(id)}
            aria-pressed={activo}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: RADIUS.md,
              background: activo ? C.accent : "transparent",
              border: "none",
              color: activo ? "#fff" : C.textMuted,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", transition: "background 0.15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function MiAsignacion() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const [params, setParams] = useSearchParams();
  const { carga, recargar, profesor, oferta, contactos, sinAsignacion } = useContactoProfesor();

  const esProyecto = oferta?.esProyecto ?? false;

  // La pestaña vive en la URL para que se pueda compartir y para que las rutas antiguas aterricen
  // en la sección correcta. En una oferta individual no hay pestaña de equipo, así que un
  // ?seccion=equipo heredado cae de vuelta en el profesor en lugar de dejar una vista muerta.
  const pedida = params.get("seccion");
  const seccion = esProyecto && pedida === SECCION_EQUIPO ? SECCION_EQUIPO : SECCION_PROFESOR;

  const cambiarSeccion = (id) => {
    // `replace` para que alternar entre pestañas no llene el historial del navegador.
    setParams(id === SECCION_PROFESOR ? {} : { seccion: id }, { replace: true });
  };

  const subtitulo = esProyecto
    ? "Tu profesor responsable y tu equipo de proyecto"
    : "Tu profesor responsable";

  const contenido = () => {
    if (carga.estado === "cargando") {
      return (
        <Aviso C={C}>
          <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>
            Cargando tu asignación...
          </p>
        </Aviso>
      );
    }

    // Sin asignación no es un error: es un estado legítimo y afecta a las dos pestañas por igual.
    if (sinAsignacion) {
      return (
        <Aviso C={C}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>👨‍🏫</p>
          <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Todavía no tienes una asignación activa
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Cuando tu registro de servicio social quede asignado, aquí verás a tu profesor
            responsable y, si es un proyecto, a tu equipo.
          </p>
        </Aviso>
      );
    }

    if (carga.estado === "error") {
      return (
        <Aviso C={C}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
          <button onClick={recargar} style={{
            padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Reintentar
          </button>
        </Aviso>
      );
    }

    return (
      <>
        {/* La pestaña de equipo solo existe en una oferta de proyecto. */}
        {esProyecto && <Pestanas activa={seccion} onCambiar={cambiarSeccion} C={C} />}

        {seccion === SECCION_EQUIPO
          ? <PanelEquipo />
          : <PanelProfesor profesor={profesor} oferta={oferta} contactos={contactos} />}
      </>
    );
  };

  return (
    <DashboardLayout
      titulo="Mi asignación"
      subtitulo={subtitulo}
      rol="alumno_asignado"
      usuario={nombreCompletoSesion(usuario)}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {contenido()}
      </div>
    </DashboardLayout>
  );
}
