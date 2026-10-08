/**
 * Funciones de renderizado: reciben datos YA calculados por el servidor y
 * devuelven HTML. No calculan totales, descuentos ni niveles.
 */
import { dinero, fecha, soloHora, esc, iniciales, ETIQUETA_ESTADO, ETIQUETA_NIVEL } from './formato.js';

const claseNivel = (nivel) => `nivel--${String(nivel).toLowerCase()}`;
const claseEstado = (estado) => `estado--${String(estado).toLowerCase()}`;
const idCorto = (id) => `#${String(id).padStart(2, '0')}`;

export function opcionesClientes(clientes, clienteId) {
  if (clientes.length === 0) return '<option value="">— Registra un cliente —</option>';
  return clientes
    .map((c) => `<option value="${c.id}" ${c.id === clienteId ? 'selected' : ''}>${esc(c.nombre)} · ${ETIQUETA_NIVEL[c.nivel]}</option>`)
    .join('');
}

export function tarjetaLealtad(perfil) {
  if (!perfil) {
    return '<p class="lealtad__vacio">Selecciona o registra un cliente para empezar a pedir.</p>';
  }
  const { progreso } = perfil;
  const textoProgreso = progreso.siguienteNivel
    ? `Te faltan <b>${dinero(progreso.montoFaltante)}</b> en compras completadas para ser <b>${ETIQUETA_NIVEL[progreso.siguienteNivel]}</b>`
    : '<b>Nivel máximo alcanzado.</b> Gracias por ser parte del core team ☕';

  return `
    <div class="lealtad__cliente">
      <span class="avatar ${claseNivel(perfil.nivel)}" aria-hidden="true">${esc(iniciales(perfil.nombre))}</span>
      <div class="lealtad__identidad">
        <strong>${esc(perfil.nombre)}</strong>
        <span class="lealtad__correo">${esc(perfil.correo)}</span>
      </div>
      <span class="nivel ${claseNivel(perfil.nivel)}">&lt;${ETIQUETA_NIVEL[perfil.nivel]} /&gt;</span>
    </div>
    <div class="lealtad__datos">
      <div class="dato"><span class="dato__etiqueta">Descuento</span><span class="dato__valor">${perfil.porcentajeDescuento}%</span></div>
      <div class="dato"><span class="dato__etiqueta">DevPoints</span><span class="dato__valor">${perfil.devPoints}</span><span class="dato__sub">= ${dinero(perfil.valorDevPoints)}</span></div>
      <div class="dato"><span class="dato__etiqueta">Acumulado</span><span class="dato__valor">${dinero(perfil.montoAcumulado)}</span></div>
    </div>
    <div class="lealtad__progreso">
      <p class="lealtad__texto">${textoProgreso}</p>
      <div class="barra-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progreso.porcentaje}">
        <span style="width:${progreso.porcentaje}%"></span>
      </div>
      ${perfil.pedidoPendienteId ? `<p class="alerta">Tienes el pedido ${idCorto(perfil.pedidoPendienteId)} pendiente de pago.</p>` : ''}
    </div>`;
}

export function productos(lista) {
  if (lista.length === 0) return '<p class="vacio">No hay productos en el menú.</p>';
  return lista
    .map((p) => {
      const agotado = p.stock === 0;
      const claseStock = agotado ? 'producto__stock--agotado' : p.stock <= 5 ? 'producto__stock--bajo' : '';
      return `
      <article class="producto ${agotado ? 'producto--agotado' : ''}">
        <span class="producto__id">${idCorto(p.id)}</span>
        <h3 class="producto__nombre">${esc(p.nombre)}</h3>
        <p class="producto__precio">${dinero(p.precio)}</p>
        <p class="producto__stock ${claseStock}">${agotado ? 'Agotado' : `${p.stock} disponibles`}</p>
        <div class="producto__acciones">
          <input class="campo campo--cantidad" type="number" min="1" step="1" value="1" inputmode="numeric"
                 data-cantidad-para="${p.id}" aria-label="Cantidad de ${esc(p.nombre)}" ${agotado ? 'disabled' : ''}>
          <button class="btn btn--primario btn--chico" type="button" data-accion="agregar" data-id="${p.id}" ${agotado ? 'disabled' : ''}>Agregar</button>
        </div>
      </article>`;
    })
    .join('');
}

/**
 * Líneas del carrito. Si hay cotización del servidor, se usan sus líneas
 * consolidadas (con subtotales calculados por el negocio). Si no, se listan
 * las entradas tal como el usuario las agregó, sin importes.
 */
export function lineasCarrito(entradas, cotizacion, nombrePorId) {
  if (entradas.length === 0) {
    return '<li class="carrito__vacio">Tu pedido está vacío.<br>Agrega algo del menú ☕</li>';
  }
  const lineas = cotizacion?.lineas ?? entradas.map((e) => ({ ...e, nombre: nombrePorId.get(e.productoId) ?? `Producto ${e.productoId}` }));
  return lineas
    .map(
      (l) => `
      <li class="linea">
        <div class="linea__info">
          <span class="linea__nombre">${esc(l.nombre)}</span>
          ${l.precioUnitario !== undefined ? `<span class="linea__unitario">${dinero(l.precioUnitario)} c/u</span>` : ''}
        </div>
        <input class="campo campo--cantidad campo--mini" type="number" min="1" step="1" value="${l.cantidad}"
               data-linea-producto="${l.productoId}" aria-label="Cantidad de ${esc(l.nombre)}">
        <span class="linea__subtotal">${l.subtotal !== undefined ? dinero(l.subtotal) : '…'}</span>
        <button class="btn-icono" type="button" data-accion="quitar" data-id="${l.productoId}" aria-label="Quitar ${esc(l.nombre)}">×</button>
      </li>`,
    )
    .join('');
}

export function resumenCotizacion(c) {
  if (!c) return '';
  return `
    <div><dt>Subtotal (${c.cantidadArticulos} art.)</dt><dd>${dinero(c.subtotal)}</dd></div>
    <div class="resumen__descuento"><dt>Descuento ${ETIQUETA_NIVEL[c.nivel]} (${c.porcentajeDescuento}%)</dt><dd>− ${dinero(c.descuentoNivel)}</dd></div>
    ${c.devPointsRedimidos > 0 ? `<div class="resumen__descuento"><dt>DevPoints (${c.devPointsRedimidos})</dt><dd>− ${dinero(c.descuentoDevPoints)}</dd></div>` : ''}
    <div class="resumen__total"><dt>Total</dt><dd>${dinero(c.total)}</dd></div>
    <div class="resumen__ganancia"><dt>Ganarás al recibirlo</dt><dd>+${c.devPointsAGanar} DevPoints</dd></div>`;
}

function itemsPedido(items) {
  return items
    .map((i) => `<li><span>${i.cantidad} × ${esc(i.nombre)}</span><span>${dinero(i.subtotal)}</span></li>`)
    .join('');
}

export function misPedidos(lista) {
  if (lista.length === 0) return '<p class="vacio">Aún no tienes pedidos. ¡El primer café siempre compila!</p>';
  return lista
    .map(
      (p) => `
      <article class="pedido tarjeta">
        <header class="pedido__cabecera">
          <span class="pedido__id">${idCorto(p.id)}</span>
          <span class="estado ${claseEstado(p.estado)}">${ETIQUETA_ESTADO[p.estado]}</span>
          <time class="pedido__fecha" datetime="${p.fecha}">${fecha(p.fecha)}</time>
        </header>
        <ul class="pedido__items">${itemsPedido(p.items)}</ul>
        <dl class="resumen resumen--compacto">
          <div><dt>Subtotal</dt><dd>${dinero(p.subtotal)}</dd></div>
          <div class="resumen__descuento"><dt>Descuento (${p.porcentajeDescuento}%)</dt><dd>− ${dinero(p.descuentoNivel)}</dd></div>
          ${p.devPointsRedimidos > 0 ? `<div class="resumen__descuento"><dt>DevPoints (${p.devPointsRedimidos})</dt><dd>− ${dinero(p.descuentoDevPoints)}</dd></div>` : ''}
          <div class="resumen__total"><dt>Total</dt><dd>${dinero(p.total)}</dd></div>
        </dl>
        <ol class="historial">
          ${p.historial.map((h) => `<li><span>${ETIQUETA_ESTADO[h.estado]}</span><time datetime="${h.fecha}">${soloHora(h.fecha)}</time></li>`).join('')}
        </ol>
        <footer class="pedido__pie">
          ${p.estado === 'PENDIENTE_PAGO' ? `<button class="btn btn--primario" type="button" data-accion="pagar" data-id="${p.id}">Pagar ${dinero(p.total)}</button>` : ''}
          ${p.completado ? `<span class="ganancia">+${p.devPointsGanados} DevPoints ganados</span>` : ''}
        </footer>
      </article>`,
    )
    .join('');
}

const COLUMNAS_TABLERO = ['PENDIENTE_PAGO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
const MAX_ENTREGADOS_VISIBLES = 8;

function textoBotonAvance(siguiente) {
  return siguiente === 'EN_PREPARACION' ? 'Registrar pago' : `Mover a ${ETIQUETA_ESTADO[siguiente]}`;
}

export function tablero(pedidos) {
  return COLUMNAS_TABLERO.map((estado) => {
    let delEstado = pedidos.filter((p) => p.estado === estado);
    if (estado === 'ENTREGADO') delEstado = delEstado.slice(0, MAX_ENTREGADOS_VISIBLES);
    const tarjetas = delEstado
      .map(
        (p) => `
        <article class="ticket">
          <header class="ticket__cabecera">
            <span class="pedido__id">${idCorto(p.id)}</span>
            <time datetime="${p.fecha}">${soloHora(p.fecha)}</time>
          </header>
          <p class="ticket__cliente">${esc(p.cliente?.nombre ?? 'Cliente')}
            ${p.cliente ? `<span class="nivel nivel--chico ${claseNivel(p.cliente.nivel)}">${ETIQUETA_NIVEL[p.cliente.nivel]}</span>` : ''}</p>
          <ul class="ticket__items">${p.items.map((i) => `<li>${i.cantidad} × ${esc(i.nombre)}</li>`).join('')}</ul>
          <p class="ticket__total">${dinero(p.total)}</p>
          ${p.siguienteEstado
            ? `<button class="btn btn--chico ${p.siguienteEstado === 'ENTREGADO' ? 'btn--exito' : 'btn--primario'}" type="button" data-accion="avanzar" data-id="${p.id}">${textoBotonAvance(p.siguienteEstado)}</button>`
            : `<span class="ganancia">+${p.devPointsGanados} DevPoints</span>`}
        </article>`,
      )
      .join('');
    return `
      <section class="columna">
        <h3 class="columna__titulo"><span class="estado ${claseEstado(estado)}">${ETIQUETA_ESTADO[estado]}</span></h3>
        <div class="columna__tickets">${tarjetas || '<p class="columna__vacia">Sin pedidos</p>'}</div>
      </section>`;
  }).join('');
}

export function tablaInventario(lista) {
  return lista
    .map(
      (p) => `
      <tr>
        <td class="mono">${idCorto(p.id)}</td>
        <td>${esc(p.nombre)}</td>
        <td class="num mono">${dinero(p.precio)}</td>
        <td>
          <form class="stock-form" data-stock-form="${p.id}" novalidate>
            <input class="campo campo--mini" name="stock" type="number" min="0" step="1" value="${p.stock}" aria-label="Stock de ${esc(p.nombre)}">
            <button class="btn btn--fantasma btn--chico" type="submit">Guardar</button>
          </form>
        </td>
      </tr>`,
    )
    .join('');
}

export function aviso(mensaje, tipo = 'info') {
  return `<div class="aviso aviso--${tipo}" role="status">${mensaje}</div>`;
}
