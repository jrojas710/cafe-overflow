import { ErrorNegocio, CodigosError } from '../../negocio/index.js';
import { ErrorValidacion } from '../validacion/validacionSintactica.js';

/**
 * Traducción de errores de negocio (semánticos) a códigos HTTP.
 * Esta decisión pertenece a la presentación: el negocio no conoce HTTP.
 */
const ESTADO_HTTP_POR_CODIGO = Object.freeze({
  [CodigosError.NO_ENCONTRADO]: 404,
  [CodigosError.DATOS_INVALIDOS]: 422,
  [CodigosError.PEDIDO_VACIO]: 422,
  [CodigosError.DEVPOINTS_INSUFICIENTES]: 422,
  [CodigosError.STOCK_INSUFICIENTE]: 409,
  [CodigosError.PEDIDO_PENDIENTE_EXISTENTE]: 409,
  [CodigosError.CORREO_DUPLICADO]: 409,
  [CodigosError.TRANSICION_INVALIDA]: 409,
});

/** @returns {{ estadoHttp: number, cuerpo: object, inesperado: boolean }} */
export function traducirError(error) {
  if (error instanceof ErrorValidacion) {
    return {
      estadoHttp: 400,
      cuerpo: { error: { codigo: 'SOLICITUD_INVALIDA', mensaje: error.message, campo: error.campo } },
      inesperado: false,
    };
  }
  if (error instanceof ErrorNegocio) {
    return {
      estadoHttp: ESTADO_HTTP_POR_CODIGO[error.codigo] ?? 422,
      cuerpo: { error: { codigo: error.codigo, mensaje: error.message, detalles: error.detalles } },
      inesperado: false,
    };
  }
  return {
    estadoHttp: 500,
    cuerpo: { error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' } },
    inesperado: true,
  };
}
