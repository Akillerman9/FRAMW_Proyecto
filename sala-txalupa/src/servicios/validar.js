const { AFORO, TIPOS } = require('../config');

// Validar un evento completo
const validarEvento = (evento) => {
  const errores = [];

  // Campos obligatorios básicos
  if (!evento.titulo || typeof evento.titulo !== 'string') {
    errores.push('El título es obligatorio y debe ser texto');
  }
  if (!evento.descripcion || typeof evento.descripcion !== 'string') {
    errores.push('La descripción es obligatoria');
  }
  if (!evento.tipo || !TIPOS.includes(evento.tipo)) {
    errores.push(`El tipo debe ser uno de: ${TIPOS.join(', ')}`);
  }
  if (!evento.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(evento.fecha)) {
    errores.push('La fecha debe tener formato AAAA-MM-DD');
  }
  if (!evento.hora || typeof evento.hora !== 'string') {
    errores.push('La hora es obligatoria');
  }

  // Gente prevista
  if (evento.gentePrevista === undefined || evento.gentePrevista === null) {
    errores.push('La gente prevista es obligatoria');
  } else if (evento.gentePrevista < 1 || evento.gentePrevista > AFORO) {
    errores.push(`La gente prevista debe estar entre 1 y ${AFORO}`);
  }

  // Entrada
  if (!evento.entrada || typeof evento.entrada.esGratis !== 'boolean') {
    errores.push('La entrada debe indicar si es gratis (booleano)');
  } else {
    if (evento.entrada.esGratis && evento.entrada.precio !== 0) {
      errores.push('Si la entrada es gratis, el precio debe ser 0');
    }
    if (!evento.entrada.esGratis && (!evento.entrada.precio || evento.entrada.precio <= 0)) {
      errores.push('Si la entrada es de pago, el precio debe ser mayor que 0');
    }
  }

  // Organizador
  if (!evento.organizador || !evento.organizador.nombre || !evento.organizador.contacto) {
    errores.push('El organizador debe tener nombre y contacto');
  }

  // Alquiler
  if (!evento.alquiler || typeof evento.alquiler.seCobra !== 'boolean') {
    errores.push('El alquiler debe indicar si se cobra (booleano)');
  } else {
    if (!evento.alquiler.seCobra) {
      if (evento.alquiler.importe !== 0) {
        errores.push('Si no se cobra alquiler, el importe debe ser 0');
      }
      if (evento.alquiler.pagado) {
        errores.push('Si no se cobra alquiler, no puede estar marcado como pagado');
      }
    }
  }

  // Artistas (array de objetos)
  if (evento.artistas && !Array.isArray(evento.artistas)) {
    errores.push('Los artistas deben ser un array');
  } else if (evento.artistas) {
    const erroresArtistas = evento.artistas.flatMap((artista, i) =>
      validarArtista(artista, i)
    );
    errores.push(...erroresArtistas);
  }

  // Etiquetas
  if (evento.etiquetas && !Array.isArray(evento.etiquetas)) {
    errores.push('Las etiquetas deben ser un array');
  }

  // Cancelado
  if (evento.cancelado) {
    if (evento.cancelado.estaCancelado && !evento.cancelado.motivo) {
      errores.push('Si el evento está cancelado, debe haber un motivo');
    }
    if (!evento.cancelado.estaCancelado && evento.cancelado.motivo) {
      errores.push('Si el evento no está cancelado, no debe haber motivo');
    }
  }

  return errores;
};

// Validar un artista individual
const validarArtista = (artista, indice) => {
  const errores = [];
  if (!artista.nombre) {
    errores.push(`artistas[${indice}].nombre es obligatorio`);
  }
  if (artista.cache === undefined || artista.cache < 0) {
    errores.push(`artistas[${indice}].cache debe ser un número >= 0`);
  }
  if (artista.duracionMin === undefined || artista.duracionMin <= 0) {
    errores.push(`artistas[${indice}].duracionMin debe ser > 0`);
  }
  return errores;
};

// Validar un producto completo
const validarProducto = (producto) => {
  const errores = [];

  if (!producto.nombre || typeof producto.nombre !== 'string') {
    errores.push('El nombre es obligatorio');
  }
  if (!producto.categoria || !['bebida', 'comida', 'otros'].includes(producto.categoria)) {
    errores.push('La categoría debe ser bebida, comida u otros');
  }
  if (!producto.unidad || typeof producto.unidad !== 'string') {
    errores.push('La unidad es obligatoria');
  }

  if (producto.stock === undefined || producto.stock < 0) {
    errores.push('El stock debe ser >= 0');
  }
  if (producto.minimo === undefined || producto.minimo < 0) {
    errores.push('El mínimo debe ser >= 0');
  }

  // Compra
  if (!producto.compra) {
    errores.push('Los datos de compra son obligatorios');
  } else {
    if (!producto.compra.unidadesPorCaja || producto.compra.unidadesPorCaja <= 0) {
      errores.push('Las unidades por caja deben ser > 0');
    }
    if (!producto.compra.precioCaja || producto.compra.precioCaja <= 0) {
      errores.push('El precio de la caja debe ser > 0');
    }
  }

  // Proveedor
  if (!producto.proveedor || !producto.proveedor.nombre || !producto.proveedor.telefono) {
    errores.push('El proveedor debe tener nombre y teléfono');
  }

  // Consumo por tipo
  if (!producto.consumoPorTipo || typeof producto.consumoPorTipo !== 'object') {
    errores.push('El consumo por tipo es obligatorio');
  } else {
    TIPOS.forEach(tipo => {
      if (producto.consumoPorTipo[tipo] === undefined) {
        errores.push(`Falta consumo para tipo: ${tipo}`);
      } else if (producto.consumoPorTipo[tipo] < 0) {
        errores.push(`El consumo para ${tipo} debe ser >= 0`);
      }
    });
  }

  return errores;
};

// Validar un pedido completo
const validarPedido = (pedido) => {
  const errores = [];

  if (!pedido.lineas || !Array.isArray(pedido.lineas) || pedido.lineas.length === 0) {
    errores.push('El pedido debe tener al menos una línea');
  } else {
    const erroresLineas = pedido.lineas.flatMap((linea, i) =>
      validarLineaPedido(linea, i)
    );
    errores.push(...erroresLineas);
  }

  return errores;
};

// Validar una línea de pedido individual
const validarLineaPedido = (linea, indice) => {
  const errores = [];
  if (!linea.productoId) {
    errores.push(`lineas[${indice}].productoId es obligatorio`);
  }
  if (linea.cajas === undefined || !Number.isInteger(linea.cajas) || linea.cajas <= 0) {
    errores.push(`lineas[${indice}].cajas debe ser un entero mayor que 0`);
  }
  return errores;
};

module.exports = {
  validarEvento,
  validarProducto,
  validarPedido,
  validarArtista,
  validarLineaPedido
};