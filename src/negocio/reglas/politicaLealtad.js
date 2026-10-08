import { Niveles, ORDEN_NIVELES, rangoDeNivel } from './niveles.js';

/**
 * Regla de negocio 2 — Política de ascenso automático de nivel.
 *   - Todo cliente nuevo inicia en Junior con $0 acumulado.
 *   - Acumulado ≥ $500.000   → Mid
 *   - Acumulado ≥ $1.500.000 → Senior
 * El acumulado solo crece con compras completadas, y un cliente nunca desciende.
 */
export const MONTO_MINIMO_POR_NIVEL = Object.freeze({
  [Niveles.JUNIOR]: 0,
  [Niveles.MID]: 500_000,
  [Niveles.SENIOR]: 1_500_000,
});

/** Nivel que "merece" un cliente según su acumulado histórico. */
export function nivelSegunAcumulado(montoAcumulado) {
  let nivel = Niveles.JUNIOR;
  for (const candidato of ORDEN_NIVELES) {
    if (montoAcumulado >= MONTO_MINIMO_POR_NIVEL[candidato]) nivel = candidato;
  }
  return nivel;
}

/** Devuelve el nivel resultante tras evaluar el ascenso. Nunca degrada. */
export function evaluarAscenso(nivelActual, montoAcumulado) {
  const merecido = nivelSegunAcumulado(montoAcumulado);
  return rangoDeNivel(merecido) > rangoDeNivel(nivelActual) ? merecido : nivelActual;
}

/** Información de progreso hacia el siguiente nivel (para mostrar al cliente). */
export function progresoHaciaSiguienteNivel(nivelActual, montoAcumulado) {
  const siguiente = ORDEN_NIVELES[rangoDeNivel(nivelActual) + 1];
  if (!siguiente) {
    return { siguienteNivel: null, montoObjetivo: null, montoFaltante: 0, porcentaje: 100 };
  }
  const base = MONTO_MINIMO_POR_NIVEL[nivelActual];
  const objetivo = MONTO_MINIMO_POR_NIVEL[siguiente];
  const avance = (montoAcumulado - base) / (objetivo - base);
  return {
    siguienteNivel: siguiente,
    montoObjetivo: objetivo,
    montoFaltante: Math.max(0, objetivo - montoAcumulado),
    porcentaje: Math.max(0, Math.min(100, Math.floor(avance * 100))),
  };
}
