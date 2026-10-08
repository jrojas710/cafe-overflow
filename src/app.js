/**
 * RAÍZ DE COMPOSICIÓN (Composition Root).
 *
 * Único lugar que conoce las tres capas a la vez. Construye las dependencias
 * de abajo hacia arriba y las inyecta:
 *
 *   Persistencia (repositorios JSON)
 *        ↓ inyectados en
 *   Negocio (servicios / casos de uso)
 *        ↓ inyectados en
 *   Presentación (servidor HTTP + controladores + cliente web)
 */
import { crearRepositoriosJson } from './persistencia/index.js';
import { crearServicios } from './negocio/index.js';
import { crearAplicacionWeb } from './presentacion/index.js';

export function crearAplicacion({ directorioDatos, registro = console }) {
  const repositorios = crearRepositoriosJson({ directorioDatos });
  const servicios = crearServicios(repositorios);
  return crearAplicacionWeb(servicios, { registro });
}
