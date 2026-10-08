import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';
import { Niveles } from '../reglas/niveles.js';
import { evaluarAscenso } from '../reglas/politicaLealtad.js';
import { devPointsGanados } from '../reglas/politicaDevPoints.js';

/**
 * Cliente: Identificador, Nombre, Correo, Nivel de lealtad,
 * Saldo de DevPoints y Monto acumulado de compras.
 */
export class Cliente {
  constructor({ id = null, nombre, correo, nivel, devPoints, montoAcumulado, fechaRegistro }) {
    this.id = id;
    this.nombre = nombre;
    this.correo = correo;
    this.nivel = nivel;
    this.devPoints = devPoints;
    this.montoAcumulado = montoAcumulado;
    this.fechaRegistro = fechaRegistro;
  }

  static normalizarCorreo(correo) {
    return String(correo ?? '').trim().toLowerCase();
  }

  /** Regla 2: todo cliente nuevo inicia en Junior con $0 acumulado (y 0 DevPoints). */
  static registrar({ nombre, correo }, fecha) {
    const nombreLimpio = String(nombre ?? '').trim();
    const correoLimpio = Cliente.normalizarCorreo(correo);
    if (!nombreLimpio) throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'El cliente debe tener un nombre.');
    if (!correoLimpio.includes('@')) throw new ErrorNegocio(CodigosError.DATOS_INVALIDOS, 'El correo del cliente no es válido.');
    return new Cliente({
      nombre: nombreLimpio,
      correo: correoLimpio,
      nivel: Niveles.JUNIOR,
      devPoints: 0,
      montoAcumulado: 0,
      fechaRegistro: fecha.toISOString(),
    });
  }

  verificarSaldoDevPoints(cantidad) {
    if (cantidad > this.devPoints) {
      throw new ErrorNegocio(
        CodigosError.DEVPOINTS_INSUFICIENTES,
        `No tienes suficientes DevPoints: intentas redimir ${cantidad} y tu saldo es ${this.devPoints}.`,
        { solicitado: cantidad, saldo: this.devPoints },
      );
    }
  }

  redimirDevPoints(cantidad) {
    this.verificarSaldoDevPoints(cantidad);
    this.devPoints -= cantidad;
  }

  /**
   * Reglas 2 y 3: al completarse un pedido se suma al acumulado, se otorgan
   * DevPoints y se evalúa el ascenso automático de nivel.
   */
  registrarCompraCompletada(totalPagado) {
    const nivelAnterior = this.nivel;
    const puntos = devPointsGanados(totalPagado);
    this.montoAcumulado += totalPagado;
    this.devPoints += puntos;
    this.nivel = evaluarAscenso(this.nivel, this.montoAcumulado);
    return {
      devPointsGanados: puntos,
      nivelAnterior,
      nivelNuevo: this.nivel,
      ascendio: this.nivel !== nivelAnterior,
    };
  }

  static desdeRegistro(registro) {
    return new Cliente(registro);
  }

  aRegistro() {
    return {
      id: this.id,
      nombre: this.nombre,
      correo: this.correo,
      nivel: this.nivel,
      devPoints: this.devPoints,
      montoAcumulado: this.montoAcumulado,
      fechaRegistro: this.fechaRegistro,
    };
  }
}
