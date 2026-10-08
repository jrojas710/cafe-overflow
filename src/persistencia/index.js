/**
 * Punto de entrada de la CAPA DE PERSISTENCIA Y DATOS.
 *
 * Construye los repositorios concretos sobre archivos JSON. Para migrar a
 * SQLite, PostgreSQL o MongoDB bastaría con otra fábrica que devuelva objetos
 * con los mismos métodos (ver src/negocio/contratos/repositorios.js).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AlmacenJson } from './AlmacenJson.js';
import { ProductoRepositorioJson } from './repositorios/ProductoRepositorioJson.js';
import { ClienteRepositorioJson } from './repositorios/ClienteRepositorioJson.js';
import { PedidoRepositorioJson } from './repositorios/PedidoRepositorioJson.js';

const DIRECTORIO_SEMILLAS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'semillas');

/**
 * @param {{ directorioDatos: string, conSemillas?: boolean }} opciones
 */
export function crearRepositoriosJson({ directorioDatos, conSemillas = true }) {
  const almacen = (nombre) =>
    new AlmacenJson(
      path.join(directorioDatos, `${nombre}.json`),
      conSemillas ? path.join(DIRECTORIO_SEMILLAS, `${nombre}.json`) : null,
    );

  return {
    productoRepositorio: new ProductoRepositorioJson(almacen('productos')),
    clienteRepositorio: new ClienteRepositorioJson(almacen('clientes')),
    pedidoRepositorio: new PedidoRepositorioJson(almacen('pedidos')),
  };
}
