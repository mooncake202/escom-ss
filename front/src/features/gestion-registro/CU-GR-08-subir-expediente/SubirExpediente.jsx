import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useSubirExpediente } from "./hooks/useSubirExpediente";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";

function UploadBox({ label, numero, descripcion, archivo, error, onAgregar, onQuitar, C }) {
  const inputRef = { current: null };

  const fmtSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accentSoft, border: `1px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accentText, flexShrink: 0 }}>
          {numero}
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{label}</p>
      </div>
      {descripcion && (
        <p style={{ margin: "0 0 8px 30px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{descripcion}</p>
      )}
      {!archivo ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            marginLeft: 30, border: `2px dashed ${error ? C.danger : C.borderDefault}`,
            borderRadius: RADIUS.lg, padding: "1.25rem",
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", background: C.bgInput, transition: "border-color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.borderFocus}
          onMouseLeave={e => e.currentTarget.style.borderColor = error ? C.danger : C.borderDefault}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M12 12v6M9 15l3-3 3 3" />
          </svg>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>Haz clic para seleccionar archivo PDF</p>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>Solo PDF original · Máx. 1 MB por documento</p>
          </div>
        </div>
      ) : (
        <div style={{
          marginLeft: 30, border: `1px solid ${C.success}`,
          borderRadius: RADIUS.lg, padding: "0.875rem 1.25rem",
          background: C.successSoft, display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.success, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {archivo.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{fmtSize(archivo.size)}</p>
          </div>
          <button onClick={onQuitar} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 18, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
      )}
      <input ref={r => inputRef.current = r} type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => onAgregar(e.target.files?.[0] ?? null)} />
      {error && <p style={{ margin: "5px 0 0 30px", fontSize: 12, color: C.danger }}>{error}</p>}
    </div>
  );
}

export default function SubirExpediente() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const {
    docs, errores, loading, enviado, errorEnvio, obligatoriosCompletos,
    info, cargandoInfo, agregarDoc, quitarDoc, enviar,
  } = useSubirExpediente();
  const { estado, cargando, error } = useEstadoSolicitud();

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={5} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  // RN-GR-58/RF-GR-90: si el plazo venció mientras el alumno estaba aquí,
  // verificarYAplicarVencimiento (disparado por el polling de arriba) ya lo
  // habrá movido a rechazada_definitivamente — no hace falta código extra.
  if (estado?.estado_solicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={5} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  // RF-GR-97: aquí SÍ es un clic manual del alumno el que lo lleva a CU-GR-11
  // (a diferencia de GR-05, donde la ficha pedía redirección automática).
  if (enviado) {
    return (
      <ProcesoLayout pasoActual={5} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>🎓</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>Expediente enviado correctamente</h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Tu expediente fue recibido y está pendiente de revisión por parte de Coordinación.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            Recibirás un correo de confirmación con los formatos de reportes mensuales una vez que tu expediente sea aprobado. Si no cumple con los requisitos, se te notificará para hacer las correcciones.
          </p>
          <button onClick={() => navigate("/alumnoSinAsignar/estado-expediente")} style={{ padding: "12px 32px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: "pointer", background: GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent }}>
            Ver estado de mi proceso
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  if (cargandoInfo) return null;

  return (
    <ProcesoLayout pasoActual={5} usuario={nombre}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Subir expediente</h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Lee completamente las instrucciones antes de cargar tus documentos.
        </p>

        <div style={{ padding: "14px 18px", borderRadius: RADIUS.md, background: C.dangerSoft, border: `1px solid ${C.danger}`, marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: C.danger }}>⚠️ Lee esto antes de continuar</p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
            <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Los documentos deben cargarse <strong>EN DIGITAL</strong> — no se aceptan fotografías, escaneados ni cambios de formato.</li>
            <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>El sistema unirá tus documentos en <strong>un solo PDF</strong>, aplicando compresión automática si hace falta.</li>
            <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>El resultado final <strong>no debe superar los 2 MB</strong> — si ni con compresión cabe, te indicaremos qué documento sustituir.</li>
            <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Documentos faltantes, extras, o con firma/sello indebidos son <strong>motivo de rechazo</strong>.</li>
          </ul>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: RADIUS.md, background: "rgba(245,158,11,0.08)", border: `1px solid ${C.warning ?? "#F59E0B"}`, marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.warning ?? "#F59E0B"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.warning ?? "#F59E0B" }}>
              Fecha límite: antes del inicio de tu periodo · antes de las 2:00 PM
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
              Si no envías tu expediente en tiempo y forma, tu solicitud se cancelará automáticamente.
            </p>
          </div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Contenido del expediente (en un solo PDF)
          </p>

          <UploadBox numero="1" label="Carta compromiso (ambos lados)"
            descripcion="Descárgala del SISS en formato original. NO IMPRIMIR, NO FIRMAR, NO SELLAR, NO CAMBIAR EL FORMATO."
            archivo={docs.cartaCompromiso} error={errores.cartaCompromiso}
            onAgregar={a => agregarDoc("cartaCompromiso", a)} onQuitar={() => quitarDoc("cartaCompromiso")} C={C} />

          <UploadBox numero="2" label="CURP vigente al año corriente"
            descripcion="No cambiar el formato que arroja la página oficial (gob.mx). Debe ser del año en curso."
            archivo={docs.curp} error={errores.curp}
            onAgregar={a => agregarDoc("curp", a)} onQuitar={() => quitarDoc("curp")} C={C} />

          <UploadBox numero="3" label="Constancia de créditos o carta de pasante"
            descripcion="Constancia para trámite de servicio social vigente al semestre actual, o carta de pasante si ya concluiste créditos."
            archivo={docs.constanciaCreditos} error={errores.constanciaCreditos}
            onAgregar={a => agregarDoc("constanciaCreditos", a)} onQuitar={() => quitarDoc("constanciaCreditos")} C={C} />

          {/* RN-GR-59: solo se muestra si el alumno declaró dictamen en CU-GR-01 */}
          {info?.requiereDictamen && (
            <>
              <div style={{ borderTop: `1px solid ${C.borderSubtle}`, margin: "1.25rem 0" }} />
              <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textDisabled }}>
                Tu solicitud tiene un {info.dictamenLabel?.toLowerCase()} — este documento es obligatorio:
              </p>
              <UploadBox numero="4" label={info.dictamenLabel}
                descripcion="Agrégalo después del punto 3."
                archivo={docs.dictamen} error={errores.dictamen}
                onAgregar={a => agregarDoc("dictamen", a)} onQuitar={() => quitarDoc("dictamen")} C={C} />
            </>
          )}
        </div>

        <div style={{ padding: "10px 14px", background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderDefault}`, marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            Tu expediente final se nombrará automáticamente
          </p>
          <code style={{ fontSize: 13, color: C.accentText, fontFamily: "'DM Mono', monospace" }}>
            {info?.nombreExpedienteSugerido}
          </code>
        </div>

        {errorEnvio && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.danger }}>{errorEnvio}</p>
        )}

        <button
          onClick={enviar}
          disabled={!obligatoriosCompletos || loading}
          style={{
            width: "100%", padding: "12px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
            cursor: !obligatoriosCompletos || loading ? "not-allowed" : "pointer",
            background: !obligatoriosCompletos || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit",
            boxShadow: !obligatoriosCompletos || loading ? "none" : SHADOWS.accent,
            opacity: !obligatoriosCompletos ? 0.5 : 1, transition: "background 0.2s",
          }}
        >
          {loading ? "Procesando expediente..." : "Enviar expediente →"}
        </button>

      </div>
    </ProcesoLayout>
  );
}