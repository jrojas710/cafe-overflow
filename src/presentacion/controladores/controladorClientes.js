import { ok, creado } from './respuestas.js';
import { texto, correo, idDeRuta } from '../validacion/validacionSintactica.js';

/** Traduce HTTP ⇄ casos de uso de clientes. No contiene reglas de negocio. */
export function crearControladorClientes(clienteServicio) {
  return {
    listar: async () => ok(await clienteServicio.listar()),

    obtener: async ({ params }) => ok(await clienteServicio.obtenerPerfil(idDeRuta(params.id))),

    registrar: async ({ cuerpo }) =>
      creado(
        await clienteServicio.registrar({
          nombre: texto(cuerpo.nombre, 'nombre', { max: 80 }),
          correo: correo(cuerpo.correo),
        }),
      ),
  };
}
