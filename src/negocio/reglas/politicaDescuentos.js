import { Niveles } from './niveles.js';
import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';

/**
 * Regla de negocio 1 — Estructura de descuentos por nivel.
 *   Junior → 5 %   ·   Mid → 10 %   ·   Senior → 15 %
 */
const PORCENTAJE_POR_NIVEL = Object.freeze({
  [Niveles.JUNIOR]: 5,
  [Niveles.MID]: 10,
  [Niveles.SENIOR]: 15,
});

export function porcentajeDescuentoPorNivel(nivel) {
  const porcentaje = PORCENTAJE_POR_NIVEL[nivel];
  if (porcentaje === undefined) {
    throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, `Nivel de lealtad desconocido: ${nivel}`);
  }
  return porcentaje;
}

/** Descuento en pesos (redondeado al peso) que corresponde a un monto según el nivel. */
export function calcularDescuentoPorNivel(monto, nivel) {
  return Math.round((monto * porcentajeDescuentoPorNivel(nivel)) / 100);
}
