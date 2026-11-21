import "./styles.css";
import { state, setState, subscribe } from "./state/store";
import { Header } from "./components/Header";
import { SeatMap } from "./components/SeatMap";
import { CartPanel } from "./components/CartPanel";
import { CheckoutModal } from "./components/CheckoutModal";
import { mockEvent, createMockSeats } from "./mock/mockData";

// ---------------------------------------------------------------------------
// Acciones (por ahora simuladas localmente; luego llamarán a ZeroC Ice)
// ---------------------------------------------------------------------------
const LOCK_SECONDS = 90;

function updateSeat(seatId, changes) {
  return state.seats.map((seat) => (seat.id === seatId ? { ...seat, ...changes } : seat));
}

function lockSeat(seatId) {
  setState({
    seats: updateSeat(seatId, { state: "LOCKED", lockedBy: state.clientId }),
    locks: { ...state.locks, [seatId]: Date.now() + LOCK_SECONDS * 1000 },
  });
}

function releaseSeat(seatId) {
  const locks = { ...state.locks };
  delete locks[seatId];
  setState({ seats: updateSeat(seatId, { state: "AVAILABLE", lockedBy: "" }), locks });
}

function toggleSeat(seatId) {
  const seat = state.seats.find((s) => s.id === seatId);
  if (seat.state === "AVAILABLE") lockSeat(seatId);
  else releaseSeat(seatId);
}

function confirmBooking(name, email) {
  const seatIds = Object.keys(state.locks);
  const totalAmount = state.seats
    .filter((seat) => seatIds.includes(seat.id))
    .reduce((sum, seat) => sum + seat.price, 0);
  const bookingCode = "RES-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  let seats = state.seats;
  seatIds.forEach((id) => {
    seats = seats.map((seat) => (seat.id === id ? { ...seat, state: "BOOKED" } : seat));
  });
  setState({ seats, locks: {}, receipt: { bookingCode, seatIds, totalAmount } });
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------
const components = [
  Header(document.getElementById("header")),
  SeatMap(document.getElementById("seat-map"), { onSeatClick: toggleSeat }),
  CartPanel(document.getElementById("cart"), {
    onConfirm: () => setState({ checkoutOpen: true, receipt: null }),
    onReleaseSeat: releaseSeat,
    onReleaseAll: () => Object.keys(state.locks).forEach(releaseSeat),
  }),
  CheckoutModal(document.getElementById("checkout"), {
    onSubmit: confirmBooking,
    onClose: () => setState({ checkoutOpen: false, receipt: null }),
  }),
];

subscribe((newState) => components.forEach((component) => component.render(newState)));

// Estado inicial
setState({
  clientId: "CLI-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  connected: false,
  event: mockEvent,
  seats: createMockSeats(),
});
