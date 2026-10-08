import { ok, creado } from './respuestas.js';
import { entero, idDeRuta, listaDeItems, texto } from '../validacion/validacionSintactica.js';

/** Extrae y valida sintácticamente el cuerpo común a cotizar/registrar. */
function leerSolicitudPedido(cuerpo) {
  return {
    clienteId: entero(cuerpo.clienteId, 'clienteId', { min: 1 }),
    items: listaDeItems(cuerpo.items),
    devPointsARedimir: entero(cuerpo.devPointsARedimir, 'devPointsARedimir', { min: 0, opcional: true, porDefecto: 0 }),
  };
}

/** Traduce HTTP ⇄ casos de uso de pedidos. No contiene reglas de negocio. */
export function crearControladorPedidos(pedidoServicio) {
  return {
    listar: async ({ query }) =>
      ok(
        await pedidoServicio.listar({
          clienteId: entero(query.clienteId, 'clienteId', { min: 1, opcional: true }),
          estado: query.estado === undefined ? undefined : texto(query.estado, 'estado', { max: 30 }),
        }),
      ),

    obtener: async ({ params }) => ok(await pedidoServicio.obtener(idDeRuta(params.id))),

    cotizar: async ({ cuerpo }) => ok(await pedidoServicio.cotizar(leerSolicitudPedido(cuerpo))),

    registrar: async ({ cuerpo }) => creado(await pedidoServicio.registrar(leerSolicitudPedido(cuerpo))),

    avanzar: async ({ params }) => ok(await pedidoServicio.avanzarEstado(idDeRuta(params.id))),
  };
}
