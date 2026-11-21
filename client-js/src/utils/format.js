export function formatMoney(value) {
  return "$" + Math.round(value).toLocaleString("es-CO");
}

// 85 segundos -> "01:25"
export function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export const ZONE_NAMES = {
  ZONEVIP: "VIP",
  ZONEPLATEA: "Platea",
  ZONEGENERAL: "General",
};
