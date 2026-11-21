// Estado central de la aplicación.
// Los componentes no se hablan entre sí: leen el estado y se vuelven
// a pintar cada vez que alguien llama a setState().

export const state = {
  clientId: "",
  connected: false,
  event: null,        // { name, date, venue, ... }
  seats: [],          // [{ id, zone, row, number, price, state, lockedBy }]
  locks: {},          // { seatId: expiresAt (ms) } de las sillas que bloqueé
  checkoutOpen: false,
  receipt: null,      // { bookingCode, seatIds, totalAmount }
  bookings: [],       // compras confirmadas de este cliente
  notice: null,       // { text, type: "error" | "info" } mensaje en pantalla
};

const listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
}

export function setState(changes) {
  Object.assign(state, changes);
  listeners.forEach((listener) => listener(state));
}

// Sillas que el cliente actual tiene bloqueadas (su carrito)
export function getMySeats(currentState) {
  return currentState.seats.filter(
    (seat) => seat.state === "LOCKED" && seat.lockedBy === currentState.clientId
  );
}
