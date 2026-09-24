import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { rutaCorrectaParaAlumnoSinAsignar } from "@/features/gestion-registro/utils/estadoRutas";
import { rutaCorrectaParaLSS } from "@/features/liberacion-ss/utils/estadoRutasLSS";
import { getEstadoRequisitos } from "@/services/lssAlumnoService";

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
 *
 * Prop `guardaLSS` (opcional, aditivo — no cambia nada de lo anterior):
 * mismo mecanismo pero para LSS, en las rutas de alumno_asignado que
 * pertenecen al módulo LSS. A diferencia de la rama de alumno_sin_asignar
 * de arriba, NO se puede aplicar "por rol completo" — alumno_asignado
 * también navega libremente por rutas de AH que nada tienen que ver con
 * LSS, así que este chequeo solo corre en las rutas que explícitamente
 * pasan `guardaLSS` (las ~6 rutas de LSS del lado alumno).
 *
 * También a diferencia de la rama de arriba, esto consulta el estado EN
 * VIVO (GET /alumno/liberacion/requisitos) en vez de leer un snapshot
 * cacheado en localStorage: alumno_asignado hace login mucho antes de que
 * exista su liberacion_proceso (se crea meses después, vía CU-LSS-01), así
 * que no hay ningún snapshot de login razonable que cachear — y esto evita
 * reproducir el punto más frágil del mecanismo de arriba (cada pantalla de
 * GR tiene que parchear a mano el usuario cacheado tras cada transición,
 * o el guardia rebota a la ruta vieja).
 */
export function RutaProtegida({ roles, guardaLSS, children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    usuario = null;
  }

  // undefined = todavía no se resolvió (evita el flash de la pantalla
  // incorrecta mientras llega la respuesta); null = no aplica o falló (no
  // redirige, fail-open — el backend sigue siendo la seguridad real).
  const [rutaLSS, setRutaLSS] = useState(undefined);

  const aplicaGuardaLSS = !!guardaLSS && !!token && usuario?.rol === "alumno_asignado";

  useEffect(() => {
    if (!aplicaGuardaLSS) {
      setRutaLSS(null);
      return;
    }
    let cancelado = false;
    setRutaLSS(undefined);
    getEstadoRequisitos()
      .then((data) => {
        if (!cancelado) setRutaLSS(rutaCorrectaParaLSS(data));
      })
      .catch(() => {
        if (!cancelado) setRutaLSS(null);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicaGuardaLSS, location.pathname]);

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

  if (aplicaGuardaLSS) {
    if (rutaLSS === undefined) return null; // esperando la respuesta en vivo
    if (rutaLSS && location.pathname !== rutaLSS) {
      return <Navigate to={rutaLSS} replace />;
    }
  }

  return children;
}