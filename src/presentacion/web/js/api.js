/**
 * Cliente HTTP del navegador. Única puerta de salida de la UI:
 * la interfaz nunca accede a datos si no es a través de la API.
 */
async function solicitar(metodo, ruta, cuerpo) {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = new Error(datos?.error?.mensaje ?? `Error ${respuesta.status}`);
    error.codigo = datos?.error?.codigo;
    error.detalles = datos?.error?.detalles;
    throw error;
  }
  return datos;
}

export const api = {
  productos: () => solicitar('GET', '/productos'),
  crearProducto: (datos) => solicitar('POST', '/productos', datos),
  actualizarStock: (id, stock) => solicitar('PATCH', `/productos/${id}/stock`, { stock }),

  clientes: () => solicitar('GET', '/clientes'),
  cliente: (id) => solicitar('GET', `/clientes/${id}`),
  registrarCliente: (datos) => solicitar('POST', '/clientes', datos),

  pedidos: (filtro = {}) => solicitar('GET', `/pedidos?${new URLSearchParams(filtro)}`),
  cotizar: (solicitud) => solicitar('POST', '/pedidos/cotizacion', solicitud),
  registrarPedido: (solicitud) => solicitar('POST', '/pedidos', solicitud),
  avanzarPedido: (id) => solicitar('POST', `/pedidos/${id}/avanzar`),
};
