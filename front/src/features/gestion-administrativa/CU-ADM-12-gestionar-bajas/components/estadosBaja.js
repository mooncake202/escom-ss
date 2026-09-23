// Estados canónicos de solicitud_baja, compartidos por la tarjeta y el detalle.
// Viven aquí y no junto a un componente para no romper fast-refresh.
export const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", bg: "rgba(234,179,8,0.12)", color: "#ca8a04", border: "rgba(234,179,8,0.3)" },
  aprobada:  { label: "Aprobada",  bg: "rgba(34,197,94,0.12)", color: "#16A34A", border: "rgba(34,197,94,0.3)" },
  rechazada: { label: "Rechazada", bg: "rgba(239,68,68,0.12)", color: "#DC2626", border: "rgba(239,68,68,0.3)" },
};

export const ORIGEN_LABEL = { alumno: "El propio alumno", profesor: "Su profesor" };

export const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : "—");
