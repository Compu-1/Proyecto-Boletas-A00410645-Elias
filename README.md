# Icesi Live Arena — Sistema Distribuido de Reserva de Boletas

Proyecto final de **Computación en Internet I (09810 - TIC)**, Universidad Icesi, 2026-2.

Sistema de reserva de boletas con un backend **Java + ZeroC Ice 3.7** y un frontend en
**JavaScript vainilla (ES Modules) empaquetado con Webpack**, comunicados por RPC sobre WebSocket.

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend web | Vanilla JS + Webpack | `3000` |
| Canal WebSocket (navegador) | ZeroC Ice | `10002` |
| Canal TCP (cliente Java / pruebas) | ZeroC Ice | `10000` |
| Servidor | Java 17 + ZeroC Ice 3.7.10 | — |

---

## Estructura del repositorio

```text
.
├── codigo_base/                 # Backend Java (Gradle)
│   ├── common/src/main/slice/BookingService.ice   # Contrato RPC
│   ├── server/.../BookingServiceImpl.java          # Lógica del inventario (thread-safe)
│   └── client/.../BookingClientApp.java            # Cliente de consola y prueba de estrés
└── client-js/                   # Frontend
    ├── package.json             # Scripts npm start / npm run build / npm run slice
    ├── webpack.config.js
    └── src/
        ├── index.html / index.js / styles.css
        ├── generated/BookingService.js   # Generado con slice2js desde el .ice
        ├── ice/BookingApp.js             # Carga Ice + código generado en el navegador
        ├── services/bookingService.js    # Llamadas RPC al servidor por WebSocket
        ├── state/store.js                # Estado central (setState / subscribe)
        ├── utils/format.js               # Formato de dinero, tiempo y zonas
        └── components/
            ├── Header.js         # Evento, contadores y estado de conexión
            ├── SeatMap.js        # Plano interactivo de las 90 sillas
            ├── CartPanel.js      # Temporizador, carrito y total
            ├── CheckoutModal.js  # Formulario de compra y comprobante
            ├── MyBookings.js     # Historial de compras del cliente
            └── Toast.js          # Avisos de error / información
```

---

## Requisitos

- **JDK 17** o superior
- **Node.js 18** o superior y npm
- (Opcional) **slice2js** de ZeroC Ice 3.7, solo si se modifica `BookingService.ice`

---

## Cómo ejecutar

### 1. Servidor Java

Desde `codigo_base/`:

```bash
./gradlew runServer          # Linux / macOS
.\gradlew.bat runServer      # Windows (PowerShell)
```

Debe mostrar `Servidor ZeroC Ice activo en endpoints: default -p 10000:ws -h 0.0.0.0 -p 10002`.

### 2. Prueba de estrés de concurrencia

En otra terminal, desde `codigo_base/`:

```bash
./gradlew :client:runClient --args="--test-concurrency"
```

Resultado esperado: **1** bloqueo exitoso y **9** rechazados.

### 3. Frontend

Desde `client-js/`:

```bash
npm install
npm start          # Desarrollo en http://localhost:3000
npm run build      # Bundle de producción en dist/
```

Para probar la concurrencia desde la interfaz, abrir `http://localhost:3000` en dos o más
ventanas: cada pestaña tiene su propio identificador de sesión.

Si se modifica el contrato Slice, regenerar el código JS con `npm run slice`.

---

## Cumplimiento de requerimientos

| Requerimiento | Implementación |
|---------------|----------------|
| **RF-1** Aforo y precios en tiempo real | `Header` y `SeatMap`; el estado se consulta al servidor cada 2 s (`getAllSeats`). |
| **RF-2** Bloqueo temporal exclusivo | Clic en una silla → `lockSeat`. El servidor rechaza con `SeatNotAvailableException` si otro la tiene. |
| **RF-3** Temporizador y desbloqueo automático | `CartPanel` muestra la cuenta regresiva con la hora de vencimiento que da el servidor. Al llegar a 00:00 el cliente llama a `releaseSeat`; además el servidor libera los bloqueos vencidos en cada consulta. |
| **RF-4** Carrito y liberación manual | Botón ✕ por silla y "Liberar Sillas" → `releaseSeat`. |
| **RF-5** Checkout y confirmación | `CheckoutModal` valida nombre y correo; `confirmBooking` solo acepta sillas bloqueadas vigentes por ese cliente y genera `RES-XXXXXXXX`. |
| **RF-6** Consulta de reservas | `MyBookings` → `getMyBookings(clientId)`. El `clientId` se guarda en `sessionStorage`. |
| **RF-7** Manejo de excepciones remotas | `errorMessage()` traduce `BookingException` (y subclases) y errores de red; `Toast` los muestra. Si el servidor se cae se marca OFFLINE, se conserva el último estado y se reconecta solo. |
| **RNF-1** Thread-safety | Métodos remotos `synchronized` en `BookingServiceImpl`; validación y cambio a `BOOKED` atómicos. |
| **RNF-2** Vanilla JS por componentes | Sin frameworks. Cada componente recibe su contenedor y callbacks y expone `render(state)`. |
| **RNF-3** Webpack | `npm start` (puerto 3000) y `npm run build` (`dist/`). |
| **RNF-4** RPC multi-protocolo | El navegador usa solo `ws://<host>:10002`; el cliente Java y la prueba de estrés usan TCP `10000`. |

---

## Decisiones de diseño

**Concurrencia en el servidor.** Ice atiende cada petición en un hilo de su *thread pool*.
Todos los métodos remotos de `BookingServiceImpl` son `synchronized` sobre el mismo objeto,
así que solo un hilo a la vez lee o modifica el inventario. Esto elimina la condición de
carrera de `lockSeat` (verificar disponibilidad → dormir 25 ms → marcar bloqueada) y hace
atómica la confirmación de compra.

**Expiración de bloqueos.** El servidor libera los bloqueos vencidos al inicio de cada
consulta (`getAllSeats`, `getEventInfo`, ...), por lo que el mapa siempre muestra el estado
real aunque el cliente que bloqueó haya cerrado la pestaña.

**Estado central en el frontend.** Los componentes no se comunican entre sí: leen el estado
de `store.js` y se repintan cuando alguien llama a `setState()`. `SeatMap` y `CartPanel` solo
reemplazan su HTML si cambió, para que la consulta periódica no anule un clic en curso, y el
formulario del checkout se crea una sola vez para no borrar lo que el usuario escribe.

**Host del WebSocket.** El endpoint usa `window.location.hostname`, así la misma build
funciona en `localhost` y en la VM sin cambiar código.

---

## Despliegue en una VM de la sala

1. Instalar JDK 17+ y Node.js 18+ en la VM y clonar el repositorio.
2. Iniciar el servidor (desde `codigo_base/`):
   ```bash
   ./gradlew runServer
   ```
3. Generar y servir el frontend (desde `client-js/`):
   ```bash
   npm install
   npm run build
   cd dist
   python3 -m http.server 3000
   ```
   (Cualquier servidor de archivos estáticos sirve; también se puede usar
   `npx webpack serve --mode development --host 0.0.0.0`.)
4. Abrir los puertos **3000** (web) y **10002** (WebSocket de Ice) en el firewall de la VM.
   El puerto **10000** solo hace falta si se ejecuta el cliente Java desde otra máquina.
5. Desde otro equipo abrir `http://<IP-de-la-VM>:3000`. El frontend se conecta
   automáticamente a `ws://<IP-de-la-VM>:10002`.

Para ejecutar la prueba de estrés contra la VM desde otra máquina:

```bash
./gradlew :client:runClient --args="--host <IP-de-la-VM> --test-concurrency"
```

---

## Video demostrativo

El video de la demostración (5:27) está en el repositorio:
[video sustentacion/video_elias.mp4](<video sustentacion/video_elias.mp4>).

Muestra la ejecución del servidor Java y la prueba de estrés corregida, la ejecución del
frontend con `npm start` y el flujo completo: bloqueo de sillas, temporizador, compra con
código de reserva, expiración y reconexión del servidor.

El guion que se siguió está en [docs/guion-video.md](docs/guion-video.md).

---

## Historial de desarrollo (ramas)

Cada parte se desarrolló en su propia rama y se integró a `develop` mediante Pull Request,
con mensajes bajo *Conventional Commits*:

| Rama | Contenido |
|------|-----------|
| `fix/server-thread-safety` | Sincronización del servidor y compra atómica |
| `feat/server-lock-expiration` | Liberación de bloqueos vencidos en el servidor |
| `feat/frontend-webpack-setup` | Proyecto npm, Webpack y código Ice generado |
| `feat/frontend-components` | Componentes de la interfaz y estado central |
| `feat/frontend-ice-integration` | Conexión RPC por WebSocket |
| `feat/frontend-timer-checkout` | Expiración, manejo de errores y mis reservas |
| `docs/readme-deploy` | Documentación, despliegue y guion del video |
