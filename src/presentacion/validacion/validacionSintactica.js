/**
 * Validación SINTÁCTICA de las solicitudes HTTP (tipos, campos requeridos,
 * formato de correo). Es lo único que la presentación puede validar: las
 * reglas de negocio (stock, niveles, DevPoints, pedidos pendientes) viven en
 * la capa de negocio.
 */
export class ErrorValidacion extends Error {
  constructor(mensaje, campo) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.campo = campo;
  }
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function texto(valor, campo, { max = 120 } = {}) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErrorValidacion(`El campo "${campo}" es obligatorio.`, campo);
  }
  const limpio = valor.trim();
  if (limpio.length > max) throw new ErrorValidacion(`El campo "${campo}" admite máximo ${max} caracteres.`, campo);
  return limpio;
}

export function correo(valor, campo = 'correo') {
  const limpio = texto(valor, campo, { max: 160 });
  if (!PATRON_CORREO.test(limpio)) throw new ErrorValidacion(`El campo "${campo}" no tiene formato de correo válido.`, campo);
  return limpio;
}

export function entero(valor, campo, { min, opcional = false, porDefecto } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (opcional) return porDefecto;
    throw new ErrorValidacion(`El campo "${campo}" es obligatorio.`, campo);
  }
  const numero = typeof valor === 'string' && /^-?\d+$/.test(valor.trim()) ? Number(valor) : valor;
  if (!Number.isInteger(numero)) throw new ErrorValidacion(`El campo "${campo}" debe ser un número entero.`, campo);
  if (min !== undefined && numero < min) throw new ErrorValidacion(`El campo "${campo}" debe ser mayor o igual a ${min}.`, campo);
  return numero;
}

export function idDeRuta(valor) {
  return entero(valor, 'id', { min: 1 });
}

export function listaDeItems(valor, campo = 'items') {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new ErrorValidacion(`El campo "${campo}" debe ser una lista con al menos un producto.`, campo);
  }
  return valor.map((item, i) => {
    if (typeof item !== 'object' || item === null) throw new ErrorValidacion(`${campo}[${i}] debe ser un objeto.`, campo);
    return {
      productoId: entero(item.productoId, `${campo}[${i}].productoId`, { min: 1 }),
      cantidad: entero(item.cantidad, `${campo}[${i}].cantidad`, { min: 1 }),
    };
  });
}
