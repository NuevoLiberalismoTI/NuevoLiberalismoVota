'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LogOut, Plus, PlayCircle, Clock, CheckCircle, Settings,
  BarChart2, FileEdit, Loader2, ShieldCheck, SlidersHorizontal, X,
} from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_CFG = {
  en_curso:   { label: 'En curso',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  Icon: PlayCircle  },
  proxima:    { label: 'Próxima',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   Icon: Clock       },
  finalizada: { label: 'Finalizada', bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   Icon: CheckCircle },
  borrador:   { label: 'Borrador',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400', Icon: FileEdit    },
};

const FILTROS_VACIOS = { fechaDesde: '', fechaHasta: '', tipo: '', territorio: '' };

export default function AdminPage() {
  const router = useRouter();
  const [usuario, setUsuario]         = useState(null);
  const [sesiones, setSesiones]       = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [estado, setEstado]           = useState('todas');
  const [tipos, setTipos]             = useState([]);
  const [colectivos, setColectivos]   = useState([]);
  const [filtros, setFiltros]         = useState(FILTROS_VACIOS);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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

    fetch('/api/admin/parametricas').then((r) => r.json()).then((json) => {
      if (json.ok) { setTipos(json.tipos || []); setColectivos(json.colectivos || []); }
    });

    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const setFiltro = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));
  const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);
  const filtrosActivos = Object.values(filtros).filter(Boolean).length;

  const filtradas = useMemo(() => {
    return sesiones.filter((s) => {
      if (estado !== 'todas' && s.estado !== estado) return false;
      if (filtros.fechaDesde && s.fecha < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && s.fecha > filtros.fechaHasta) return false;
      if (filtros.tipo && s.tipos_asamblea?.codigo !== filtros.tipo) return false;
      if (filtros.territorio && s.colectivos?.codigo !== filtros.territorio) return false;
      return true;
    });
  }, [sesiones, estado, filtros]);

  const stats = {
    total:      sesiones.length,
    en_curso:   sesiones.filter((s) => s.estado === 'en_curso').length,
    proxima:    sesiones.filter((s) => s.estado === 'proxima').length,
    finalizada: sesiones.filter((s) => s.estado === 'finalizada').length,
  };

  if (!usuario) return null;

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
            { label: 'Total',       val: stats.total,      color: 'text-gray-800',  bg: 'bg-white',      Icon: BarChart2   },
            { label: 'En curso',    val: stats.en_curso,   color: 'text-green-700', bg: 'bg-green-50',   Icon: PlayCircle  },
            { label: 'Próximas',    val: stats.proxima,    color: 'text-blue-700',  bg: 'bg-blue-50',    Icon: Clock       },
            { label: 'Finalizadas', val: stats.finalizada, color: 'text-gray-500',  bg: 'bg-gray-100',   Icon: CheckCircle },
          ].map(({ label, val, color, bg, Icon }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-100`}>
              <Icon size={18} className={color} />
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => router.push('/admin/nueva')}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl transition-colors shadow-md">
            <Plus size={20} /> Crear nueva sesión
          </button>
          <button onClick={() => router.push('/admin/usuarios')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-brand text-brand font-bold py-4 px-5 rounded-xl transition-colors shadow-sm">
            <ShieldCheck size={18} /> Administradores
          </button>
        </div>

        {/* Listado + filtros */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Sesiones
              {!cargando && (
                <span className="ml-2 text-brand font-bold normal-case">
                  {filtradas.length} de {sesiones.length}
                </span>
              )}
            </h2>
            <button onClick={() => setMostrarFiltros((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                mostrarFiltros || filtrosActivos > 0
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand'
              }`}>
              <SlidersHorizontal size={13} />
              Filtros
              {filtrosActivos > 0 && (
                <span className="bg-white text-brand rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none font-black">
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>

          {/* Panel filtros avanzados */}
          {mostrarFiltros && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex flex-col gap-4">
              {/* Fecha */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fecha</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Desde</label>
                    <input type="date" value={filtros.fechaDesde}
                      onChange={(e) => setFiltro('fechaDesde', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Hasta</label>
                    <input type="date" value={filtros.fechaHasta}
                      onChange={(e) => setFiltro('fechaHasta', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                </div>
              </div>

              {/* Tipo y Territorio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de asamblea</label>
                  <select value={filtros.tipo} onChange={(e) => setFiltro('tipo', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    <option value="">Todos los tipos</option>
                    {tipos.map((t) => (
                      <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Territorio</label>
                  <select value={filtros.territorio} onChange={(e) => setFiltro('territorio', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                    <option value="">Todos los territorios</option>
                    {colectivos.map((c) => (
                      <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filtrosActivos > 0 && (
                <button onClick={limpiarFiltros}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg py-2 transition-colors">
                  <X size={13} /> Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Chips de estado */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['todas', 'en_curso', 'proxima', 'borrador', 'finalizada'].map((f) => (
              <button key={f} onClick={() => setEstado(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  estado === f ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'
                }`}>
                {f === 'todas' ? 'Todas' : ESTADO_CFG[f]?.label}
              </button>
            ))}
          </div>

          {cargando && <div className="flex justify-center py-8"><Loader2 size={28} className="text-brand animate-spin" /></div>}

          <div className="flex flex-col gap-3">
            {!cargando && filtradas.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-sm text-gray-400">No hay sesiones con los filtros seleccionados</p>
                {filtrosActivos > 0 && (
                  <button onClick={limpiarFiltros} className="mt-3 text-xs text-brand font-bold hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
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
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-400 items-center">
                      <span>📅 {s.fecha}</span>
                      {s.tipos_asamblea?.nombre && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.tipos_asamblea.nombre}</span>
                      )}
                      {s.colectivos?.nombre && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.colectivos.nombre}</span>
                      )}
                    </div>
                    <button onClick={() => router.push(`/admin/sesion/${encodeURIComponent(s.id)}`)}
                      className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex-shrink-0 ml-2">
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
