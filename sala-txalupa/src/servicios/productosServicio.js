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
  if (filtros.stockBajo === 'true' || filtros.stockBajo === true) {
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

// Valor del almacén
const obtenerValorAlmacen = () => {
  const productos = leerDatos();
  let valorTotal = 0;
  const porCategoria = {};
  
  productos.forEach(p => {
    const precioUnidad = (p.compra && p.compra.precioCaja && p.compra.unidadesPorCaja) 
      ? (p.compra.precioCaja / p.compra.unidadesPorCaja) 
      : 0;
    const valorProducto = p.stock * precioUnidad;
    
    valorTotal += valorProducto;
    
    if (!porCategoria[p.categoria]) {
      porCategoria[p.categoria] = 0;
    }
    porCategoria[p.categoria] += valorProducto;
  });
  
  // Redondear a 2 decimales
  Object.keys(porCategoria).forEach(cat => {
    porCategoria[cat] = Math.round(porCategoria[cat] * 100) / 100;
  });
  
  return { 
    total: Math.round(valorTotal * 100) / 100,
    porCategoria
  };
};

const obtenerPrevision = () => {
  const productos = leerDatos();
  const eventos = require('./eventosServicio').obtenerTodos();
  
  const consumoPrevisto = {};
  
  eventos.filter(e => !e.cancelado || !e.cancelado.estaCancelado).forEach(e => {
    productos.forEach(p => {
      const consumoUnitario = p.consumoPorTipo ? (p.consumoPorTipo[e.tipo] || 0) : 0;
      const totalParaEsteEvento = consumoUnitario * (e.gentePrevista || 0);
      consumoPrevisto[p.id] = (consumoPrevisto[p.id] || 0) + totalParaEsteEvento;
    });
  });

  const necesidades = [];
  productos.forEach(p => {
    const necesario = Math.ceil(consumoPrevisto[p.id] || 0);
    const falta = Math.max(0, necesario - p.stock);
    const unidadesPorCaja = (p.compra && p.compra.unidadesPorCaja) ? p.compra.unidadesPorCaja : 1;
    const precioCaja = (p.compra && p.compra.precioCaja) ? p.compra.precioCaja : 0;
    
    const cajasAComprar = Math.ceil(falta / unidadesPorCaja);
    
    if (cajasAComprar > 0) {
      necesidades.push({
        productoId: p.id,
        nombre: p.nombre,
        stockActual: p.stock,
        necesario,
        falta,
        cajasAComprar,
        costeEstimado: cajasAComprar * precioCaja
      });
    }
  });

  return necesidades.sort((a, b) => b.costeEstimado - a.costeEstimado);
};

const obtenerNecesidadesEvento = (eventoId) => {
  const eventos = require('./eventosServicio').obtenerTodos();
  const evento = eventos.find(e => e.id === eventoId);
  
  if (!evento) return { error: 'Evento no encontrado' };
  if (evento.cancelado && evento.cancelado.estaCancelado) {
    return { error: 'El evento está cancelado' };
  }

  const productos = leerDatos();
  const necesidades = [];

  productos.forEach(p => {
    const consumoUnitario = p.consumoPorTipo ? (p.consumoPorTipo[evento.tipo] || 0) : 0;
    const necesario = consumoUnitario * (evento.gentePrevista || 0);
    const falta = Math.max(0, necesario - p.stock);
    const unidadesPorCaja = (p.compra && p.compra.unidadesPorCaja) ? p.compra.unidadesPorCaja : 1;
    const precioCaja = (p.compra && p.compra.precioCaja) ? p.compra.precioCaja : 0;
    
    const cajasAComprar = Math.ceil(falta / unidadesPorCaja);

    if (cajasAComprar > 0) {
      necesidades.push({
        productoId: p.id,
        nombre: p.nombre,
        stockActual: p.stock,
        necesario,
        falta,
        cajasAComprar,
        costeEstimado: cajasAComprar * precioCaja
      });
    }
  });

  return {
    eventoId: evento.id,
    titulo: evento.titulo,
    tipo: evento.tipo,
    gentePrevista: evento.gentePrevista,
    necesidades: necesidades.sort((a, b) => b.costeEstimado - a.costeEstimado)
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
  comprarStock,
  obtenerValorAlmacen,
  obtenerPrevision,
  obtenerNecesidadesEvento
};