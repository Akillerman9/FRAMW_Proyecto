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

module.exports = { obtenerTodos, obtenerPorId, crearEvento };