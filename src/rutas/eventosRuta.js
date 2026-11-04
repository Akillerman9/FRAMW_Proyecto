const express = require('express');
const router = express.Router();
const { obtenerTodos, obtenerPorId } = require('../servicios/eventosServicio');

router.get('/', (req, res) => {
  res.json(obtenerTodos());
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const evento = obtenerPorId(id);

  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }

  res.json(evento);
});

module.exports = router;