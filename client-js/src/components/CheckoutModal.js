import { getMySeats } from "../state/store";
import { formatMoney } from "../utils/format";

// Modal de checkout: datos del comprador y comprobante de la reserva (RF-5)
export function CheckoutModal(root, { onSubmit, onClose }) {
  // El HTML se crea una sola vez para no borrar lo que el usuario escribe
  // cuando el estado cambia; render() solo muestra/oculta y actualiza textos.
  root.innerHTML = `
    <div class="modal">
      <button class="close" id="modal-close">✕</button>

      <form id="checkout-form">
        <h2>Datos del Comprador</h2>
        <p class="muted">Ingrese su información para emitir el boleto.</p>
        <div class="summary" id="modal-summary"></div>

        <label for="customer-name">Nombre Completo</label>
        <input id="customer-name" type="text" required>

        <label for="customer-email">Correo Electrónico</label>
        <input id="customer-email" type="email" required>

        <button type="submit" class="btn primary">Finalizar y Pagar</button>
        <button type="button" class="btn" id="modal-back">Volver al Plano</button>
      </form>

      <div class="receipt" id="receipt">
        <h3>Comprobante Generado</h3>
        <p>Reserva confirmada con éxito</p>
        <div class="code" id="receipt-code"></div>
        <p class="muted" id="receipt-detail"></p>
        <button type="button" class="btn" id="receipt-close">Volver al Plano</button>
      </div>
    </div>
  `;

  const form = root.querySelector("#checkout-form");
  const receipt = root.querySelector("#receipt");

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // el navegador ya validó required y type="email"
    onSubmit(form.querySelector("#customer-name").value.trim(),
             form.querySelector("#customer-email").value.trim());
  });
  root.querySelector("#modal-close").addEventListener("click", onClose);
  root.querySelector("#modal-back").addEventListener("click", onClose);
  root.querySelector("#receipt-close").addEventListener("click", () => {
    form.reset();
    onClose();
  });

  function render(state) {
    root.hidden = !state.checkoutOpen;
    if (!state.checkoutOpen) return;

    const mySeats = getMySeats(state);
    const total = mySeats.reduce((sum, seat) => sum + seat.price, 0);
    root.querySelector("#modal-summary").textContent =
      `Sillas: ${mySeats.map((seat) => seat.id).join(", ")} · Valor total: ${formatMoney(total)}`;

    // Si ya hay comprobante se muestra en lugar del formulario
    form.hidden = Boolean(state.receipt);
    receipt.hidden = !state.receipt;
    if (state.receipt) {
      root.querySelector("#receipt-code").textContent = `CÓDIGO: ${state.receipt.bookingCode}`;
      root.querySelector("#receipt-detail").textContent =
        `Sillas: ${state.receipt.seatIds.join(", ")} · Total: ${formatMoney(state.receipt.totalAmount)}`;
    }
  }

  return { render };
}
