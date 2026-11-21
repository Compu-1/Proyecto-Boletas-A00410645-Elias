// Carga el código generado por slice2js (src/generated/BookingService.js).
// En el navegador, ese archivo busca la librería Ice en window.Ice
// y deja el módulo BookingApp en window.BookingApp.
import { Ice } from "ice";

window.Ice = Ice;
require("../generated/BookingService.js");

export const BookingApp = window.BookingApp;
export { Ice };
