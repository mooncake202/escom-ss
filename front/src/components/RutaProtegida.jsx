import { Navigate } from "react-router-dom";

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
 * Uso:
 * <Route path="/coordinacion/usuarios-asignados" element={
 *   <RutaProtegida roles={["coordinador"]}>
 *     <RegistroProfesores />
 *   </RutaProtegida>
 * } />
 */
export function RutaProtegida({ roles, children }) {
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

  return children;
}
