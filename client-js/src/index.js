import "./styles.css";
import { state, setState, subscribe, getMySeats } from "./state/store";
import { Header } from "./components/Header";
import { SeatMap } from "./components/SeatMap";
import { CartPanel } from "./components/CartPanel";
import { CheckoutModal } from "./components/CheckoutModal";
import * as api from "./services/bookingService";

const REFRESH_MS = 2000; // cada cuánto se consulta el estado de las sillas

// Identificador de sesión del cliente: se conserva si se recarga la página
function getClientId() {
  let id = sessionStorage.getItem("clientId");
  if (!id) {
    id = "CLI-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    sessionStorage.setItem("clientId", id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Acciones: llaman al servidor y luego refrescan el estado
// ---------------------------------------------------------------------------

// Trae las sillas del servidor. Los bloqueos propios (con su hora de
// vencimiento) salen de las mismas sillas, así el temporizador siempre
// coincide con lo que tiene el servidor.
async function refresh() {
  try {
    const seats = await api.getAllSeats();
    const locks = {};
    getMySeats({ seats, clientId: state.clientId }).forEach((seat) => {
      locks[seat.id] = seat.expiresAt;
    });
    setState({ seats, locks, connected: true });
  } catch (error) {
    console.error("No se pudo consultar el servidor:", error);
    setState({ connected: false });
  }
}

async function toggleSeat(seatId) {
  const seat = state.seats.find((s) => s.id === seatId);
  try {
    if (seat.state === "AVAILABLE") {
      await api.lockSeat(seatId, state.clientId);
    } else {
      await api.releaseSeat(seatId, state.clientId);
    }
  } catch (error) {
    console.error(`Error con la silla ${seatId}:`, error.reason || error);
  }
  await refresh();
}

async function releaseSeat(seatId) {
  try {
    await api.releaseSeat(seatId, state.clientId);
  } catch (error) {
    console.error(`Error liberando ${seatId}:`, error.reason || error);
  }
  await refresh();
}

async function releaseAll() {
  for (const seatId of Object.keys(state.locks)) {
    await releaseSeat(seatId);
  }
}

async function confirmBooking(name, email) {
  try {
    const seatIds = Object.keys(state.locks);
    const receipt = await api.confirmBooking(seatIds, state.clientId, name, email);
    setState({ receipt });
  } catch (error) {
    console.error("Error confirmando la compra:", error.reason || error);
  }
  await refresh();
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
    onReleaseAll: releaseAll,
  }),
  CheckoutModal(document.getElementById("checkout"), {
    onSubmit: confirmBooking,
    onClose: () => setState({ checkoutOpen: false, receipt: null }),
  }),
];

subscribe((newState) => components.forEach((component) => component.render(newState)));

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------
async function start() {
  setState({ clientId: getClientId() });
  try {
    await api.connect();
    setState({ event: await api.getEventInfo() });
    await refresh();
  } catch (error) {
    console.error("No se pudo conectar con el servidor:", error);
    setState({ connected: false });
  }
  // Consulta periódica para ver los cambios de otros clientes
  setInterval(refresh, REFRESH_MS);
}

start();
