import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme, GRADIENTS, BRAND } from "@/themes/colors";

// ── Iconos SVG inline ────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  solicitudes:  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  actividades:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  reportes:     "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z",
  config:       "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0",
  chevron:      "M9 18l6-6-6-6",
  logout:       "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

// Menú por rol
const NAV_ITEMS = {
  alumno: [
    { key: "dashboard",   label: "Inicio",       path: "/dashboard",             icon: "dashboard" },
    { key: "solicitudes", label: "Mi solicitud", path: "/registro",              icon: "solicitudes" },
    { key: "actividades", label: "Actividades",  path: "/actividades",           icon: "actividades" },
    { key: "reportes",    label: "Reportes",     path: "/reportes",              icon: "reportes" },
    { key: "config",      label: "Configuración",path: "/configuracion",         icon: "config" },
  ],
  profesor: [
    { key: "dashboard",   label: "Inicio",       path: "/dashboard",             icon: "dashboard" },
    { key: "solicitudes", label: "Solicitudes",  path: "/profesor/solicitudes",  icon: "solicitudes" },
    { key: "actividades", label: "Actividades",  path: "/profesor/actividades",  icon: "actividades" },
    { key: "reportes",    label: "Reportes",     path: "/profesor/reportes",     icon: "reportes" },
    { key: "config",      label: "Configuración",path: "/configuracion",         icon: "config" },
  ],
  coordinacion: [
    { key: "dashboard",   label: "Inicio",       path: "/dashboard",             icon: "dashboard" },
    { key: "solicitudes", label: "Solicitudes",  path: "/coordinacion/solicitudes", icon: "solicitudes" },
    { key: "actividades", label: "Actividades",  path: "/coordinacion/actividades", icon: "actividades" },
    { key: "reportes",    label: "Reportes",     path: "/coordinacion/reportes",    icon: "reportes" },
    { key: "config",      label: "Configuración",path: "/configuracion",            icon: "config" },
  ],
};

export function Sidebar({ rol = "profesor" }) {
  const { C } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const items = NAV_ITEMS[rol] ?? NAV_ITEMS.profesor;
  const W_collapsed = 56;
  const W_expanded  = 220;
  const W = expanded ? W_expanded : W_collapsed;

  return (
    <aside style={{
      width: W, minWidth: W, height: "100%",
      background: C.navBg,
      borderRight: `1px solid ${C.navBorder}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.22s ease, min-width 0.22s ease",
      overflow: "hidden", flexShrink: 0,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* Logo + toggle */}
      <div style={{
        height: 56, display: "flex", alignItems: "center",
        padding: expanded ? "0 12px" : "0",
        justifyContent: expanded ? "space-between" : "center",
        borderBottom: `1px solid ${C.navBorder}`,
        flexShrink: 0,
      }}>
        {expanded && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>🏫</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
              Serv. Social
            </span>
          </div>
        )}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: 32, height: 32, borderRadius: 6, border: "none",
            background: "transparent", cursor: "pointer",
            color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.navItemHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s ease" }}>
            <path d={ICONS.chevron} />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={!expanded ? item.label : undefined}
              style={{
                width: "100%", height: 40,
                display: "flex", alignItems: "center",
                gap: 10, padding: expanded ? "0 10px" : "0",
                justifyContent: expanded ? "flex-start" : "center",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: active ? C.navItemActive : "transparent",
                color: active ? C.accentText : C.textMuted,
                fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "background 0.15s, color 0.15s",
                flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.navItemHover; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {/* Indicador activo */}
              {active && (
                <div style={{ position: "absolute", left: 0, width: 3, height: 24, borderRadius: "0 3px 3px 0", background: GRADIENTS.primary }} />
              )}
              <span style={{ flexShrink: 0, display: "flex" }}>
                <Icon d={ICONS[item.icon]} size={17} />
              </span>
              {expanded && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "8px 6px", borderTop: `1px solid ${C.navBorder}`, flexShrink: 0 }}>
        <button
          onClick={() => navigate("/login")}
          title={!expanded ? "Cerrar sesión" : undefined}
          style={{
            width: "100%", height: 40,
            display: "flex", alignItems: "center",
            gap: 10, padding: expanded ? "0 10px" : "0",
            justifyContent: expanded ? "flex-start" : "center",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: C.danger,
            fontFamily: "inherit", fontSize: 13, fontWeight: 400,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.dangerSoft}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ flexShrink: 0, display: "flex" }}>
            <Icon d={ICONS.logout} size={17} />
          </span>
          {expanded && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
