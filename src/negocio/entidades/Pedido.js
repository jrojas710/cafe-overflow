import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';

export const EstadosPedido = Object.freeze({
  PENDIENTE_PAGO: 'PENDIENTE_PAGO',
  EN_PREPARACION: 'EN_PREPARACION',
  LISTO: 'LISTO',
  ENTREGADO: 'ENTREGADO',
});

/** Máquina de estados del pedido: cada estado solo puede avanzar al siguiente. */
const SIGUIENTE_ESTADO = Object.freeze({
  [EstadosPedido.PENDIENTE_PAGO]: EstadosPedido.EN_PREPARACION, // el cliente paga
  [EstadosPedido.EN_PREPARACION]: EstadosPedido.LISTO,
  [EstadosPedido.LISTO]: EstadosPedido.ENTREGADO,
  [EstadosPedido.ENTREGADO]: null,
});

export function esEstadoValido(estado) {
  return Object.hasOwn(SIGUIENTE_ESTADO, estado);
}

/**
 * Pedido: Identificador, Cliente, Lista de ítems (producto y cantidad),
 * Estado, Total calculado y Fecha.
 */
export class Pedido {
  constructor({
    id = null, clienteId, items, estado, subtotal, porcentajeDescuento, descuentoNivel,
    devPointsRedimidos, descuentoDevPoints, total, devPointsGanados = null, fecha, historial,
  }) {
    Object.assign(this, {
      id, clienteId, items, estado, subtotal, porcentajeDescuento, descuentoNivel,
      devPointsRedimidos, descuentoDevPoints, total, devPointsGanados, fecha, historial,
    });
  }

  /**
   * Crea un pedido nuevo en estado "Pendiente de pago".
   * Los ítems guardan nombre y precio del momento (si el menú cambia, el pedido no).
   */
  static crear({ clienteId, lineas, totales, fecha }) {
    const marca = fecha.toISOString();
    return new Pedido({
      clienteId,
      items: lineas.map((l) => ({ ...l })),
      estado: EstadosPedido.PENDIENTE_PAGO,
      subtotal: totales.subtotal,
      porcentajeDescuento: totales.porcentajeDescuento,
      descuentoNivel: totales.descuentoNivel,
      devPointsRedimidos: totales.devPointsRedimidos,
      descuentoDevPoints: totales.descuentoDevPoints,
      total: totales.total,
      fecha: marca,
      historial: [{ estado: EstadosPedido.PENDIENTE_PAGO, fecha: marca }],
    });
  }

  get siguienteEstado() {
    return SIGUIENTE_ESTADO[this.estado];
  }

  get estaPendienteDePago() {
    return this.estado === EstadosPedido.PENDIENTE_PAGO;
  }

  /** Un pedido se considera "completado" cuando fue entregado al cliente. */
  get estaCompletado() {
    return this.estado === EstadosPedido.ENTREGADO;
  }

  avanzar(fecha) {
    const siguiente = this.siguienteEstado;
    if (!siguiente) {
      throw new ErrorNegocio(CodigosError.TRANSICION_INVALIDA, `El pedido #${this.id} ya fue entregado; no puede avanzar más.`);
    }
    this.estado = siguiente;
    this.historial.push({ estado: siguiente, fecha: fecha.toISOString() });
    return siguiente;
  }

  asignarDevPointsGanados(cantidad) {
    this.devPointsGanados = cantidad;
  }

  static desdeRegistro(registro) {
    return new Pedido(structuredClone(registro));
  }

  aRegistro() {
    return structuredClone({
      id: this.id,
      clienteId: this.clienteId,
      items: this.items,
      estado: this.estado,
      subtotal: this.subtotal,
      porcentajeDescuento: this.porcentajeDescuento,
      descuentoNivel: this.descuentoNivel,
      devPointsRedimidos: this.devPointsRedimidos,
      descuentoDevPoints: this.descuentoDevPoints,
      total: this.total,
      devPointsGanados: this.devPointsGanados,
      fecha: this.fecha,
      historial: this.historial,
    });
  }
}
