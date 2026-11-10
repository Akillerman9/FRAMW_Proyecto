const express = require('express');
const router = express.Router();
const { obtenerTodos, obtenerPorId, crearPedido, actualizarPedido, actualizarParcial, eliminarPedido } = require('../servicios/pedidosServicio');

router.get('/', (req, res) => {
  res.json(obtenerTodos());
});

router.post('/', (req, res) => {
  const resultado = crearPedido(req.body);
  if (resultado.error) {
    return res.status(400).json(resultado);
  }
  res.status(201).json(resultado);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarPedido(id, req.body);
  if (resultado.error === 'Pedido no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarParcial(id, req.body);
  if (resultado.error === 'Pedido no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = eliminarPedido(id);
  if (resultado.error) return res.status(404).json(resultado);
  res.json({ mensaje: 'Pedido eliminado', pedido: resultado });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const pedido = obtenerPorId(id);
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  res.json(pedido);
});

module.exports = router;