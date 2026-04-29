'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Calendar, Clock, CheckCircle, PlayCircle, Lock } from 'lucide-react';
import { getSesiones, EVENTO_UPDATE } from '../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_CONFIG = {
  en_curso: { label: 'En curso', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: PlayCircle },
  proxima:  { label: 'Próxima',  color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400',  icon: Clock },
  finalizada:{ label: 'Finalizada',color:'bg-gray-100 text-gray-500',  dot: 'bg-gray-400',  icon: CheckCircle },
};

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario]   = useState(null);
  const [sesiones, setSesiones] = useState([]);

  const cargar = () => setSesiones(getSesiones());

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    setUsuario(JSON.parse(stored));
    cargar();
    window.addEventListener(EVENTO_UPDATE, cargar);
    window.addEventListener('storage', cargar);
    return () => {
      window.removeEventListener(EVENTO_UPDATE, cargar);
      window.removeEventListener('storage', cargar);
    };
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    router.push('/');
  };

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="w-full bg-brand shadow-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={140} height={46} className="object-contain" priority />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-white text-xs font-semibold hover:text-brand-200 transition-colors">
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      {/* Bienvenida */}
      <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Bienvenido(a)</p>
        <h1 className="text-xl font-bold text-gray-900">{usuario.nombre}</h1>
        <p className="text-xs text-gray-400 mt-0.5">Cédula: {usuario.cedula}</p>
      </div>

      {/* Sesiones */}
      <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 flex-1">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tus asambleas</h2>

        {sesiones.map((sesion) => {
          const cfg = ESTADO_CONFIG[sesion.estado];
          const Icon = cfg.icon;
          const activa = sesion.estado === 'en_curso';

          return (
            <div
              key={sesion.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all ${activa ? 'border-brand' : 'border-gray-100'}`}
            >
              {/* Badge estado */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <Icon size={18} className={activa ? 'text-brand' : 'text-gray-300'} />
              </div>

              <h3 className="font-bold text-gray-900 mb-1 leading-snug">{sesion.nombre}</h3>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                <Calendar size={12} /> {sesion.fecha} · {sesion.hora}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                <Clock size={12} /> {sesion.lugar}
              </div>

              {activa ? (
                <button
                  onClick={() => router.push(`/sesion/${sesion.id}`)}
                  className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle size={18} />
                  Ingresar a la sesión
                </button>
              ) : sesion.estado === 'proxima' ? (
                <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl text-sm cursor-not-allowed">
                  <Lock size={15} />
                  Aún no disponible
                </div>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-400 font-semibold py-3 rounded-xl text-sm">
                  <CheckCircle size={15} />
                  Sesión finalizada
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-4">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}
