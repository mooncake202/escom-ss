import { useTheme, RADIUS }                from "@/themes/colors";
import { DashboardLayout }                 from "@/components/layout/DashboardLayout";
import { useNavigate }                     from "react-router-dom";
import { CaracteristicasActuales }         from "./components/CaracteristicasActuales";
import { CaracteristicaSelector }          from "./components/CaracteristicaSelector";
import { useSolicitarModificacion }        from "./hooks/useSolicitarModificacion";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

const SUBTITULO = "CU-ADM-15 · Profesor";

const ESTADO_ESTILO = {
  pendiente: { bg: "rgba(234,179,8,0.12)", color: "#ca8a04", borde: "rgba(234,179,8,0.3)", texto: "Pendiente" },
  aprobada:  { bg: "rgba(34,197,94,0.12)", color: "#16A34A", borde: "rgba(34,197,94,0.3)", texto: "Aprobada" },
  rechazada: { bg: "rgba(239,68,68,0.12)", color: "#DC2626", borde: "rgba(239,68,68,0.3)", texto: "Rechazada" },
};

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : null);

// El destino de una solicitud puede ser una característica o la vuelta a Profesor base (null).
const destinoDe = (solicitud) => solicitud.caracteristicaSolicitada?.nombre ?? "Profesor base";

function EstadoBadge({ estado, C }) {
  const s = ESTADO_ESTILO[estado] ?? { bg: C.bgInput, color: C.textMuted, borde: C.borderDefault, texto: estado };
  return (
    <span style={{
      flexShrink: 0, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color, border: `1px solid ${s.borde}`,
    }}>
      {s.texto}
    </span>
  );
}

function Marco({ usuario, children }) {
  return (
    <DashboardLayout
      titulo="Solicitar modificación de características"
      subtitulo={SUBTITULO}
      rol="profesor"
      usuario={usuario}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

// `destacado` es el id que traía la notificación de resolución: esa tarjeta se marca para que el
// profesor la localice de inmediato, tanto si fue aprobada como rechazada.
function Historial({ solicitudes, destacado, C }) {
  if (solicitudes.length === 0) return null;
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginTop: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Mis solicitudes anteriores
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {solicitudes.map((h) => (
          <div key={h.id} style={{
            padding: "0.75rem 1rem", borderRadius: RADIUS.md,
            background: h.id === destacado ? C.accentSoft : C.bgInput,
            border: `1px solid ${h.id === destacado ? C.accent : C.borderDefault}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                {destinoDe(h)}
              </p>
              <EstadoBadge estado={h.estado} C={C} />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
              Enviada el {fechaLegible(h.fecha)}
              {h.fechaRespuesta ? ` · resuelta el ${fechaLegible(h.fechaRespuesta)}` : ""}
            </p>
            {h.comentario && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
                <strong style={{ color: C.textPrimary }}>Coordinación:</strong> {h.comentario}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SolicitarModificacionCaracteristicas() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const nombreProfesor = nombreCompletoSesion(usuario);

  const {
    carga, recargar,
    profesor, opciones, historial, destacado, solicitudPendiente, tieneSolicitudPendiente,
    seleccion, opcionSeleccionada, capacidadResultante, excedeOcupados,
    justificacion, errores, enviando, enviado, puedeEnviar,
    handleSeleccionar, handleJustificacionChange,
    handleSubmit, handleCancelar,
  } = useSolicitarModificacion();

  // ── Carga y error ─────────────────────────────────────────────
  if (carga.estado !== "listo") {
    return (
      <Marco usuario={nombreProfesor}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "2.5rem 2rem", textAlign: "center",
        }}>
          {carga.estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tus características...</p>
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

  const historialPrevio = historial.filter((h) => h.id !== solicitudPendiente?.id);

  // ── Ya existe una solicitud pendiente: no se puede enviar otra ──
  // Máximo UNA solicitud pendiente por profesor; el backend lo valida igual.
  if (tieneSolicitudPendiente) {
    return (
      <Marco usuario={nombreProfesor}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.warning}`,
          padding: "2rem 1.75rem",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: C.warningSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
              stroke={C.warning} strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>
            Solicitud pendiente de resolución
          </h3>
          <p style={{ margin: "0 0 1.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6, textAlign: "center" }}>
            Solicitaste <strong style={{ color: C.textPrimary }}>{destinoDe(solicitudPendiente)}</strong> el{" "}
            {fechaLegible(solicitudPendiente.fecha)} y coordinación aún no la resuelve.
            No puedes enviar otra hasta entonces.
          </p>
          <CaracteristicasActuales profesor={profesor} C={C} />
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              width: "100%", padding: "10px", borderRadius: RADIUS.md,
              background: C.accent, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Ir al inicio
          </button>
        </div>
        <Historial solicitudes={historialPrevio} destacado={destacado} C={C} />
      </Marco>
    );
  }

  // ── Confirmación de envío ─────────────────────────────────────
  if (enviado) {
    return (
      <Marco usuario={nombreProfesor}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.success}`,
          padding: "2.5rem 2rem", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: C.successSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
              stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
            Solicitud enviada
          </h3>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted }}>
            Solicitaste cambiar a:
          </p>
          <span style={{
            display: "inline-block", margin: "0 0 1.25rem",
            padding: "4px 14px", borderRadius: RADIUS.full,
            background: C.accentSoft, border: `1px solid ${C.accent}`,
            fontSize: 13, fontWeight: 700, color: C.accentText,
          }}>
            {opcionSeleccionada?.nombre}
          </span>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            Quedó registrada con estado <strong style={{ color: C.textMuted }}>Pendiente</strong> y tu
            capacidad seguirá siendo de {profesor.cuposTotales} cupos hasta que coordinación la apruebe.
            Recibirás una notificación cuando la resuelvan.
          </p>
          <button
            onClick={() => navigate("/profesor/datos-personales")}
            style={{
              padding: "10px 28px", borderRadius: RADIUS.md,
              background: C.accent, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Volver a mis datos
          </button>
        </div>
      </Marco>
    );
  }

  // ── Flujo principal ───────────────────────────────────────────
  return (
    <Marco usuario={nombreProfesor}>
      <CaracteristicasActuales profesor={profesor} C={C} />

      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
      }}>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
          Nueva solicitud
        </h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
          Elige la característica que quieres que quede vigente y explica por qué. Coordinación la revisará.
        </p>

        <CaracteristicaSelector
          opciones={opciones}
          seleccion={seleccion}
          error={errores.caracteristica}
          onSeleccionar={handleSeleccionar}
          C={C}
        />

        {/* Capacidad resultante antes de enviar: el profesor ve el efecto del cambio. */}
        {opcionSeleccionada && (
          <div style={{
            marginBottom: "1.25rem", padding: "0.875rem 1rem", borderRadius: RADIUS.md,
            background: excedeOcupados ? "rgba(239,68,68,0.06)" : C.bgInput,
            border: `1px solid ${excedeOcupados ? C.danger : C.borderDefault}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                Capacidad actual <strong style={{ color: C.textPrimary }}>{profesor.cuposTotales}</strong>
              </span>
              <span style={{ fontSize: 12, color: C.textDisabled }}>→</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                Capacidad resultante{" "}
                <strong style={{ color: excedeOcupados ? C.danger : C.accentText }}>{capacidadResultante}</strong>
              </span>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                · Ocupados hoy <strong style={{ color: C.textPrimary }}>{profesor.ocupados}</strong>
              </span>
            </div>
            {excedeOcupados && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
                No puedes solicitar este cambio: quedarías con {capacidadResultante} cupos y tienes{" "}
                {profesor.ocupados} alumnos asignados. Tendrías que liberar {opcionSeleccionada.cuposALiberar}{" "}
                antes de poder pedirlo. Reducir tu capacidad nunca da de baja a un alumno.
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
          }}>
            Justificación <span style={{ color: C.danger }}>*</span>
          </label>
          <textarea
            value={justificacion}
            onChange={handleJustificacionChange}
            rows={4}
            placeholder="Explica los motivos por los que solicitas este cambio de característica..."
            style={{
              width: "100%", padding: "10px 14px", boxSizing: "border-box",
              background: C.bgInput,
              border: `1px solid ${errores.justificacion ? C.danger : C.borderDefault}`,
              borderRadius: RADIUS.md, color: C.textPrimary,
              fontSize: 13, outline: "none", fontFamily: "inherit",
              resize: "vertical", lineHeight: 1.55,
            }}
          />
          {errores.justificacion && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>
              {errores.justificacion}
            </p>
          )}
        </div>

        {/* El backend es la autoridad: puede rechazar aunque el formulario creyera que se podía. */}
        {errores.envio && (
          <div style={{
            marginBottom: "1rem", padding: "10px 14px", borderRadius: RADIUS.md,
            background: "rgba(239,68,68,0.06)", border: `1px solid ${C.danger}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: C.danger, lineHeight: 1.55 }}>{errores.envio}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleCancelar} style={{
            flex: 1, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            color: C.textMuted, fontFamily: "inherit",
          }}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!puedeEnviar}
            style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700,
              cursor: puedeEnviar ? "pointer" : "not-allowed",
              opacity: puedeEnviar ? 1 : 0.5,
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
            }}
          >
            {enviando ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </div>

      <Historial solicitudes={historialPrevio} destacado={destacado} C={C} />
    </Marco>
  );
}
