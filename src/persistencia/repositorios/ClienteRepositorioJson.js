import { RepositorioJson } from './RepositorioJson.js';

/** Acceso a datos de clientes (clientes.json). */
export class ClienteRepositorioJson extends RepositorioJson {
  async buscarPorCorreo(correo) {
    const [registro] = await this.listar({ correo });
    return registro ?? null;
  }
}
