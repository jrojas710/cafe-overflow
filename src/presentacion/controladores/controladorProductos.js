import { ok, creado } from './respuestas.js';
import { texto, entero, idDeRuta } from '../validacion/validacionSintactica.js';

/** Traduce HTTP ⇄ casos de uso de productos. No contiene reglas de negocio. */
export function crearControladorProductos(productoServicio) {
  return {
    listar: async () => ok(await productoServicio.listar()),

    crear: async ({ cuerpo }) =>
      creado(
        await productoServicio.crear({
          nombre: texto(cuerpo.nombre, 'nombre', { max: 80 }),
          precio: entero(cuerpo.precio, 'precio', { min: 1 }),
          stock: entero(cuerpo.stock, 'stock', { min: 0 }),
        }),
      ),

    actualizarStock: async ({ params, cuerpo }) =>
      ok(await productoServicio.actualizarStock(idDeRuta(params.id), entero(cuerpo.stock, 'stock', { min: 0 }))),
  };
}
