import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/services/apiClient";

const SocketContext = createContext({ socket: null, conectar: () => {}, desconectar: () => {} });

/**
 * UNA sola conexión de socket.io compartida en toda la sesión del usuario —
 * los hooks se suscriben a `socket` vía useSocket(), nunca crean su propia
 * conexión. Se conecta con el mismo JWT que ya usa apiFetch (vía
 * `auth.token` en el handshake, no query string), replicando el patrón ya
 * probado en Parte 1/2.
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const conectar = useCallback(() => {
    // Idempotente — si ya hay una conexión activa, no crea una segunda.
    if (socketRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Solo el origen (protocolo+host+puerto), NUNCA API_URL completo — si
    // API_URL trae un path (ej. "https://ttservicio.com/api"), io(...)
    // interpreta ese path como un NAMESPACE de socket.io, no como prefijo
    // HTTP, y el servidor lo rechaza con "Invalid namespace" (solo existe
    // el namespace default "/"). apiFetch() sigue usando API_URL completo
    // sin cambios — esto es exclusivo de cómo se abre el socket.
    const nuevoSocket = io(new URL(API_URL).origin, { auth: { token } });
    socketRef.current = nuevoSocket;
    setSocket(nuevoSocket);
  }, []);

  const desconectar = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
  }, []);

  // Sesión ya existente al recargar la página (F5) — conecta sin esperar
  // un login nuevo.
  useEffect(() => {
    conectar();
  }, [conectar]);

  // Mismo evento que ya dispara apiClient.js en cualquier 401 — cubre el
  // logout automático por sesión vencida sin código adicional.
  useEffect(() => {
    window.addEventListener("sesion-expirada", desconectar);
    return () => window.removeEventListener("sesion-expirada", desconectar);
  }, [desconectar]);

  return (
    <SocketContext.Provider value={{ socket, conectar, desconectar }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Dispara `callback` una sola vez cada vez que el socket se RECONECTA tras
 * haber estado desconectado (laptop dormida, corte de red, etc.) — cierra
 * el hueco de eventos perdidos durante la ventana sin conexión, sin usar
 * ningún setInterval propio.
 *
 * Verificado contra el código fuente instalado (socket.io-client@4.8.3,
 * build/cjs/manager.js): `socket.on('connect', ...)` dispara igual en la
 * primera conexión y en cada reconexión — no sirve para distinguir. El
 * evento correcto vive en el MANAGER, no en el socket: `Manager.onreconnect()`
 * emite `'reconnect'` únicamente desde el ciclo interno
 * onclose() -> reconnect() -> onreconnect(), es decir, solo tras una
 * desconexión real seguida de reconexión automática exitosa — nunca en el
 * connect inicial. `socket.io` es la referencia pública al Manager.
 *
 * Centralizado aquí a propósito: los hooks que lo usan no necesitan saber
 * que el evento vive en `socket.io` y no en `socket` directamente.
 */
export function useSocketReconectado(callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.io.on("reconnect", callback);
    return () => socket.io.off("reconnect", callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
}
