import { Ice, BookingApp } from "../ice/BookingApp";

// Comunicación RPC con el servidor ZeroC Ice por WebSocket (RNF-4).
// Se usa el mismo host desde el que se abrió la página, así funciona
// tanto en localhost como en la VM.
const ENDPOINT = `BookingService:ws -h ${window.location.hostname || "localhost"} -p 10002`;

let communicator = null;
let service = null;

export async function connect() {
  communicator = Ice.initialize();
  const base = communicator.stringToProxy(ENDPOINT);
  service = await BookingApp.BookingServicePrx.checkedCast(base);
  if (!service) {
    throw new Error("El proxy no corresponde a BookingService");
  }
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
  const info = await service.getEventInfo();
  return { name: info.name, date: info.date, venue: info.venue };
}

export async function getAllSeats() {
  const seats = await service.getAllSeats();
  return seats.map(toSeat);
}

export function lockSeat(seatId, clientId) {
  return service.lockSeat(seatId, clientId);
}

export function releaseSeat(seatId, clientId) {
  return service.releaseSeat(seatId, clientId);
}

export async function confirmBooking(seatIds, clientId, name, email) {
  const result = await service.confirmBooking(seatIds, clientId, name, email);
  return {
    bookingCode: result.bookingCode,
    seatIds: result.seatIds,
    totalAmount: result.totalAmount,
  };
}
