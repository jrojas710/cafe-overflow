import { ErrorValidacion } from '../validacion/validacionSintactica.js';

const LIMITE_CUERPO_BYTES = 100 * 1024;

export function enviarJson(res, estadoHttp, cuerpo) {
  const texto = JSON.stringify(cuerpo);
  res.writeHead(estadoHttp, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
  });
  res.end(texto);
}

/** Lee el cuerpo de la petición y lo interpreta como un objeto JSON. */
export async function leerCuerpoJson(req) {
  let tamano = 0;
  const partes = [];
  for await (const parte of req) {
    tamano += parte.length;
    if (tamano > LIMITE_CUERPO_BYTES) throw new ErrorValidacion('El cuerpo de la petición es demasiado grande.', 'cuerpo');
    partes.push(parte);
  }
  if (tamano === 0) return {};
  let datos;
  try {
    datos = JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch {
    throw new ErrorValidacion('El cuerpo de la petición no es un JSON válido.', 'cuerpo');
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new ErrorValidacion('El cuerpo de la petición debe ser un objeto JSON.', 'cuerpo');
  }
  return datos;
}
