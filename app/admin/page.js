'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Plus, PlayCircle, Clock, CheckCircle, Settings, BarChart2, FileEdit, Loader2 } from 'lucide-react';
const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_CFG = {
  en_curso:   { label: 'En curso',   bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500',  Icon: PlayCircle  },
  proxima:    { label: 'Próxima',    bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-400',   Icon: Clock       },
  finalizada: { label: 'Finalizada', bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-400',   Icon: CheckCircle },
  borrador:   { label: 'Borrador',   bg: 'bg-yellow-100',text: 'text-yellow-700',dot: 'bg-yellow-400', Icon: FileEdit    },
};

export default function AdminPage() {
  const router = useRouter();
  const [usuario, setUsuario]   = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro]     = useState('todas');

  const cargar = async () => {
    const res = await fetch('/api/admin/sesiones');
    if (res.ok) {
      const json = await res.json();
      if (json.ok) setSesiones(json.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    const u = JSON.parse(stored);
    if (u.rol !== 'admin') { router.replace('/dashboard'); return; }
    setUsuario(u);
    cargar();

    // Polling cada 5 segundos para reflejar cambios de estado
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (!usuario) return null;

  const filtradas = filtro === 'todas' ? sesiones : sesiones.filter((s) => s.estado === filtro);
  const stats = {
    total:      sesiones.length,
    en_curso:   sesiones.filter((s) => s.estado === 'en_curso').length,
    proxima:    sesiones.filter((s) => s.estado === 'proxima').length,
    finalizada: sesiones.filter((s) => s.estado === 'finalizada').length,
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority />
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-brand-200 text-xs font-semibold">Panel Admin</span>
            <button onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                sessionStorage.removeItem('usuario');
                router.push('/');
              }}
              className="flex items-center gap-1.5 text-white text-xs font-semibold hover:text-brand-200 transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Administrador</p>
          <h1 className="text-xl font-bold text-gray-900">{usuario.nombre}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       val: stats.total,      color: 'text-gray-800', bg: 'bg-white',     Icon: BarChart2   },
            { label: 'En curso',    val: stats.en_curso,   color: 'text-green-700',bg: 'bg-green-50',  Icon: PlayCircle  },
            { label: 'Próximas',    val: stats.proxima,    color: 'text-blue-700', bg: 'bg-blue-50',   Icon: Clock       },
            { label: 'Finalizadas', val: stats.finalizada, color: 'text-gray-500', bg: 'bg-gray-100',  Icon: CheckCircle },
          ].map(({ label, val, color, bg, Icon }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-100`}>
              <Icon size={18} className={color} />
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Crear */}
        <button onClick={() => router.push('/admin/nueva')}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl transition-colors shadow-md">
          <Plus size={20} /> Crear nueva sesión
        </button>

        {/* Filtros */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Todas las sesiones</h2>
          <div className="flex gap-2 flex-wrap mb-4">
            {['todas','en_curso','proxima','borrador','finalizada'].map((f) => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filtro === f ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
                {f === 'todas' ? 'Todas' : ESTADO_CFG[f]?.label}
              </button>
            ))}
          </div>

          {cargando && <div className="flex justify-center py-8"><Loader2 size={28} className="text-brand animate-spin" /></div>}

          <div className="flex flex-col gap-3">
            {!cargando && filtradas.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No hay sesiones en esta categoría</p>
            )}
            {filtradas.map((s) => {
              const cfg = ESTADO_CFG[s.estado] || ESTADO_CFG.borrador;
              return (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-snug truncate">{s.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{s.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-400">
                      📅 {s.fecha} · 🗺️ {s.tipos_asamblea?.nombre} · {s.colectivos?.nombre}
                    </div>
                    <button onClick={() => router.push(`/admin/sesion/${encodeURIComponent(s.id)}`)}
                      className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                      <Settings size={13} /> Gestionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-6">
        © {new Date().getFullYear()} Nuevo Liberalismo · Panel de Administración
      </footer>
    </main>
  );
}
