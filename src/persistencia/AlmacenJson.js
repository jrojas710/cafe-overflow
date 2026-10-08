import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Almacén de una colección de registros sobre un archivo JSON.
 *
 * Formato del archivo:  { "secuencia": <último id>, "registros": [ ... ] }
 *
 * - Mantiene una caché en memoria y la carga de forma perezosa.
 * - Si el archivo no existe, lo crea a partir del archivo semilla.
 * - Escribe de forma atómica (archivo temporal + rename) y en serie.
 * - Devuelve siempre copias, para que nadie modifique la caché por referencia.
 *
 * Es un componente puramente técnico: no conoce ninguna regla de negocio.
 */
export class AlmacenJson {
  #ruta;
  #rutaSemilla;
  #datos = null;
  #cargando = null;
  #colaEscritura = Promise.resolve();

  constructor(ruta, rutaSemilla = null) {
    this.#ruta = ruta;
    this.#rutaSemilla = rutaSemilla;
  }

  async leerTodos() {
    const datos = await this.#cargar();
    return structuredClone(datos.registros);
  }

  async buscarPorId(id) {
    const datos = await this.#cargar();
    const registro = datos.registros.find((r) => r.id === id);
    return registro ? structuredClone(registro) : null;
  }

  async insertar(registro) {
    const datos = await this.#cargar();
    datos.secuencia += 1;
    const nuevo = { ...structuredClone(registro), id: datos.secuencia };
    datos.registros.push(nuevo);
    await this.#persistir();
    return structuredClone(nuevo);
  }

  async actualizar(registro) {
    const datos = await this.#cargar();
    const indice = datos.registros.findIndex((r) => r.id === registro.id);
    if (indice === -1) throw new Error(`No existe un registro con id ${registro.id} en ${path.basename(this.#ruta)}`);
    datos.registros[indice] = structuredClone(registro);
    await this.#persistir();
    return structuredClone(registro);
  }

  async #cargar() {
    if (this.#datos) return this.#datos;
    this.#cargando ??= this.#leerDelDisco();
    this.#datos = await this.#cargando;
    return this.#datos;
  }

  async #leerDelDisco() {
    try {
      return JSON.parse(await readFile(this.#ruta, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const inicial = this.#rutaSemilla
        ? JSON.parse(await readFile(this.#rutaSemilla, 'utf8'))
        : { secuencia: 0, registros: [] };
      await this.#escribir(inicial);
      return inicial;
    }
  }

  #persistir() {
    const instantanea = JSON.stringify(this.#datos, null, 2);
    this.#colaEscritura = this.#colaEscritura.catch(() => {}).then(() => this.#escribir(instantanea));
    return this.#colaEscritura;
  }

  async #escribir(contenido) {
    const texto = typeof contenido === 'string' ? contenido : JSON.stringify(contenido, null, 2);
    await mkdir(path.dirname(this.#ruta), { recursive: true });
    const temporal = `${this.#ruta}.${process.pid}.tmp`;
    await writeFile(temporal, texto + '\n', 'utf8');
    await rename(temporal, this.#ruta);
  }
}
