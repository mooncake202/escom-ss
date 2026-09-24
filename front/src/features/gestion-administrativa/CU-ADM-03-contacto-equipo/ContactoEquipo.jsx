import { useTheme, RADIUS }  from "@/themes/colors";
import { IntegranteCard }    from "./components/IntegranteCard";
import { useContactoEquipo } from "./hooks/useContactoEquipo";

// A nivel de módulo, no dentro del componente: declarado adentro sería un tipo nuevo en cada render
// y React remontaría el bloque.
function Aviso({ C, children }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
    }}>
      {children}
    </div>
  );
}

// CU-ADM-03 — contacto del equipo de proyecto.
//
// Es el CONTENIDO de la pestaña "Mi equipo" dentro de "Mi asignación". Sigue consumiendo SU PROPIO
// endpoint (`GET /directorio/mi-equipo`) a través de su propio hook: la unificación es visual, los
// dos CU siguen siendo independientes. Como el panel solo se monta al abrir la pestaña, la llamada
// no se dispara mientras el alumno está viendo a su profesor.
//
// El botón "Ver a mi profesor" desapareció a propósito: esa navegación ahora son las pestañas.
export function PanelEquipo() {
  const { C } = useTheme();
  // `yo` no se desestructura a propósito: esta pantalla nunca muestra al alumno autenticado.
  const { carga, recargar, oferta, companeros, esProyecto, sinAsignacion } = useContactoEquipo();

  if (carga.estado === "cargando") {
    return (
      <Aviso C={C}>
        <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>
          Cargando a los integrantes de tu proyecto...
        </p>
      </Aviso>
    );
  }

  // La pantalla contenedora ya resuelve este caso con los datos de ADM-01; aquí solo se cubre la
  // carrera entre las dos peticiones.
  if (sinAsignacion) {
    return (
      <Aviso C={C}>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Todavía no tienes una asignación de servicio social activa.
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

  const EncabezadoOferta = (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "12px 16px", marginBottom: "1.25rem",
      display: "flex", alignItems: "center", gap: "0.875rem",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: RADIUS.md,
        background: C.accentSoft, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
          {oferta.nombre}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
          {oferta.descripcion}
        </p>
      </div>
    </div>
  );

  // Defensa: la pestaña ni siquiera existe en una oferta individual, pero si se llegara aquí por una
  // URL antigua, se dice lo que pasa en vez de pintar una lista vacía sin explicación.
  if (!esProyecto) {
    return (
      <>
        {EncabezadoOferta}
        <Aviso C={C}>
          <p style={{ margin: "0 0 0.375rem", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
            Tu servicio social es individual
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Esta oferta no es de proyecto, así que no tienes compañeros de equipo.
          </p>
        </Aviso>
      </>
    );
  }

  // Solo los OTROS alumnos del proyecto. El alumno autenticado no se lista: sus propios datos están
  // en "Mis datos" y esta sección existe para consultar a sus compañeros. El backend ya lo excluye
  // de `companeros`, así que aquí basta con no volver a añadirlo.
  return (
    <>
      {EncabezadoOferta}

      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {companeros.length} compañero{companeros.length !== 1 ? "s" : ""}
      </p>

      {companeros.length === 0 ? (
        <Aviso C={C}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Por ahora no tienes compañeros asignados a este proyecto.
          </p>
        </Aviso>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {companeros.map((companero) => (
              <IntegranteCard key={companero.boleta} integrante={companero} C={C} />
            ))}
          </div>

          <p style={{ margin: "1.25rem 0 0", fontSize: 11, color: C.textDisabled }}>
            El correo personal solo aparece si el integrante lo registró en su perfil.
          </p>
        </>
      )}
    </>
  );
}
