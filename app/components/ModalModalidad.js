'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Calendar, Building2, Monitor } from 'lucide-react';

// Ventana obligatoria: si el usuario está inscrito en una asamblea activa y no ha elegido
// cómo asistirá, debe escoger presencial o virtual antes de seguir. No se puede cerrar.
export default function ModalModalidad({ onCompletado }) {
  const [pendientes, setPendientes] = useState([]);
  const [guardando,  setGuardando]  = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    fetch('/api/modalidad')
      .then((r) => r.json())
      .then((json) => { if (json.ok) setPendientes(json.pendientes || []); })
      .catch(() => {});
  }, []);

  // Bloquear el scroll del fondo mientras la ventana está abierta
  useEffect(() => {
    if (pendientes.length === 0) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [pendientes.length]);

  if (pendientes.length === 0) return null;

  const actual = pendientes[0];

  const elegir = async (modalidad) => {
    setGuardando(modalidad);
    setError('');
    try {
      const res  = await fetch('/api/modalidad', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asambleaId: actual.id, modalidad }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || 'No se pudo guardar. Intenta de nuevo.'); return; }
      const resto = pendientes.slice(1);
      setPendientes(resto);
      if (resto.length === 0) onCompletado?.();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="modalidad-titulo">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand px-6 py-5">
          <h2 id="modalidad-titulo" className="text-white text-lg font-extrabold">¿Cómo asistirás?</h2>
          <p className="text-brand-200 text-xs mt-1">
            Elige si participarás de forma presencial o virtual
            {pendientes.length > 1 && ` (${pendientes.length} asambleas pendientes)`}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-extrabold text-gray-900">{actual.nombre}</p>
            {(actual.fecha || actual.hora) && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                <Calendar size={12}/> {[actual.fecha, actual.hora].filter(Boolean).join(' · ')}
              </p>
            )}
            {actual.lugar && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <MapPin size={12}/> {actual.lugar}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => elegir('presencial')} disabled={!!guardando}
              className="flex flex-col items-center gap-2 border-2 border-brand rounded-xl py-4 text-brand font-bold text-sm hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50 transition-colors">
              {guardando === 'presencial' ? <Loader2 size={26} className="animate-spin"/> : <Building2 size={26}/>}
              Presencial
            </button>
            <button onClick={() => elegir('virtual')} disabled={!!guardando}
              className="flex flex-col items-center gap-2 border-2 border-brand rounded-xl py-4 text-brand font-bold text-sm hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50 transition-colors">
              {guardando === 'virtual' ? <Loader2 size={26} className="animate-spin"/> : <Monitor size={26}/>}
              Virtual
            </button>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
