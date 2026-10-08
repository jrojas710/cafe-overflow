/**
 * CONTRATOS (interfaces) que la capa de negocio espera de la persistencia.
 *
 * La capa de negocio NUNCA importa la capa de persistencia: recibe objetos
 * que cumplen estos contratos por inyección de dependencias (ver src/app.js).
 * Así se puede cambiar JSON por SQLite/PostgreSQL/MongoDB, o por dobles en
 * memoria durante una prueba, sin tocar una sola regla de negocio.
 *
 * Todos los métodos son asíncronos y trabajan con "registros": objetos planos.
 *
 * @typedef {object} RepositorioProductos
 * @property {() => Promise<object[]>} listar
 * @property {(id: number) => Promise<object|null>} buscarPorId
 * @property {(registro: object) => Promise<object>} guardar  Inserta (asigna id) o actualiza.
 *
 * @typedef {object} RepositorioClientes
 * @property {() => Promise<object[]>} listar
 * @property {(id: number) => Promise<object|null>} buscarPorId
 * @property {(correo: string) => Promise<object|null>} buscarPorCorreo
 * @property {(registro: object) => Promise<object>} guardar
 *
 * @typedef {object} RepositorioPedidos
 * @property {(filtro?: {clienteId?: number, estado?: string}) => Promise<object[]>} listar
 * @property {(id: number) => Promise<object|null>} buscarPorId
 * @property {(registro: object) => Promise<object>} guardar
 */
export {};
