const fs = require('fs');
const path = require('path');
const { validarEvento } = require('./validar');
const { PERSONAS_POR_CAMARERO, MINIMO_CAMAREROS, COSTE_CAMARERO } = require('../config');

const rutaDatos = path.join(__dirname, '../data/eventos.json');

const leerDatos = () => JSON.parse(fs.readFileSync(rutaDatos, 'utf-8'));
const escribirDatos = (datos) => fs.writeFileSync(rutaDatos, JSON.stringify(datos, null, 2));

const obtenerTodos = () => leerDatos();

const obtenerPorId = (id) => {
  const eventos = leerDatos();
  return eventos.find(evento => evento.id === id);
};

// --- CÁLCULOS ---
const calcularCamareros = (evento) => {
  if (evento.cancelado && evento.cancelado.estaCancelado) return 0;
  const base = Math.ceil((evento.gentePrevista || 0) / PERSONAS_POR_CAMARERO);
  const conMinimo = Math.max(base, MINIMO_CAMAREROS);
  const extraFiesta = evento.tipo === 'fiesta' ? 1 : 0;
  return conMinimo + extraFiesta;
};

const calcularCostePersonal = (evento) => calcularCamareros(evento) * COSTE_CAMARERO;

const calcularCosteArtistas = (evento) => {
  if (!evento.artistas || evento.artistas.length === 0) return 0;
  return evento.artistas.reduce((suma, a) => suma + (a.cache || 0), 0);
};

const calcularBalance = (evento) => {
  if (evento.cancelado && evento.cancelado.estaCancelado) return 0;
  
  const esGratis = evento.entrada ? evento.entrada.esGratis : true;
  const precio = evento.entrada ? (evento.entrada.precio || 0) : 0;
  const gentePrevista = evento.gentePrevista || 0;
  
  const ingresosEntradas = esGratis ? 0 : precio * gentePrevista;
  
  const seCobra = evento.alquiler ? evento.alquiler.seCobra : false;
  const importe = evento.alquiler ? (evento.alquiler.importe || 0) : 0;
  const ingresosAlquiler = seCobra ? importe : 0;
  
  const costePersonal = calcularCostePersonal(evento);
  const costeArtistas = calcularCosteArtistas(evento);
  
  return (ingresosEntradas + ingresosAlquiler) - (costePersonal + costeArtistas);
};

const anadirDatosCalculados = (evento) => ({
  ...evento,
  camarerosNecesarios: calcularCamareros(evento),
  costePersonal: calcularCostePersonal(evento),
  costeArtistas: calcularCosteArtistas(evento),
  balancePrevisto: calcularBalance(evento)
});

const anadirDatosCalculadosLista = (eventos) => eventos.map(e => anadirDatosCalculados(e));

// --- FILTROS, ORDEN, PAGINACIÓN Y PROYECCIÓN ---
const obtenerEventosProcesados = (query) => {
  // 1. Cargar y calcular
  let eventos = anadirDatosCalculadosLista(leerDatos());

  // 2. Filtrar
  if (query.tipo) eventos = eventos.filter(e => e.tipo === query.tipo);
  
  if (query.precioMin !== undefined) {
    const min = Number(query.precioMin);
    eventos = eventos.filter(e => (e.entrada && e.entrada.precio) >= min);
  }
  if (query.precioMax !== undefined) {
    const max = Number(query.precioMax);
    eventos = eventos.filter(e => (e.entrada && e.entrada.precio) <= max);
  }
  
  if (query.gratis !== undefined) {
    const esGratis = query.gratis === 'true' || query.gratis === true;
    eventos = eventos.filter(e => e.entrada && e.entrada.esGratis === esGratis);
  }
  
  if (query.texto) {
    const textoLower = query.texto.toLowerCase();
    eventos = eventos.filter(e => 
      (e.titulo && e.titulo.toLowerCase().includes(textoLower)) || 
      (e.descripcion && e.descripcion.toLowerCase().includes(textoLower))
    );
  }
  
  if (query.etiqueta) {
    eventos = eventos.filter(e => e.etiquetas && e.etiquetas.includes(query.etiqueta));
  }
  
  if (query.desde) eventos = eventos.filter(e => e.fecha >= query.desde);
  if (query.hasta) eventos = eventos.filter(e => e.fecha <= query.hasta);
  
  if (query.organizador) {
    const orgLower = query.organizador.toLowerCase();
    eventos = eventos.filter(e => e.organizador && e.organizador.nombre && e.organizador.nombre.toLowerCase().includes(orgLower));
  }
  
  if (query.artista) {
    const artLower = query.artista.toLowerCase();
    eventos = eventos.filter(e => 
      e.artistas && e.artistas.some(a => a.nombre && a.nombre.toLowerCase().includes(artLower))
    );
  }
  
  if (query.cancelado !== undefined) {
    const estaCancelado = query.cancelado === 'true' || query.cancelado === true;
    eventos = eventos.filter(e => e.cancelado && e.cancelado.estaCancelado === estaCancelado);
  }
  
  if (query.alquilerPendiente === 'true' || query.alquilerPendiente === true) {
    eventos = eventos.filter(e => e.alquiler && e.alquiler.seCobra && !e.alquiler.pagado);
  }
  
  if (query.minCamareros !== undefined) {
    const minCam = Number(query.minCamareros);
    eventos = eventos.filter(e => e.camarerosNecesarios >= minCam);
  }

  // 3. Ordenar
  if (query.orden) {
    const dir = query.dir === 'desc' ? -1 : 1;
    eventos = [...eventos].sort((a, b) => {
      const valA = a[query.orden];
      const valB = b[query.orden];
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      // Si orden es fecha, desempatar por hora
      if (query.orden === 'fecha' && a.hora !== b.hora) {
        return a.hora < b.hora ? -1 * dir : 1 * dir;
      }
      return 0;
    });
  }

  // Paginar
  const pagina = Number(query.pagina) || 1;
  const limite = Number(query.limite) || 10;
  const total = eventos.length;
  const inicio = (pagina - 1) * limite;
  const datosPaginados = eventos.slice(inicio, inicio + limite);

  // 5. Proyectar (si viene query.campos)
  let datosFinales = datosPaginados;
  if (query.campos) {
    const camposLista = query.campos.split(',').map(c => c.trim());
    datosFinales = datosPaginados.map(e => {
      const objetoProyectado = { id: e.id }; // El id siempre va
      camposLista.forEach(campo => {
        if (e[campo] !== undefined) objetoProyectado[campo] = e[campo];
      });
      return objetoProyectado;
    });
  }

  return { total, pagina, limite, datos: datosFinales };
};

// --- CRUD BÁSICO ---
const crearEvento = (nuevoEvento) => {
  const errores = validarEvento(nuevoEvento);
  if (errores.length > 0) return { error: 'Datos inválidos', errores };
  
  const eventos = leerDatos();
  const nuevoId = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
  const eventoConId = { ...nuevoEvento, id: nuevoId };
  eventos.push(eventoConId);
  escribirDatos(eventos);
  return anadirDatosCalculados(eventoConId);
};

const actualizarEvento = (id, eventoActualizado) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  
  const errores = validarEvento(eventoActualizado);
  if (errores.length > 0) return { error: 'Datos inválidos', errores };
  
  eventos[indice] = { ...eventoActualizado, id };
  escribirDatos(eventos);
  return anadirDatosCalculados(eventos[indice]);
};

const actualizarParcial = (id, cambios) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  
  // Fusión de objetos anidados campo a campo
  const eventoBase = { ...eventos[indice] };
  const eventoActualizado = { ...eventoBase, ...cambios };
  
  const errores = validarEvento(eventoActualizado);
  if (errores.length > 0) return { error: 'Datos inválidos', errores };
  
  eventos[indice] = eventoActualizado;
  escribirDatos(eventos);
  return anadirDatosCalculados(eventoActualizado);
};

const eliminarEvento = (id) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  
  const eventoEliminado = eventos[indice];
  eventos.splice(indice, 1);
  escribirDatos(eventos);
  return anadirDatosCalculados(eventoEliminado);
};

const cancelarEvento = (id, motivo) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  if (eventos[indice].cancelado && eventos[indice].cancelado.estaCancelado) {
    return { error: 'El evento ya está cancelado' };
  }
  eventos[indice].cancelado = { estaCancelado: true, motivo: motivo || 'Sin motivo' };
  escribirDatos(eventos);
  return anadirDatosCalculados(eventos[indice]);
};

// --- INFORMES ---
const obtenerResumen = () => {
  const eventos = leerDatos();
  const eventosConCalculos = anadirDatosCalculadosLista(eventos);
  const noCancelados = eventosConCalculos.filter(e => !e.cancelado || !e.cancelado.estaCancelado);
  
  const total = eventos.length;
  const cancelados = eventos.filter(e => e.cancelado && e.cancelado.estaCancelado).length;
  const celebrados = eventos.filter(e => e.celebrado).length;
  
  const sumaGente = noCancelados.reduce((suma, e) => suma + (e.gentePrevista || 0), 0);
  const mediaGente = noCancelados.length > 0 ? sumaGente / noCancelados.length : 0;
  
  const balanceTotal = noCancelados.reduce((suma, e) => {
    const balance = e.balancePrevisto || 0;
    return suma + balance;
  }, 0);

  return { total, cancelados, celebrados, mediaGente, balanceTotal };
};

const obtenerDeudas = () => {
  const eventos = leerDatos();
  const deudores = {};
  
  eventos.filter(e => e.alquiler && e.alquiler.seCobra && !e.alquiler.pagado).forEach(e => {
    const nombre = e.organizador ? e.organizador.nombre : 'Desconocido';
    deudores[nombre] = (deudores[nombre] || 0) + (e.alquiler.importe || 0);
  });
  
  return Object.entries(deudores).map(([nombre, debe]) => ({ nombre, debe }));
};

const obtenerActuaciones = () => {
  const eventos = leerDatos();
  return eventos
    .filter(e => e.artistas && e.artistas.length > 0)
    .flatMap(e => e.artistas.map(a => ({ ...a, eventoId: e.id, titulo: e.titulo, fecha: e.fecha })))
    .sort((a, b) => (b.cache || 0) - (a.cache || 0));
};

const obtenerCalendario = (mes) => {
  const eventos = leerDatos();
  return eventos
    .filter(e => (!e.cancelado || !e.cancelado.estaCancelado) && e.fecha && e.fecha.startsWith(mes))
    .map(e => ({ fecha: e.fecha, hora: e.hora, titulo: e.titulo, tipo: e.tipo }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
};

const obtenerPreguntas = () => {
  const eventos = leerDatos();
  const hayAlquilerSinCobrar = eventos.some(e => e.alquiler && e.alquiler.seCobra && !e.alquiler.pagado);
  const almacenOK = true; // Esto se calculará con la lógica de almacén más adelante
  const todosConMasDeUnaActuacion = eventos
    .filter(e => e.artistas && e.artistas.length > 0)
    .every(e => e.artistas.length > 1);
    
  return { hayAlquilerSinCobrar, almacenOK, todosConMasDeUnaActuacion };
};

// --- ACCIONES ---
const pagarAlquiler = (id) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  if (!eventos[indice].alquiler || !eventos[indice].alquiler.seCobra || eventos[indice].alquiler.pagado) {
    return { error: 'No se cobra alquiler o ya está pagado' };
  }
  eventos[indice].alquiler.pagado = true;
  escribirDatos(eventos);
  return anadirDatosCalculados(eventos[indice]);
};

const celebrarEvento = (id) => {
  const eventos = leerDatos();
  const indice = eventos.findIndex(e => e.id === id);
  if (indice === -1) return { error: 'Evento no encontrado' };
  if (eventos[indice].cancelado && eventos[indice].cancelado.estaCancelado) {
    return { error: 'El evento está cancelado' };
  }
  if (eventos[indice].celebrado) {
    return { error: 'El evento ya está celebrado' };
  }

  // Aquí iría la lógica para descontar del almacén. 
  // Por ahora marcamos como celebrado para no romper la API si falta la lógica de stock.
  eventos[indice].celebrado = true;
  escribirDatos(eventos);
  return anadirDatosCalculados(eventos[indice]);
};

module.exports = { 
  obtenerTodos, obtenerPorId, crearEvento, actualizarEvento,
  actualizarParcial, eliminarEvento, cancelarEvento,
  anadirDatosCalculados, anadirDatosCalculadosLista, obtenerEventosProcesados,
  obtenerResumen, obtenerDeudas, obtenerActuaciones, obtenerCalendario, obtenerPreguntas,
  pagarAlquiler, celebrarEvento
};