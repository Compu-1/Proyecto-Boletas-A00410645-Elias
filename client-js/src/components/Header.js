// Información del evento y contadores de aforo en tiempo real (RF-1)
export function Header(root) {
  function render(state) {
    const event = state.event || { name: "Cargando evento...", date: "", venue: "" };
    const count = (s) => state.seats.filter((seat) => seat.state === s).length;

    root.innerHTML = `
      <div class="header-info">
        <h1>Icesi Live Arena — Reserva de Boletas</h1>
        <p>${event.name} · ${event.venue} · ${event.date} · Aforo total: ${state.seats.length} sillas</p>
      </div>
      <div class="header-stats">
        <div class="stat"><span>Disponibles</span><strong>${count("AVAILABLE")}</strong></div>
        <div class="stat"><span>Retenidas</span><strong>${count("LOCKED")}</strong></div>
        <div class="stat"><span>Ocupadas</span><strong>${count("BOOKED")}</strong></div>
        <div class="stat"><span>Estado</span>
          <strong class="${state.connected ? "online" : "offline"}">
            ${state.connected ? "ONLINE" : "OFFLINE"}
          </strong>
        </div>
      </div>
    `;
  }

  return { render };
}
