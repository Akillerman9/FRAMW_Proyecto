const noEncontrado = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

const gestorErrores = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno' });
};

module.exports = { noEncontrado, gestorErrores };