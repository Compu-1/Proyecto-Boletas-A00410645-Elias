import { getMySeats } from "../state/store";
import { formatMoney, formatTime, ZONE_NAMES } from "../utils/format";

// Resumen de selección: temporizador, sillas retenidas y total (RF-3, RF-4)
export function CartPanel(root, { onConfirm, onReleaseSeat, onReleaseAll }) {
  let lastState = null;

  root.addEventListener("click", (e) => {
    const removeButton = e.target.closest("button[data-release]");
    if (removeButton) onReleaseSeat(removeButton.dataset.release);
    if (e.target.id === "btn-confirm") onConfirm();
    if (e.target.id === "btn-release-all") onReleaseAll();
  });

  // Segundos que le quedan a la silla que vence primero
  function secondsLeft(state) {
    const times = Object.values(state.locks);
    if (times.length === 0) return 0;
    return Math.ceil((Math.min(...times) - Date.now()) / 1000);
  }

  // Cada segundo solo se actualiza el texto del temporizador
  setInterval(() => {
    const timer = root.querySelector("#timer");
    if (timer && lastState) timer.textContent = formatTime(secondsLeft(lastState));
  }, 1000);

  function render(state) {
    lastState = state;
    const mySeats = getMySeats(state);
    const total = mySeats.reduce((sum, seat) => sum + seat.price, 0);
    const empty = mySeats.length === 0;

    const items = mySeats
      .map(
        (seat) => `
        <li>
          <span>Silla ${seat.id} (${ZONE_NAMES[seat.zone]})</span>
          <span>${formatMoney(seat.price)}</span>
          <button class="remove" data-release="${seat.id}" title="Liberar silla">✕</button>
        </li>`
      )
      .join("");

    root.innerHTML = `
      <h2>Resumen de Selección</h2>
      <div class="timer-box">
        <span>Tiempo de retención:</span>
        <strong id="timer">${formatTime(secondsLeft(state))}</strong>
      </div>
      <p class="muted">Sillas en retención (${mySeats.length}):</p>
      <ul class="cart-list">${empty ? `<li class="muted">Selecciona sillas en el plano.</li>` : items}</ul>
      <div class="total"><span>Total a pagar:</span><strong>${formatMoney(total)}</strong></div>
      <button id="btn-confirm" class="btn primary" ${empty ? "disabled" : ""}>Confirmar Reserva</button>
      <button id="btn-release-all" class="btn" ${empty ? "disabled" : ""}>Liberar Sillas</button>
    `;
  }

  return { render };
}
