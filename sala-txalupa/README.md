# API REST - Sala Txalupa

API REST para la gestión de eventos, productos y pedidos de la Sala Txalupa.

## Diseño de Datos y Justificación

La API trabaja con tres colecciones principales almacenadas en archivos JSON: **Eventos**, **Productos** y **Pedidos**.

### 1. Colección: Eventos
* **Estructura elegida:** Contiene campos básicos (`id`, `titulo`, `descripcion`, `tipo`, `fecha`, `hora`, `gentePrevista`, `celebrado`). Incluye 2 objetos anidados (`organizador` y `alquiler`), 1 array de objetos (`artistas`), 1 array de valores simples (`etiquetas`) y campos booleanos (`entrada.esGratis`, `celebrado`, `cancelado.estaCancelado`).
* **Justificación:** Se han separado los datos de `organizador` y `alquiler` para evitar tener una lista de campos sueltos, haciendo la estructura más limpia. El array de `artistas` permite que el evento pueda tener un número variable de artistas. Se optó por un objeto `cancelado` con un motivo para simplificar la comprobación del estado.

### 2. Colección: Productos
* **Estructura elegida:** Contiene campos básicos (`id`, `nombre`, `categoria`, `unidad`, `stock`, `minimo`). Incluye objetos anidados (`compra` y `proveedor`) y un objeto de consumo por tipo de evento (`consumoPorTipo`).
* **Justificación:** Agrupar los datos de compra y proveedor en objetos mantiene la coherencia con el diseño de Eventos. El objeto `consumoPorTipo` permite calcular rápidamente el gasto de stock según el tipo de evento que se celebre.

### 3. Colección: Pedidos
* **Estructura elegida:** Contiene el `id`, el `eventoId` al que pertenece, un array de `productos` (con `productoId` y `cantidad`) y el `estado` del pedido.
* **Justificación:** Relacionar los pedidos con los eventos mediante `eventoId` permite trazar qué productos se han consumido en cada evento.

## Tabla de Endpoints

### Eventos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/eventos` | Obtener todos los eventos |
| GET | `/api/eventos/:id` | Obtener un evento por ID |
| GET | `/api/eventos/filtrar` | Filtrar eventos (query: tipo, desde, hasta, etiqueta, cancelado) |
| POST | `/api/eventos` | Crear un nuevo evento |
| PUT | `/api/eventos/:id` | Actualizar un evento completo |
| PATCH | `/api/eventos/:id` | Actualizar parcialmente un evento |
| DELETE | `/api/eventos/:id` | Eliminar un evento |
| POST | `/api/eventos/:id/cancelar` | Cancelar un evento (body: motivo) |

### Productos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/productos` | Obtener todos los productos |
| GET | `/api/productos/:id` | Obtener un producto por ID |
| GET | `/api/productos/filtrar` | Filtrar productos (query: categoria, stockBajo) |
| POST | `/api/productos` | Crear un nuevo producto |
| PUT | `/api/productos/:id` | Actualizar un producto completo |
| PATCH | `/api/productos/:id` | Actualizar parcialmente un producto |
| DELETE | `/api/productos/:id` | Eliminar un producto |
| POST | `/api/productos/:id/comprar` | Restar stock de un producto (body: cantidad) |

### Pedidos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/pedidos` | Obtener todos los pedidos |
| GET | `/api/pedidos/:id` | Obtener un pedido por ID |
| POST | `/api/pedidos` | Crear un nuevo pedido |
| PUT | `/api/pedidos/:id` | Actualizar un pedido completo |
| PATCH | `/api/pedidos/:id` | Actualizar parcialmente un pedido |
| DELETE | `/api/pedidos/:id` | Eliminar un pedido |

## Cómo arrancar el proyecto

1. Asegúrate de tener [Node.js](https://nodejs.org/) instalado en tu sistema.
2. Clona el repositorio o descarga el código.
3. Abre una terminal en la carpeta raíz del proyecto (`sala-txalupa`).
4. Instala las dependencias ejecutando:
   ```bash
   npm install