import { formatMoney } from "../utils/format";

// Compras confirmadas por este cliente (RF-6)
export function MyBookings(root) {
  function render(state) {
    const items = state.bookings
      .map(
        (b) => `
        <li>
          <strong>${b.bookingCode}</strong>
          <span>Sillas: ${b.seatIds.join(", ")}</span>
          <span>Total: ${formatMoney(b.totalAmount)} · ${new Date(b.timestamp).toLocaleString("es-CO")}</span>
        </li>`
      )
      .join("");

    root.innerHTML = `
      <h2>Mis Reservas</h2>
      <p class="muted">Sesión: ${state.clientId}</p>
      <ul class="bookings-list">
        ${items || `<li class="muted">Aún no tienes compras confirmadas.</li>`}
      </ul>
    `;
  }

  return { render };
}
