import { ZONE_NAMES } from "../utils/format";

// Plano interactivo de sillas agrupado por zona y fila.
// onSeatClick(seatId) se llama al hacer clic en una silla que se puede tocar.
export function SeatMap(root, { onSeatClick }) {
  let lastHtml = "";

  // Un solo listener para todo el plano (delegación de eventos)
  root.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-seat]");
    if (button && !button.disabled) {
      onSeatClick(button.dataset.seat);
    }
  });

  // Clase CSS según el estado de la silla y quién la tiene
  function seatClass(seat, clientId) {
    if (seat.state === "BOOKED") return "booked";
    if (seat.state === "LOCKED") return seat.lockedBy === clientId ? "mine" : "locked";
    return "available";
  }

  function renderRow(row, seats, clientId) {
    const buttons = seats
      .map((seat) => {
        const cls = seatClass(seat, clientId);
        const disabled = cls === "booked" || cls === "locked" ? "disabled" : "";
        const aisle = seat.number === 6 ? " aisle" : ""; // pasillo en la mitad
        return `<button class="seat ${cls}${aisle}" data-seat="${seat.id}" ${disabled}
                  title="${seat.id}">${seat.number}</button>`;
      })
      .join("");
    return `<div class="seat-row"><span class="row-label">${row}</span>${buttons}</div>`;
  }

  function render(state) {
    let html = `<h2>Distribución de Sillas</h2><div class="stage">ESCENARIO</div>`;

    for (const zone of Object.keys(ZONE_NAMES)) {
      const zoneSeats = state.seats.filter((seat) => seat.zone === zone);
      const rows = [...new Set(zoneSeats.map((seat) => seat.row))];

      html += `<h3>Zona ${ZONE_NAMES[zone]}</h3>`;
      for (const row of rows) {
        html += renderRow(row, zoneSeats.filter((seat) => seat.row === row), state.clientId);
      }
    }

    html += `
      <div class="legend">
        <span><i class="seat available"></i> Disponible</span>
        <span><i class="seat mine"></i> Seleccionada (mía)</span>
        <span><i class="seat locked"></i> Bloqueada (otro)</span>
        <span><i class="seat booked"></i> Vendida</span>
      </div>
    `;
    // Solo se repinta si algo cambió: así un clic no se pierde porque
    // el botón fue reemplazado justo por la consulta periódica.
    if (html !== lastHtml) {
      root.innerHTML = html;
      lastHtml = html;
    }
  }

  return { render };
}
