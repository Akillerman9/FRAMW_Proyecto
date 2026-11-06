const { AFORO, TIPOS } = require('../config');

const validarArtista = (artista, index) => {
  const errores = [];
  if (!artista.nombre || typeof artista.nombre !== 'string') {
    errores.push(`artistas[${index}].nombre debe ser un texto`);
  }
  if (typeof artista.cache !== 'number' || artista.cache < 0) {
    errores.push(`artistas[${index}].cache debe ser un número mayor o igual a 0`);
  }
  if (typeof artista.duracionMin !== 'number' || artista.duracionMin <= 0) {
    errores.push(`artistas[${index}].duracionMin debe ser un número mayor que 0`);
  }
  return errores;
};

const validarEvento = (evento) => {
  const errores = [];
  
  if (!evento.titulo || typeof evento.titulo !== 'string') errores.push('titulo es obligatorio');
  if (!evento.descripcion || typeof evento.descripcion !== 'string') errores.push('descripcion es obligatoria');
  if (!TIPOS.includes(evento.tipo)) errores.push(`tipo debe ser uno de: ${TIPOS.join(', ')}`);
  if (!evento.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(evento.fecha)) errores.push('fecha debe tener formato AAAA-MM-DD');
  if (!evento.hora || !/^\d{2}:\d{2}$/.test(evento.hora)) errores.push('hora debe tener formato HH:MM');
  
  if (typeof evento.entrada?.esGratis !== 'boolean') errores.push('entrada.esGratis es obligatorio');
  if (evento.entrada?.esGratis && evento.entrada.precio !== 0) errores.push('si es gratis, precio debe ser 0');
  if (!evento.entrada?.esGratis && (!evento.entrada?.precio || evento.entrada.precio <= 0)) errores.push('si es de pago, precio debe ser mayor que 0');
  
  if (typeof evento.gentePrevista !== 'number' || evento.gentePrevista < 1 || evento.gentePrevista > AFORO) {
    errores.push(`gentePrevista debe estar entre 1 y ${AFORO}`);
  }
  
  if (!evento.organizador?.nombre || !evento.organizador?.contacto) errores.push('organizador con nombre y contacto es obligatorio');
  
  if (evento.alquiler?.seCobra) {
    if (!evento.alquiler.importe || evento.alquiler.importe <= 0) errores.push('si se cobra alquiler, importe debe ser mayor que 0');
  } else {
    if (evento.alquiler?.importe !== 0) errores.push('si no se cobra, importe debe ser 0');
    if (evento.alquiler?.pagado) errores.push('si no se cobra, no puede estar pagado');
  }
  
  if (evento.cancelado?.estaCancelado && !evento.cancelado.motivo) errores.push('si está cancelado, debe tener motivo');
  if (!evento.cancelado?.estaCancelado && evento.cancelado?.motivo) errores.push('si no está cancelado, no debe tener motivo');
  
  if (!Array.isArray(evento.artistas)) errores.push('artistas debe ser un array');
  else {
    const erroresArtistas = evento.artistas.flatMap((artista, i) => validarArtista(artista, i));
    errores.push(...erroresArtistas);
  }
  
  if (!Array.isArray(evento.etiquetas)) errores.push('etiquetas debe ser un array');
  else if (!evento.etiquetas.every(e => typeof e === 'string')) errores.push('cada etiqueta debe ser un texto');
  
  if (typeof evento.celebrado !== 'boolean') errores.push('celebrado es obligatorio');
  
  return errores;
};

const validarProducto = (producto) => {
  const errores = [];
  
  if (!producto.nombre || typeof producto.nombre !== 'string') errores.push('nombre es obligatorio');
  if (!['bebida', 'comida', 'otros'].includes(producto.categoria)) errores.push('categoria debe ser bebida, comida u otros');
  if (!producto.unidad || typeof producto.unidad !== 'string') errores.push('unidad es obligatoria');
  if (typeof producto.stock !== 'number' || producto.stock < 0) errores.push('stock debe ser un número mayor o igual a 0');
  if (typeof producto.minimo !== 'number' || producto.minimo < 0) errores.push('minimo debe ser un número mayor o igual a 0');
  
  if (typeof producto.compra?.unidadesPorCaja !== 'number' || producto.compra.unidadesPorCaja <= 0) errores.push('unidadesPorCaja debe ser mayor que 0');
  if (typeof producto.compra?.precioCaja !== 'number' || producto.compra.precioCaja <= 0) errores.push('precioCaja debe ser mayor que 0');
  
  if (!producto.proveedor?.nombre || !producto.proveedor?.telefono) errores.push('proveedor con nombre y telefono es obligatorio');
  
  if (!producto.consumoPorTipo) errores.push('consumoPorTipo es obligatorio');
  else {
    TIPOS.forEach(tipo => {
      if (typeof producto.consumoPorTipo[tipo] !== 'number' || producto.consumoPorTipo[tipo] < 0) {
        errores.push(`consumoPorTipo.${tipo} debe ser un número mayor o igual a 0`);
      }
    });
  }
  
  return errores;
};

const validarLineaPedido = (linea, index, productos) => {
  const errores = [];
  if (typeof linea.productoId !== 'number') errores.push(`lineas[${index}].productoId debe ser un número`);
  else if (!productos.find(p => p.id === linea.productoId)) errores.push(`lineas[${index}].productoId no existe`);
  if (typeof linea.cajas !== 'number' || linea.cajas <= 0 || !Number.isInteger(linea.cajas)) {
    errores.push(`lineas[${index}].cajas debe ser un entero mayor que 0`);
  }
  return errores;
};

const validarPedido = (pedido, productos) => {
  const errores = [];
  
  if (!Array.isArray(pedido.lineas) || pedido.lineas.length === 0) errores.push('pedido debe tener al menos una línea');
  else {
    const erroresLineas = pedido.lineas.flatMap((linea, i) => validarLineaPedido(linea, i, productos));
    errores.push(...erroresLineas);
  }
  
  return errores;
};

module.exports = { validarEvento, validarProducto, validarPedido };