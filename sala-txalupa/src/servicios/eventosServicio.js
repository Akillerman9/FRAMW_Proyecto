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

module.exports = { obtenerTodos, 
  obtenerPorId, 
  crearEvento,
  actualizarEvento,
  actualizarParcial,
  eliminarEvento
 };