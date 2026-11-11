const express = require('express');
const router = express.Router();
const { 
  obtenerTodos, obtenerPorId, crearEvento, actualizarEvento, 
  actualizarParcial, eliminarEvento, obtenerFiltrados, cancelarEvento,
  anadirDatosCalculados, anadirDatosCalculadosLista 
} = require('../servicios/eventosServicio');

router.get('/', (req, res) => {
  const eventos = obtenerTodos();
  res.json(anadirDatosCalculadosLista(eventos));
});

router.get('/filtrar', (req, res) => {
  res.json(obtenerFiltrados(req.query));
});

router.post('/', (req, res) => {
  const resultado = crearEvento(req.body);
  if (resultado.error) {
    return res.status(400).json(resultado);
  }
  res.status(201).json(resultado);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarEvento(id, req.body);
  if (resultado.error === 'Evento no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarParcial(id, req.body);
  if (resultado.error === 'Evento no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = eliminarEvento(id);
  if (resultado.error) return res.status(404).json(resultado);
  res.json({ mensaje: 'Evento eliminado', evento: resultado });
});

router.post('/:id/cancelar', (req, res) => {
  const id = Number(req.params.id);
  const { motivo } = req.body;
  const resultado = cancelarEvento(id, motivo);
  
  if (resultado.error === 'Evento no encontrado') {
    return res.status(404).json(resultado);
  }
  if (resultado.error === 'El evento ya está cancelado') {
    return res.status(400).json(resultado);
  }
  
  res.json({ mensaje: 'Evento cancelado', evento: resultado });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const evento = obtenerPorId(id);
  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  res.json(anadirDatosCalculados(evento));
});

module.exports = router;