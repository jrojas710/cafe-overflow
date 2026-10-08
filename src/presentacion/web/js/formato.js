/** Formateo de datos para mostrar. Solo presentación: aquí no se calcula nada. */
const moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const hora = new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' });

export const dinero = (valor) => moneda.format(valor);
export const fecha = (iso) => fechaHora.format(new Date(iso));
export const soloHora = (iso) => hora.format(new Date(iso));

export const ETIQUETA_ESTADO = Object.freeze({
  PENDIENTE_PAGO: 'Pendiente de pago',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
});

export const ETIQUETA_NIVEL = Object.freeze({ JUNIOR: 'Junior', MID: 'Mid', SENIOR: 'Senior' });

export function iniciales(nombre) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escapa texto antes de insertarlo como HTML (previene XSS). */
export const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
