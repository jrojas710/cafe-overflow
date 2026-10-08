/**
 * Regla de negocio 3 — Acumulación y redención de DevPoints.
 *   - Por cada $20.000 consumidos en un pedido completado se gana 1 DevPoint.
 *   - Cada DevPoint equivale a $200 de descuento directo en la siguiente compra.
 */
export const PESOS_POR_DEVPOINT_GANADO = 20_000;
export const VALOR_DEVPOINT_EN_PESOS = 200;

/** DevPoints que se ganan al completar un pedido por `totalPagado`. */
export function devPointsGanados(totalPagado) {
  return Math.floor(totalPagado / PESOS_POR_DEVPOINT_GANADO);
}

/** Valor en pesos de una cantidad de DevPoints. */
export function valorDeDevPoints(cantidad) {
  return cantidad * VALOR_DEVPOINT_EN_PESOS;
}

/**
 * Máximo de DevPoints que tiene sentido aplicar sobre un monto
 * (nunca se deja el total en negativo ni se "queman" puntos de más).
 */
export function maximoDevPointsAplicables(monto) {
  return Math.floor(monto / VALOR_DEVPOINT_EN_PESOS);
}
