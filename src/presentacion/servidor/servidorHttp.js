import http from 'node:http';
import { enviarJson, leerCuerpoJson } from './utilidadesHttp.js';
import { traducirError } from './mapeoErrores.js';

const METODOS_CON_CUERPO = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Servidor HTTP construido sobre el módulo nativo `node:http`.
 *   /api/*  → enrutador + controladores (JSON)
 *   resto   → archivos estáticos del cliente web
 */
export function crearServidorHttp({ enrutador, servirEstatico, registro = console }) {
  async function atenderApi(req, res, url) {
    const ruta = enrutador.resolver(req.method, url.pathname);
    if (ruta.noEncontrada) {
      enviarJson(res, 404, { error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: `No existe ${url.pathname}` } });
      return 404;
    }
    if (ruta.metodoNoPermitido) {
      enviarJson(res, 405, { error: { codigo: 'METODO_NO_PERMITIDO', mensaje: `${req.method} no está permitido en ${url.pathname}` } });
      return 405;
    }
    const cuerpo = METODOS_CON_CUERPO.has(req.method) ? await leerCuerpoJson(req) : {};
    const query = Object.fromEntries(url.searchParams);
    const respuesta = await ruta.manejador({ params: ruta.params, query, cuerpo });
    enviarJson(res, respuesta.estadoHttp, respuesta.cuerpo);
    return respuesta.estadoHttp;
  }

  return http.createServer(async (req, res) => {
    const inicio = performance.now();
    const url = new URL(req.url, 'http://localhost');
    let estado = 500;
    try {
      estado = url.pathname.startsWith('/api/')
        ? await atenderApi(req, res, url)
        : await servirEstatico(req, res, url.pathname);
    } catch (error) {
      const { estadoHttp, cuerpo, inesperado } = traducirError(error);
      if (inesperado) registro.error(error);
      estado = estadoHttp;
      if (!res.headersSent) enviarJson(res, estadoHttp, cuerpo);
      else res.end();
    } finally {
      if (url.pathname.startsWith('/api/')) {
        registro.log(`${req.method} ${url.pathname} → ${estado} (${(performance.now() - inicio).toFixed(1)} ms)`);
      }
    }
  });
}
