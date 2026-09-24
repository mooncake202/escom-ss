import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeccionCard } from "./components/SeccionCard";
import { useContactoInstitucional, SECCIONES, MAX_VALOR } from "./hooks/useContactoInstitucional";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// CU-ADM-06 — Contacto institucional. UNA sola pantalla para los tres roles:
//   coordinación    → administra (agregar, editar, quitar) y confirma con "Guardar cambios"
//   alumno asignado → consulta
//   profesor        → consulta
//
// La consulta es exactamente la misma vista para alumno y profesor: solo cambia el rol que se le
// pasa al layout para que el menú lateral sea el suyo.
//
// Coordinación trabaja sobre un BORRADOR: nada se envía hasta pulsar "Guardar cambios".

// Texto institucional fijo: NO es un medio de contacto persistido, es el encabezado de la sección.
const DEPARTAMENTO = "Departamento de Extensión y Apoyos Educativos — Servicio Social";

function Editor({ fila, seccion, onCambiar, C }) {
  const estilo = {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    borderRadius: RADIUS.md, background: C.bgInput,
    border: `1px solid ${C.borderDefault}`,
    color: C.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none",
  };

  return seccion.multilinea ? (
    <textarea
      value={fila.valor}
      onChange={(e) => onCambiar(fila.clave, e.target.value)}
      maxLength={MAX_VALOR}
      rows={3}
      placeholder={seccion.placeholder}
      style={{ ...estilo, resize: "vertical", lineHeight: 1.6 }}
    />
  ) : (
    <input
      value={fila.valor}
      onChange={(e) => onCambiar(fila.clave, e.target.value)}
      maxLength={MAX_VALOR}
      placeholder={seccion.placeholder}
      style={estilo}
    />
  );
}

// Fila en modo administración: editable siempre, con "Quitar"/"Deshacer". No guarda por su cuenta.
function FilaEditable({ fila, seccion, hook, C }) {
  const { cambiarValor, quitar, restaurar } = hook;

  if (fila.quitada) {
    return (
      <div style={{
        padding: "8px 0", borderBottom: `1px solid ${C.borderSubtle}`,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
      }}>
        <span style={{ fontSize: 13, color: C.textDisabled, textDecoration: "line-through", flex: 1, minWidth: 0 }}>
          {fila.valorOriginal}
        </span>
        <span style={{ fontSize: 11, color: C.danger, flexShrink: 0 }}>Se quitará al guardar</span>
        <button onClick={() => restaurar(fila.clave)} style={{
          padding: "3px 9px", borderRadius: RADIUS.sm, fontSize: 11,
          background: "transparent", border: `1px solid ${C.borderDefault}`,
          color: C.textMuted, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
        }}>
          Deshacer
        </button>
      </div>
    );
  }

  const esNueva = fila.id === null;
  const editada = !esNueva && fila.valor !== fila.valorOriginal;

  return (
    <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Editor fila={fila} seccion={seccion} onCambiar={cambiarValor} C={C} />
        </div>
        <button onClick={() => quitar(fila.clave)} style={{
          padding: "6px 10px", borderRadius: RADIUS.sm, fontSize: 11,
          background: "transparent", border: `1px solid ${C.danger}`,
          color: C.danger, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
        }}>
          Quitar
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: 3 }}>
        <span style={{ fontSize: 11, color: C.accentText }}>
          {esNueva ? "Nuevo" : editada ? "Modificado" : ""}
        </span>
        <span style={{ fontSize: 11, color: C.textDisabled }}>
          {fila.valor.length}/{MAX_VALOR}
        </span>
      </div>
    </div>
  );
}

export default function ContactoInstitucional({ rol = "alumno_asignado" }) {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const hook = useContactoInstitucional();
  const {
    carga, recargar, porTipo, tipos, total,
    agregar, hayCambios, totalPendientes, descartarCambios,
    guardarCambios, guardando, errorGuardado, guardado,
  } = hook;

  const esCoord = rol === "coordinacion";

  const marco = {
    titulo: "Contacto institucional",
    subtitulo: esCoord
      ? "Administra los medios de contacto de Coordinación"
      : "Medios de contacto de la Coordinación de Servicio Social",
    rol,
    usuario: nombreCompletoSesion(usuario),
  };

  if (carga.estado !== "listo") {
    return (
      <DashboardLayout {...marco}>
        <div style={{
          maxWidth: 560, margin: "3rem auto", textAlign: "center",
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem",
        }}>
          {carga.estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando información de contacto...</p>
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
      </DashboardLayout>
    );
  }

  // Quien solo consulta y no hay nada registrado, no tiene nada que ver.
  if (!esCoord && total === 0) {
    return (
      <DashboardLayout {...marco}>
        <div style={{
          maxWidth: 560, margin: "0 auto",
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3.5rem 2rem", textAlign: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>🏛️</p>
          <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Sin información de contacto
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Coordinación todavía no ha publicado sus medios de contacto.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...marco}>
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>

        {/* Encabezado institucional: texto fijo, no es un medio de contacto persistido. */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1rem 1.25rem", marginBottom: "1.25rem",
        }}>
          <p style={{
            margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            ESCOM · IPN
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
            {DEPARTAMENTO}
          </p>
        </div>

        {tipos.map((tipo) => {
          const seccion = SECCIONES[tipo];
          const filas = porTipo[tipo] ?? [];
          const visibles = filas.filter((f) => !f.quitada);

          // Al que solo consulta no se le muestra una sección vacía.
          if (!esCoord && visibles.length === 0) return null;

          return (
            <SeccionCard key={tipo} titulo={seccion.titulo} C={C}>
              {esCoord ? (
                <>
                  {filas.length === 0 && (
                    <p style={{ margin: "6px 0", fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
                      Sin registros.
                    </p>
                  )}
                  {filas.map((f) => (
                    <FilaEditable key={f.clave} fila={f} seccion={seccion} hook={hook} C={C} />
                  ))}
                  <button onClick={() => agregar(tipo)} style={{
                    marginTop: "0.5rem", padding: "5px 12px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px dashed ${C.borderDefault}`,
                    color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    + Agregar {seccion.singular}
                  </button>
                </>
              ) : (
                visibles.map((f) => (
                  <div key={f.clave} style={{ padding: "10px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
                    <span style={{ fontSize: 13, color: C.textPrimary, whiteSpace: "pre-wrap" }}>
                      {f.valor}
                    </span>
                  </div>
                ))
              )}
            </SeccionCard>
          );
        })}

        {/* Barra de guardado — solo coordinación. Un único punto de persistencia. */}
        {esCoord && (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${hayCambios ? C.accent : C.borderDefault}`,
            padding: "0.875rem 1.25rem", marginTop: "1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 0 }}>
              {errorGuardado ? (
                <span style={{ fontSize: 12, color: C.danger }}>{errorGuardado}</span>
              ) : guardado ? (
                <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>Cambios guardados</span>
              ) : hayCambios ? (
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  {totalPendientes} cambio{totalPendientes !== 1 ? "s" : ""} sin guardar
                </span>
              ) : (
                <span style={{ fontSize: 12, color: C.textDisabled }}>No hay cambios pendientes.</span>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
              {hayCambios && (
                <button onClick={descartarCambios} disabled={guardando} style={{
                  padding: "9px 18px", borderRadius: RADIUS.md,
                  background: "transparent", border: `1px solid ${C.borderDefault}`,
                  color: C.textMuted, fontSize: 13, fontWeight: 500,
                  cursor: guardando ? "default" : "pointer", fontFamily: "inherit",
                }}>
                  Descartar
                </button>
              )}
              <button
                onClick={guardarCambios}
                disabled={!hayCambios || guardando}
                style={{
                  padding: "10px 28px", borderRadius: RADIUS.md, border: "none",
                  background: !hayCambios || guardando ? C.bgInput : C.accent,
                  color: !hayCambios || guardando ? C.textDisabled : "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                  cursor: !hayCambios || guardando ? "not-allowed" : "pointer",
                }}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {!esCoord && (
          <p style={{ margin: "0.5rem 0 0", fontSize: 11, color: C.textDisabled }}>
            Para trámites documentales se recomienda acudir en persona con identificación institucional.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
