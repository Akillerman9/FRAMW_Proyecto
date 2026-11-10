const fs = require('fs');
const path = require('path');
const { validarProducto } = require('./validar');

const rutaDatos = path.join(__dirname, '../data/productos.json');

const leerDatos = () => JSON.parse(fs.readFileSync(rutaDatos, 'utf-8'));
const escribirDatos = (datos) => fs.writeFileSync(rutaDatos, JSON.stringify(datos, null, 2));

const obtenerTodos = () => leerDatos();

const obtenerPorId = (id) => {
  const productos = leerDatos();
  return productos.find(producto => producto.id === id);
};

const crearProducto = (nuevoProducto) => {
  const errores = validarProducto(nuevoProducto);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  const productos = leerDatos();
  const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
  const productoConId = { ...nuevoProducto, id: nuevoId };
  
  productos.push(productoConId);
  escribirDatos(productos);
  
  return productoConId;
};

const actualizarProducto = (id, productoActualizado) => {
  const productos = leerDatos();
  const indice = productos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Producto no encontrado' };
  }
  
  const errores = validarProducto(productoActualizado);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  productos[indice] = { ...productoActualizado, id };
  escribirDatos(productos);
  
  return productos[indice];
};

const actualizarParcial = (id, cambios) => {
  const productos = leerDatos();
  const indice = productos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Producto no encontrado' };
  }
  
  const productoActualizado = { ...productos[indice], ...cambios };
  const errores = validarProducto(productoActualizado);
  
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  productos[indice] = productoActualizado;
  escribirDatos(productos);
  
  return productoActualizado;
};

const eliminarProducto = (id) => {
  const productos = leerDatos();
  const indice = productos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Producto no encontrado' };
  }
  
  const productoEliminado = productos[indice];
  productos.splice(indice, 1);
  escribirDatos(productos);
  
  return productoEliminado;
};

const obtenerFiltrados = (filtros) => {
  let productos = leerDatos();
  
  if (filtros.categoria) {
    productos = productos.filter(p => p.categoria === filtros.categoria);
  }
  if (filtros.stockBajo === 'true') {
    productos = productos.filter(p => p.stock <= p.minimo);
  }
  
  return productos;
};

const comprarStock = (id, cantidad) => {
  const productos = leerDatos();
  const indice = productos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Producto no encontrado' };
  }
  
  if (productos[indice].stock < cantidad) {
    return { error: 'Stock insuficiente', stockActual: productos[indice].stock };
  }
  
  productos[indice].stock -= cantidad;
  escribirDatos(productos);
  
  return { 
    mensaje: 'Stock actualizado', 
    producto: productos[indice],
    stockRestante: productos[indice].stock
  };
};

module.exports = { 
  obtenerTodos, 
  obtenerPorId, 
  crearProducto,
  actualizarProducto,
  actualizarParcial,
  eliminarProducto,
  obtenerFiltrados,
  comprarStock
};