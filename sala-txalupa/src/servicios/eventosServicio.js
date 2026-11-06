const eventos = require('../data/eventos.json');

const obtenerTodos = () => {
  return [...eventos];
};

const obtenerPorId = (id) => {
  return eventos.find(evento => evento.id === id);
};

module.exports = { obtenerTodos, obtenerPorId };