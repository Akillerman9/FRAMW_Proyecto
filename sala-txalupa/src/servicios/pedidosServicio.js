const fs = require('fs');
const path = require('path');
const { validarPedido } = require('./validar');

const rutaDatos = path.join(__dirname, '../data/pedidos.json');
const rutaProductos = path.join(__dirname, '../data/productos.json');
const rutaEventos = path.join(__dirname, '../data/eventos.json');

const leerDatos = () => JSON.parse(fs.readFileSync(rutaDatos, 'utf-8'));
const escribirDatos = (datos) => fs.writeFileSync(rutaDatos, JSON.stringify(datos, null, 2));

const leerProductos = () => JSON.parse(fs.readFileSync(rutaProductos, 'utf-8'));
const escribirProductos = (datos) => fs.writeFileSync(rutaProductos, JSON.stringify(datos, null, 2));

const obtenerTodos = (filtros) => {
  let pedidos = leerDatos();
  
  if (filtros && filtros.pendiente === 'true') {
    pedidos = pedidos.filter(p => p.estado === 'pendiente');
  }
  
  // Añadir nombre del producto a cada línea
  const productos = leerProductos();
  return pedidos.map(pedido => {
    const lineasConNombre = pedido.lineas.map(linea => {
      const producto = productos.find(p => p.id === linea.productoId);
      return {
        ...linea,
        nombreProducto: producto ? producto.nombre : 'Desconocido'
      };
    });
    return { ...pedido, lineas: lineasConNombre };
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

const obtenerPorId = (id) => {
  const pedidos = leerDatos();
  const pedido = pedidos.find(p => p.id === id);
  
  if (!pedido) return null;
  
  const productos = leerProductos();
  const lineasConNombre = pedido.lineas.map(linea => {
    const producto = productos.find(p => p.id === linea.productoId);
    return {
      ...linea,
      nombreProducto: producto ? producto.nombre : 'Desconocido'
    };
  });
  
  return { ...pedido, lineas: lineasConNombre };
};

const calcularImporte = (lineas) => {
  const productos = leerProductos();
  return lineas.reduce((total, linea) => {
    const producto = productos.find(p => p.id === linea.productoId);
    if (!producto) return total;
    const precioCaja = producto.compra ? producto.compra.precioCaja : 0;
    return total + (precioCaja * linea.cajas);
  }, 0);
};

const crearPedido = (nuevoPedido) => {
  const errores = validarPedido(nuevoPedido);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  const pedidos = leerDatos();
  const nuevoId = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
  
  const pedidoConId = {
    ...nuevoPedido,
    id: nuevoId,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    importe: calcularImporte(nuevoPedido.lineas)
  };
  
  pedidos.push(pedidoConId);
  escribirDatos(pedidos);
  
  return obtenerPorId(nuevoId);
};

const crearPedidoAutomatico = () => {
  const productos = leerProductos();
  const eventos = require('./eventosServicio').obtenerTodos();
  
  // Calcular consumo previsto para todos los eventos no cancelados
  const consumoPrevisto = {};
  
  eventos.filter(e => !e.cancelado || !e.cancelado.estaCancelado).forEach(e => {
    productos.forEach(p => {
      const consumoUnitario = p.consumoPorTipo ? (p.consumoPorTipo[e.tipo] || 0) : 0;
      const totalParaEsteEvento = consumoUnitario * (e.gentePrevista || 0);
      consumoPrevisto[p.id] = (consumoPrevisto[p.id] || 0) + totalParaEsteEvento;
    });
  });

  // Calcular qué hace falta pedir
  const lineas = [];
  productos.forEach(p => {
    const necesario = Math.ceil(consumoPrevisto[p.id] || 0);
    const falta = Math.max(0, necesario - p.stock);
    const unidadesPorCaja = (p.compra && p.compra.unidadesPorCaja) ? p.compra.unidadesPorCaja : 1;
    const cajasAComprar = Math.ceil(falta / unidadesPorCaja);
    
    if (cajasAComprar > 0) {
      lineas.push({
        productoId: p.id,
        cajas: cajasAComprar
      });
    }
  });

  if (lineas.length === 0) {
    return { error: 'No hace falta pedir nada' };
  }

  return crearPedido({ lineas });
};

const recibirPedido = (id) => {
  const pedidos = leerDatos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  if (pedidos[indice].estado === 'recibido') {
    return { error: 'El pedido ya está recibido' };
  }
  
  // Sumar al almacén
  const productos = leerProductos();
  const lineas = pedidos[indice].lineas;
  
  lineas.forEach(linea => {
    const productoIndice = productos.findIndex(p => p.id === linea.productoId);
    if (productoIndice !== -1) {
      const unidadesPorCaja = productos[productoIndice].compra.unidadesPorCaja;
      productos[productoIndice].stock += linea.cajas * unidadesPorCaja;
    }
  });
  
  escribirProductos(productos);
  
  // Marcar pedido como recibido
  pedidos[indice].estado = 'recibido';
  escribirDatos(pedidos);
  
  return obtenerPorId(id);
};

const actualizarPedido = (id, pedidoActualizado) => {
  const pedidos = leerDatos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  const errores = validarPedido(pedidoActualizado);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  pedidos[indice] = { 
    ...pedidoActualizado, 
    id,
    importe: calcularImporte(pedidoActualizado.lineas)
  };
  escribirDatos(pedidos);
  
  return obtenerPorId(id);
};

const actualizarParcial = (id, cambios) => {
  const pedidos = leerDatos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  const pedidoActualizado = { ...pedidos[indice], ...cambios };
  const errores = validarPedido(pedidoActualizado);
  
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  pedidos[indice] = pedidoActualizado;
  escribirDatos(pedidos);
  
  return obtenerPorId(id);
};

const eliminarPedido = (id) => {
  const pedidos = leerDatos();
  const indice = pedidos.findIndex(p => p.id === id);
  
  if (indice === -1) {
    return { error: 'Pedido no encontrado' };
  }
  
  // Verificar si está pendiente
  if (pedidos[indice].estado === 'pendiente') {
    return { error: 'No se puede eliminar un pedido pendiente' };
  }
  
  const pedidoEliminado = pedidos[indice];
  pedidos.splice(indice, 1);
  escribirDatos(pedidos);
  
  return pedidoEliminado;
};

module.exports = { 
  obtenerTodos,
  obtenerPorId,
  crearPedido,
  crearPedidoAutomatico,
  recibirPedido,
  actualizarPedido,
  actualizarParcial,
  eliminarPedido
};