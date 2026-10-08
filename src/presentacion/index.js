/**
 * Punto de entrada de la CAPA DE PRESENTACIÓN.
 *
 * Recibe los servicios de negocio ya construidos (inyección de dependencias)
 * y arma el servidor HTTP: rutas de la API + cliente web estático.
 * Esta capa NUNCA accede a la persistencia: solo habla con el negocio.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Enrutador } from './servidor/Enrutador.js';
import { crearServidorHttp } from './servidor/servidorHttp.js';
import { crearServidorEstatico } from './servidor/archivosEstaticos.js';
import { crearControladorProductos } from './controladores/controladorProductos.js';
import { crearControladorClientes } from './controladores/controladorClientes.js';
import { crearControladorPedidos } from './controladores/controladorPedidos.js';

const DIRECTORIO_WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web');

export function crearAplicacionWeb({ productoServicio, clienteServicio, pedidoServicio }, { registro = console } = {}) {
  const productos = crearControladorProductos(productoServicio);
  const clientes = crearControladorClientes(clienteServicio);
  const pedidos = crearControladorPedidos(pedidoServicio);

  const enrutador = new Enrutador()
    .agregar('GET', '/api/productos', productos.listar)
    .agregar('POST', '/api/productos', productos.crear)
    .agregar('PATCH', '/api/productos/:id/stock', productos.actualizarStock)

    .agregar('GET', '/api/clientes', clientes.listar)
    .agregar('POST', '/api/clientes', clientes.registrar)
    .agregar('GET', '/api/clientes/:id', clientes.obtener)

    .agregar('GET', '/api/pedidos', pedidos.listar)
    .agregar('POST', '/api/pedidos/cotizacion', pedidos.cotizar)
    .agregar('POST', '/api/pedidos', pedidos.registrar)
    .agregar('GET', '/api/pedidos/:id', pedidos.obtener)
    .agregar('POST', '/api/pedidos/:id/avanzar', pedidos.avanzar);

  return crearServidorHttp({ enrutador, servirEstatico: crearServidorEstatico(DIRECTORIO_WEB), registro });
}
