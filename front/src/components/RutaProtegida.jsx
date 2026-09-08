import { Navigate, useLocation } from "react-router-dom";
import { rutaCorrectaParaAlumnoSinAsignar } from "@/features/gestion-registro/utils/estadoRutas";

/**
 * Envuelve una ruta para exigir sesión activa (y opcionalmente un rol
 * específico) antes de renderizar el contenido real.
 *
 * NOTA: esto es una protección de experiencia de usuario, no la seguridad
 * real — esa siempre vive en el backend (requireAuth/requireRole), que ya
 * rechaza cualquier request sin importar lo que haga el frontend. Esto solo
 * evita que alguien vea una pantalla rota al navegar directo a una URL sin
 * sesión.
 *
 * Regla extra para alumno_sin_asignar: a diferencia de profesor/coordinador/
 * alumno_asignado (que sí pueden navegar libremente entre TODAS las rutas
 * de su rol), un alumno_sin_asignar SOLO puede estar en la única ruta que
 * corresponde exactamente a su estado_solicitud actual — cualquier otra
 * (incluyendo /dashboard) lo regresa ahí automáticamente.
 *
 * Uso:
 * <Route path="/coordinacion/usuarios-asignados" element={
 *   <RutaProtegida roles={["coordinador"]}>
 *     <RegistroProfesores />
 *   </RutaProtegida>
 * } />
 */
export function RutaProtegida({ roles, children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    usuario = null;
  }

  if (!token || !usuario) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  if (usuario.rol === "alumno_sin_asignar") {
    const rutaCorrecta = rutaCorrectaParaAlumnoSinAsignar(usuario);
    if (location.pathname !== rutaCorrecta) {
      return <Navigate to={rutaCorrecta} replace />;
    }
  }

  return children;
}