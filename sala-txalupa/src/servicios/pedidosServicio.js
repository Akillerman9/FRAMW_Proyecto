const fs = require('fs');
const path = require('path');
const { validarPedido } = require('./validar');

const rutaPedidos = path.join(__dirname, '../data/pedidos.json');
const rutaProductos = path.join(__dirname, '../data/productos.json');

const leerPedidos = () => JSON.parse(fs.readFileSync(rutaPedidos, 'utf-8'));
const escribirPedidos = (datos) => fs.writeFileSync(rutaPedidos, JSON.stringify(datos, null, 2));
const leerProductos = () => JSON.parse(fs.readFileSync(rutaProductos, 'utf-8'));

const obtenerTodos = () => leerPedidos();

const obtenerPorId = (id) => {
  const pedidos = leerPedidos();
  return pedidos.find(p => p.id === id);
};

const crearPedido = (nuevoPedido) => {
  const productos = leerProductos();
  const errores = validarPedido(nuevoPedido, productos);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  const pedidos = leerPedidos();
  const nuevoId = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
  const pedidoConId = { ...nuevoPedido, id: nuevoId };
  
  pedidos.push(pedidoConId);
  escribirPedidos(pedidos);
  
  return pedidoConId;
};

const actualizarPedido = (id, pedidoActualizado) => {
  const productos = leerProductos();
  const pedidos = leerPedidos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  const errores = validarPedido(pedidoActualizado, productos);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  pedidos[indice] = { ...pedidoActualizado, id };
  escribirPedidos(pedidos);
  
  return pedidos[indice];
};

const actualizarParcial = (id, cambios) => {
  const productos = leerProductos();
  const pedidos = leerPedidos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  const pedidoActualizado = { ...pedidos[indice], ...cambios };
  const errores = validarPedido(pedidoActualizado, productos);
  
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  pedidos[indice] = pedidoActualizado;
  escribirPedidos(pedidos);
  
  return pedidoActualizado;
};

const eliminarPedido = (id) => {
  const pedidos = leerPedidos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  const pedidoEliminado = pedidos[indice];
  pedidos.splice(indice, 1);
  escribirPedidos(pedidos);
  
  return pedidoEliminado;
};

module.exports = { 
  obtenerTodos, 
  obtenerPorId, 
  crearPedido,
  actualizarPedido,
  actualizarParcial,
  eliminarPedido
};