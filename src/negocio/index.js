/**
 * Punto de entrada de la CAPA DE NEGOCIO (Core).
 *
 * Expone los servicios (casos de uso) y una fábrica que los construye a partir
 * de repositorios inyectados. Esta capa no conoce HTTP, HTML, JSON ni SQL.
 */
import { Mutex } from './comun/Mutex.js';
import { ProductoServicio } from './servicios/ProductoServicio.js';
import { ClienteServicio } from './servicios/ClienteServicio.js';
import { PedidoServicio } from './servicios/PedidoServicio.js';

export { ErrorNegocio, CodigosError } from './errores/ErrorNegocio.js';
export { EstadosPedido } from './entidades/Pedido.js';
export { Niveles } from './reglas/niveles.js';
export { ProductoServicio, ClienteServicio, PedidoServicio };

/**
 * @param {{ productoRepositorio: object, clienteRepositorio: object, pedidoRepositorio: object }} repositorios
 * @param {{ reloj?: () => Date }} [opciones]
 */
export function crearServicios(repositorios, { reloj = () => new Date() } = {}) {
  // Un único candado compartido: las operaciones que modifican stock,
  // puntos o estados nunca se intercalan entre sí.
  const mutex = new Mutex();
  const { productoRepositorio, clienteRepositorio, pedidoRepositorio } = repositorios;
  return {
    productoServicio: new ProductoServicio({ productoRepositorio, mutex }),
    clienteServicio: new ClienteServicio({ clienteRepositorio, pedidoRepositorio, reloj, mutex }),
    pedidoServicio: new PedidoServicio({ pedidoRepositorio, productoRepositorio, clienteRepositorio, reloj, mutex }),
  };
}
