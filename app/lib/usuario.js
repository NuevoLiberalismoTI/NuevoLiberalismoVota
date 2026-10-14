// Sesión del usuario en el navegador.
// Se guarda en localStorage (compartido entre pestañas y persistente al cerrar el navegador),
// para que al abrir un enlace o escanear un QR en otra pestaña no se pida iniciar sesión de nuevo.
// Solo se borra cuando el usuario cierra sesión o cuando el servidor invalida el dispositivo.

const KEY = 'usuario';

export function getUsuario() {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(KEY);
    // Migración: sesiones iniciadas antes de este cambio quedaron en sessionStorage
    if (!raw) {
      raw = sessionStorage.getItem(KEY);
      if (raw) {
        localStorage.setItem(KEY, raw);
        sessionStorage.removeItem(KEY);
      }
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUsuario(usuario) {
  try {
    localStorage.setItem(KEY, JSON.stringify(usuario));
  } catch { /* almacenamiento bloqueado (modo privado estricto) */ }
}

export function clearUsuario() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

// Cierre de sesión explícito: borra la sesión local y la cookie del servidor
export async function cerrarSesion() {
  clearUsuario();
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}
