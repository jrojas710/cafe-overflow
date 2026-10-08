/**
 * Validación SINTÁCTICA en el navegador: campos requeridos y formato.
 * Da retroalimentación inmediata; el servidor vuelve a validar siempre.
 * Devuelve un mensaje de error o null.
 */
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requerido(valor, nombreCampo) {
  return String(valor ?? '').trim() === '' ? `${nombreCampo} es obligatorio.` : null;
}

export function formatoCorreo(valor) {
  return PATRON_CORREO.test(String(valor).trim()) ? null : 'El correo no tiene un formato válido.';
}

export function enteroMinimo(valor, minimo, nombreCampo) {
  const texto = String(valor ?? '').trim();
  if (!/^-?\d+$/.test(texto)) return `${nombreCampo} debe ser un número entero.`;
  return Number(texto) < minimo ? `${nombreCampo} debe ser mayor o igual a ${minimo}.` : null;
}

/** Ejecuta validaciones en orden y devuelve el primer error encontrado. */
export function primerError(...resultados) {
  return resultados.find(Boolean) ?? null;
}
