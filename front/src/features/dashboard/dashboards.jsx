import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, RADIUS, BRAND } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSesion, nombreCompletoSesion } from "../login/CU-CRED-03-crear-usuarios/hooks/useSesion"; // ajusta si tu useSesion vive en otro lado
import { obtenerResumenDashboard } from "@/services/dashboardService";
import {
  listarNotificacionesPendientes,
  marcarNotificacionLeida,
} from "@/services/notificacionesService";
import { ModalBienvenidaAlumnoAsignado } from "@/features/gestion-registro/components/ModalBienvenidaAlumnoAsignado";

// ── Iconos SVG inline ──────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    clock:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    book:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>,
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
    bell:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>,
    user:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>,
    users:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>,
    chart:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
    check:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    plus:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/>,
    arrow:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7"/>,
    star:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
    flag:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>,
    folder:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>,
    pencil:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>,
    cog:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>,
    inbox:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>,
    key:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>,
    link:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>,
    shield:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
    logout:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>,
  };
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
};

// ── Componentes base reutilizables ────────────────────────────────

const Badge = ({ children, color, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: RADIUS.full, fontSize: 11, fontWeight: 700,
    color, background: bg, letterSpacing: "0.04em", textTransform: "uppercase",
    flexShrink: 0,
  }}>
    {children}
  </span>
);

const StatCard = ({ icon, label, value, sub, color, bg, C }) => (
  <div style={{
    background: C.bgCard, borderRadius: RADIUS.lg, padding: "1.125rem 1.25rem",
    border: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: RADIUS.md, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon name={icon} size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.textDisabled, marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const ActionItem = ({ icon, label, desc, color, bg, onClick, C }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%",
      background: "none", border: "none", padding: "9px 10px", borderRadius: RADIUS.md,
      cursor: onClick ? "pointer" : "default", opacity: onClick ? 1 : 0.5,
      textAlign: "left", transition: "background 0.15s", fontFamily: "inherit",
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.background = C.navItemHover)}
    onMouseLeave={e => e.currentTarget.style.background = "none"}
  >
    <div style={{
      width: 34, height: 34, borderRadius: RADIUS.sm, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon name={icon} size={16} color={color} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: C.textDisabled, marginTop: 1 }}>{desc}</div>}
    </div>
    {onClick && <Icon name="arrow" size={14} color={C.textDisabled} />}
  </button>
);

const Section = ({ title, icon, color, bg, children, badge, C }) => (
  <div style={{
    background: C.bgCard, borderRadius: RADIUS.lg,
    border: `1px solid ${C.borderSubtle}`, overflow: "hidden",
  }}>
    <div style={{
      padding: "14px 16px", borderBottom: `1px solid ${C.borderSubtle}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: RADIUS.sm, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={15} color={color} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      {/* El badge solo se pinta si hay valor > 0 — nunca se muestra "0 pendientes" */}
      {!!badge && <Badge color={color} bg={bg}>{badge}</Badge>}
    </div>
    <div style={{ padding: "6px 8px 8px" }}>{children}</div>
  </div>
);

const AlertBanner = ({ tipo = "info", children, onClick, C }) => {
  const map = {
    info:    { bg: C.accentSoft,   border: C.accent,   color: C.accentText, icon: "bell"  },
    warning: { bg: C.warningSoft,  border: C.warning,  color: C.warning,    icon: "bell"  },
    success: { bg: C.successSoft,  border: C.success,  color: C.success,    icon: "check" },
    urgente: { bg: C.dangerSoft,   border: C.danger,   color: C.danger,     icon: "flag"  },
  };
  const s = map[tipo] || map.info;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px",
      background: s.bg, borderLeft: `3px solid ${s.border}`,
      borderRadius: RADIUS.md, marginBottom: 8,
    }}>
      <Icon name={s.icon} size={15} color={s.color} />
      <span
        onClick={onClick}
        style={{ fontSize: 13, color: s.color, lineHeight: 1.5, flex: 1, cursor: onClick ? "pointer" : "default" }}
      >
        {children}
      </span>
    </div>
  );
};

const ProgressBar = ({ value, max, color, C }) => (
  <div style={{ height: 6, background: C.borderSubtle, borderRadius: RADIUS.full, overflow: "hidden", marginTop: 6 }}>
    <div style={{
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, height: "100%",
      background: color, borderRadius: RADIUS.full, transition: "width 0.4s ease",
    }} />
  </div>
);

// ── Tokens de color semánticos ──────────────────────────────────
const T = {
  blue:    { color: BRAND.blue400, bg: "rgba(10,102,194,0.12)" },
  teal:    { color: "#2DD4BF",     bg: "rgba(45,212,191,0.12)" },
  green:   { color: BRAND.success, bg: BRAND.successSoft },
  warning: { color: BRAND.warning, bg: BRAND.warningSoft },
  danger:  { color: BRAND.danger,  bg: BRAND.dangerSoft },
  purple:  { color: "#A78BFA",     bg: "rgba(167,139,250,0.12)" },
  slate:   { color: BRAND.gray400, bg: "rgba(154,154,154,0.10)" },
  accent:  { color: BRAND.blue300, bg: "rgba(0,58,143,0.20)" },
};

// ── Notificaciones posicionadas por ruta ──────────────────────────
// Cada notificación real trae (o no) una `ruta_relacionada`. Si la trae,
// aparece EXACTAMENTE en el slot de esa ruta (por eso no hay que adivinar
// dónde ponerla — el dato mismo lo dice). Si no trae ruta (null), es una
// notificación general y aparece en el bloque de arriba del dashboard.
function notificacionPorRuta(notificaciones, ruta) {
  return notificaciones.find((n) => n.ruta_relacionada === ruta) || null;
}

function SlotNotificacion({ ruta, notificaciones, onLeer, navigate, C }) {
  const n = notificacionPorRuta(notificaciones, ruta);
  if (!n) return null;
  return (
    <AlertBanner
      tipo={n.tipo}
      C={C}
      onClick={() => {
        onLeer(n.id);
        if (n.ruta_relacionada) navigate(n.ruta_relacionada);
      }}
    >
      {n.mensaje}
    </AlertBanner>
  );
}

// Slot CALCULADO — no lee la tabla `notificacion`, no tiene "leído": aparece
// solo mientras la condición sea verdadera (ej. resumen.algoPendiente > 0) y
// desaparece sola cuando deja de serlo. Úsalo para cualquier mensaje que sea
// una CONSULTA en vivo, no un evento histórico que haya que recordar.
function SlotNotificacionCalculada({ mostrar, mensaje, ruta, tipo = "info", navigate, C }) {
  if (!mostrar) return null;
  return (
    <AlertBanner tipo={tipo} C={C} onClick={() => navigate(ruta)}>
      {mensaje}
    </AlertBanner>
  );
}



function BloqueAlertasGenerales({ notificaciones, onLeer, navigate, C }) {
  const generales = notificaciones.filter((n) => !n.ruta_relacionada);
  if (generales.length === 0) return null;
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {generales.map((n) => (
        <AlertBanner
          key={n.id}
          tipo={n.tipo}
          C={C}
          onClick={() => onLeer(n.id)}
        >
          {n.mensaje}
        </AlertBanner>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD ALUMNO
// ══════════════════════════════════════════════════════════════════
const DashboardAlumno = ({ C, sesion, resumen, notificaciones, onLeerNotificacion, navigate }) => {
  const stats = [
    { icon: "clock",    label: "Horas acumuladas",    value: resumen.horasAcumuladas ?? 0,       ...T.blue  },
    { icon: "document", label: "Reportes enviados",   value: resumen.reportesEnviados ?? 0,      ...T.teal  },
    { icon: "check",    label: "Actividades activas", value: resumen.actividadesAsignadas ?? 0,  ...T.green },
    { icon: "flag",     label: "Faltas totales",      value: resumen.faltasAcumuladas ?? 0,      ...T.slate },
  ];

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Bienvenido, <span style={{ color: C.accentText }}>{nombreCompletoSesion(sesion)}</span>
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Inicio de servicio social: <strong style={{ color: C.textSecondary }}>{resumen.periodoLabel || "—"}</strong>
          {" · "}Oferta: <em>{resumen.ofertaNombre || "Sin asignar"}</em>
        </p>
      </div>

      <BloqueAlertasGenerales notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {stats.map(s => <StatCard key={s.label} {...s} C={C} />)}
      </div>

      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg, padding: "1rem 1.25rem",
        border: `1px solid ${C.borderSubtle}`, marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Faltas seguidas</span>
          <span style={{ fontSize: 13, color: C.accentText, fontWeight: 700 }}>{resumen.faltasConsecutivas ?? 0} / 5 días</span>
        </div>
        <ProgressBar value={resumen.faltasConsecutivas ?? 0} max={5} color={GRADIENTS.progress} C={C} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.textDisabled }}>Si llegas a 5 días seguidos de falta, te darán de baja el servicio.</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        {/* CU-AH */}
        <Section title="Actividades y Horas" icon="clock" {...T.blue} C={C}>
          <ActionItem icon="plus"   {...T.blue}  label="Registrar bitácora del día"      desc="Sin completar"          onClick={() => navigate("/alumno/bitacora")} C={C} />
          <ActionItem icon="book"   {...T.teal}  label="Consultar actividades asignadas" desc="Actividades activas"    onClick={() => navigate("/alumno/actividades")} C={C} />
          <SlotNotificacion ruta="/alumno/actividades" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="folder" {...T.slate} label="Historial de actividades y bitácoras" desc="Ver todas las actividades completadas" onClick={() => navigate("/alumno/historial")} C={C} />
          <SlotNotificacion ruta="/alumno/historial" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="chart"  {...T.green} label="Horas acumuladas"                desc="Detalle de horas en el servicio social" onClick={() => navigate("/alumno/horas")} C={C} />
        </Section>

        {/* CU-REP */}
        <Section title="Reportes" icon="document" {...T.teal} C={C}>
          <ActionItem icon="plus"   {...T.teal} label="Generar reporte"              desc="Reporte disponible para generar" onClick={() => navigate("/alumno/reportes/generar")} C={C} />
          <ActionItem icon="check"  {...T.blue} label="Consultar estado de reportes" desc="Ver el estado de tus reportes activos" onClick={() => navigate("/alumno/reportes/estatus")} C={C} />
          <SlotNotificacion ruta="/alumno/reportes/estatus" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="folder" {...T.slate} label="Historial de reportes"       desc="Todos los reportes enviados" onClick={() => navigate("/alumno/reportes")} C={C} />
        </Section>

        {/* CU-ADM */}
        <Section title="Administrativa" icon="cog" {...T.purple} C={C}>
          <ActionItem icon="bell"   {...T.warning} label="Anuncios del sistema"        desc="Anuncios nuevos"          onClick={() => navigate("/alumno/anuncios")} C={C} />
          <ActionItem icon="user"   {...T.purple}  label="Contacto del profesor"       desc="Datos de contacto de tu profesor" onClick={() => navigate("/alumno/contacto-profesor")} C={C} />
          <ActionItem icon="pencil" {...T.blue}    label="Actualizar datos personales" desc="Teléfono, correo personal" onClick={() => navigate("/alumno/datos")} C={C} />
          <ActionItem icon="logout" {...T.danger}  label="Baja del servicio"           desc="Proceso irreversible, requiere justificación" onClick={() => navigate("/alumno/solicitar-baja")} C={C} />
          <SlotNotificacion ruta="/alumno/solicitar-baja" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

        {/* CU-LSS */}
        <Section title="Liberación del Servicio Social" icon="star" {...T.warning} C={C}>
          <div style={{ padding: "10px 10px 4px" }}>
            <div style={{
              background: C.bgInput, borderRadius: RADIUS.md, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
              border: `1px dashed ${C.borderDefault}`,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: RADIUS.sm, background: C.bgPage,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="flag" size={17} color={C.textDisabled} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>Proceso no iniciado</div>
                <div style={{ fontSize: 12, color: C.textDisabled }}>Debes cumplir 480 hrs y tener 6 reportes aprobados</div>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textDisabled, marginBottom: 3 }}>
                <span>Requisito de horas</span><span style={{ color: C.accentText, fontWeight: 700 }}>{resumen.horasAcumuladas ?? 0}/480</span>
              </div>
              <ProgressBar value={resumen.horasAcumuladas ?? 0} max={480} color={C.textDisabled} C={C} />
            </div>
          </div>
          <ActionItem icon="arrow"  {...T.slate} label="Ver proceso de liberación" desc="Disponible al cumplir los requisitos" onClick={() => navigate("/alumno/iniciar-proceso-evaluacion")} C={C} />
          <SlotNotificacion ruta="/alumno/iniciar-proceso-evaluacion" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="folder" {...T.slate} label="Documentos del servicio" desc="Ve los documentos históricos del servicio" onClick={() => navigate("/alumnoasignado-documentacion")} C={C} />
          <SlotNotificacion ruta="/alumnoasignado-documentacion" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD PROFESOR
// ══════════════════════════════════════════════════════════════════
const DashboardProfesor = ({ C, sesion, resumen, notificaciones, onLeerNotificacion, navigate }) => {
  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Bienvenido, <span style={{ color: T.teal.color }}>{nombreCompletoSesion(sesion)}</span>
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Departamento de {resumen.departamento || "—"} · Cubículo {resumen.cubiculo || "—"}
        </p>

        {resumen.caracteristicas?.length > 0 && (
  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
    Características: {resumen.caracteristicas.join(", ")}
  </p>
)}

      </div>

      <BloqueAlertasGenerales notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard icon="users"    label="Alumnos asignados"    value={resumen.alumnosAsignados ?? 0} sub={`de ${resumen.cuposTotales ?? 0} cupos`} {...T.teal} C={C} />
        <StatCard icon="folder"   label="Ofertas activas"      value={resumen.ofertasActivas ?? 0} {...T.blue} C={C} />
        {/* Dan 0 hasta que existan CU-REP / CU-AH-04 con su convención de estado */}
        <StatCard icon="document" label="Reportes por revisar"  value={resumen.reportesPorRevisar ?? 0} {...T.danger} C={C} />
        <StatCard icon="inbox"    label="Revisar bitácoras"     value={resumen.bitacorasPorRevisar ?? 0} {...T.warning} C={C} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        {/* CU-AH */}
        <Section title="Actividades y Horas" icon="clock" {...T.teal} C={C} badge={resumen.bitacorasPorRevisar}>
          <ActionItem icon="chart" {...T.teal}  label="Acumulado de horas por alumno"  desc="Ver el progreso detallado de cada alumno" onClick={() => navigate("/profesor/horas")} C={C} />
          <ActionItem icon="chart" {...T.teal}  label="Historial de actividades y bitácoras"  desc="Ver el progreso detallado de cada alumno" onClick={() => navigate("/profesor/historial")} C={C} />  
          <ActionItem icon="plus"  {...T.blue}  label="Asignar actividades por alumno" desc="Crear y asignar nuevas actividades" onClick={() => navigate("/profesor/actividades")} C={C} />
          <ActionItem icon="book"  {...T.green} label="Revisar bitácoras por alumno"   desc="Bitácoras pendientes de revisión" onClick={() => navigate("/profesor/bitacoras")} C={C} />
          <SlotNotificacion ruta="/profesor/bitacoras" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

        {/* CU-GR */}
        <Section title="Registro de Alumnos" icon="users" {...T.blue} C={C} badge={resumen.solicitudesPendientes}>
          <ActionItem icon="check" {...T.blue} label="Aceptar o rechazar solicitudes" desc="Solicitudes pendientes" onClick={() => navigate("/profesor/solicitudes")} C={C} />
          <SlotNotificacionCalculada
            mostrar={(resumen.solicitudesPendientes ?? 0) > 0}
            mensaje="Hay solicitudes de ingreso pendientes de respuesta."
            ruta="/profesor/solicitudes"
            navigate={navigate}
            C={C}
          />
          <ActionItem icon="users" {...T.blue} label="Consultar información de alumnos" desc="Datos y cantidad" onClick={() => navigate("/profesor/mis-alumnos")} C={C} />
        </Section>

        {/* CU-REP */}
        <Section title="Reportes" icon="document" {...T.danger} C={C} badge={resumen.reportesPorRevisar}>
          <ActionItem icon="pencil" {...T.danger} label="Revisar y firmar reporte" desc="Reportes esperan tu revisión y firma" onClick={() => navigate("/profesor/reportes")} C={C} />
          <SlotNotificacion ruta="/profesor/reportes" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

        {/* CU-PRO */}
        <Section title="Gestión de Ofertas" icon="folder" {...T.purple} C={C}>
          <ActionItem icon="plus"   {...T.purple} label="Solicitar apertura de oferta" desc="Nueva oferta de proyecto o individual" onClick={() => navigate("/profesor/proyectos/registrar")} C={C} />
          <SlotNotificacion ruta="/profesor/proyectos/registrar" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="folder" {...T.slate}  label="Historial de ofertas"         desc="Consultar ofertas anteriores y activas" onClick={() => navigate("/profesor/proyectos")} C={C} />
        </Section>

        {/* CU-ADM */}
        <Section title="Administrativa" icon="cog" {...T.slate} C={C}>
          <ActionItem icon="pencil" {...T.blue}    label="Actualizar datos personales"    desc="Teléfono, cubículo, departamento" onClick={() => navigate("/profesor/datos-personales")} C={C} />
          <ActionItem icon="bell"   {...T.warning} label="Publicar anuncio a mis alumnos" desc="Notificar a todos o a un alumno específico" onClick={() => navigate("/profesor/anuncios")} C={C} />
          <ActionItem icon="logout" {...T.danger}  label="Solicitar baja de alumno"       desc="Requiere justificación documentada" onClick={() => navigate("/profesor/solicitar-baja-alumno")} C={C} />
          <SlotNotificacion ruta="/profesor/solicitar-baja-alumno" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="pencil" {...T.blue}  label="Solicitar modificación en características de profesor" desc="Requiere justificación" onClick={() => navigate("/profesor/solicitar-modificacion")} C={C} />
          <SlotNotificacion ruta="/profesor/solicitar-modificacion" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

        {/* CU-LSS */}
        <Section title="Liberación del Servicio Social" icon="star" {...T.warning} C={C} badge={resumen.evaluacionesPendientes}>
          <ActionItem icon="star" {...T.warning} label="Evaluar desempeño de alumno" desc="Evaluación pendiente de completar" onClick={() => navigate("/profesor/evaluar-alumno")} C={C} />
          <SlotNotificacion ruta="/profesor/evaluar-alumno" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD COORDINACIÓN
// ══════════════════════════════════════════════════════════════════
const DashboardCoordinacion = ({ C, sesion, resumen, notificaciones, onLeerNotificacion, navigate }) => {
  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Panel de <span style={{ color: T.purple.color }}>Coordinación</span>
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          {nombreCompletoSesion(sesion)} · Periodo activo: <strong style={{ color: C.textSecondary }}>{resumen.periodoLabel || "—"}</strong>
          {" · "}{resumen.alumnosRegistrados ?? 0} alumnos registrados
        </p>
      </div>

      <BloqueAlertasGenerales notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Alumnos con horas completas",      value: resumen.alumnosConHorasCompletas ?? 0,   total: resumen.alumnosRegistrados ?? 0, ...T.green },
          { label: "Alumnos en proceso de liberación",  value: resumen.alumnosEnProcesoLiberacion ?? 0, total: resumen.alumnosRegistrados ?? 0, ...T.purple },
          // Sin convención de estado_reporte todavía (CU-REP) — el total
          // aquí es una referencia aproximada, no un objetivo real.
          { label: "Reportes aprobados este mes",       value: resumen.reportesAprobadosMes ?? 0,       total: resumen.alumnosRegistrados ?? 0, ...T.teal },
        ].map(m => (
          <div key={m.label} style={{
            background: C.bgCard, borderRadius: RADIUS.lg, padding: "14px 16px",
            border: `1px solid ${C.borderSubtle}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, color: C.textMuted, maxWidth: 140, lineHeight: 1.4 }}>{m.label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</span>
            </div>
            <ProgressBar value={m.value} max={m.total || 1} color={m.color} C={C} />
            <div style={{ fontSize: 11, color: C.textDisabled, marginTop: 4 }}>de {m.total} alumnos</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        {/* CU-AH */}
        <Section title="Actividades y Horas" icon="clock" {...T.teal} C={C}>
          <ActionItem icon="chart" {...T.teal} label="Acumulado de horas por alumno"    desc="Ver progreso general del grupo" onClick={() => navigate("/coordinacion/horas")} C={C} />
          {/* RUTA_PENDIENTE */}
          <ActionItem icon="book" {...T.blue} label="Consultar actividades por alumno" desc="Revisar actividades asignadas" onClick={() => navigate("/coordinacion/historial")} C={C} />
        </Section>

        {/* CU-GR */}
          <Section title="Registro de Alumnos" icon="users" {...T.blue} C={C} badge={(resumen.solicitudesRegistroPendientes ?? 0) + (resumen.expedientesPendientes ?? 0)}>
          <ActionItem icon="document" {...T.blue}   label="Revisar documentación inicial"  desc="Solicitudes pendientes" onClick={() => navigate("/coordinacion/documentacion")} C={C} />
          <SlotNotificacionCalculada
            mostrar={(resumen.solicitudesRegistroPendientes ?? 0) > 0}
            mensaje="Tienes revisiones pendientes de documentación inicial."
            ruta="/coordinacion/documentacion"
            navigate={navigate}
            C={C}
          />
          <ActionItem icon="check"    {...T.green}  label="Validar carta compromiso"       desc="Confirma cuando el alumno la entregue" onClick={() => navigate("/coordinacion/carta-presencial")} C={C} />
          <ActionItem icon="folder"   {...T.purple} label="Revisar expediente de registro" desc="Solicitudes pendientes" onClick={() => navigate("/coordinacion/expedientes")} C={C} />
          <SlotNotificacionCalculada
            mostrar={(resumen.expedientesPendientes ?? 0) > 0}
            mensaje="Tienes expedientes pendientes de revisión."
            ruta="/coordinacion/expedientes"
            navigate={navigate}
            C={C}
          />
          <ActionItem icon="folder"   {...T.purple} label="Envío de carta compromiso firmada" desc="Solicitudes pendientes" onClick={() => navigate("/cartacompromisofirmada")} C={C} />
        </Section>

        {/* CU-REP */} {/* RUTA_PENDIENTE_SOL */}
        <Section title="Reportes" icon="document" {...T.teal} C={C} badge={resumen.reportesPorRevisar}>
          <ActionItem icon="pencil"   {...T.danger} label="Dictaminar reportes e historial"   desc="Reportes esperan dictamen" onClick={() => navigate("/coordinacion/reportes")} C={C} />
          <SlotNotificacion ruta="/coordinacion/reportes" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
        </Section>

        {/* CU-PRO */}
        <Section title="Gestión de Ofertas" icon="star" {...T.warning} C={C} badge={resumen.ofertasPorValidar}>
          <ActionItem icon="check"  {...T.warning} label="Solicitudes de ofertas e historial"        desc="Solicitudes de profesores" onClick={() => navigate("/coordinacion/ofertas")} C={C} />
          <SlotNotificacion ruta="/coordinacion/ofertas" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="cog"    {...T.purple}  label="Modificar características de profesor" desc="Solicitudes pendientes" onClick={() => navigate("/coordinacion/solicitudes-caracteristicas")} C={C} />
          <SlotNotificacion ruta="/coordinacion/solicitudes-caracteristicas" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          
        </Section>

        {/* CU-ADM */}
        <Section title="Administrativa" icon="cog" {...T.slate} C={C}>
          <ActionItem icon="calendar" {...T.blue}    label="Gestionar calendario escolar" desc="Periodos, días inhábiles, vacaciones" onClick={() => navigate("/coordinacion/calendario")} C={C} />
          <ActionItem icon="bell"     {...T.warning} label="Publicar anuncio"             desc="Para todos los alumnos o por profesor" onClick={() => navigate("/coordinacion/admin/anuncios")} C={C} />
          <ActionItem icon="link"     {...T.teal}    label="Gestionar medios de contacto" desc="Información institucional visible" onClick={() => navigate("/coordinacion/contacto-institucional")} C={C} />
          <ActionItem icon="key"      {...T.purple}  label="Gestionar recursos del SS"    desc="Documentos y guías del servicio" onClick={() => navigate("/coordinacion/admin/recursos")} C={C} />
          <ActionItem icon="flag"     {...T.danger}  label="Solicitudes de baja"          desc="Gestionar solicitudes de baja" onClick={() => navigate("/coordinacion/gestionar-bajas")} C={C} />
          <SlotNotificacion ruta="/coordinacion/gestionar-bajas" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="users" {...T.blue} label="Consultar información de alumnos por profesor" desc="Datos y cantidad" onClick={() => navigate("/coordinacion/usuarios-asignados")} C={C} />
          {/* RUTA_PENDIENTE Ruta suelta, sin prefijo /coordinacion/ — confirmar */}
          <ActionItem icon="flag" {...T.danger} label="Gestión de faltas alumnos" desc="Pendientes" onClick={() => navigate("/gestion-faltas")} C={C} />
          <SlotNotificacion ruta="/gestion-faltas" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="users" {...T.blue} label="Crear o editar usuarios" desc="Profesor o Coordinador" onClick={() => navigate("/crear-usuario")} C={C} />
        </Section>

        {/* CU-LSS */}
        <Section title="Liberación del Servicio Social" icon="flag" {...T.purple} C={C}>
          <ActionItem icon="star"     {...T.warning} label="Dictaminar evaluación de desempeño" desc="Evaluación pendiente de dictamen" onClick={() => navigate("/coordinacion/revisar-evaluacion-alumno")} C={C} />
          <SlotNotificacion ruta="/coordinacion/revisar-evaluacion-alumno" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="document" {...T.blue}    label="Gestionar carta de término"         desc="Carta lista para entregar" onClick={() => navigate("/coordinacion/estado-carta-termino")} C={C} />
          <ActionItem icon="folder"   {...T.teal}    label="Dictaminar expediente"              desc="Expediente en revisión" onClick={() => navigate("/coordinacion/evaluacion-expediente")} C={C} />
          <SlotNotificacion ruta="/coordinacion/evaluacion-expediente" notificaciones={notificaciones} onLeer={onLeerNotificacion} navigate={navigate} C={C} />
          <ActionItem icon="check"    {...T.green}   label="Gestionar constancia de término"    desc="Constancia pendiente de emisión" onClick={() => navigate("/coordinacion/gestion-constancia-termino")} C={C} />
          <ActionItem icon="folder" {...T.slate}  label="Documentos del servicio" desc="Ve los documentos históricos del servicio" onClick={() => navigate("/coordinación-alumnoasignado-documentacion")} C={C} />
        </Section>

      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ — sin selector: renderiza SOLO el dashboard del rol
// real de la sesión.
// ══════════════════════════════════════════════════════════════════

const ROL_CONFIG = {
  alumno_asignado: { titulo: "Mi Dashboard",           subtitulo: "Inicio" },
  profesor:        { titulo: "Panel del Profesor",     subtitulo: "Inicio" },
  coordinador:      { titulo: "Panel de Coordinación",  subtitulo: "Inicio" },
};

export default function Dashboards() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { usuario: sesion } = useSesion();

  const [resumen, setResumen] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Carga única al montar — esta sí debe mostrar "Cargando…".
  useEffect(() => {
    async function cargarInicial() {
      setCargando(true);
      try {
        const [resumenData, notiData] = await Promise.all([
          obtenerResumenDashboard(),
          listarNotificacionesPendientes(),
        ]);
        setResumen(resumenData);
        setNotificaciones(notiData);
      } catch (err) {
        console.error('Error al cargar el dashboard:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarInicial();
  }, []); // ver nota sobre el loop de useSesion()

  // Polling de 120s — refresca resumen Y notificaciones (badges, mensajes
  // calculados de SlotNotificacionCalculada, y el modal de bienvenida).
  // NUNCA toca `cargando`: no debe ocultar el dashboard ya pintado.
  useEffect(() => {
    async function refrescar() {
      try {
        const [resumenData, notiData] = await Promise.all([
          obtenerResumenDashboard(),
          listarNotificacionesPendientes(),
        ]);
        setResumen(resumenData);
        setNotificaciones(notiData);
      } catch (err) {
        console.error('Error al refrescar el dashboard:', err);
      }
    }
    const intervalo = setInterval(refrescar, 120000);
    return () => clearInterval(intervalo);
  }, []);

  async function handleLeerNotificacion(id) {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await marcarNotificacionLeida(id);
    } catch (err) {
      console.error('No se pudo marcar la notificación como leída:', err);
    }
  }

  if (!sesion) return null;

  const rol = sesion.rol;

  if (rol === "alumno_sin_asignar") {
    return (
      <DashboardLayout titulo="Tu proceso de inscripción" subtitulo="Servicio Social" rol={rol} usuario={nombreCompletoSesion(sesion)}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`,
          padding: "2rem", textAlign: "center",
        }}>
          <p style={{ color: C.textMuted, fontSize: 14 }}>
            Tu proceso de inscripción al servicio social todavía está en curso.
            Esta pantalla se completará junto con el módulo de registro (CU-GR).
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const cfg = ROL_CONFIG[rol];
  if (!cfg) {
    return (
      <DashboardLayout titulo="Dashboard" subtitulo="" rol={rol} usuario={nombreCompletoSesion(sesion)}>
        <p style={{ color: C.textMuted }}>Rol no reconocido: {rol}</p>
      </DashboardLayout>
    );
  }
  
  const notifBienvenida = notificaciones.find((n) => n.ruta_relacionada === "MODAL_BIENVENIDA_ALUMNO_ASIGNADO");

  return (
    <DashboardLayout titulo={cfg.titulo} subtitulo={cfg.subtitulo} rol={rol} usuario={nombreCompletoSesion(sesion)}>
      {notifBienvenida && (
        <ModalBienvenidaAlumnoAsignado
          mensaje={notifBienvenida.mensaje}
          onConfirmado={() => window.location.reload()}
        />
      )}
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>


        {cargando ? (
          <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "2rem" }}>Cargando…</p>
        ) : (
          <>
            {rol === "alumno_asignado" && (
              <DashboardAlumno C={C} sesion={sesion} resumen={resumen} notificaciones={notificaciones} onLeerNotificacion={handleLeerNotificacion} navigate={navigate} />
            )}
            {rol === "profesor" && (
              <DashboardProfesor C={C} sesion={sesion} resumen={resumen} notificaciones={notificaciones} onLeerNotificacion={handleLeerNotificacion} navigate={navigate} />
            )}
            {rol === "coordinador" && (
              <DashboardCoordinacion C={C} sesion={sesion} resumen={resumen} notificaciones={notificaciones} onLeerNotificacion={handleLeerNotificacion} navigate={navigate} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}