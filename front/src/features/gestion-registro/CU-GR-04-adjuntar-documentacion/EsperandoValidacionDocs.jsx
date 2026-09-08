import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import {
  getMisDocumentos,
  continuarACartaCompromiso,
  corregirDocumentacion,
  corregirRegistroSISS,
} from "@/services/estadoSolicitudService";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

const ETIQUETA_DOCUMENTO = {
  carta_creditos: "Carta de créditos",
  constancia_seguro_social: "Constancia de vigencia del seguro social",
};

function DocItem({ label, C }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 0", borderBottom: `1px solid ${C.borderSubtle}`, fontSize: 13,
    }}>
      <span style={{ color: C.success, fontSize: 16 }}>✔</span>
      <span>{label}</span>
    </div>
  );
}

export default function EsperandoValidacionDocs() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error } = useEstadoSolicitud();

  const [documentos, setDocumentos] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";
  const estadoSolicitud = estado?.estado_solicitud;

  // RF-GR-62: la lista de documentos solo se necesita mientras está pendiente.
  useEffect(() => {
    if (estadoSolicitud !== "SISS_y_documentacion_pendiente") {
      setCargandoDocs(false);
      return;
    }
    getMisDocumentos()
      .then(setDocumentos)
      .catch((err) => setErrorAccion(err.message))
      .finally(() => setCargandoDocs(false));
  }, [estadoSolicitud]);

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={3} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  if (estadoSolicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={3} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  const ejecutarAccion = async (fn, ruta, cambiosLocalStorage) => {
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await fn();
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, ...cambiosLocalStorage });
      navigate(ruta);
    } catch (err) {
      setErrorAccion(err.message);
      setEnviando(false);
    }
  };

  return (
    <ProcesoLayout pasoActual={3} usuario={nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        {/* ── PENDIENTE DE REVISIÓN — RF-GR-62 ── */}
        {estadoSolicitud === "SISS_y_documentacion_pendiente" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>📄</div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Documentación enviada</h2>
            <p style={{ color: C.textMuted, marginTop: "0.75rem" }}>
              Tu documentación y tu registro en SISS están siendo revisados por Coordinación.
              Esta pantalla se actualiza sola cada par de minutos.
            </p>

            <div style={{
              marginTop: "1.5rem", background: C.bgCard,
              border: `1px solid ${C.borderSubtle}`, borderRadius: RADIUS.md,
              padding: "1rem", textAlign: "left",
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: "0.5rem" }}>Documentos enviados</p>
              {cargandoDocs ? (
                <p style={{ fontSize: 13, color: C.textDisabled }}>Cargando...</p>
              ) : documentos.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textDisabled }}>No se encontraron documentos.</p>
              ) : (
                documentos.map((d) => (
                  <DocItem key={d.id} label={ETIQUETA_DOCUMENTO[d.tipoDocumento] || d.tipoDocumento} C={C} />
                ))
              )}
            </div>
          </>
        )}

        {/* ── APROBADOS — Flujo A ── */}
        {estadoSolicitud === "SISS_docs_aprobados" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.success }}>Documentación aprobada</h2>
            <p style={{ color: C.textMuted, marginTop: "0.75rem", marginBottom: "1.5rem" }}>
              Coordinación validó tu documentación y tu registro en SISS. Ya puedes continuar con el siguiente paso.
            </p>
            <button
              onClick={() => ejecutarAccion(continuarACartaCompromiso, "/alumnoSinAsignar/carta-compromiso", { estado_anterior: "SISS_docs_aprobados" })}
              disabled={enviando}
              style={{
                padding: "10px 20px", borderRadius: RADIUS.md, background: enviando ? C.borderDefault : C.accent,
                color: "#fff", border: "none", cursor: enviando ? "wait" : "pointer", fontWeight: 600,
              }}
            >
              {enviando ? "Avanzando..." : "Continuar"}
            </button>
          </>
        )}

        {/* ── CORREGIR DOCUMENTOS — Flujo B ── */}
        {estadoSolicitud === "corregir_docsini" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.warning ?? "#F59E0B" }}>
              Se requieren correcciones en tus documentos
            </h2>
            <p style={{ color: C.textMuted, marginTop: "0.75rem", marginBottom: "1rem" }}>
              Coordinación revisó tu documentación y encontró observaciones. Tus archivos anteriores
              fueron eliminados — corrígelos y vuelve a adjuntarlos.
            </p>
            {estado.motivo_rechazo && (
              <div style={{
                background: C.bgCard, border: `1px solid ${C.borderSubtle}`,
                borderRadius: RADIUS.md, padding: "1rem", marginBottom: "1.5rem", textAlign: "left",
              }}>
                <strong style={{ fontSize: 13 }}>Observaciones de Coordinación:</strong>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSecondary }}>{estado.motivo_rechazo}</p>
              </div>
            )}
            <button
              onClick={() => ejecutarAccion(corregirDocumentacion, "/alumnoSinAsignar/documentacion", { estado_anterior: "corregir_docsini" })}
              disabled={enviando}
              style={{
                padding: "10px 20px", borderRadius: RADIUS.md, background: enviando ? C.borderDefault : C.accent,
                color: "#fff", border: "none", cursor: enviando ? "wait" : "pointer", fontWeight: 600,
              }}
            >
              {enviando ? "Procesando..." : "Corregir y reenviar documentación"}
            </button>
          </>
        )}

        {/* ── CORREGIR REGISTRO SISS — Flujo C ── */}
        {estadoSolicitud === "corregir_SISS" && (
          <>
            <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.warning ?? "#F59E0B" }}>
              Se requiere corregir tu registro en SISS
            </h2>
            <p style={{ color: C.textMuted, marginTop: "0.75rem", marginBottom: "1rem" }}>
              Coordinación encontró un problema con tu registro en SISS. Tus documentos fueron
              eliminados — vuelve a completar el registro en SISS.
            </p>
            {estado.motivo_rechazo && (
              <div style={{
                background: C.bgCard, border: `1px solid ${C.borderSubtle}`,
                borderRadius: RADIUS.md, padding: "1rem", marginBottom: "1.5rem", textAlign: "left",
              }}>
                <strong style={{ fontSize: 13 }}>Observaciones de Coordinación:</strong>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSecondary }}>{estado.motivo_rechazo}</p>
              </div>
            )}
            <button
              onClick={() => ejecutarAccion(corregirRegistroSISS, "/alumnoSinAsignar/siss", { estado_anterior: "corregir_SISS" })}
              disabled={enviando}
              style={{
                padding: "10px 20px", borderRadius: RADIUS.md, background: enviando ? C.borderDefault : C.accent,
                color: "#fff", border: "none", cursor: enviando ? "wait" : "pointer", fontWeight: 600,
              }}
            >
              {enviando ? "Procesando..." : "Corregir registro en SISS"}
            </button>
          </>
        )}

        {errorAccion && (
          <p style={{ marginTop: "1rem", fontSize: 13, color: C.danger }}>{errorAccion}</p>
        )}

      </div>
    </ProcesoLayout>
  );
}