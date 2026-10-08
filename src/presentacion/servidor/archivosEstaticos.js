import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TIPOS_MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
});

/**
 * Crea un manejador que sirve el cliente web (HTML/CSS/JS) desde `directorio`.
 * Bloquea cualquier intento de salir del directorio (path traversal).
 */
export function crearServidorEstatico(directorio) {
  const raiz = path.resolve(directorio);

  return async function servirEstatico(req, res, rutaUrl) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return 405;
    }
    const relativa = rutaUrl === '/' ? 'index.html' : decodeURIComponent(rutaUrl).replace(/^\/+/, '');
    const archivo = path.resolve(raiz, relativa);
    if (archivo !== raiz && !archivo.startsWith(raiz + path.sep)) {
      res.writeHead(403).end();
      return 403;
    }
    try {
      const contenido = await readFile(archivo);
      res.writeHead(200, {
        'Content-Type': TIPOS_MIME[path.extname(archivo)] ?? 'application/octet-stream',
        'Content-Length': contenido.length,
        'Cache-Control': 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : contenido);
      return 200;
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
      return 404;
    }
  };
}
