import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useRecursosConsulta, formatFecha } from "./hooks/useGestionarRecursos";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// CU-ADM-05 — Vista de CONSULTA. La misma lista que administra Coordinación, en solo lectura:
// sin agregar, editar ni eliminar.
//
// La comparten los roles que solo consultan —el alumno ASIGNADO y el profesor—: la lista es
// idéntica para ambos, así que no hay razón para duplicar la pantalla. `rol` llega desde la ruta
// únicamente para que el menú lateral y el encabezado sean los de ese rol.
//
// El sistema no aloja los archivos, solo el enlace: cada recurso se abre en una pestaña nueva.

function Marco({ rol, usuario, children }) {
  return (
    <DashboardLayout
      titulo="Recursos"
      subtitulo="Formatos, guías y documentos del servicio social"
      rol={rol}
      usuario={usuario}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

export default function RecursosConsulta({ rol = "alumno_asignado" }) {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const { carga, recargar, recursos } = useRecursosConsulta();

  const nombre = nombreCompletoSesion(usuario);

  if (carga.estado !== "listo") {
    return (
      <Marco rol={rol} usuario={nombre}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem", textAlign: "center",
        }}>
          {carga.estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando recursos...</p>
          ) : (
            <>
              <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
              <button onClick={recargar} style={{
                padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </Marco>
    );
  }

  if (recursos.length === 0) {
    return (
      <Marco rol={rol} usuario={nombre}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3.5rem 2rem", textAlign: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📁</p>
          <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Sin recursos disponibles
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Coordinación todavía no ha publicado formatos ni guías.
          </p>
        </div>
      </Marco>
    );
  }

  return (
    <Marco rol={rol} usuario={nombre}>
      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {recursos.length} recurso{recursos.length !== 1 ? "s" : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {recursos.map((r) => (
          <div key={r.id} style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "1rem 1.25rem",
            display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
              background: C.accentSoft,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>
              📄
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                {r.nombre}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
                Actualizado el {formatFecha(r.ultimaActualizacion)}
              </p>
            </div>

            {/* El recurso vive fuera del sistema: se abre en una pestaña nueva. */}
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px", borderRadius: RADIUS.md,
                background: C.accent, color: "#fff", textDecoration: "none",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}
            >
              Abrir recurso
            </a>
          </div>
        ))}
      </div>

      <p style={{ margin: "1.25rem 0 0", fontSize: 11, color: C.textDisabled }}>
        Los recursos se abren en una página externa. Coordinación los mantiene actualizados.
      </p>
    </Marco>
  );
}
