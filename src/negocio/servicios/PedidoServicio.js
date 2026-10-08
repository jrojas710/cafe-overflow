import { Pedido, EstadosPedido, esEstadoValido } from '../entidades/Pedido.js';
import { Producto } from '../entidades/Producto.js';
import { Cliente } from '../entidades/Cliente.js';
import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';
import { calcularTotales } from '../reglas/calculadoraPedido.js';
import { Mutex } from '../comun/Mutex.js';

/** Agrupa ítems repetidos del mismo producto y valida cantidades. */
function consolidarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorNegocio(CodigosError.PEDIDO_VACIO, 'El pedido debe tener al menos un producto.');
  }
  const cantidades = new Map();
  for (const { productoId, cantidad } of items) {
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'Cada cantidad debe ser un entero mayor o igual a 1.');
    }
    cantidades.set(productoId, (cantidades.get(productoId) ?? 0) + cantidad);
  }
  return [...cantidades].map(([productoId, cantidad]) => ({ productoId, cantidad }));
}

/** Casos de uso de pedidos: cotizar, registrar, consultar y avanzar estado. */
export class PedidoServicio {
  #pedidos;
  #productos;
  #clientes;
  #reloj;
  #mutex;

  constructor({ pedidoRepositorio, productoRepositorio, clienteRepositorio, reloj = () => new Date(), mutex = new Mutex() }) {
    this.#pedidos = pedidoRepositorio;
    this.#productos = productoRepositorio;
    this.#clientes = clienteRepositorio;
    this.#reloj = reloj;
    this.#mutex = mutex;
  }

  /** Calcula el desglose de un pedido sin registrarlo (vista previa del carrito). */
  async cotizar({ clienteId, items, devPointsARedimir = 0 }) {
    const cliente = await this.#obtenerCliente(clienteId);
    const { lineas, totales } = await this.#prepararPedido(cliente, items, devPointsARedimir);
    return { clienteId: cliente.id, nivel: cliente.nivel, lineas, cantidadArticulos: lineas.reduce((s, l) => s + l.cantidad, 0), ...totales };
  }

  /** Registra un pedido aplicando TODAS las reglas de negocio. */
  registrar({ clienteId, items, devPointsARedimir = 0 }) {
    return this.#mutex.ejecutar(async () => {
      const cliente = await this.#obtenerCliente(clienteId);

      // Regla 4b: no se permite un pedido nuevo si hay uno pendiente de pago.
      const [pendiente] = await this.#pedidos.listar({ clienteId: cliente.id, estado: EstadosPedido.PENDIENTE_PAGO });
      if (pendiente) {
        throw new ErrorNegocio(
          CodigosError.PEDIDO_PENDIENTE_EXISTENTE,
          `Tienes el pedido #${pendiente.id} pendiente de pago. Págalo antes de registrar uno nuevo.`,
          { pedidoPendienteId: pendiente.id },
        );
      }

      // Regla 4a (stock), regla 1 (descuento) y regla 3 (redención de DevPoints).
      const { productos, lineas, totales } = await this.#prepararPedido(cliente, items, devPointsARedimir);

      for (const linea of lineas) {
        const producto = productos.get(linea.productoId);
        producto.descontarStock(linea.cantidad);
        await this.#productos.guardar(producto.aRegistro());
      }

      cliente.redimirDevPoints(totales.devPointsRedimidos);
      await this.#clientes.guardar(cliente.aRegistro());

      const pedido = Pedido.crear({ clienteId: cliente.id, lineas, totales, fecha: this.#reloj() });
      const guardado = Pedido.desdeRegistro(await this.#pedidos.guardar(pedido.aRegistro()));
      return this.#aVista(guardado, cliente);
    });
  }

  async listar({ clienteId, estado } = {}) {
    if (estado !== undefined && !esEstadoValido(estado)) {
      throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, `Estado de pedido desconocido: ${estado}`);
    }
    const filtro = {};
    if (clienteId !== undefined) filtro.clienteId = clienteId;
    if (estado !== undefined) filtro.estado = estado;

    const [registros, clientes] = await Promise.all([this.#pedidos.listar(filtro), this.#clientes.listar()]);
    const clientesPorId = new Map(clientes.map((c) => [c.id, Cliente.desdeRegistro(c)]));
    return registros
      .map((r) => Pedido.desdeRegistro(r))
      .sort((a, b) => b.id - a.id)
      .map((p) => this.#aVista(p, clientesPorId.get(p.clienteId)));
  }

  async obtener(id) {
    const pedido = await this.#obtenerPedido(id);
    const registroCliente = await this.#clientes.buscarPorId(pedido.clienteId);
    return this.#aVista(pedido, registroCliente && Cliente.desdeRegistro(registroCliente));
  }

  /**
   * Avanza el pedido al siguiente estado del flujo:
   * Pendiente de pago → En preparación → Listo → Entregado.
   * Al ser entregado (compra completada) se aplican las reglas 2 y 3.
   */
  avanzarEstado(id) {
    return this.#mutex.ejecutar(async () => {
      const pedido = await this.#obtenerPedido(id);
      const cliente = await this.#obtenerCliente(pedido.clienteId);
      pedido.avanzar(this.#reloj());

      let lealtad = null;
      if (pedido.estaCompletado) {
        lealtad = cliente.registrarCompraCompletada(pedido.total);
        pedido.asignarDevPointsGanados(lealtad.devPointsGanados);
        await this.#clientes.guardar(cliente.aRegistro());
      }
      await this.#pedidos.guardar(pedido.aRegistro());
      return { pedido: this.#aVista(pedido, cliente), lealtad };
    });
  }

  // ───────────────────────── auxiliares privados ─────────────────────────

  async #prepararPedido(cliente, items, devPointsARedimir) {
    if (!Number.isInteger(devPointsARedimir) || devPointsARedimir < 0) {
      throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'Los DevPoints a redimir deben ser un entero mayor o igual a 0.');
    }
    cliente.verificarSaldoDevPoints(devPointsARedimir);

    const productos = new Map();
    const lineas = [];
    for (const { productoId, cantidad } of consolidarItems(items)) {
      const producto = await this.#obtenerProducto(productoId);
      producto.verificarStock(cantidad);
      productos.set(producto.id, producto);
      lineas.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precioUnitario: producto.precio,
        cantidad,
        subtotal: producto.precio * cantidad,
      });
    }

    const totales = calcularTotales({ lineas, nivel: cliente.nivel, devPointsSolicitados: devPointsARedimir });
    return { productos, lineas, totales };
  }

  async #obtenerCliente(id) {
    const registro = await this.#clientes.buscarPorId(id);
    if (!registro) throw new ErrorNegocio(CodigosError.NO_ENCONTRADO, `No existe el cliente #${id}.`);
    return Cliente.desdeRegistro(registro);
  }

  async #obtenerProducto(id) {
    const registro = await this.#productos.buscarPorId(id);
    if (!registro) throw new ErrorNegocio(CodigosError.NO_ENCONTRADO, `No existe el producto #${id}.`);
    return Producto.desdeRegistro(registro);
  }

  async #obtenerPedido(id) {
    const registro = await this.#pedidos.buscarPorId(id);
    if (!registro) throw new ErrorNegocio(CodigosError.NO_ENCONTRADO, `No existe el pedido #${id}.`);
    return Pedido.desdeRegistro(registro);
  }

  #aVista(pedido, cliente) {
    return {
      ...pedido.aRegistro(),
      siguienteEstado: pedido.siguienteEstado,
      completado: pedido.estaCompletado,
      cliente: cliente ? { id: cliente.id, nombre: cliente.nombre, nivel: cliente.nivel } : null,
    };
  }
}
