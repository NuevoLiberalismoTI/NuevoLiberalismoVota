'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, PlayCircle, Clock, CheckCircle,
  BarChart2, FileEdit, Loader2, Settings, SlidersHorizontal, X,
} from 'lucide-react';

const ESTADO_CFG = {
  en_curso:   { label: 'En curso',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  Icon: PlayCircle  },
  proxima:    { label: 'Próxima',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   Icon: Clock       },
  finalizada: { label: 'Finalizada', bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   Icon: CheckCircle },
  borrador:   { label: 'Borrador',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400', Icon: FileEdit    },
};

const FILTROS_VACIOS = { fechaDesde: '', fechaHasta: '', tipo: '', territorio: '' };

export default function AdminPage() {
  const router = useRouter();
  const [usuario, setUsuario]               = useState(null);
  const [sesiones, setSesiones]             = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [estado, setEstado]                 = useState('todas');
  const [tipos, setTipos]                   = useState([]);
  const [colectivos, setColectivos]         = useState([]);
  const [filtros, setFiltros]               = useState(FILTROS_VACIOS);
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
    if (stored) setUsuario(JSON.parse(stored));
    cargar();

    fetch('/api/admin/parametricas').then((r) => r.json()).then((json) => {
      if (json.ok) { setTipos(json.tipos || []); setColectivos(json.colectivos || []); }
    });

    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="p-6">
      {/* Welcome + action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Administrador</p>
          <h1 className="text-xl font-bold text-gray-900">
            {usuario ? `Bienvenido, ${usuario.nombre}` : 'Bienvenido'}
          </h1>
        </div>
        <button
          onClick={() => router.push('/admin/nueva')}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
        >
          <Plus size={16} /> Nueva sesión
        </button>
      </div>

      {/* Stats — 4 cols */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',       val: stats.total,      color: 'text-gray-800',  bg: 'bg-white',     Icon: BarChart2   },
          { label: 'En curso',    val: stats.en_curso,   color: 'text-green-700', bg: 'bg-green-50',  Icon: PlayCircle  },
          { label: 'Próximas',    val: stats.proxima,    color: 'text-blue-700',  bg: 'bg-blue-50',   Icon: Clock       },
          { label: 'Finalizadas', val: stats.finalizada, color: 'text-gray-500',  bg: 'bg-gray-100',  Icon: CheckCircle },
        ].map(({ label, val, color, bg, Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-100`}>
            <Icon size={18} className={color} />
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Sessions header + filter toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Sesiones
          {!cargando && (
            <span className="ml-2 text-brand font-bold normal-case">
              {filtradas.length} de {sesiones.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setMostrarFiltros((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
            mostrarFiltros || filtrosActivos > 0
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-gray-600 border-gray-200 hover:border-brand'
          }`}
        >
          <SlidersHorizontal size={13} />
          Filtros
          {filtrosActivos > 0 && (
            <span className="bg-white text-brand rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none font-black">
              {filtrosActivos}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters panel */}
      {mostrarFiltros && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-3">
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

      {/* Estado chips */}
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

      {/* Loading */}
      {cargando && (
        <div className="flex justify-center py-8">
          <Loader2 size={28} className="text-brand animate-spin" />
        </div>
      )}

      {/* Table */}
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

      {!cargando && filtradas.length > 0 && (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">ID</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Nombre</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Tipo · Colectivo</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Estado</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s) => {
                const cfg = ESTADO_CFG[s.estado] || ESTADO_CFG.borrador;
                return (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-gray-400">{s.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 text-sm">{s.nombre}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.tipos_asamblea?.nombre && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {s.tipos_asamblea.nombre}
                          </span>
                        )}
                        {s.colectivos?.nombre && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {s.colectivos.nombre}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{s.fecha}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => router.push(`/admin/sesion/${encodeURIComponent(s.id)}`)}
                        className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                      >
                        <Settings size={13} /> Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
