/**
 * Repositorio genérico (patrón Repository / DAO) sobre un AlmacenJson.
 * Solo consulta, guarda y actualiza: no evalúa ninguna regla de negocio.
 */
export class RepositorioJson {
  #almacen;

  /** @param {import('../AlmacenJson.js').AlmacenJson} almacen */
  constructor(almacen) {
    this.#almacen = almacen;
  }

  /** Lista registros; `filtro` compara por igualdad campo a campo. */
  async listar(filtro = {}) {
    const registros = await this.#almacen.leerTodos();
    const criterios = Object.entries(filtro);
    return criterios.length === 0
      ? registros
      : registros.filter((r) => criterios.every(([campo, valor]) => r[campo] === valor));
  }

  buscarPorId(id) {
    return this.#almacen.buscarPorId(id);
  }

  /** Inserta si el registro no tiene id; si lo tiene, lo actualiza. */
  guardar(registro) {
    return registro.id == null ? this.#almacen.insertar(registro) : this.#almacen.actualizar(registro);
  }
}
