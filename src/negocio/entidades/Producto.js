import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';

function validarStock(stock) {
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'El stock debe ser un número entero mayor o igual a 0.');
  }
}

/** Producto del menú: Identificador, Nombre, Precio base y Stock disponible. */
export class Producto {
  constructor({ id = null, nombre, precio, stock }) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
  }

  static crear({ nombre, precio, stock }) {
    const nombreLimpio = String(nombre ?? '').trim();
    if (!nombreLimpio) {
      throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'El producto debe tener un nombre.');
    }
    if (!Number.isInteger(precio) || precio <= 0) {
      throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'El precio base debe ser un entero positivo (en pesos).');
    }
    validarStock(stock);
    return new Producto({ nombre: nombreLimpio, precio, stock });
  }

  /** Regla 4a: no se puede pedir más de lo que hay en stock. */
  verificarStock(cantidad) {
    if (cantidad > this.stock) {
      throw new ErrorNegocio(
        CodigosError.STOCK_INSUFICIENTE,
        `Stock insuficiente para "${this.nombre}": solicitaste ${cantidad} y solo hay ${this.stock} disponible(s).`,
        { productoId: this.id, solicitado: cantidad, disponible: this.stock },
      );
    }
  }

  descontarStock(cantidad) {
    this.verificarStock(cantidad);
    this.stock -= cantidad;
  }

  fijarStock(stock) {
    validarStock(stock);
    this.stock = stock;
  }

  static desdeRegistro(registro) {
    return new Producto(registro);
  }

  aRegistro() {
    return { id: this.id, nombre: this.nombre, precio: this.precio, stock: this.stock };
  }
}
