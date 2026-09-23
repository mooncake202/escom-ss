import { useTheme, RADIUS }                    from "@/themes/colors";
import { DashboardLayout }                      from "@/components/layout/DashboardLayout";
import { useNavigate }                          from "react-router-dom";
import { useSesion, nombreCompletoSesion }      from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { CalendarioReporte }                    from "./components/CalendarioReporte";
import { AvanceActividades }                    from "./components/AvanceActividades";
import { FirmaCanvas }                          from "../compartido/FirmaCanvas";
import { useGenerarReporte }                    from "./hooks/useGenerarReporte";
import { nombreMes, etiquetaEstadoReporte, formatearFechaHoraMexico } from "./reportesGeneracion";

// Fuera del componente para que React no lo remonte (y el textarea pierda el foco) en cada render.
function Layout({ usuario, ancho = 580, children }) {
  return (
    <DashboardLayout titulo="Generar reporte mensual" subtitulo="Alumno" rol="alumno_asignado" usuario={usuario}>
      <div style={{ maxWidth: ancho, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

const ETIQUETA = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" };

export default function GenerarReporte() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const g = useGenerarReporte();

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  const botonSecundario = (extra = {}) => ({
    flex: 1, padding: "10px", borderRadius: RADIUS.md,
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    background: "transparent", border: `1px solid ${C.borderDefault}`,
    color: C.textMuted, fontFamily: "inherit", ...extra,
  });
  const botonPrimario = (deshabilitado = false, extra = {}) => ({
    flex: 2, padding: "10px", borderRadius: RADIUS.md,
    fontSize: 13, fontWeight: 700, cursor: deshabilitado ? "not-allowed" : "pointer",
    background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
    opacity: deshabilitado ? 0.6 : 1, ...extra,
  });

  const nombreUsuario = nombreCompletoSesion(usuario);

  const tarjeta = { background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, padding: "1.75rem" };

  const flechaAtras = (
    <button
      onClick={() => navigate("/alumno/reportes")}
      style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        background: "transparent", border: "none", cursor: "pointer",
        color: C.textMuted, fontSize: 13, padding: "0 0 1rem",
        fontFamily: "inherit",
      }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Mis reportes
    </button>
  );

  // ── Carga inicial ────────────────────────────────────────────
  if (g.estadoCarga === "cargando") {
    return (
      <Layout usuario={nombreUsuario}>
        {flechaAtras}
        <div style={{ ...tarjeta, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando los datos de tu reporte...</p>
        </div>
      </Layout>
    );
  }

  if (g.estadoCarga === "error") {
    return (
      <Layout usuario={nombreUsuario}>
        {flechaAtras}
        <div style={{ ...tarjeta, textAlign: "center" }}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{g.errorCarga}</p>
          <button onClick={g.recargar} style={botonPrimario(false, { flex: "none", padding: "10px 24px" })}>Reintentar</button>
        </div>
      </Layout>
    );
  }

  // ── Confirmación de envío (datos reales de la respuesta) ─────
  if (g.resultado) {
    const { reporte, fechaEnvio } = g.resultado;
    const envio = formatearFechaHoraMexico(fechaEnvio);
    return (
      <Layout usuario={nombreUsuario}>
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
            Reporte enviado correctamente
          </h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
            Tu reporte mensual No. {reporte.numero} fue firmado y enviado
            {g.profesor?.nombreCompleto ? <> a <strong>{g.profesor.nombreCompleto}</strong></> : ""} con estado:
          </p>
          <span style={{
            display: "inline-block", margin: "0 0 1rem",
            padding: "4px 14px", borderRadius: RADIUS.full,
            background: C.warningSoft, color: C.warning,
            fontSize: 13, fontWeight: 700, border: `1px solid ${C.warning}`,
          }}>
            {etiquetaEstadoReporte(reporte.estadoReporte)}
          </span>
          {envio && (
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled }}>
              Enviado el {envio.fecha} a las {envio.hora} h (hora de México).
            </p>
          )}
          <button
            onClick={() => navigate("/alumno/reportes")}
            style={{
              padding: "10px 28px", borderRadius: RADIUS.md,
              background: C.accent, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Ver mis reportes
          </button>
        </div>
      </Layout>
    );
  }

  const periodo = g.reporte?.periodo ?? null;
  const textoPeriodo = periodo ? `${periodo.inicioTexto} — ${periodo.finTexto}` : null;
  const titulo = g.reporte?.titulo ?? "Reporte mensual de actividades";
  const encabezadoPaso = (
    <p style={{ margin: "0 0 4px", ...ETIQUETA, color: C.textDisabled }}>Paso {g.numeroPaso} de {g.totalPasos}</p>
  );

  // ── Franja resumen (valores del backend) ─────────────────────
  const franjaResumen = periodo && (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.md,
      border: `1px solid ${C.borderDefault}`,
      padding: "10px 16px", marginBottom: "1.25rem",
      display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
    }}>
      <div>
        <span style={{ ...ETIQUETA, color: C.textDisabled }}>Periodo</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{textoPeriodo}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ ...ETIQUETA, color: C.textDisabled }}>Días laborados</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{g.resumen.diasLaborados}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ ...ETIQUETA, color: C.textDisabled }}>Horas reportadas</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{g.resumen.horas} h</p>
      </div>
    </div>
  );

  // ── Paso 1: Calendario ───────────────────────────────────────
  if (g.pasoActual === "calendario") {
    const mesData = g.meses[g.mesActivo];
    return (
      <Layout usuario={nombreUsuario}>
        {flechaAtras}
        <div style={tarjeta}>
          {encabezadoPaso}
          <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{titulo}</h3>
          {textoPeriodo && (
            <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>Periodo: {textoPeriodo}</p>
          )}

          {/* Bloqueos: el backend decide si se puede generar */}
          {!g.puedeGenerar && (
            <div style={{
              margin: "0 0 1.25rem", padding: "12px 14px", borderRadius: RADIUS.md,
              background: C.warningSoft, border: `1px solid ${C.warning}`,
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.warning }}>
                Todavía no puedes generar este reporte
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
                {g.motivosBloqueo.map((m) => <li key={m.codigo}>{m.mensaje}</li>)}
              </ul>
            </div>
          )}

          {mesData && (
            <>
              {/* Selector de mes (cuando el periodo abarca dos meses) */}
              {g.meses.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
                  {g.meses.map(({ anio, mes }, idx) => (
                    <button
                      key={`${anio}-${mes}`}
                      onClick={() => g.setMesActivo(idx)}
                      style={{
                        padding: "6px 14px", borderRadius: RADIUS.full,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                        background: g.mesActivo === idx ? C.accent : "transparent",
                        border: `1px solid ${g.mesActivo === idx ? C.accent : C.borderDefault}`,
                        color: g.mesActivo === idx ? "#fff" : C.textMuted,
                      }}
                    >
                      {nombreMes(mes)} {anio}
                    </button>
                  ))}
                </div>
              )}

              <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.accentText, lineHeight: 1.6 }}>
                Los días y horas son de tus bitácoras aprobadas.
              </p>

              <div style={{
                background: C.bgInput, borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderDefault}`,
                padding: "1rem", marginBottom: "0.75rem",
              }}>
                <CalendarioReporte anio={mesData.anio} mes={mesData.mes} dias={mesData.dias} C={C} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>
                  {g.resumen.diasLaborados} día{g.resumen.diasLaborados !== 1 ? "s" : ""} laborado{g.resumen.diasLaborados !== 1 ? "s" : ""}
                </span>
                <span style={{
                  padding: "2px 10px", borderRadius: RADIUS.full,
                  background: C.accentSoft, color: C.accentText, fontSize: 12, fontWeight: 700,
                }}>
                  Total: {g.resumen.horas} h
                </span>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario()}>Cancelar</button>
            <button onClick={g.continuarDesdeCalendario} disabled={!g.puedeGenerar} style={botonPrimario(!g.puedeGenerar)}>
              Continuar →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 2: Detalle + avance ─────────────────────────────────
  if (g.pasoActual === "actividades") {
    return (
      <Layout usuario={nombreUsuario}>
        {flechaAtras}
        {franjaResumen}
        {g.avances.length > 0 && <AvanceActividades avances={g.avances} descripcion={false} C={C} />}

        <div style={tarjeta}>
          {encabezadoPaso}
          <h3 style={{ margin: "0 0 1.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>Detalle del reporte</h3>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block", ...ETIQUETA, color: C.textMuted, fontSize: 12, marginBottom: 6,
            }}>
              Actividades realizadas <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea
              value={g.actividades}
              onChange={g.handleActividadesChange}
              rows={6}
              placeholder="Describe las actividades realizadas durante el periodo, una por línea..."
              style={{ ...inputBase(!!g.errores.actividades), resize: "vertical", lineHeight: 1.6 }}
            />
            {g.errores.actividades && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{g.errores.actividades}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={g.atras} style={botonSecundario()}>← Atrás</button>
            <button onClick={g.continuarDesdeActividades} style={botonPrimario()}>
              {g.totalPasos === 4 && !g.firmaSubida ? "Continuar → Firma" : "Firmar y ver vista previa →"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 3: Firma (solo si el backend no la tiene) ───────────
  if (g.pasoActual === "firma") {
    return (
      <Layout usuario={nombreUsuario}>
        {flechaAtras}
        {franjaResumen}
        <div style={tarjeta}>
          {encabezadoPaso}
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>Dibuja tu firma</h3>

          {g.firmaSubida ? (
            <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.success }}>
              Tu firma ya quedó registrada y se usará en este y en tus próximos reportes.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                Dibuja tu firma con el mouse, el trackpad o el dedo. Se guardará y se usará automáticamente en tus reportes futuros.
              </p>
              <div style={{ marginBottom: "1.25rem" }}>
                <FirmaCanvas onCambiar={g.handleFirmaChange} error={g.errores.firma} C={C} />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={g.atras} disabled={g.subiendoFirma} style={botonSecundario()}>← Atrás</button>
            <button
              onClick={g.continuarDesdeFirma}
              disabled={g.subiendoFirma || (!g.firmaSubida && !g.firma)}
              style={botonPrimario(g.subiendoFirma || (!g.firmaSubida && !g.firma))}
            >
              {g.subiendoFirma ? "Guardando firma..." : "Ver vista previa →"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Último paso: vista previa (PDF del servidor) y envío ─────
  const { vistaPrevia, errorEnvio } = g;
  const accionesError = (e) => (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: 8, flexWrap: "wrap" }}>
      {e.accion === "actividades" && (
        <button onClick={g.irAActividades} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Corregir actividades</button>
      )}
      {e.accion === "recargar" && (
        <button onClick={g.recargar} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Actualizar datos</button>
      )}
      {e.accion === "reintentar" && (
        <button onClick={g.enviar} disabled={g.enviando} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Reintentar envío</button>
      )}
      {e.accion === "lista" && (
        <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Ver mis reportes</button>
      )}
    </div>
  );

  return (
    <Layout usuario={nombreUsuario} ancho={780}>
      {flechaAtras}
      {franjaResumen}

      <div style={{ ...tarjeta, marginBottom: "1.25rem" }}>
        {encabezadoPaso}
        <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>Vista previa del reporte</h3>

        <div style={{
          height: 600, marginBottom: "1.25rem",
          borderRadius: RADIUS.md, overflow: "hidden",
          border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bgInput,
        }}>
          {vistaPrevia.estado === "cargando" && (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Generando vista previa...</p>
          )}
          {vistaPrevia.estado === "error" && (
            <div style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{vistaPrevia.error.mensaje}</p>
              {accionesError(vistaPrevia.error)}
              {vistaPrevia.error.accion === "ninguna" && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={g.reintentarVistaPrevia} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Reintentar</button>
                </div>
              )}
            </div>
          )}
          {vistaPrevia.estado === "listo" && (
            <iframe src={vistaPrevia.url} width="100%" height="100%" style={{ border: "none" }} title="Vista previa del reporte" />
          )}
        </div>

        {errorEnvio && (
          <div style={{
            margin: "0 0 1rem", padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{errorEnvio.mensaje}</p>
            {accionesError(errorEnvio)}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={g.atras} disabled={g.enviando} style={botonSecundario()}>← Editar</button>
          <button
            onClick={g.enviar}
            disabled={g.enviando || vistaPrevia.estado !== "listo"}
            style={botonPrimario(g.enviando || vistaPrevia.estado !== "listo")}
          >
            {g.enviando ? "Enviando... (puede tardar unos segundos)" : "Enviar al profesor →"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
