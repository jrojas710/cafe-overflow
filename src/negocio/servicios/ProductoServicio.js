import { Producto } from '../entidades/Producto.js';
import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';
import { Mutex } from '../comun/Mutex.js';

/** Casos de uso del menú e inventario. */
export class ProductoServicio {
  #productos;
  #mutex;

  /** @param {{ productoRepositorio: import('../contratos/repositorios.js').RepositorioProductos, mutex?: Mutex }} deps */
  constructor({ productoRepositorio, mutex = new Mutex() }) {
    this.#productos = productoRepositorio;
    this.#mutex = mutex;
  }

  async listar() {
    const registros = await this.#productos.listar();
    return registros.map((r) => Producto.desdeRegistro(r).aRegistro()).sort((a, b) => a.id - b.id);
  }

  async obtener(id) {
    const registro = await this.#productos.buscarPorId(id);
    if (!registro) throw new ErrorNegocio(CodigosError.NO_ENCONTRADO, `No existe el producto #${id}.`);
    return Producto.desdeRegistro(registro).aRegistro();
  }

  crear(datos) {
    return this.#mutex.ejecutar(async () => {
      const producto = Producto.crear(datos);
      return this.#productos.guardar(producto.aRegistro());
    });
  }

  actualizarStock(id, stock) {
    return this.#mutex.ejecutar(async () => {
      const producto = Producto.desdeRegistro(await this.obtener(id));
      producto.fijarStock(stock);
      return this.#productos.guardar(producto.aRegistro());
    });
  }
}
