import "./styles.css";
import { BookingApp } from "./ice/BookingApp";

const app = document.getElementById("app");
app.innerHTML = `<h1>Icesi Live Arena</h1>`;

// Verificación del setup: el contrato Slice quedó incluido en el bundle
console.log("BookingApp cargado:", Object.keys(BookingApp));
