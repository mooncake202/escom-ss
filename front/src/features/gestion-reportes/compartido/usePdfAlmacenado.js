import { useCallback, useEffect, useRef, useState } from "react";

// Estado del PDF almacenado de un reporte: inactivo | cargando | listo | error. El PDF es un Blob del servidor y su URL se
// libera al cerrar, al cambiar de reporte y al desmontar; una respuesta tardía de un reporte que ya no está abierto se descarta.
export function usePdfAlmacenado() {
  const [pdf, setPdf] = useState({ estado: "inactivo", url: null, error: null });
  const ref = useRef({ url: null, id: 0 });

  const cerrarPdf = useCallback(() => {
    ref.current.id += 1;
    if (ref.current.url) URL.revokeObjectURL(ref.current.url);
    ref.current.url = null;
    setPdf({ estado: "inactivo", url: null, error: null });
  }, []);

  useEffect(() => () => {
    ref.current.id += 1;
    if (ref.current.url) URL.revokeObjectURL(ref.current.url);
  }, []);

  // `obtener`: () => Promise<Blob> (el servicio del rol que pide el PDF).
  const abrirPdf = useCallback(async (obtener) => {
    const id = ++ref.current.id;
    setPdf({ estado: "cargando", url: null, error: null });
    try {
      const archivo = await obtener();
      if (id !== ref.current.id) return;
      ref.current.url = URL.createObjectURL(archivo);
      setPdf({ estado: "listo", url: ref.current.url, error: null });
    } catch (err) {
      if (id === ref.current.id) setPdf({ estado: "error", url: null, error: err.message });
    }
  }, []);

  return { pdf, abrirPdf, cerrarPdf };
}
