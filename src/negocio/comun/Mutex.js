/**
 * Exclusión mutua mínima basada en promesas.
 * Garantiza que dos operaciones que leen-validan-escriben (p. ej. descontar
 * stock) no se intercalen y provoquen sobreventa.
 */
export class Mutex {
  #cola = Promise.resolve();

  ejecutar(operacion) {
    const resultado = this.#cola.then(operacion);
    this.#cola = resultado.catch(() => {});
    return resultado;
  }
}
