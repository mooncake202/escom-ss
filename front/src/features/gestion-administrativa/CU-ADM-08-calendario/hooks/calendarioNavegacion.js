// Lógica pura de ciclos y navegación mensual del calendario (sin React ni dependencias, para poder probarla).
// Los meses van de 0 a 11.

const SIN_LIMITE = { mesMin: null, anioMin: null, mesMax: null, anioMax: null };

const mesDe = (iso) => { const [y, m] = iso.split("-").map(Number); return { anio: y, mes: m - 1 }; };
const desdeTotal = (total) => ({ anio: Math.floor(total / 12), mes: total % 12 });
const totalDe = (anio, mes) => anio * 12 + mes;
const totalesDe = (l) => [totalDe(l.anioMin, l.mesMin), totalDe(l.anioMax, l.mesMax)];

// Ciclos ofrecidos (filtro, alta de Periodo y selector de año): el año de negocio actual y los dos siguientes.
// Salen de contexto.hoy y son fijos: navegar por el calendario no los modifica.
export function ciclosDesdeHoy(hoy) {
  if (!hoy) return [];
  const anio = Number(hoy.slice(0, 4));
  return [anio, anio + 1, anio + 2];
}

// Dado un ciclo y periodo calcula el rango ISO de fechas
export function rangoSemestre(ciclo, periodo) {
  if (periodo === "01") {
    // Semestre 1: Ago(ciclo-1) – Ene(ciclo)
    return {
      desde: `${ciclo - 1}-08-01`,
      hasta: `${ciclo}-01-31`,
      label: `Ago ${ciclo - 1} – Ene ${ciclo}`,
    };
  }
  // Semestre 2: Ene(ciclo) – Jul(ciclo)
  return {
    desde: `${ciclo}-01-01`,
    hasta: `${ciclo}-07-31`,
    label: `Ene ${ciclo} – Jul ${ciclo}`,
  };
}

// Ventana global navegable: de enero del año de `hoy` a diciembre dos años después (los mismos años de ciclosDesdeHoy).
function ventanaGlobal(hoy) {
  if (!hoy) return SIN_LIMITE;
  const [primero, , ultimo] = ciclosDesdeHoy(hoy);
  return { anioMin: primero, mesMin: 0, anioMax: ultimo, mesMax: 11 };
}

// Rango que imponen los filtros: del mes del primer evento resultante al del último, sin saltar meses vacíos.
// Sin resultados y con ciclo/semestre elegido, un solo mes: el actual si pertenece al ciclo, si no el primero.
function limitesPorFiltro({ ciclo, periodo, hayFiltroActivo, eventosFiltrados, hoy }) {
  if (!hayFiltroActivo) return SIN_LIMITE;
  if (eventosFiltrados.length === 0) {
    if (!ciclo || !periodo) return SIN_LIMITE;
    const { desde, hasta } = rangoSemestre(parseInt(ciclo), periodo);
    const { anio, mes } = mesDe(hoy && hoy >= desde && hoy <= hasta ? hoy : desde);
    return { anioMin: anio, mesMin: mes, anioMax: anio, mesMax: mes };
  }
  const fechas = [];
  eventosFiltrados.forEach(ev => {
    if (ev.tipo === "Periodo de prestación") {
      if (ev.fechaInicio)           fechas.push(ev.fechaInicio);
      if (ev.fechaTermino)          fechas.push(ev.fechaTermino);
      if (ev.fechaLimiteExpediente) fechas.push(ev.fechaLimiteExpediente);
    } else if (ev.tipo === "Periodo vacacional") {
      if (ev.fechaInicioVac) fechas.push(ev.fechaInicioVac);
      if (ev.fechaFinVac)    fechas.push(ev.fechaFinVac);
    } else { if (ev.fecha) fechas.push(ev.fecha); }
  });
  if (fechas.length === 0) return SIN_LIMITE;
  const sorted = [...fechas].sort();
  const [yMin, mMin] = sorted[0].split("-").map(Number);
  const [yMax, mMax] = sorted[sorted.length - 1].split("-").map(Number);
  return { anioMin: yMin, mesMin: mMin - 1, anioMax: yMax, mesMax: mMax - 1 };
}

// Meses navegables: la ventana global, acotada además por el rango de los filtros (el más restrictivo manda).
// Si los resultados quedan fuera de la ventana global, se acotan a su mes más cercano.
export function limitesNavegacion(entrada) {
  const ventana = ventanaGlobal(entrada.hoy);
  const filtro = limitesPorFiltro(entrada);
  if (ventana.mesMin === null) return filtro;
  if (filtro.mesMin === null) return ventana;
  const min = acotarMes(filtro.anioMin, filtro.mesMin, ventana);
  const max = acotarMes(filtro.anioMax, filtro.mesMax, ventana);
  return { anioMin: min.anio, mesMin: min.mes, anioMax: max.anio, mesMax: max.mes };
}

// Mes destino a `delta` meses del actual (diciembre → enero del año siguiente y viceversa), o null si
// saldría de los límites. Si el mes visible ya está fuera de ellos, el movimiento lo acerca al rango.
export function moverMes(anio, mes, delta, limites) {
  const total = totalDe(anio, mes) + delta;
  if (limites.mesMin === null) return desdeTotal(total);
  const [min, max] = totalesDe(limites);
  if (total >= min && total <= max) return desdeTotal(total);
  const actual = totalDe(anio, mes);
  return actual >= min && actual <= max ? null : desdeTotal(Math.min(Math.max(total, min), max));
}

// Mes al que saltar al cambiar filtros: el actual si está dentro del rango navegable, si no el primero.
export function mesInicial(limites, hoy) {
  if (limites.mesMin === null) return null;
  const [min, max] = totalesDe(limites);
  if (hoy) {
    const actual = mesDe(hoy);
    const total = totalDe(actual.anio, actual.mes);
    if (total >= min && total <= max) return actual;
  }
  return { anio: limites.anioMin, mes: limites.mesMin };
}

// Mes más cercano dentro de los límites (selector de año, mes tras guardar).
export function acotarMes(anio, mes, limites) {
  if (limites.mesMin === null) return { anio, mes };
  const [min, max] = totalesDe(limites);
  return desdeTotal(Math.min(Math.max(totalDe(anio, mes), min), max));
}

// Fechas válidas para el inicio de un Periodo según ciclo/semestre (misma ventana que rangoSemestre), sin
// bajar de `minFechaFutura`. `vistaInicial` es el mes en que debe abrir el selector. Null sin ciclo completo.
export function ventanaInicioPeriodo({ anio, semestre, minFechaFutura }) {
  if (!/^\d{4}$/.test(anio) || !semestre) return null;
  const { desde, hasta } = rangoSemestre(Number(anio), semestre);
  const minDate = minFechaFutura > desde ? minFechaFutura : desde;
  return { minDate, maxDate: hasta, vistaInicial: minDate <= hasta ? minDate : desde };
}
