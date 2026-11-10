const express = require('express');
const cors = require('cors');
const { noEncontrado, gestorErrores } = require('./middlewares/errores');
const eventosRuta = require('./rutas/eventosRuta');
const productosRuta = require('./rutas/productosRuta');
const pedidosRuta = require('./rutas/pedidosRuta');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de la Sala Txalupa funcionando' });
});

app.use('/api/eventos', eventosRuta);
app.use('/api/productos', productosRuta);
app.use('/api/pedidos', pedidosRuta); // <--- ESTA LÍNEA FALTABA

app.use(noEncontrado);
app.use(gestorErrores);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});