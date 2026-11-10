const express = require('express');
const router = express.Router();
const { obtenerTodos, obtenerPorId, crearProducto, actualizarProducto, actualizarParcial, eliminarProducto, obtenerFiltrados } = require('../servicios/productosServicio');

router.get('/', (req, res) => {
  res.json(obtenerTodos());
});

router.get('/filtrar', (req, res) => {
  res.json(obtenerFiltrados(req.query));
});

router.post('/', (req, res) => {
  const resultado = crearProducto(req.body);
  if (resultado.error) {
    return res.status(400).json(resultado);
  }
  res.status(201).json(resultado);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarProducto(id, req.body);
  if (resultado.error === 'Producto no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = actualizarParcial(id, req.body);
  if (resultado.error === 'Producto no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'Datos inválidos') return res.status(400).json(resultado);
  res.json(resultado);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const resultado = eliminarProducto(id);
  if (resultado.error) return res.status(404).json(resultado);
  res.json({ mensaje: 'Producto eliminado', producto: resultado });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const producto = obtenerPorId(id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(producto);
});

module.exports = router;