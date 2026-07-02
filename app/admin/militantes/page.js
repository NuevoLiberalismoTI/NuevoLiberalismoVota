'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, User, Phone, Mail, Calendar, IdCard, X,
} from 'lucide-react';

const PER_PAGE_ESTIMATE = 20;

const ESTADO_COLORS = {
  Activo:    'bg-green-100 text-green-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Inactivo:  'bg-gray-100 text-gray-500',
  Retirado:  'bg-red-100 text-red-600',
};

function estadoClass(estado) {
  return ESTADO_COLORS[estado] ?? 'bg-gray-100 text-gray-500';
}

function nombreCompleto(m) {
  return [m.primer_nombre, m.segundo_nombre, m.primer_apellido, m.segundo_apellido]
    .filter(Boolean)
    .join(' ');
}

function formatFecha(str) {
  if (!str || str.startsWith('0000')) return '—';
  return str.slice(0, 10);
}

export default function MilitantesPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [busqueda,  setBusqueda]  = useState('');
  const [inputVal,  setInputVal]  = useState('');
  const [detalle,   setDetalle]   = useState(null);

  const totalPaginas = Math.ceil(total / PER_PAGE_ESTIMATE) || 1;

  const cargar = useCallback(async (pg, q) => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: pg });
      if (q) params.set('search', q);
      const res  = await fetch(`/api/admin/militantes?${params}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error al cargar militantes'); return; }
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError('No se pudo conectar con la API de militantes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(page, busqueda); }, [page, busqueda, cargar]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setBusqueda(inputVal.trim());
  };

  const limpiarBusqueda = () => {
    setInputVal('');
    setPage(1);
    setBusqueda('');
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-50 rounded-xl p-2">
            <Users size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Militantes</h1>
            <p className="text-xs text-gray-400">
              {total > 0 ? `${total.toLocaleString('es-CO')} registros en total` : 'Cargando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand bg-white"
          />
          {inputVal && (
            <button type="button" onClick={limpiarBusqueda}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit"
          className="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-colors">
          Buscar
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={28} className="text-brand animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No se encontraron militantes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">ID</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Nombre</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Documento</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Contacto</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Rol</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Creación</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((m) => (
                  <tr key={m.id_militante} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.id_militante}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{nombreCompleto(m)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-xs text-gray-400">{m.tipo_documento}</span>{' '}
                      <span className="font-mono">{m.numero_documento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {m.email  && <span className="text-xs text-gray-500 truncate max-w-[160px]">{m.email}</span>}
                        {m.celular && <span className="text-xs text-gray-400 font-mono">{m.celular}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.rol_electoral ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass(m.estado_afiliacion)}`}>
                        {m.estado_afiliacion ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatFecha(m.fecha_creacion)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalle(m)}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!cargando && totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Página {page} de {totalPaginas.toLocaleString('es-CO')}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detalle && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm">
                  {(detalle.primer_nombre?.[0] ?? '') + (detalle.primer_apellido?.[0] ?? '')}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{nombreCompleto(detalle)}</p>
                  <p className="text-xs text-gray-400">ID #{detalle.id_militante}</p>
                </div>
              </div>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <span className={`self-start inline-flex px-3 py-1 rounded-full text-xs font-bold ${estadoClass(detalle.estado_afiliacion)}`}>
                {detalle.estado_afiliacion ?? '—'} · {detalle.rol_electoral ?? '—'}
              </span>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Campo icon={<IdCard size={14} />} label="Documento">
                  {detalle.tipo_documento} {detalle.numero_documento}
                </Campo>
                <Campo icon={<Calendar size={14} />} label="Nacimiento">
                  {formatFecha(detalle.fecha_nacimiento)}
                </Campo>
                <Campo icon={<User size={14} />} label="Sexo">
                  {detalle.sexo ?? '—'}
                </Campo>
                <Campo icon={<Phone size={14} />} label="Celular">
                  {detalle.celular ?? '—'}
                </Campo>
                <Campo icon={<Mail size={14} />} label="Email" wide>
                  {detalle.email ?? '—'}
                </Campo>
              </div>

              {(detalle.facebook || detalle.instagram || detalle.tiktok || detalle.x_twitter) && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Redes sociales</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {detalle.facebook  && <span>Facebook: {detalle.facebook}</span>}
                    {detalle.instagram && <span>Instagram: {detalle.instagram}</span>}
                    {detalle.tiktok    && <span>TikTok: {detalle.tiktok}</span>}
                    {detalle.x_twitter && <span>X/Twitter: {detalle.x_twitter}</span>}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Afiliación</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Campo label="Fecha afiliación">{formatFecha(detalle.fecha_afiliacion)}</Campo>
                  <Campo label="Fecha creación">{formatFecha(detalle.fecha_creacion)}</Campo>
                  <Campo label="Acepta ideales">{detalle.acepta_ideales === '1' ? 'Sí' : 'No'}</Campo>
                  <Campo label="Autoriza datos">{detalle.autoriza_datos === '1' ? 'Sí' : 'No'}</Campo>
                  <Campo label="Autoriza antecedentes">{detalle.autoriza_antecedentes === '1' ? 'Sí' : 'No'}</Campo>
                  {detalle.invitado_por_nombre && (
                    <Campo label="Invitado por">{detalle.invitado_por_nombre}</Campo>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ icon, label, wide, children }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
        {icon}{label}
      </p>
      <p className="text-gray-800 font-medium truncate">{children}</p>
    </div>
  );
}
