// Datos de prueba con la misma forma que devuelve el servidor.
// Se usan mientras el frontend no está conectado a ZeroC Ice.

export const mockEvent = {
  name: "Concierto Icesi Live Rock & Pop 2026",
  date: "2026-11-28 20:00",
  venue: "Auditorio Manuelita - Universidad Icesi",
};

const ZONES = [
  { rows: ["A", "B"], zone: "ZONEVIP", price: 120000 },
  { rows: ["C", "D", "E"], zone: "ZONEPLATEA", price: 75000 },
  { rows: ["F", "G", "H", "I"], zone: "ZONEGENERAL", price: 45000 },
];

export function createMockSeats() {
  const seats = [];
  for (const { rows, zone, price } of ZONES) {
    for (const row of rows) {
      for (let number = 1; number <= 10; number++) {
        seats.push({ id: `${row}-${number}`, zone, row, number, price, state: "AVAILABLE", lockedBy: "" });
      }
    }
  }
  // Algunas sillas ocupadas para ver todos los estados en pantalla
  seats.find((s) => s.id === "A-3").state = "BOOKED";
  seats.find((s) => s.id === "C-9").state = "BOOKED";
  Object.assign(seats.find((s) => s.id === "C-4"), { state: "LOCKED", lockedBy: "OTRO-CLIENTE" });
  return seats;
}
