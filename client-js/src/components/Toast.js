// Notificación flotante para errores y avisos (RF-7).
// state.notice = { text, type } donde type es "error" o "info".
export function Toast(root) {
  function render(state) {
    root.hidden = !state.notice;
    if (state.notice) {
      root.textContent = state.notice.text;
      root.className = `toast ${state.notice.type}`;
    }
  }

  return { render };
}
