const express = require('express');
const router = express.Router();
const { 
  obtenerPorId, crearEvento, actualizarEvento, 
  actualizarParcial, eliminarEvento, cancelarEvento,
  anadirDatosCalculados, obtenerEventosProcesados,
  obtenerResumen, obtenerDeudas, obtenerActuaciones, obtenerCalendario, obtenerPreguntas,
  pagarAlquiler, celebrarEvento
} = require('../servicios/eventosServicio');

// --- INFORMES (Van antes de /:id) ---
router.get('/resumen', (req, res) => {
  res.json(obtenerResumen());
});

router.get('/deudas', (req, res) => {
  res.json(obtenerDeudas());
});

router.get('/actuaciones', (req, res) => {
  res.json(obtenerActuaciones());
});

router.get('/calendario', (req, res) => {
  const { mes } = req.query;
  if (!mes) return res.status(400).json({ error: 'Falta el parámetro mes (ej: 2026-11)' });
  res.json(obtenerCalendario(mes));
});

router.get('/preguntas', (req, res) => {
  res.json(obtenerPreguntas());
});

// --- CRUD PRINCIPAL ---
router.get('/', (req, res) => {
  res.json(obtenerEventosProcesados(req.query));
});

router.post('/', (req, res) => {
  const resultado = crearEvento(req.body);
  if (resultado.error) return res.status(400).json(resultado);
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
  res.status(204).send(); 
});

// --- ACCIONES (Van antes de /:id) ---
router.patch('/:id/cancelar', (req, res) => {
  const id = Number(req.params.id);
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ error: 'Falta el motivo' });
  const resultado = cancelarEvento(id, motivo);
  if (resultado.error === 'Evento no encontrado') return res.status(404).json(resultado);
  if (resultado.error === 'El evento ya está cancelado') return res.status(409).json(resultado);
  res.json(resultado);
});

router.patch('/:id/pagar-alquiler', (req, res) => {
  const id = Number(req.params.id);
  const resultado = pagarAlquiler(id);
  if (resultado.error === 'Evento no encontrado') return res.status(404).json(resultado);
  if (resultado.error) return res.status(409).json(resultado);
  res.json(resultado);
});

router.patch('/:id/celebrar', (req, res) => {
  const id = Number(req.params.id);
  const resultado = celebrarEvento(id);
  if (resultado.error === 'Evento no encontrado') return res.status(404).json(resultado);
  if (resultado.error) return res.status(409).json(resultado);
  res.json(resultado);
});

// --- DETALLE POR ID (Va al final) ---
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const evento = obtenerPorId(id);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json(anadirDatosCalculados(evento));
});

module.exports = router;