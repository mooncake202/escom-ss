import { useState } from "react";
import { useTheme, GRADIENTS, RADIUS, BRAND } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// ── Iconos SVG inline ─────────────────────────────────────────────
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
    style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%",
      background: "none", border: "none", padding: "9px 10px", borderRadius: RADIUS.md,
      cursor: "pointer", textAlign: "left", transition: "background 0.15s", fontFamily: "inherit",
    }}
    onMouseEnter={e => e.currentTarget.style.background = C.navItemHover}
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
    <Icon name="arrow" size={14} color={C.textDisabled} />
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
      {badge && <Badge color={color} bg={bg}>{badge}</Badge>}
    </div>
    <div style={{ padding: "6px 8px 8px" }}>{children}</div>
  </div>
);

const AlertBanner = ({ type = "info", children, C }) => {
  const map = {
    info:    { bg: C.accentSoft,   border: C.accent,   color: C.accentText, icon: "bell"  },
    warning: { bg: C.warningSoft,  border: C.warning,  color: C.warning,    icon: "bell"  },
    success: { bg: C.successSoft,  border: C.success,  color: C.success,    icon: "check" },
    urgente:   { bg: C.dangerSoft,   border: C.danger,   color: C.danger,     icon: "flag"  },
    error:   { bg: C.dangerSoft,   border: C.danger,   color: C.danger,     icon: "flag"  },

  };
  const s = map[type];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px",
      background: s.bg, borderLeft: `3px solid ${s.border}`,
      borderRadius: RADIUS.md, marginBottom: 8,
    }}>
      <Icon name={s.icon} size={15} color={s.color} />
      <span style={{ fontSize: 13, color: s.color, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
};

const ProgressBar = ({ value, max, color, C }) => (
  <div style={{ height: 6, background: C.borderSubtle, borderRadius: RADIUS.full, overflow: "hidden", marginTop: 6 }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`, height: "100%",
      background: color, borderRadius: RADIUS.full, transition: "width 0.4s ease",
    }} />
  </div>
);

// ── Tokens de color semánticos para cada rol ──────────────────────
// Usamos exclusivamente los tokens del sistema ESCOM
const T = {
  blue:       { color: BRAND.blue400,  bg: "rgba(10,102,194,0.12)"  },
  teal:       { color: "#2DD4BF",      bg: "rgba(45,212,191,0.12)"  },
  green:      { color: BRAND.success,  bg: BRAND.successSoft         },
  warning:    { color: BRAND.warning,  bg: BRAND.warningSoft         },
  danger:     { color: BRAND.danger,   bg: BRAND.dangerSoft          },
  purple:     { color: "#A78BFA",      bg: "rgba(167,139,250,0.12)" },
  slate:      { color: BRAND.gray400,  bg: "rgba(154,154,154,0.10)" },
  accent:     { color: BRAND.blue300,  bg: "rgba(0,58,143,0.20)"    },
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD ALUMNO
// ══════════════════════════════════════════════════════════════════
const DashboardAlumno = ({ C }) => {
  const stats = [
    { icon: "clock",    label: "Horas acumuladas",    value: "312", sub: "",      ...T.blue    },
    { icon: "document", label: "Reportes enviados",   value: "4",   sub: "",        ...T.teal    },
    { icon: "check",    label: "Actividades activas", value: "6",   sub: "1 con entrega hoy",   ...T.green   },
    { icon: "flag",     label: "Faltas totales", value: "5",   sub: "Max. 18",          ...T.slate   },
  ];

  return (
    <>
      {/* Encabezado */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Bienvenido, <span style={{ color: C.accentText }}>María González</span> 
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Inicio de servicio social: <strong style={{ color: C.textSecondary }}>2025-2</strong> · Oferta: <em>Desarrollo de software para biblioteca ESCOM</em>
        </p>
      </div>

      {/* Alertas */}
      <div style={{ marginBottom: "1.25rem" }}>
        <AlertBanner type="urgente" C={C}>Se te bloqueó el registro de bitácoras hasta que generes y envíes tu reporte del mes de <strong>abril</strong>. Creálo ahora para poder realizar bitácora del día.</AlertBanner>
        <AlertBanner type="warning" C={C}>Tienes un reporte mensual con fecha límite el <strong>15 de abril</strong>. Genera y firma antes de la fecha.</AlertBanner>

        <AlertBanner type="urgente" C={C}>Falta tu bitácora del día.</AlertBanner>

        <AlertBanner type="info" C={C}>Hay un anuncio nuevo.</AlertBanner>






      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {stats.map(s => <StatCard key={s.label} {...s} C={C} />)}
      </div>

      {/* Progreso de faltas */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg, padding: "1rem 1.25rem",
        border: `1px solid ${C.borderSubtle}`, marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Faltas seguidas</span>
          <span style={{ fontSize: 13, color: C.accentText, fontWeight: 700 }}>3 / 5 días</span>
        </div>
        <ProgressBar value={3} max={5} color={GRADIENTS.progress} C={C} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.textDisabled }}>Si llegas a 5 días seguidos de falta, te darán de baja el servicio.</span>
          
        </div>
      </div>

      {/* Grid de secciones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        <Section title="Actividades y Horas" icon="clock" {...T.blue} C={C}>
          <ActionItem icon="plus"   {...T.blue}    label="Registrar bitácora del día"       desc="Sin completar" C={C} />
          <ActionItem icon="book"   {...T.teal}    label="Consultar actividades asignadas"  desc="6 actividades activas" C={C} />
        <AlertBanner type="info" C={C}>Te asignaron una nueva actividad.</AlertBanner>

          <ActionItem icon="folder" {...T.slate}   label="Historial de actividades y bitácoras"         desc="Ver todas las actividades completadas" C={C} />
        <AlertBanner type="info" C={C}>Te revisaron una bitácora.</AlertBanner>


          <ActionItem icon="chart"  {...T.green}   label="Horas acumuladas"                 desc="Detalle de horas en el servicio social" C={C} />
        </Section>

        <Section title="Reportes" icon="document" {...T.teal} C={C}>
          <ActionItem icon="plus"   {...T.teal}    label="Generar reporte "          desc="Reporte #5 disponible para generar" C={C} />
          <ActionItem icon="check"  {...T.blue}    label="Consultar estado de reportes"     desc="Ver el estado de tus reportes activos" C={C} />
        <AlertBanner type="info" C={C}>Tienes una actualización en el estado de tu reporte.</AlertBanner>

          <ActionItem icon="folder" {...T.slate}   label="Historial de reportes"            desc="Todos los reportes enviados" C={C} />
        </Section>

        <Section title="Administrativa" icon="cog" {...T.purple} C={C}>
          <ActionItem icon="bell"   {...T.warning} label="Anuncios del sistema"             desc="3 anuncios nuevos sin leer" C={C} />
          <ActionItem icon="user"   {...T.purple}  label="Contacto del profesor"            desc="Dr. Alejandro Méndez · ext. 52340" C={C} />
          <ActionItem icon="pencil" {...T.blue}    label="Actualizar datos personales"      desc="Teléfono, correo personal" C={C} />
          <ActionItem icon="logout" {...T.danger}  label="Baja del servicio"      desc="Proceso irreversible, requiere justificación" C={C} />
        <AlertBanner type="info" C={C}>Tienes una actualización en el estado de la solicitud de baja del servicio social.</AlertBanner>


        </Section>

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
                <span>Requisito de horas</span><span style={{ color: C.accentText, fontWeight: 700 }}>312/480</span>
              </div>
              <ProgressBar value={312} max={480} color={C.textDisabled} C={C} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textDisabled, marginBottom: 3 }}>
                <span>Reportes aprobados</span><span style={{ color: C.accentText, fontWeight: 700 }}>4/6</span>
              </div>
              <ProgressBar value={4} max={6} color={C.textDisabled} C={C} />
            </div>
          </div>
          <ActionItem icon="arrow" {...T.slate} label="Ver proceso de liberación" desc="Disponible al cumplir los requisitos" C={C} />
        <AlertBanner type="info" C={C}>Hay una actualización en tu proceso de liberación del servicio social.</AlertBanner>
          <ActionItem icon="folder" {...T.slate}  label="Documentos del servicio"      desc="Ve los documentos históricos del servicio" C={C} />
        <AlertBanner type="info" C={C}>Te enviaron tu carta compromiso firmada.</AlertBanner>


        </Section>

      </div>

      {/* Anuncios recientes */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`, padding: "1rem 1.25rem", marginTop: "0.875rem",
      }}>
        <p style={{ margin: "0 0 0.875rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Anuncios recientes</p>
        {[
          { from: "Dr. Alejandro Méndez", text: "Recuerden que la sesión de seguimiento es el viernes a las 10:00 AM en el cubículo B-203.", time: "Hace 2 horas", isNew: true },
          { from: "Coordinación SS",      text: "El periodo de entrega de reportes mensuales cierra el 15 de abril. No olviden firmar sus documentos.", time: "Ayer", isNew: true },
          { from: "Dr. Alejandro Méndez", text: "Actividades del mes de abril han sido actualizadas. Revisen las fechas límite.", time: "Hace 3 días", isNew: false },
        ].map((a, i, arr) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "10px 0",
            borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: GRADIENTS.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="user" size={15} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{a.from}</span>
                {a.isNew && <Badge {...T.blue}>Nuevo</Badge>}
                <span style={{ fontSize: 11, color: C.textDisabled, marginLeft: "auto" }}>{a.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD PROFESOR
// ══════════════════════════════════════════════════════════════════
const DashboardProfesor = ({ C }) => {
  

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Bienvenido, <span style={{ color: T.teal.color }}>Dr. Alejandro Méndez</span>
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Departamento de Computación · Cubículo B-203 · Periodo <strong style={{ color: C.textSecondary }}>2025-2</strong>
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Características: Investigador, jefe de club 
        </p>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <AlertBanner type="urgente" C={C}>Actividades de alumnos proximas a caducar. Asignales más.</AlertBanner>
        <AlertBanner type="urgente" C={C}>Un alumno acabó sus asignaciones. Asingale más</AlertBanner>

        
        





      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard icon="users"    label="Alumnos asignados"      value="5"  sub="de 6"           {...T.teal}    C={C} />
        <StatCard icon="folder"   label="Ofertas activas"         value="2"  sub="1 proyecto, 1 individual" {...T.blue}    C={C} />
        <StatCard icon="document" label="Reportes por revisar"    value="2"  sub="Con fecha límite hoy"     {...T.danger}  C={C} />

        <StatCard icon="inbox"    label="Revisar bitácoras"  value="3"  sub="Sin responder"            {...T.warning} C={C} />
      </div>

      {/* Tabla alumnos */}
      
      {/* Grid secciones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        <Section title="Actividades y Horas" icon="clock" {...T.teal} C={C} badge={"2 pendientes"}>
          <ActionItem icon="chart"  {...T.teal}    label="Acumulado de horas por alumno"  desc="Ver el progreso detallado de cada alumno" C={C} />
          <ActionItem icon="plus"   {...T.blue}    label="Asignar actividades por alumno"  desc="Crear y asignar nuevas actividades" C={C} />
          <ActionItem icon="book"   {...T.green}   label="Revisar bitácoras por alumno"   desc="2 bitácoras pendientes de revisión" C={C} />
        <AlertBanner type="urgente" C={C}>Hay bitácoras pendientes de tu revisión.</AlertBanner>

        </Section>

        <Section title="Registro de Alumnos" icon="users" {...T.blue} C={C} badge="3 pendientes">
          
          <ActionItem icon="check"  {...T.blue}    label="Aceptar o rechazar solicitudes"  desc="3 solicitudes pendientes" C={C} />
        <AlertBanner type="urgente" C={C}>Hay solicitudes de ingreso pendiente de respuesta.</AlertBanner>

        </Section>

        <Section title="Reportes" icon="document" {...T.danger} C={C} badge="2 por revisar">
          <ActionItem icon="pencil" {...T.danger}  label="Revisar y firmar reporte"       desc="2 reportes esperan tu revisión y firma" C={C} />
        <AlertBanner type="urgente" C={C}>Hay reportes que pendientes de revisión y firma.</AlertBanner>

        </Section>

        <Section title="Gestión de Ofertas" icon="folder" {...T.purple} C={C}>
          <ActionItem icon="plus"   {...T.purple}  label="Solicitar apertura de oferta"   desc="Nueva oferta de proyecto o individual" C={C} />
        <AlertBanner type="info" C={C}>Tienes actualizaciones en tu soliciud de ofertas.</AlertBanner>

          <ActionItem icon="folder" {...T.slate}   label="Historial de ofertas"           desc="Consultar ofertas anteriores y activas" C={C} />
        </Section>

        <Section title="Administrativa" icon="cog" {...T.slate} C={C}>
          <ActionItem icon="pencil" {...T.blue}    label="Actualizar datos personales"    desc="Teléfono, cubículo, departamento" C={C} />
          <ActionItem icon="bell"   {...T.warning} label="Publicar anuncio a mis alumnos" desc="Notificar a todos o a un alumno específico" C={C} />
          <ActionItem icon="logout" {...T.danger}  label="Solicitar baja de alumno"       desc="Requiere justificación documentada" C={C} />
        <AlertBanner type="info" C={C}>Tienes actualizaciones en tu solicitud de dar de baja a alumno.</AlertBanner>

          <ActionItem icon="pencil" {...T.blue}  label="Solicitar modificación en características de profesor"       desc="Requiere justificación" C={C} />
        <AlertBanner type="info" C={C}>Tienes actualizaciones en tu solicitud de modificacion de rol de profesor.</AlertBanner>


        </Section>

        <Section title="Liberación del Servicio Social" icon="star" {...T.warning} C={C} badge="1 pendiente">
          
          <ActionItem icon="star"   {...T.warning} label="Evaluar desempeño de alumno"   desc="1 evaluación pendiente de completar" C={C} />
        <AlertBanner type="urgente" C={C}>Hay evaluaciones de desempeño pendientes.</AlertBanner>

        </Section>

      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD COORDINACIÓN
// ══════════════════════════════════════════════════════════════════
const DashboardCoordinacion = ({ C }) => {
  const pendientes = [
    { label: "Solicitudes de registro", value: 8,  icon: "inbox",    ...T.blue    },
    { label: "Expedientes LSS",         value: 3,  icon: "folder",   ...T.purple  },
    { label: "Reportes por revisar",    value: 11, icon: "document", ...T.teal    },
    { label: "Ofertas por validar",     value: 2,  icon: "star",     ...T.warning },
  ];

  const lssItems = [
    { alumno: "Luis Hernández",  etapa: "Evaluación de desempeño", estado: "Pendiente dictamen",  ...T.warning },
    { alumno: "Andrea Martínez", etapa: "Carta de término",        estado: "Lista para entregar", ...T.green   },
    { alumno: "Pedro Sánchez",   etapa: "Expediente",              estado: "En revisión",         ...T.blue    },
    { alumno: "Diana López",     etapa: "Constancia de término",   estado: "Pendiente emisión",   ...T.purple  },
  ];

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Panel de <span style={{ color: T.purple.color }}>Coordinación</span>
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Lic. Carmen Torres · Periodo activo: <strong style={{ color: C.textSecondary }}>2025-2</strong> · 47 alumnos registrados
        </p>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <AlertBanner type="error" C={C}>8 solicitudes de alumnos llevan más de 3 días sin respuesta.</AlertBanner>
        <AlertBanner type="warning" C={C}>El periodo de registro cierra en <strong>10 días</strong>. Hay documentación de registro pendiente de validar.</AlertBanner>
      </div>

      

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Alumnos con horas completas",        value: "12", total: 47, ...T.green  },
          { label: "Alumnos en proceso de liberación",   value: "4",  total: 47, ...T.purple },
          { label: "Reportes aprobados este mes",        value: "23", total: 30, ...T.teal   },
        ].map(m => (
          <div key={m.label} style={{
            background: C.bgCard, borderRadius: RADIUS.lg, padding: "14px 16px",
            border: `1px solid ${C.borderSubtle}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, color: C.textMuted, maxWidth: 140, lineHeight: 1.4 }}>{m.label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</span>
            </div>
            <ProgressBar value={parseInt(m.value)} max={m.total} color={m.color} C={C} />
            <div style={{ fontSize: 11, color: C.textDisabled, marginTop: 4 }}>de {m.total} alumnos</div>
          </div>
        ))}
      </div>

     

      {/* Grid secciones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>

        <Section title="Actividades y Horas" icon="clock" {...T.teal} C={C}>
          <ActionItem icon="chart"    {...T.teal}    label="Acumulado de horas por alumno"     desc="Ver progreso general del grupo" C={C} />
          <ActionItem icon="book"     {...T.blue}    label="Consultar actividades por alumno"  desc="Revisar actividades asignadas" C={C} />
        </Section>

        <Section title="Registro de Alumnos" icon="users" {...T.blue} C={C} >
          <ActionItem icon="document" {...T.blue}    label="Revisar documentación inicial"     desc="8 solicitudes" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes revisiones pendientes de documentacion inicial.</AlertBanner>
          <ActionItem icon="check"    {...T.green}   label="Validar carta compromiso"          desc="Confirma  cuando el alumno la entregue" C={C} />
          <ActionItem icon="folder"   {...T.purple}  label="Revisar expediente de registro"    desc="5 solicitudes" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes revisiones pendientes de expediente de registro.</AlertBanner>

          <ActionItem icon="folder"   {...T.purple}  label="Envío de carta compromiso firmada"    desc="3 solicitudes" C={C} />

        </Section>

        <Section title="Reportes" icon="document" {...T.teal} C={C} badge="11 pendientes">
          <ActionItem icon="chart"    {...T.teal}    label="Estado de reportes"                desc="Vista general por alumno y periodo" C={C} />
          <ActionItem icon="folder"   {...T.slate}   label="Historial de reportes enviados"    desc="Todos los reportes del periodo" C={C} />
          <ActionItem icon="pencil"   {...T.danger}  label="Revisar y dictaminar reporte"      desc="11 reportes esperan dictamen" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes revisiones pendientes de reportes.</AlertBanner>

        </Section>

        <Section title="Gestión de Ofertas" icon="star" {...T.warning} C={C} badge="2 solicitudes">
          <ActionItem icon="check"    {...T.warning} label="Revisar solicitudes de apertura"   desc="2 solicitudes de profesores" C={C} />
          <AlertBanner type="warning" C={C}>Tienes solicitudes pendientes de apertura.</AlertBanner>

          <ActionItem icon="cog"      {...T.purple}  label="Modificar características de profesor" desc="3 solicitudes" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes solicitudes de modificación de roles pendientes.</AlertBanner>

          <ActionItem icon="folder"   {...T.blue}    label="Consultar proyectos registrados"   desc="Catálogo completo de ofertas" C={C} />
        </Section>

        <Section title="Administrativa" icon="cog" {...T.slate} C={C} badge={"1 solicitud"}>
          <ActionItem icon="calendar" {...T.blue}    label="Gestionar calendario escolar"      desc="Periodos, días inhábiles, vacaciones" C={C} />
          <ActionItem icon="bell"     {...T.warning} label="Publicar anuncio"                  desc="Para todos los alumnos o por profesor" C={C} />
          <ActionItem icon="link"     {...T.teal}    label="Gestionar medios de contacto"      desc="Información institucional visible" C={C} />
          <ActionItem icon="key"      {...T.purple}  label="Gestionar recursos del SS"         desc="Documentos y guías del servicio" C={C} />
          <ActionItem icon="flag"      {...T.danger}  label="Solicitudes de baja"         desc="Gestionar solicitudes de baja" C={C} />
          <AlertBanner type="warning" C={C}>Tienes solicitudes pendientes de baja.</AlertBanner>


        </Section>

        <Section title="Liberación del Servicio Social" icon="flag" {...T.purple} C={C} >
          <ActionItem icon="star"     {...T.warning} label="Dictaminar evaluación de desempeño" desc="1 evaluación pendiente de dictamen" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes revisiones pendientes de evaluación de desempeño.</AlertBanner>

          <ActionItem icon="document" {...T.blue}    label="Gestionar carta de término"         desc="1 carta lista para entregar" C={C} />
          <ActionItem icon="folder"   {...T.teal}    label="Dictaminar expediente"              desc="1 expediente en revisión" C={C} />
          <AlertBanner type="urgente" C={C}>Tienes revisiones pendientes de expediente de término.</AlertBanner>

          <ActionItem icon="check"    {...T.green}   label="Gestionar constancia de término"    desc="1 constancia pendiente de emisión" C={C} />
          <ActionItem icon="folder" {...T.slate}  label="Documentos del servicio"      desc="Ve los documentos históricos del servicio" C={C} />

        </Section>

      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ — selecciona rol y envuelve en DashboardLayout
// ══════════════════════════════════════════════════════════════════

const ROL_CONFIG = {
  alumno:       { titulo: "Mi Dashboard",              subtitulo: "Inicio",             usuario: "García López Juan Carlos" },
  profesor:     { titulo: "Panel del Profesor",         subtitulo: "Inicio",             usuario: "Dr. Alejandro Méndez"     },
  coordinacion: { titulo: "Panel de Coordinación",      subtitulo: "Inicio",             usuario: "Lic. Carmen Torres"       },
};

export default function Dashboards() {
  const { C } = useTheme();
  const [rol, setRol] = useState("alumno");
  const cfg = ROL_CONFIG[rol];

  return (
    <DashboardLayout titulo={cfg.titulo} subtitulo={cfg.subtitulo} rol={rol} usuario={cfg.usuario}>

      <div style={{
        maxWidth: "800px",   // ← controla el ancho máximo
        margin: "0 auto",     // ← centra horizontalmente
        width: "100%",
      }}>

        {/* Selector de rol */}
        <div style={{
          display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
          padding: "10px 14px", background: C.bgCard,
          borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`,
          alignItems: "center",
        }}></div>

      {/* Selector de rol — solo para demo / desarrollo */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
        padding: "10px 14px", background: C.bgCard,
        borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`,
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: C.textDisabled, fontWeight: 600, marginRight: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Vista:
        </span>
        {["alumno", "profesor", "coordinacion"].map(r => (
          <button
            key={r}
            onClick={() => setRol(r)}
            style={{
              padding: "5px 14px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: rol === r ? C.accent : C.bgInput,
              border: `1px solid ${rol === r ? C.accent : C.borderDefault}`,
              color: rol === r ? "#fff" : C.textMuted,
              textTransform: "capitalize",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {rol === "alumno"       && <DashboardAlumno       C={C} />}
      {rol === "profesor"     && <DashboardProfesor      C={C} />}
      {rol === "coordinacion" && <DashboardCoordinacion  C={C} />}

        </div>
    </DashboardLayout>
  );
}
