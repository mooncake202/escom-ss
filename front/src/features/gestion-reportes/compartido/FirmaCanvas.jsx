import { useEffect, useRef, useState } from "react";
import { RADIUS } from "@/themes/colors";

// Firma dibujada a mano (mouse, trackpad o táctil) para la rúbrica del alumno (CU-REP-01) y del profesor (CU-REP-05):
// ya no se sube un PNG/JPG existente. El canvas se ve con fondo blanco, pero eso es solo CSS — sus píxeles quedan
// transparentes salvo donde se dibuja, así el PNG que se exporta sale con fondo transparente. El trazo es oscuro y
// de grosor fijo, pensado para leerse como una firma.
//
// `onCambiar(file)` se llama con un File PNG (campo "rubrica" del FormData, igual que antes) al terminar cada trazo,
// y con `null` en cuanto el canvas queda vacío (al montar o después de "Limpiar") — así el llamador nunca intenta
// guardar una firma vacía, con la misma validación que ya usaba el archivo subido (validarArchivoFirma).
export function FirmaCanvas({ onCambiar, error, C, ancho = 460, alto = 160, disabled = false }) {
  const canvasRef = useRef(null);
  const dibujandoRef = useRef(false);
  const ultimoPuntoRef = useRef(null);
  const [vacio, setVacio] = useState(true);

  // Resolución real del canvas a la densidad de píxeles del dispositivo (trazo nítido); el tamaño en pantalla (CSS)
  // no cambia. `vacio` ya empieza en `true` y el llamador ya empieza sin firma: no hace falta repetirlo aquí.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1a1a1a";
  }, [ancho, alto]);

  function puntoDe(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciarTrazo(e) {
    if (disabled) return;
    canvasRef.current.setPointerCapture(e.pointerId);
    dibujandoRef.current = true;
    ultimoPuntoRef.current = puntoDe(e);
  }

  function continuarTrazo(e) {
    if (!dibujandoRef.current) return;
    const punto = puntoDe(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(ultimoPuntoRef.current.x, ultimoPuntoRef.current.y);
    ctx.lineTo(punto.x, punto.y);
    ctx.stroke();
    ultimoPuntoRef.current = punto;
    if (vacio) setVacio(false);
  }

  function terminarTrazo() {
    if (!dibujandoRef.current) return;
    dibujandoRef.current = false;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      onCambiar(new File([blob], "firma.png", { type: "image/png" }));
    }, "image/png");
  }

  function limpiar() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    dibujandoRef.current = false;
    ultimoPuntoRef.current = null;
    setVacio(true);
    onCambiar(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={vacio ? "Recuadro para dibujar tu firma, vacío" : "Recuadro con tu firma dibujada"}
        style={{
          width: ancho, height: alto,
          background: "#fff", // solo visual: el PNG exportado tiene fondo transparente
          borderRadius: RADIUS.md,
          border: `1px solid ${error ? C.danger : !vacio ? C.success : C.borderDefault}`,
          touchAction: "none", // evita el scroll táctil mientras se dibuja
          cursor: disabled ? "not-allowed" : "crosshair",
          display: "block",
        }}
        onPointerDown={iniciarTrazo}
        onPointerMove={continuarTrazo}
        onPointerUp={terminarTrazo}
        onPointerCancel={terminarTrazo}
        onPointerLeave={terminarTrazo}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <span style={{ fontSize: 12, color: vacio ? C.textDisabled : C.success }}>
          {vacio ? "Dibuja tu firma en el recuadro." : "Firma dibujada correctamente."}
        </span>
        <button
          type="button"
          onClick={limpiar}
          disabled={disabled || vacio}
          style={{
            padding: "6px 14px", borderRadius: RADIUS.md, background: "transparent",
            border: `1px solid ${C.borderDefault}`, color: vacio ? C.textDisabled : C.textMuted,
            fontSize: 12, fontWeight: 600, cursor: vacio ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          Limpiar
        </button>
      </div>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>}
    </div>
  );
}
