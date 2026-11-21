import { Ice, BookingApp } from "../ice/BookingApp";

// Comunicación RPC con el servidor ZeroC Ice por WebSocket (RNF-4).
// Se usa el mismo host desde el que se abrió la página, así funciona
// tanto en localhost como en la VM.
const ENDPOINT = `BookingService:ws -h ${window.location.hostname || "localhost"} -p 10002`;

let communicator = null;
let service = null;

async function connect() {
  communicator = Ice.initialize();
  try {
    const base = communicator.stringToProxy(ENDPOINT);
    service = await BookingApp.BookingServicePrx.checkedCast(base);
  } catch (error) {
    communicator.destroy();
    service = null;
    throw error;
  }
}

// Si todavía no hay conexión (o falló al inicio), se intenta de nuevo.
// Una vez creado el proxy, Ice se reconecta solo si el servidor se cae y vuelve.
async function getService() {
  if (!service) await connect();
  return service;
}

// Traduce los errores remotos a un mensaje para el usuario (RF-7)
export function errorMessage(error) {
  if (error instanceof BookingApp.BookingException) {
    return error.reason; // SeatNotAvailable, LockExpired, InvalidBooking, ...
  }
  if (error instanceof Ice.LocalException) {
    return "No hay conexión con el servidor. Reintentando...";
  }
  return error.message || String(error);
}

// Convierte la silla de Ice (enums y Ice.Long) a un objeto JS simple,
// que es lo que usan los componentes.
function toSeat(seat) {
  return {
    id: seat.id,
    zone: seat.zone.name,
    row: seat.row,
    number: seat.number,
    price: seat.price,
    state: seat.state.name,
    lockedBy: seat.lockedByClientId,
    expiresAt: seat.lockTimestamp.toNumber() + seat.lockDurationSeconds.toNumber() * 1000,
  };
}

export async function getEventInfo() {
  const info = await (await getService()).getEventInfo();
  return { name: info.name, date: info.date, venue: info.venue };
}

export async function getAllSeats() {
  const seats = await (await getService()).getAllSeats();
  return seats.map(toSeat);
}

export async function lockSeat(seatId, clientId) {
  return (await getService()).lockSeat(seatId, clientId);
}

export async function releaseSeat(seatId, clientId) {
  return (await getService()).releaseSeat(seatId, clientId);
}

export async function confirmBooking(seatIds, clientId, name, email) {
  const result = await (await getService()).confirmBooking(seatIds, clientId, name, email);
  return {
    bookingCode: result.bookingCode,
    seatIds: result.seatIds,
    totalAmount: result.totalAmount,
  };
}

export async function getMyBookings(clientId) {
  const bookings = await (await getService()).getMyBookings(clientId);
  return bookings.map((b) => ({
    bookingCode: b.bookingCode,
    seatIds: b.seatIds,
    totalAmount: b.totalAmount,
    timestamp: b.timestamp.toNumber(),
  }));
}
