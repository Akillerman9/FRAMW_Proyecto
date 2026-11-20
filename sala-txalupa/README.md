# API REST - Sala Txalupa

API REST para la gestión de eventos, productos y pedidos de la Sala Txalupa, desarrollada con Node.js y Express.

## Diseño de Datos y Justificación

La API trabaja con tres colecciones principales almacenadas en archivos JSON: **Eventos**, **Productos** y **Pedidos**.

### 1. Colección: Eventos
* **Estructura elegida:** Contiene campos básicos (`id`, `titulo`, `descripcion`, `tipo`, `fecha`, `hora`, `gentePrevista`, `celebrado`). Incluye objetos anidados (`organizador`, `alquiler`, `entrada`, `cancelado`), un array de objetos (`artistas`) y un array de valores simples (`etiquetas`).
* **Justificación:** Se han agrupado los datos relacionados (como `organizador` o `alquiler`) en objetos para mantener la coherencia y evitar una lista de campos sueltos. El array de `artistas` permite un número variable de actuaciones por evento. Se optó por un objeto `cancelado` para incluir tanto el estado como el motivo de forma estructurada.

### 2. Colección: Productos
* **Estructura elegida:** Contiene campos básicos (`id`, `nombre`, `categoria`, `unidad`, `stock`, `minimo`). Incluye objetos anidados (`compra` y `proveedor`) y un objeto de consumo por tipo de evento (`consumoPorTipo`).
* **Justificación:** Agrupar los datos de compra y proveedor mantiene la coherencia con el diseño de Eventos. El objeto `consumoPorTipo` permite calcular rápidamente el gasto de stock previsto según el tipo de evento.

### 3. Colección: Pedidos
* **Estructura elegida:** Contiene el `id`, la `fecha`, un array de `lineas` (donde cada línea tiene `productoId` y `cajas`), el `estado` (pendiente o recibido) y el `importe` total calculado.
* **Justificación:** Relacionar los pedidos con los productos mediante `lineas` permite trazar exactamente qué cajas de cada producto se han solicitado, facilitando el cálculo automático del importe y la posterior actualización del stock al recibir el pedido.

## Tabla de Endpoints

### Eventos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/eventos` | Obtener todos los eventos (admite query: tipo, precioMin, precioMax, gratis, texto, etiqueta, desde, hasta, organizador, artista, cancelado, alquilerPendiente, minCamareros, orden, dir, pagina, limite, campos) |
| GET | `/api/eventos/:id` | Obtener un evento por ID |
| POST | `/api/eventos` | Crear un nuevo evento |
| PUT | `/api/eventos/:id` | Actualizar un evento completo |
| PATCH | `/api/eventos/:id` | Actualizar parcialmente un evento |
| DELETE | `/api/eventos/:id` | Eliminar un evento (devuelve 204 sin cuerpo) |
| PATCH | `/api/eventos/:id/cancelar` | Cancelar un evento (body: motivo) |
| PATCH | `/api/eventos/:id/pagar-alquiler` | Marcar el alquiler de un evento como pagado |
| PATCH | `/api/eventos/:id/celebrar` | Marcar un evento como celebrado |
| GET | `/api/eventos/resumen` | Obtener resumen global (total, cancelados, celebrados, media gente, balance) |
| GET | `/api/eventos/deudas` | Obtener listado de organizadores con alquiler pendiente y su deuda |
| GET | `/api/eventos/actuaciones` | Obtener listado de todas las actuaciones ordenadas por caché |
| GET | `/api/eventos/calendario` | Obtener eventos de un mes (query: mes=AAAA-MM) |
| GET | `/api/eventos/preguntas` | Obtener respuestas a preguntas de estado del negocio |

### Productos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/productos` | Obtener todos los productos |
| GET | `/api/productos/:id` | Obtener un producto por ID |
| GET | `/api/productos/filtrar` | Filtrar productos (query: categoria, stockBajo) |
| POST | `/api/productos` | Crear un nuevo producto |
| PUT | `/api/productos/:id` | Actualizar un producto completo |
| PATCH | `/api/productos/:id` | Actualizar parcialmente un producto |
| DELETE | `/api/productos/:id` | Eliminar un producto (devuelve 204 sin cuerpo) |
| POST | `/api/productos/:id/comprar` | Restar stock de un producto (body: cantidad) |
| GET | `/api/productos/valor` | Obtener el valor total del almacén y desglose por categoría |
| GET | `/api/productos/prevision` | Obtener previsión global de compra basada en eventos futuros |
| GET | `/api/productos/necesidades/:eventoId` | Obtener necesidades de stock para un evento concreto |

### Pedidos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/pedidos` | Obtener todos los pedidos (admite query: pendiente=true) |
| GET | `/api/pedidos/:id` | Obtener un pedido por ID |
| POST | `/api/pedidos` | Crear un nuevo pedido (body: lineas con productoId y cajas) |
| POST | `/api/pedidos/automatico` | Generar un pedido automático basado en la previsión de consumo |
| PUT | `/api/pedidos/:id` | Actualizar un pedido completo |
| PATCH | `/api/pedidos/:id` | Actualizar parcialmente un pedido |
| PATCH | `/api/pedidos/:id/recibir` | Marcar pedido como recibido y sumar las cajas al stock del almacén |
| DELETE | `/api/pedidos/:id` | Eliminar un pedido (solo si no está pendiente) |

## Cómo arrancar el proyecto

1. Asegúrate de tener [Node.js](https://nodejs.org/) instalado en tu sistema.
2. Clona el repositorio o descarga el código.
3. Abre una terminal en la carpeta raíz del proyecto (`sala-txalupa`).
4. Instala las dependencias ejecutando:
   ```bash
   npm install