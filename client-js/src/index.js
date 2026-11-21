import "./styles.css";
import { state, setState, subscribe, getMySeats } from "./state/store";
import { Header } from "./components/Header";
import { SeatMap } from "./components/SeatMap";
import { CartPanel } from "./components/CartPanel";
import { CheckoutModal } from "./components/CheckoutModal";
import { MyBookings } from "./components/MyBookings";
import { Toast } from "./components/Toast";
import * as api from "./services/bookingService";

const REFRESH_MS = 2000;  // cada cuánto se consulta el estado de las sillas
const NOTICE_MS = 4000;   // cuánto dura un mensaje en pantalla

// Identificador de sesión del cliente: se conserva si se recarga la página
function getClientId() {
  let id = sessionStorage.getItem("clientId");
  if (!id) {
    id = "CLI-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    sessionStorage.setItem("clientId", id);
  }
  return id;
}

// Muestra un mensaje temporal (RF-7)
let noticeTimer = null;
function notify(text, type = "info") {
  setState({ notice: { text, type } });
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => setState({ notice: null }), NOTICE_MS);
}

// ---------------------------------------------------------------------------
// Acciones: llaman al servidor y luego refrescan el estado
// ---------------------------------------------------------------------------

// Trae las sillas del servidor. Los bloqueos propios (con su hora de
// vencimiento) salen de las mismas sillas, así el temporizador siempre
// coincide con lo que tiene el servidor.
let connectionLost = false;
async function refresh() {
  try {
    if (!state.event) setState({ event: await api.getEventInfo() });
    const seats = await api.getAllSeats();
    const locks = {};
    getMySeats({ seats, clientId: state.clientId }).forEach((seat) => {
      locks[seat.id] = seat.expiresAt;
    });
    setState({ seats, locks, connected: true });

    if (connectionLost) {
      connectionLost = false;
      notify("Conexión con el servidor restablecida.");
    }
  } catch (error) {
    // Se conserva el último estado conocido; solo se marca OFFLINE
    if (!connectionLost) {
      connectionLost = true;
      notify(api.errorMessage(error), "error");
    }
    setState({ connected: false });
  }
}

async function loadBookings() {
  try {
    setState({ bookings: await api.getMyBookings(state.clientId) });
  } catch (error) {
    console.error("No se pudieron cargar las reservas:", error);
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
    notify(api.errorMessage(error), "error");
  }
  await refresh();
}

async function releaseSeat(seatId) {
  try {
    await api.releaseSeat(seatId, state.clientId);
  } catch (error) {
    notify(api.errorMessage(error), "error");
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
    await loadBookings();
  } catch (error) {
    notify(api.errorMessage(error), "error");
  }
  await refresh();
}

// Temporizador (RF-3): cuando un bloqueo llega a 00:00 se libera en el
// servidor para que la silla quede disponible para otros clientes.
let checkingLocks = false;
async function releaseExpiredLocks() {
  if (checkingLocks) return;
  checkingLocks = true;

  const expired = Object.keys(state.locks).filter((id) => state.locks[id] <= Date.now());
  for (const seatId of expired) {
    try {
      await api.releaseSeat(seatId, state.clientId);
    } catch (error) {
      console.error(`No se pudo liberar ${seatId}:`, error);
    }
  }
  if (expired.length > 0) {
    notify(`Se acabó el tiempo de retención. Sillas liberadas: ${expired.join(", ")}`, "error");
    await refresh();
  }

  checkingLocks = false;
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
  MyBookings(document.getElementById("my-bookings")),
  CheckoutModal(document.getElementById("checkout"), {
    onSubmit: confirmBooking,
    onClose: () => setState({ checkoutOpen: false, receipt: null }),
  }),
  Toast(document.getElementById("toast")),
];

subscribe((newState) => components.forEach((component) => component.render(newState)));

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------
async function start() {
  setState({ clientId: getClientId() });
  await refresh();
  await loadBookings();

  setInterval(refresh, REFRESH_MS);          // cambios de otros clientes
  setInterval(releaseExpiredLocks, 1000);    // vencimiento de mis bloqueos
}

start();
