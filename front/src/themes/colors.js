// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Paleta de diseño centralizada
//  Uso: import { COLORS, DARK, LIGHT, GRADIENTS, SHADOWS, RADIUS, TYPOGRAPHY } from '../colors'
// ============================================================

// --- Colores base de marca ---
export const BRAND = {
  blue900: "#001F5B",   // azul más oscuro
  blue800: "#002F7A",   // azul profundo
  blue700: "#003A8F",   // ← azul ESCOM principal
  blue600: "#0A4DB5",
  blue500: "#0A66C2",   // azul claro interactivo
  blue400: "#2E86DE",
  blue300: "#6AAFF5",
  blue200: "#A8D0F7",
  blue100: "#D6EAFD",
  blue50:  "#EDF5FF",

  // Neutros
  gray950: "#0A0A0A",
  gray900: "#111111",
  gray850: "#161616",
  gray800: "#1C1C1C",
  gray750: "#242424",
  gray700: "#2E2E2E",
  gray600: "#cdcccc",
  gray500: "#555555",
  gray400: "#a1a0a0",
  gray300: "#9A9A9A",
  gray200: "#f4f4f4",
  gray100: "#DEDEDE",
  gray50:  "#F4F4F4",
  white:   "#FFFFFF",

  // Semánticos
  success:     "#22C55E",
  successSoft: "rgba(34,197,94,0.12)",
  warning:     "#F59E0B",
  warningSoft: "rgba(245,158,11,0.12)",
  danger:      "#EF4444",
  dangerSoft:  "rgba(239,68,68,0.12)",
  info:        "#0A66C2",
  infoSoft:    "rgba(10,102,194,0.12)",
};

// ============================================================
//  MODO OSCURO (default del proyecto)
// ============================================================
export const DARK = {
  // Fondos
  bgPage:       BRAND.gray950,   // fondo de toda la página
  bgCard:       BRAND.gray900,   // cards principales
  bgCardHover:  BRAND.gray850,   // card al hacer hover
  bgInput:      BRAND.gray800,   // inputs / selects
  bgInputHover: BRAND.gray750,   // input hover
  bgOverlay:    "rgba(0,0,0,0.6)",

  // Texto
  textPrimary:   BRAND.white,
  textSecondary: BRAND.gray200,
  textMuted:     BRAND.gray400,
  textDisabled:  BRAND.gray600,
  textInverse:   BRAND.gray950,

  // Bordes
  borderSubtle:  BRAND.gray800,
  borderDefault: BRAND.gray700,
  borderStrong:  BRAND.gray500,
  borderFocus:   BRAND.blue500,

  // Acento principal (azul ESCOM)
  accent:        BRAND.blue700,
  accentHover:   BRAND.blue600,
  accentActive:  BRAND.blue800,
  accentSoft:    "rgba(0,58,143,0.20)",
  accentText:    BRAND.blue300,   // texto azul sobre fondo oscuro

  // Semánticos
  success:       BRAND.success,
  successSoft:   BRAND.successSoft,
  warning:       BRAND.warning,
  warningSoft:   BRAND.warningSoft,
  danger:        BRAND.danger,
  dangerSoft:    BRAND.dangerSoft,

  // Nav / sidebar
  navBg:         BRAND.gray900,
  navBorder:     BRAND.gray800,
  navItemActive: "rgba(0,58,143,0.25)",
  navItemHover:  BRAND.gray800,
};

// ============================================================
//  MODO CLARO
// ============================================================
export const LIGHT = {
  // Fondos
  bgPage:       BRAND.gray50,
  bgCard:       BRAND.white,
  bgCardHover:  BRAND.blue50,
  bgInput:      BRAND.white,
  bgInputHover: BRAND.blue50,
  bgOverlay:    "rgba(0,0,0,0.4)",

  // Texto
  textPrimary:   BRAND.gray950,
  textSecondary: BRAND.gray600,
  textMuted:     BRAND.gray400,
  textDisabled:  BRAND.gray300,
  textInverse:   BRAND.white,

  // Bordes
  borderSubtle:  BRAND.gray100,
  borderDefault: BRAND.gray200,
  borderStrong:  BRAND.gray400,
  borderFocus:   BRAND.blue700,

  // Acento principal (azul ESCOM)
  accent:        BRAND.blue700,
  accentHover:   BRAND.blue800,
  accentActive:  BRAND.blue900,
  accentSoft:    BRAND.blue50,
  accentText:    BRAND.blue700,   // texto azul sobre fondo claro

  // Semánticos
  success:       "#16A34A",
  successSoft:   "rgba(22,163,74,0.10)",
  warning:       "#D97706",
  warningSoft:   "rgba(217,119,6,0.10)",
  danger:        "#DC2626",
  dangerSoft:    "rgba(220,38,38,0.10)",

  // Nav / sidebar
  navBg:         BRAND.white,
  navBorder:     BRAND.gray100,
  navItemActive: BRAND.blue50,
  navItemHover:  BRAND.gray50,
};

// ============================================================
//  GRADIENTES
// ============================================================
export const GRADIENTS = {
  // Botones y headers
  primary:     `linear-gradient(135deg, ${BRAND.blue900}, ${BRAND.blue500})`,
  primaryHover:`linear-gradient(135deg, ${BRAND.blue800}, ${BRAND.blue400})`,
  subtle:      `linear-gradient(135deg, ${BRAND.blue700}, ${BRAND.blue500})`,

  // Fondos decorativos
  pageDark:    `linear-gradient(160deg, #0D1B3E 0%, ${BRAND.gray950} 60%)`,
  pageLight:   `linear-gradient(160deg, ${BRAND.blue50} 0%, ${BRAND.gray50} 60%)`,

  // Barra de progreso
  progress:    `linear-gradient(90deg, ${BRAND.blue900}, ${BRAND.blue400})`,

  // Hero / banner institucional
  hero:        `linear-gradient(135deg, ${BRAND.blue900} 0%, ${BRAND.blue600} 100%)`,
};

// ============================================================
//  SOMBRAS
// ============================================================
export const SHADOWS = {
  sm:     "0 1px 3px rgba(0,0,0,0.25)",
  md:     "0 4px 12px rgba(0,0,0,0.3)",
  lg:     "0 8px 32px rgba(0,0,0,0.4)",
  xl:     "0 16px 64px rgba(0,0,0,0.5)",
  card:   "0 2px 8px rgba(0,0,0,0.35)",

  // Sombra de color de marca (para botones y elementos destacados)
  accent: "0 4px 20px rgba(0,58,143,0.35)",
  accentLg: "0 8px 32px rgba(0,58,143,0.4)",

  // Modo claro
  smLight:  "0 1px 3px rgba(0,0,0,0.08)",
  mdLight:  "0 4px 12px rgba(0,0,0,0.10)",
  lgLight:  "0 8px 32px rgba(0,0,0,0.12)",
  cardLight:"0 2px 8px rgba(0,0,0,0.08)",
};

// ============================================================
//  BORDER RADIUS
// ============================================================
export const RADIUS = {
  xs:   "4px",
  sm:   "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  xxl:  "24px",
  full: "9999px",  // pills / badges
};

// ============================================================
//  TIPOGRAFÍA
// ============================================================
export const TYPOGRAPHY = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontMono:   "'DM Mono', monospace",

  // Tamaños
  xs:   "11px",
  sm:   "13px",
  base: "14px",
  md:   "16px",
  lg:   "18px",
  xl:   "20px",
  xxl:  "24px",
  h1:   "32px",
  h2:   "26px",
  h3:   "20px",

  // Pesos
  regular: 400,
  medium:  500,
  semibold:600,
  bold:    700,

  // Line heights
  tight:  1.2,
  normal: 1.5,
  relaxed:1.7,
};

// ============================================================
//  ESPACIADO (múltiplos de 4px)
// ============================================================
export const SPACING = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  8:  "32px",
  10: "40px",
  12: "48px",
  16: "64px",
};

// ============================================================
//  HOOK HELPER — useTheme
//  Uso: const theme = useTheme()  →  theme.bgCard, theme.accent, etc.
// ============================================================
import { useState, useEffect } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true); // oscuro por default

  useEffect(() => {
    const stored = localStorage.getItem("escom-theme");
    if (stored) setIsDark(stored === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("escom-theme", next ? "dark" : "light");
  };

  return {
    isDark,
    toggle,
    colors: isDark ? DARK : LIGHT,
    // accesos directos
    C: isDark ? DARK : LIGHT,
  };
}

// Export default para importación simple
export default { BRAND, DARK, LIGHT, GRADIENTS, SHADOWS, RADIUS, TYPOGRAPHY, SPACING };
