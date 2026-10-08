/**
 * Controlador de la interfaz (cliente liviano / thin client).
 *
 * Responsabilidades permitidas: capturar eventos, validar sintácticamente,
 * llamar a la API y renderizar. PROHIBIDO: calcular totales, aplicar
 * descuentos, evaluar ascensos de nivel o acceder a datos directamente.
 */
import { api } from './api.js';
import * as vistas from './vistas.js';
import { requerido, formatoCorreo, enteroMinimo, primerError } from './validacion.js';
import { ETIQUETA_NIVEL, ETIQUETA_ESTADO, dinero } from './formato.js';

const $ = (selector) => document.querySelector(selector);

const estado = {
  clientes: [],
  clienteId: null,
  productos: [],
  /** Entradas tal como el usuario las agregó; el servidor las consolida. */
  carrito: [],
  devPoints: 0,
  cotizacion: null,
  cotizacionVigente: false,
  errorCarrito: null,
  enviando: false,
  pestana: 'menu',
};

const perfilActual = () => estado.clientes.find((c) => c.id === estado.clienteId) ?? null;

// ───────────────────────────── utilidades ─────────────────────────────

const CLAVE_CLIENTE = 'cafe-overflow.clienteId';
function recordarCliente(id) {
  try { localStorage.setItem(CLAVE_CLIENTE, String(id)); } catch { /* almacenamiento no disponible */ }
}
function clienteRecordado() {
  try { return Number(localStorage.getItem(CLAVE_CLIENTE)) || null; } catch { return null; }
}

function avisar(mensaje, tipo = 'info') {
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.setAttribute('role', 'status');
  aviso.textContent = mensaje;
  $('#avisos').append(aviso);
  setTimeout(() => aviso.classList.add('aviso--saliendo'), 4200);
  setTimeout(() => aviso.remove(), 4700);
}

function mostrarMensaje(elemento, texto, tipo = 'error') {
  elemento.textContent = texto ?? '';
  elemento.dataset.tipo = texto ? tipo : '';
}

// ───────────────────────────── renderizado ─────────────────────────────

function renderClientes() {
  $('#selector-cliente').innerHTML = vistas.opcionesClientes(estado.clientes, estado.clienteId);
  $('#tarjeta-lealtad').innerHTML = vistas.tarjetaLealtad(perfilActual());
}

function renderProductos() {
  $('#lista-productos').innerHTML = vistas.productos(estado.productos);
  $('#tabla-inventario').innerHTML = vistas.tablaInventario(estado.productos);
}

function renderCarrito() {
  const perfil = perfilActual();
  const cotizacion = estado.cotizacionVigente ? estado.cotizacion : null;
  const nombres = new Map(estado.productos.map((p) => [p.id, p.nombre]));

  $('#carrito-lineas').innerHTML = vistas.lineasCarrito(estado.carrito, cotizacion, nombres);

  const resumen = $('#carrito-resumen');
  resumen.innerHTML = vistas.resumenCotizacion(estado.cotizacion);
  resumen.classList.toggle('resumen--desactualizado', !estado.cotizacionVigente);

  const ayuda = $('#devpoints-ayuda');
  if (!perfil) ayuda.textContent = '';
  else if (cotizacion && cotizacion.devPointsRedimidos < cotizacion.devPointsSolicitados) {
    ayuda.textContent = `Solo se aplican ${cotizacion.devPointsRedimidos} DevPoints: el total no puede quedar en negativo.`;
  } else {
    ayuda.textContent = `Saldo: ${perfil.devPoints} DevPoints (= ${dinero(perfil.valorDevPoints)}). Cada punto vale $200.`;
  }

  const mensaje = $('#carrito-mensaje');
  if (!perfil) mostrarMensaje(mensaje, 'Selecciona un cliente para cotizar tu pedido.', 'info');
  else if (estado.errorCarrito) mostrarMensaje(mensaje, estado.errorCarrito);
  else if (perfil.pedidoPendienteId) mostrarMensaje(mensaje, `Paga el pedido #${perfil.pedidoPendienteId} antes de registrar uno nuevo.`, 'info');
  else mostrarMensaje(mensaje, '');

  $('#btn-confirmar').disabled =
    estado.enviando || !perfil || !cotizacion || estado.carrito.length === 0 || Boolean(perfil.pedidoPendienteId);
}

// ───────────────────────────── carga de datos ─────────────────────────────

async function cargarClientes() {
  estado.clientes = await api.clientes();
  if (!perfilActual()) estado.clienteId = estado.clientes[0]?.id ?? null;
  renderClientes();
}

async function cargarProductos() {
  estado.productos = await api.productos();
  renderProductos();
}

async function cargarMisPedidos() {
  const contenedor = $('#lista-mis-pedidos');
  if (!estado.clienteId) {
    contenedor.innerHTML = '<p class="vacio">Selecciona un cliente para ver sus pedidos.</p>';
    return;
  }
  contenedor.innerHTML = vistas.misPedidos(await api.pedidos({ clienteId: estado.clienteId }));
}

async function cargarBarra() {
  $('#tablero-barra').innerHTML = vistas.tablero(await api.pedidos());
}

// ───────────────────────────── cotización ─────────────────────────────

let temporizadorCotizacion;
let secuenciaCotizacion = 0;

function programarCotizacion() {
  estado.cotizacionVigente = false;
  estado.errorCarrito = null;
  renderCarrito();
  clearTimeout(temporizadorCotizacion);
  temporizadorCotizacion = setTimeout(cotizar, 220);
}

async function cotizar() {
  const turno = ++secuenciaCotizacion;
  if (!estado.clienteId || estado.carrito.length === 0) {
    estado.cotizacion = null;
    renderCarrito();
    return;
  }
  try {
    const cotizacion = await api.cotizar({
      clienteId: estado.clienteId,
      items: estado.carrito,
      devPointsARedimir: estado.devPoints,
    });
    if (turno !== secuenciaCotizacion) return; // llegó una respuesta más nueva
    estado.cotizacion = cotizacion;
    estado.cotizacionVigente = true;
    estado.errorCarrito = null;
  } catch (error) {
    if (turno !== secuenciaCotizacion) return;
    estado.cotizacion = null;
    estado.errorCarrito = error.message;
  }
  renderCarrito();
}

// ───────────────────────────── acciones ─────────────────────────────

function agregarAlCarrito(productoId) {
  const entrada = document.querySelector(`[data-cantidad-para="${productoId}"]`);
  const error = enteroMinimo(entrada.value, 1, 'La cantidad');
  if (error) return avisar(error, 'error');
  estado.carrito.push({ productoId, cantidad: Number(entrada.value) });
  entrada.value = '1';
  const producto = estado.productos.find((p) => p.id === productoId);
  avisar(`Agregado: ${producto?.nombre ?? 'producto'}`);
  programarCotizacion();
}

function cambiarCantidad(productoId, valor) {
  const error = enteroMinimo(valor, 1, 'La cantidad');
  if (error) {
    estado.errorCarrito = error;
    return renderCarrito();
  }
  estado.carrito = [...estado.carrito.filter((e) => e.productoId !== productoId), { productoId, cantidad: Number(valor) }];
  programarCotizacion();
}

function quitarDelCarrito(productoId) {
  estado.carrito = estado.carrito.filter((e) => e.productoId !== productoId);
  programarCotizacion();
}

function cambiarDevPoints(valor) {
  const error = enteroMinimo(valor === '' ? '0' : valor, 0, 'Los DevPoints a redimir');
  if (error) {
    estado.errorCarrito = error;
    estado.cotizacionVigente = false;
    return renderCarrito();
  }
  estado.devPoints = Number(valor || 0);
  programarCotizacion();
}

async function confirmarPedido() {
  estado.enviando = true;
  renderCarrito();
  try {
    const pedido = await api.registrarPedido({
      clienteId: estado.clienteId,
      items: estado.carrito,
      devPointsARedimir: estado.devPoints,
    });
    avisar(`Pedido #${pedido.id} registrado por ${dinero(pedido.total)}. Queda pendiente de pago.`, 'exito');
    estado.carrito = [];
    estado.devPoints = 0;
    estado.cotizacion = null;
    $('#devpoints-redimir').value = '0';
    await Promise.all([cargarProductos(), cargarClientes()]);
    cambiarPestana('mis-pedidos');
  } catch (error) {
    estado.errorCarrito = error.message;
    if (error.codigo === 'STOCK_INSUFICIENTE') await cargarProductos();
  } finally {
    estado.enviando = false;
    renderCarrito();
  }
}

async function avanzarPedido(id) {
  try {
    const { pedido, lealtad } = await api.avanzarPedido(id);
    avisar(`Pedido #${pedido.id}: ${ETIQUETA_ESTADO[pedido.estado]}.`, 'exito');
    if (lealtad) {
      avisar(`${pedido.cliente.nombre} ganó ${lealtad.devPointsGanados} DevPoints.`, 'exito');
      if (lealtad.ascendio) {
        avisar(`🎉 ${pedido.cliente.nombre} ascendió de ${ETIQUETA_NIVEL[lealtad.nivelAnterior]} a ${ETIQUETA_NIVEL[lealtad.nivelNuevo]}!`, 'celebracion');
      }
    }
  } catch (error) {
    avisar(error.message, 'error');
  }
  await cargarClientes();
  programarCotizacion();
  if (estado.pestana === 'barra') await cargarBarra();
  if (estado.pestana === 'mis-pedidos') await cargarMisPedidos();
}

async function registrarCliente(formulario) {
  const datos = Object.fromEntries(new FormData(formulario));
  const mensaje = formulario.querySelector('[data-mensaje]');
  const error = primerError(requerido(datos.nombre, 'El nombre'), requerido(datos.correo, 'El correo'), formatoCorreo(datos.correo));
  if (error) return mostrarMensaje(mensaje, error);
  try {
    const cliente = await api.registrarCliente({ nombre: datos.nombre, correo: datos.correo });
    $('#dialogo-cliente').close();
    formulario.reset();
    mostrarMensaje(mensaje, '');
    avisar(`Bienvenido/a, ${cliente.nombre}. Empiezas como Junior.`, 'exito');
    await cargarClientes();
    seleccionarCliente(cliente.id);
  } catch (e) {
    mostrarMensaje(mensaje, e.message);
  }
}

async function crearProducto(formulario) {
  const datos = Object.fromEntries(new FormData(formulario));
  const mensaje = formulario.querySelector('[data-mensaje]');
  const error = primerError(
    requerido(datos.nombre, 'El nombre'),
    enteroMinimo(datos.precio, 1, 'El precio'),
    enteroMinimo(datos.stock, 0, 'El stock'),
  );
  if (error) return mostrarMensaje(mensaje, error);
  try {
    const producto = await api.crearProducto({ nombre: datos.nombre, precio: Number(datos.precio), stock: Number(datos.stock) });
    formulario.reset();
    mostrarMensaje(mensaje, '');
    avisar(`"${producto.nombre}" agregado al menú.`, 'exito');
    await cargarProductos();
  } catch (e) {
    mostrarMensaje(mensaje, e.message);
  }
}

async function actualizarStock(formulario) {
  const id = Number(formulario.dataset.stockForm);
  const valor = formulario.elements.stock.value;
  const error = enteroMinimo(valor, 0, 'El stock');
  if (error) return avisar(error, 'error');
  try {
    const producto = await api.actualizarStock(id, Number(valor));
    avisar(`Stock de "${producto.nombre}": ${producto.stock}.`, 'exito');
    await cargarProductos();
    programarCotizacion();
  } catch (e) {
    avisar(e.message, 'error');
  }
}

function seleccionarCliente(id) {
  estado.clienteId = id;
  estado.devPoints = 0;
  $('#devpoints-redimir').value = '0';
  recordarCliente(id);
  renderClientes();
  programarCotizacion();
  if (estado.pestana === 'mis-pedidos') cargarMisPedidos();
}

// ───────────────────────────── pestañas ─────────────────────────────

let sondeoBarra;

function cambiarPestana(nombre) {
  estado.pestana = nombre;
  document.querySelectorAll('[data-pestana]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pestana === nombre)));
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== nombre; });

  clearInterval(sondeoBarra);
  const cargas = {
    menu: () => Promise.all([cargarProductos(), cargarClientes()]).then(programarCotizacion),
    'mis-pedidos': () => Promise.all([cargarMisPedidos(), cargarClientes()]),
    barra: cargarBarra,
    inventario: cargarProductos,
  };
  cargas[nombre]().catch((e) => avisar(e.message, 'error'));
  if (nombre === 'barra') sondeoBarra = setInterval(() => cargarBarra().catch(() => {}), 5000);
}

// ───────────────────────────── eventos ─────────────────────────────

function enlazarEventos() {
  document.querySelector('.pestanas').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-pestana]');
    if (boton) cambiarPestana(boton.dataset.pestana);
  });

  $('#selector-cliente').addEventListener('change', (e) => seleccionarCliente(Number(e.target.value)));

  $('#lista-productos').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion="agregar"]');
    if (boton) agregarAlCarrito(Number(boton.dataset.id));
  });

  $('#carrito-lineas').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion="quitar"]');
    if (boton) quitarDelCarrito(Number(boton.dataset.id));
  });
  $('#carrito-lineas').addEventListener('change', (e) => {
    const entrada = e.target.closest('[data-linea-producto]');
    if (entrada) cambiarCantidad(Number(entrada.dataset.lineaProducto), entrada.value);
  });

  $('#devpoints-redimir').addEventListener('input', (e) => cambiarDevPoints(e.target.value));
  $('#btn-usar-todos').addEventListener('click', () => {
    const perfil = perfilActual();
    if (!perfil) return;
    $('#devpoints-redimir').value = String(perfil.devPoints);
    cambiarDevPoints(String(perfil.devPoints));
  });
  $('#btn-confirmar').addEventListener('click', confirmarPedido);

  $('#lista-mis-pedidos').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion="pagar"]');
    if (boton) { boton.disabled = true; avanzarPedido(Number(boton.dataset.id)); }
  });

  $('#tablero-barra').addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion="avanzar"]');
    if (boton) { boton.disabled = true; avanzarPedido(Number(boton.dataset.id)); }
  });

  $('#tabla-inventario').addEventListener('submit', (e) => {
    e.preventDefault();
    actualizarStock(e.target);
  });
  $('#form-producto').addEventListener('submit', (e) => {
    e.preventDefault();
    crearProducto(e.target);
  });

  const dialogo = $('#dialogo-cliente');
  $('#btn-nuevo-cliente').addEventListener('click', () => dialogo.showModal());
  dialogo.querySelector('[data-cerrar]').addEventListener('click', () => dialogo.close());
  $('#form-cliente').addEventListener('submit', (e) => {
    e.preventDefault();
    registrarCliente(e.target);
  });
}

// ───────────────────────────── inicio ─────────────────────────────

async function iniciar() {
  enlazarEventos();
  estado.clienteId = clienteRecordado();
  try {
    await Promise.all([cargarClientes(), cargarProductos()]);
    renderCarrito();
  } catch (error) {
    avisar(`No se pudo conectar con el servidor: ${error.message}`, 'error');
  }
}

iniciar();
