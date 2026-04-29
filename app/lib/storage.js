import { SESIONES_DEFAULT } from './data';

const KEY = 'nl_sesiones';
const EV  = 'nl_sesiones_update';

export function getSesiones() {
  if (typeof window === 'undefined') return SESIONES_DEFAULT;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : SESIONES_DEFAULT;
}

export function getSesion(id) {
  return getSesiones().find((s) => s.id === id) || null;
}

export function saveSesiones(sesiones) {
  localStorage.setItem(KEY, JSON.stringify(sesiones));
  // Notifica otras pestañas (storage event) y la misma pestaña (custom event)
  window.dispatchEvent(new CustomEvent(EV, { detail: sesiones }));
}

export function crearSesion(sesion) {
  const sesiones = getSesiones();
  sesiones.unshift(sesion);
  saveSesiones(sesiones);
}

export function actualizarSesion(sesionActualizada) {
  const sesiones = getSesiones().map((s) =>
    s.id === sesionActualizada.id ? sesionActualizada : s
  );
  saveSesiones(sesiones);
}

export function agregarPregunta(sesionId, pregunta) {
  const sesiones = getSesiones();
  const idx = sesiones.findIndex((s) => s.id === sesionId);
  if (idx === -1) return;
  const maxId = sesiones[idx].preguntas.reduce((m, p) => Math.max(m, p.id), 0);
  sesiones[idx].preguntas.push({ ...pregunta, id: maxId + 1, estado: 'pendiente', enVivo: !!pregunta.enVivo });
  saveSesiones(sesiones);
}

export function publicarPregunta(sesionId, preguntaId) {
  const sesiones = getSesiones();
  const idx = sesiones.findIndex((s) => s.id === sesionId);
  if (idx === -1) return;
  sesiones[idx].preguntas = sesiones[idx].preguntas.map((p) => ({
    ...p,
    estado: p.id === preguntaId ? 'activa' : p.estado === 'activa' ? 'cerrada' : p.estado,
  }));
  sesiones[idx].preguntaActivaId = preguntaId;
  saveSesiones(sesiones);
}

export function cerrarPreguntaActiva(sesionId) {
  const sesiones = getSesiones();
  const idx = sesiones.findIndex((s) => s.id === sesionId);
  if (idx === -1) return;
  sesiones[idx].preguntas = sesiones[idx].preguntas.map((p) => ({
    ...p,
    estado: p.estado === 'activa' ? 'cerrada' : p.estado,
  }));
  sesiones[idx].preguntaActivaId = null;
  saveSesiones(sesiones);
}

export function eliminarPregunta(sesionId, preguntaId) {
  const sesiones = getSesiones();
  const idx = sesiones.findIndex((s) => s.id === sesionId);
  if (idx === -1) return;
  sesiones[idx].preguntas = sesiones[idx].preguntas.filter((p) => p.id !== preguntaId);
  saveSesiones(sesiones);
}

export function cambiarEstado(sesionId, nuevoEstado) {
  const sesiones = getSesiones().map((s) =>
    s.id === sesionId ? { ...s, estado: nuevoEstado } : s
  );
  saveSesiones(sesiones);
}

export const EVENTO_UPDATE = EV;
