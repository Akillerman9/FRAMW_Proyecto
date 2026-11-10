const fs = require('fs');
const path = require('path');
const { validarEvento } = require('./validar');

const rutaDatos = path.join(__dirname, '../data/eventos.json');

const leerDatos = () => JSON.parse(fs.readFileSync(rutaDatos, 'utf-8'));
const escribirDatos = (datos) => fs.writeFileSync(rutaDatos, JSON.stringify(datos, null, 2));

const obtenerTodos = () => leerDatos();

const obtenerPorId = (id) => {
  const eventos = leerDatos();
  return eventos.find(evento => evento.id === id);
};

const crearEvento = (nuevoEvento) => {
  const errores = validarEvento(nuevoEvento);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  const eventos = leerDatos();
  const nuevoId = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
  const eventoConId = { ...nuevoEvento, id: nuevoId };
  
  eventos.push(eventoConId);
  escribirDatos(eventos);
  
  return eventoConId;
};

const actualizarEvento = (id, eventoActualizado) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  
  if (indice === -1) {
    return { error: 'Evento no encontrado' };
  }
  
  const errores = validarEvento(eventoActualizado);
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  eventos[indice] = { ...eventoActualizado, id };
  escribirDatos(eventos);
  
  return eventos[indice];
};

const actualizarParcial = (id, cambios) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  
  if (indice === -1) {
    return { error: 'Evento no encontrado' };
  }
  
  const eventoActualizado = { ...eventos[indice], ...cambios };
  const errores = validarEvento(eventoActualizado);
  
  if (errores.length > 0) {
    return { error: 'Datos inválidos', errores };
  }
  
  eventos[indice] = eventoActualizado;
  escribirDatos(eventos);
  
  return eventoActualizado;
};

const eliminarEvento = (id) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  
  if (indice === -1) {
    return { error: 'Evento no encontrado' };
  }
  
  const eventoEliminado = eventos[indice];
  eventos.splice(indice, 1);
  escribirDatos(eventos);
  
  return eventoEliminado;
};

const obtenerFiltrados = (filtros) => {
  let eventos = leerDatos();
  
  if (filtros.tipo) {
    eventos = eventos.filter(e => e.tipo === filtros.tipo);
  }
  if (filtros.desde) {
    eventos = eventos.filter(e => e.fecha >= filtros.desde);
  }
  if (filtros.hasta) {
    eventos = eventos.filter(e => e.fecha <= filtros.hasta);
  }
  if (filtros.etiqueta) {
    eventos = eventos.filter(e => e.etiquetas && e.etiquetas.includes(filtros.etiqueta));
  }
  if (filtros.cancelado !== undefined) {
    const estaCancelado = filtros.cancelado === 'true' || filtros.cancelado === true;
    eventos = eventos.filter(e => e.cancelado && e.cancelado.estaCancelado === estaCancelado);
  }
  
  return eventos;
};

const cancelarEvento = (id, motivo) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  
  if (indice === -1) {
    return { error: 'Evento no encontrado' };
  }
  
  if (eventos[indice].cancelado && eventos[indice].cancelado.estaCancelado) {
    return { error: 'El evento ya está cancelado' };
  }
  
  eventos[indice].cancelado = { estaCancelado: true, motivo: motivo || 'Sin motivo especificado' };
  escribirDatos(eventos);
  
  return eventos[indice];
};



module.exports = { 
  obtenerTodos, 
  obtenerPorId, 
  crearEvento,
  actualizarEvento,
  actualizarParcial,
  eliminarEvento,
  obtenerFiltrados,
  cancelarEvento
};