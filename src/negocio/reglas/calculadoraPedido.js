import { porcentajeDescuentoPorNivel, calcularDescuentoPorNivel } from './politicaDescuentos.js';
import { devPointsGanados, maximoDevPointsAplicables, valorDeDevPoints } from './politicaDevPoints.js';

/**
 * Calcula el desglose económico de un pedido. Función pura: sin E/S.
 *
 * Orden de aplicación:
 *   1. Subtotal = Σ precioUnitario × cantidad
 *   2. Descuento por nivel (5 / 10 / 15 %) sobre el subtotal
 *   3. Descuento por DevPoints ($200 c/u) sobre lo que queda
 *   4. Total = subtotal − descuento nivel − descuento DevPoints
 *
 * @param {{ lineas: {precioUnitario:number, cantidad:number}[], nivel: string, devPointsSolicitados?: number }} p
 */
export function calcularTotales({ lineas, nivel, devPointsSolicitados = 0 }) {
  const subtotal = lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0);

  const porcentajeDescuento = porcentajeDescuentoPorNivel(nivel);
  const descuentoNivel = calcularDescuentoPorNivel(subtotal, nivel);
  const montoTrasNivel = subtotal - descuentoNivel;

  const devPointsRedimidos = Math.min(devPointsSolicitados, maximoDevPointsAplicables(montoTrasNivel));
  const descuentoDevPoints = valorDeDevPoints(devPointsRedimidos);

  const total = montoTrasNivel - descuentoDevPoints;

  return {
    subtotal,
    porcentajeDescuento,
    descuentoNivel,
    devPointsSolicitados,
    devPointsRedimidos,
    descuentoDevPoints,
    total,
    devPointsAGanar: devPointsGanados(total),
  };
}
