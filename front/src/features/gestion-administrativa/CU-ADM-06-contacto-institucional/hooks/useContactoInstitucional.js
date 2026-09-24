import { useEffect, useMemo, useState } from "react";
import {
  obtenerContactos, crearContacto, actualizarContacto, eliminarContacto,
} from "@/services/contactoInstitucionalService";

// CU-ADM-06 — Contacto institucional.
//
// EL MODELO ES tipo + valor, Y NO SE AMPLÍA. Las etiquetas del diseño original no se persisten:
// la pantalla agrupa por tipo y muestra el valor tal cual. Para `ubicacion` y `horario` el valor
// puede ser un texto completo, incluso multilínea, mientras quepa en 255.
//
// EDICIÓN EN BORRADOR (un solo "Guardar cambios")
// Agregar, editar y quitar solo tocan el BORRADOR local; nada viaja al servidor hasta pulsar
// "Guardar cambios". Ahí se traducen las diferencias contra el estado original a las operaciones
// que hacen falta:
//
//   fila nueva            → POST
//   valor modificado      → PUT
//   fila quitada          → DELETE
//   fila nueva y quitada  → nada (nunca existió en la base)
//
// Tras guardar se vuelve a leer del servidor en vez de parchear el estado a mano: así los ids de
// las altas y cualquier resultado parcial quedan reflejados tal como están en la base.

export const MAX_VALOR = 255; // contacto_institucional.valor VarChar(255); el backend lo revalida

// Presentación de cada sección. El orden real lo manda el backend en `tipos`.
export const SECCIONES = {
  correo: {
    titulo: "Correos institucionales",
    singular: "correo",
    placeholder: "ejemplo@ipn.mx",
    multilinea: false,
  },
  telefono: {
    titulo: "Teléfonos",
    singular: "teléfono",
    placeholder: "55 5729 6000 ext. 00000",
    multilinea: false,
  },
  ubicacion: {
    titulo: "Ubicación",
    singular: "ubicación",
    placeholder: "Edificio, unidad y ciudad",
    multilinea: true,
  },
  horario: {
    titulo: "Horarios de atención",
    singular: "horario",
    placeholder: "Lunes a viernes de 9:00 a 15:00",
    multilinea: true,
  },
};

const TIPOS_POR_OMISION = ["correo", "telefono", "ubicacion", "horario"];

// Clave estable para React: los registros nuevos aún no tienen id de base.
let secuenciaLocal = 0;
const claveNueva = () => `nuevo-${++secuenciaLocal}`;

const filaDesdeServidor = (c) => ({
  clave: `bd-${c.id}`,
  id: c.id,
  tipo: c.tipo,
  valor: c.valor,
  valorOriginal: c.valor,
  quitada: false,
});

export function useContactoInstitucional() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null });
  const [filas, setFilas] = useState([]);
  const [tipos, setTipos] = useState(TIPOS_POR_OMISION);
  const [intento, setIntento] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerContactos().then(
      (r) => {
        if (!vigente) return;
        setFilas(r.contactos.map(filaDesdeServidor));
        setTipos(r.tipos);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function recargar() {
    setCarga({ estado: "cargando", error: null });
    setErrorGuardado(null);
    setGuardado(false);
    setIntento((n) => n + 1);
  }

  // ── Operaciones LOCALES (no tocan el servidor) ────────────────────────────

  const marcarSucio = () => { setGuardado(false); setErrorGuardado(null); };

  function agregar(tipo) {
    setFilas((prev) => [...prev, { clave: claveNueva(), id: null, tipo, valor: "", valorOriginal: null, quitada: false }]);
    marcarSucio();
  }

  function cambiarValor(clave, valor) {
    setFilas((prev) => prev.map((f) => (f.clave === clave ? { ...f, valor } : f)));
    marcarSucio();
  }

  /** Una fila nueva se descarta del todo; una existente se marca para borrarla al guardar. */
  function quitar(clave) {
    setFilas((prev) => prev.flatMap((f) => {
      if (f.clave !== clave) return [f];
      return f.id === null ? [] : [{ ...f, quitada: true }];
    }));
    marcarSucio();
  }

  /** Deshace el "quitar" de una fila que todavía no se ha guardado. */
  function restaurar(clave) {
    setFilas((prev) => prev.map((f) => (f.clave === clave ? { ...f, quitada: false } : f)));
    marcarSucio();
  }

  function descartarCambios() {
    setFilas((prev) => prev
      .filter((f) => f.id !== null)
      .map((f) => ({ ...f, valor: f.valorOriginal, quitada: false })));
    setErrorGuardado(null);
    setGuardado(false);
  }

  // ── Estado derivado del borrador ──────────────────────────────────────────

  const pendientes = useMemo(() => ({
    altas: filas.filter((f) => f.id === null),
    ediciones: filas.filter((f) => f.id !== null && !f.quitada && f.valor !== f.valorOriginal),
    bajas: filas.filter((f) => f.id !== null && f.quitada),
  }), [filas]);

  const totalPendientes = pendientes.altas.length + pendientes.ediciones.length + pendientes.bajas.length;
  const hayCambios = totalPendientes > 0;

  // Agrupado que consume la pantalla. Las filas quitadas SIGUEN visibles, tachadas, para poder
  // deshacer antes de guardar. Siempre se devuelven todos los tipos, aunque estén vacíos.
  const porTipo = useMemo(() => {
    const agrupado = Object.fromEntries(tipos.map((t) => [t, []]));
    for (const f of filas) if (agrupado[f.tipo]) agrupado[f.tipo].push(f);
    return agrupado;
  }, [filas, tipos]);

  // Para la vista de solo lectura: lo que hay guardado, sin borrador.
  const total = filas.filter((f) => !f.quitada).length;

  // ── Validación y guardado ─────────────────────────────────────────────────

  function primerProblema() {
    for (const f of filas) {
      if (f.quitada) continue;
      const limpio = f.valor.trim();
      if (!limpio) return { clave: f.clave, mensaje: `Hay un ${SECCIONES[f.tipo]?.singular ?? "contacto"} sin valor.` };
      if (limpio.length > MAX_VALOR) {
        return { clave: f.clave, mensaje: `Un valor pasa de ${MAX_VALOR} caracteres.` };
      }
    }
    return null;
  }

  async function guardarCambios() {
    if (guardando || !hayCambios) return;

    const problema = primerProblema();
    if (problema) { setErrorGuardado(problema.mensaje); return; }

    setGuardando(true);
    setErrorGuardado(null);
    try {
      // Las bajas van primero: liberan el registro antes de crear los nuevos.
      for (const f of pendientes.bajas) {
        await eliminarContacto(f.id);
      }
      for (const f of pendientes.ediciones) {
        await actualizarContacto(f.id, { tipo: f.tipo, valor: f.valor.trim() });
      }
      for (const f of pendientes.altas) {
        await crearContacto({ tipo: f.tipo, valor: f.valor.trim() });
      }
      setGuardado(true);
      setIntento((n) => n + 1); // relee el estado real de la base
    } catch (err) {
      // Puede haber quedado guardado a medias: se recarga para mostrar lo que SÍ persistió en vez
      // de dejar el borrador mintiendo.
      setErrorGuardado(`${err.message} Se recargó la información guardada.`);
      setIntento((n) => n + 1);
    } finally {
      setGuardando(false);
    }
  }

  return {
    carga, recargar,
    porTipo, tipos, total,
    agregar, cambiarValor, quitar, restaurar, descartarCambios,
    hayCambios, totalPendientes, pendientes,
    guardarCambios, guardando, errorGuardado, guardado,
  };
}
