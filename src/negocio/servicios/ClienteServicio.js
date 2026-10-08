import { Cliente } from '../entidades/Cliente.js';
import { EstadosPedido } from '../entidades/Pedido.js';
import { ErrorNegocio, CodigosError } from '../errores/ErrorNegocio.js';
import { porcentajeDescuentoPorNivel } from '../reglas/politicaDescuentos.js';
import { progresoHaciaSiguienteNivel } from '../reglas/politicaLealtad.js';
import { valorDeDevPoints } from '../reglas/politicaDevPoints.js';
import { Mutex } from '../comun/Mutex.js';

/** Casos de uso de clientes y programa de lealtad. */
export class ClienteServicio {
  #clientes;
  #pedidos;
  #reloj;
  #mutex;

  constructor({ clienteRepositorio, pedidoRepositorio, reloj = () => new Date(), mutex = new Mutex() }) {
    this.#clientes = clienteRepositorio;
    this.#pedidos = pedidoRepositorio;
    this.#reloj = reloj;
    this.#mutex = mutex;
  }

  async listar() {
    const registros = await this.#clientes.listar();
    const perfiles = await Promise.all(registros.map((r) => this.#construirPerfil(Cliente.desdeRegistro(r))));
    return perfiles.sort((a, b) => a.id - b.id);
  }

  async obtenerPerfil(id) {
    const registro = await this.#clientes.buscarPorId(id);
    if (!registro) throw new ErrorNegocio(CodigosError.NO_ENCONTRADO, `No existe el cliente #${id}.`);
    return this.#construirPerfil(Cliente.desdeRegistro(registro));
  }

  registrar(datos) {
    return this.#mutex.ejecutar(async () => {
      const cliente = Cliente.registrar(datos, this.#reloj());
      const existente = await this.#clientes.buscarPorCorreo(cliente.correo);
      if (existente) {
        throw new ErrorNegocio(CodigosError.CORREO_DUPLICADO, `Ya existe un cliente registrado con el correo ${cliente.correo}.`);
      }
      const guardado = await this.#clientes.guardar(cliente.aRegistro());
      return this.#construirPerfil(Cliente.desdeRegistro(guardado));
    });
  }

  /**
   * Perfil de lealtad: todo lo que la UI necesita mostrar ya viene calculado
   * aquí (porcentaje de descuento, valor de los puntos, progreso de nivel),
   * para que la presentación no evalúe ninguna regla.
   */
  async #construirPerfil(cliente) {
    const pendientes = await this.#pedidos.listar({ clienteId: cliente.id, estado: EstadosPedido.PENDIENTE_PAGO });
    return {
      ...cliente.aRegistro(),
      porcentajeDescuento: porcentajeDescuentoPorNivel(cliente.nivel),
      valorDevPoints: valorDeDevPoints(cliente.devPoints),
      progreso: progresoHaciaSiguienteNivel(cliente.nivel, cliente.montoAcumulado),
      pedidoPendienteId: pendientes[0]?.id ?? null,
    };
  }
}
