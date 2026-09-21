// Constantes del calendario institucional (CU-ADM-08). Sin dependencias de otros módulos.

// Valores del enum TipoEventoCalendario.
const TIPOS_EVENTO = Object.freeze({
  INHABIL: 'Inhabil',
  VACACIONAL: 'Vacacional',
  PERIODO: 'Periodo',
});

const NOMBRE_LONGITUD_MAX = 150;
const ZONA_HORARIA = 'America/Mexico_City';

// Inhabil parcial: solo horas exactas. Nula = todo el día; "07:00" significa literalmente desde las 07:00.
const HORAS_INHABIL_PERMITIDAS = Object.freeze(
  Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`),
);

const CODIGOS_ERROR = Object.freeze({
  VALIDACION: 'VALIDACION',
  CONFIRMACION_REQUERIDA: 'CONFIRMACION_REQUERIDA',
  EVENTO_INMUTABLE: 'EVENTO_INMUTABLE',
  EVENTO_YA_EN_VIGOR: 'EVENTO_YA_EN_VIGOR',
  // Un solo Inhabil por fecha: lo aplicará el servicio con una consulta a BD (no en esta fase).
  INHABIL_DUPLICADO: 'INHABIL_DUPLICADO',
  // Dos Vacacionales no pueden compartir ningún día.
  VACACIONAL_CRUZADO: 'VACACIONAL_CRUZADO',
});

// La API usa "01"/"02"; Prisma usa s01/s02.
const SEMESTRE_API_A_PRISMA = Object.freeze({ '01': 's01', '02': 's02' });
const SEMESTRE_PRISMA_A_API = Object.freeze({ s01: '01', s02: '02' });

function semestreApiAPrisma(semestre) {
  const valor = SEMESTRE_API_A_PRISMA[semestre];
  if (!valor) throw new TypeError(`Semestre inválido: ${String(semestre)}. Debe ser "01" o "02".`);
  return valor;
}

function semestrePrismaAApi(semestre) {
  const valor = SEMESTRE_PRISMA_A_API[semestre];
  if (!valor) throw new TypeError(`Semestre de Prisma inválido: ${String(semestre)}. Debe ser s01 o s02.`);
  return valor;
}

module.exports = {
  TIPOS_EVENTO,
  NOMBRE_LONGITUD_MAX,
  ZONA_HORARIA,
  HORAS_INHABIL_PERMITIDAS,
  CODIGOS_ERROR,
  semestreApiAPrisma,
  semestrePrismaAApi,
};
