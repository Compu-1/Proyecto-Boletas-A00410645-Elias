# Guion del video demostrativo (máximo 6 minutos)

Preparación antes de grabar: tener abiertas tres terminales (servidor, cliente Java,
frontend) y dos ventanas del navegador lado a lado. No arrancar nada todavía.

---

## 1. Servidor Java y prueba de concurrencia (≈ 1:30)

1. **Terminal 1** (en `codigo_base/`): `.\gradlew.bat runServer`
   - Mostrar los endpoints: TCP `10000` y WebSocket `10002`.
2. Abrir `BookingServiceImpl.java` y señalar:
   - los métodos remotos `synchronized`;
   - el comentario de la clase que explica por qué (thread pool de Ice);
   - `confirmBooking` solo acepta sillas bloqueadas por el mismo cliente.
3. **Terminal 2** (en `codigo_base/`):
   `.\gradlew.bat :client:runClient --args="--test-concurrency"`
   - Resaltar: **1** bloqueo exitoso, **9** rechazados.
   - Mencionar que con el código original los 10 hilos ganaban.

## 2. Frontend con Webpack (≈ 1:00)

1. Mostrar `package.json` (scripts y dependencias) y `webpack.config.js`.
2. **Terminal 3** (en `client-js/`): `npm start`
   - Mostrar que compila y queda en `http://localhost:3000`.
3. Mostrar rápidamente la carpeta `src/components/`: un archivo por componente.

## 3. Flujo completo en el navegador (≈ 3:00)

1. **Ventana A**: abrir `http://localhost:3000`.
   - Encabezado con el evento, contadores y estado **ONLINE**.
2. **Ventana A**: seleccionar dos sillas VIP (p. ej. A-1 y A-2).
   - Aparecen en gris en el plano y en el carrito, con el total.
   - El temporizador empieza en 01:30 y baja.
3. **Ventana B** (otra ventana del navegador, nueva sesión):
   - A-1 y A-2 se ven como "Bloqueada (otro)" y no se pueden seleccionar.
   - Bloquear otra silla (p. ej. C-5) y mostrar que la Ventana A la ve bloqueada.
4. **Ventana A**: quitar una silla con ✕ → se libera en ambas ventanas (RF-4).
5. **Ventana A**: "Confirmar Reserva" → llenar nombre y correo → "Finalizar y Pagar".
   - Mostrar el comprobante `RES-XXXXXXXX`.
   - Las sillas pasan a "Vendida" en ambas ventanas.
   - La compra aparece en "Mis Reservas".
6. **Ventana B**: dejar correr el temporizador de C-5 hasta 00:00 (se puede adelantar
   el video). Mostrar el aviso "Se acabó el tiempo de retención" y la silla disponible.

## 4. Manejo de errores (≈ 0:30)

1. Detener el servidor (Ctrl+C en la Terminal 1).
   - El encabezado pasa a **OFFLINE** y aparece el aviso de conexión perdida;
     la interfaz conserva el último estado.
2. Volver a iniciar el servidor.
   - Aparece "Conexión con el servidor restablecida" y vuelve a **ONLINE**.

> Nota: al reiniciar el servidor el inventario vuelve al estado inicial
> (el estado está en memoria).
