/**
 * Error que representa la violación de una regla de negocio.
 *
 * La capa de negocio NO conoce HTTP: solo expone un `codigo` semántico.
 * Es la capa de presentación la que decide cómo traducirlo (p. ej. 409 o 422).
 */
export class ErrorNegocio extends Error {
  /**
   * @param {string} codigo  Uno de los valores de `CodigosError`.
   * @param {string} mensaje Mensaje legible para el usuario final.
   * @param {object} [detalles] Datos adicionales para diagnóstico.
   */
  constructor(codigo, mensaje, detalles = undefined) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const CodigosError = Object.freeze({
  NO_ENCONTRADO: 'NO_ENCONTRADO',
  DATOS_INVALIDOS: 'DATOS_INVALIDOS',
  PEDIDO_VACIO: 'PEDIDO_VACIO',
  STOCK_INSUFICIENTE: 'STOCK_INSUFICIENTE',
  PEDIDO_PENDIENTE_EXISTENTE: 'PEDIDO_PENDIENTE_EXISTENTE',
  DEVPOINTS_INSUFICIENTES: 'DEVPOINTS_INSUFICIENTES',
  CORREO_DUPLICADO: 'CORREO_DUPLICADO',
  TRANSICION_INVALIDA: 'TRANSICION_INVALIDA',
});
