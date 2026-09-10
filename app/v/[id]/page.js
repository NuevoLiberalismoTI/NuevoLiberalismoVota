'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, LogIn, ShieldCheck, AlertTriangle, Calendar, MapPin } from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function VotoRapidoPage() {
  const router   = useRouter();
  const params   = useParams();
  const sesionId = decodeURIComponent(params.id);

  const [sesion,    setSesion]    = useState(null);
  const [cedula,    setCedula]    = useState('');
  const [error,     setError]     = useState('');
  const [cargando,  setCargando]  = useState(false);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    fetch(`/api/voto-rapido/${encodeURIComponent(sesionId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) setError('Esta sesión no está disponible.');
        else setSesion(json.sesion);
      })
      .catch(() => setError('Error al cargar la sesión.'))
      .finally(() => setIniciando(false));
  }, [sesionId]);

  const handleAcceder = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) { setError('Ingresa tu número de identificación'); return; }
    setCargando(true);
    setError('');
    try {
      const res  = await fetch(`/api/voto-rapido/${encodeURIComponent(sesionId)}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cedula: cedula.trim() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || 'No tienes acceso a esta sesión'); return; }
      sessionStorage.setItem('usuario', JSON.stringify(json.usuario));
      router.push(`/sesion/${encodeURIComponent(sesionId)}`);
    } catch {
      setError('Error al conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (iniciando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand"/>
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority/>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertTriangle size={40} className="text-orange-400 mx-auto mb-3"/>
            <p className="text-gray-700 font-semibold">{error || 'Sesión no disponible.'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority/>
        <span className="text-brand-200 text-xs mt-2">Acceso a votación</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">

          <div className="flex justify-center mb-5">
            <div className="bg-brand-50 rounded-full p-4">
              <ShieldCheck size={36} className="text-brand"/>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">{sesion.nombre}</h2>
          <div className="flex flex-col items-center gap-1 mb-6">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={11}/> {sesion.fecha} · {sesion.hora}
            </span>
            {sesion.lugar && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11}/> {sesion.lugar}
              </span>
            )}
          </div>

          <form onSubmit={handleAcceder} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Número de identificación</label>
              <input
                type="number"
                value={cedula}
                onChange={(e) => { setCedula(e.target.value); setError(''); }}
                placeholder="Ingresa tu cédula"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
              {cargando ? <Loader2 size={18} className="animate-spin"/> : <LogIn size={18}/>}
              {cargando ? 'Verificando...' : 'Acceder a votación'}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 px-4 border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}
