/**
 * Enrutador HTTP mínimo (sin frameworks).
 * Soporta parámetros de ruta con la sintaxis `/api/pedidos/:id`.
 */
export class Enrutador {
  #rutas = [];

  agregar(metodo, patron, manejador) {
    const nombres = [];
    const expresion = patron.replace(/:(\w+)/g, (_, nombre) => {
      nombres.push(nombre);
      return '([^/]+)';
    });
    this.#rutas.push({ metodo, regex: new RegExp(`^${expresion}/?$`), nombres, manejador });
    return this;
  }

  /**
   * @returns {{ manejador: Function, params: object } | { noEncontrada: true } | { metodoNoPermitido: true }}
   */
  resolver(metodo, ruta) {
    let existeRuta = false;
    for (const r of this.#rutas) {
      const coincidencia = r.regex.exec(ruta);
      if (!coincidencia) continue;
      existeRuta = true;
      if (r.metodo !== metodo) continue;
      const params = Object.fromEntries(r.nombres.map((n, i) => [n, decodeURIComponent(coincidencia[i + 1])]));
      return { manejador: r.manejador, params };
    }
    return existeRuta ? { metodoNoPermitido: true } : { noEncontrada: true };
  }
}
