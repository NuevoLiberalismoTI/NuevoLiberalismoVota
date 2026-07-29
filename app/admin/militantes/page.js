'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, User, Phone, Mail, Calendar, IdCard, X, MapPin,
} from 'lucide-react';

const DEPARTAMENTOS_API = [
  { id: '29', nombre: 'Amazonas' },
  { id: '1',  nombre: 'Antioquia' },
  { id: '25', nombre: 'Arauca' },
  { id: '2',  nombre: 'Atlántico' },
  { id: '3',  nombre: 'Bogotá D.C.' },
  { id: '4',  nombre: 'Bolívar' },
  { id: '5',  nombre: 'Boyacá' },
  { id: '6',  nombre: 'Caldas' },
  { id: '7',  nombre: 'Caquetá' },
  { id: '26', nombre: 'Casanare' },
  { id: '8',  nombre: 'Cauca' },
  { id: '9',  nombre: 'Cesar' },
  { id: '12', nombre: 'Chocó' },
  { id: '10', nombre: 'Córdoba' },
  { id: '11', nombre: 'Cundinamarca' },
  { id: '13', nombre: 'Huila' },
  { id: '14', nombre: 'La Guajira' },
  { id: '15', nombre: 'Magdalena' },
  { id: '16', nombre: 'Meta' },
  { id: '17', nombre: 'Nariño' },
  { id: '18', nombre: 'Norte de Santander' },
  { id: '27', nombre: 'Putumayo' },
  { id: '19', nombre: 'Quindío' },
  { id: '20', nombre: 'Risaralda' },
  { id: '28', nombre: 'San Andrés y Providencia' },
  { id: '21', nombre: 'Santander' },
  { id: '22', nombre: 'Sucre' },
  { id: '23', nombre: 'Tolima' },
  { id: '24', nombre: 'Valle del Cauca' },
  { id: '36', nombre: 'Colombiano En El Exterior' },
];

const PER_PAGE_BROWSE  = 50;  // registros por página al navegar
const PER_PAGE_SEARCH  = 100; // registros que trae el servidor al buscar
const PER_PAGE_DISPLAY = 20;  // registros mostrados por página en UI

const ESTADO_COLORS = {
  Activo:    'bg-green-100 text-green-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Inactivo:  'bg-gray-100 text-gray-500',
  Retirado:  'bg-red-100 text-red-600',
  Suspendido:'bg-orange-100 text-orange-700',
};

function estadoClass(estado) {
  return ESTADO_COLORS[estado] ?? 'bg-gray-100 text-gray-500';
}

function nombreCompleto(m) {
  return [m.primer_nombre, m.segundo_nombre, m.primer_apellido, m.segundo_apellido]
    .filter(Boolean).join(' ');
}

function formatFecha(str) {
  if (!str || str.startsWith('0000')) return '—';
  return str.slice(0, 10);
}

function nombreDepto(id) {
  return DEPARTAMENTOS_API.find((d) => d.id === String(id))?.nombre ?? (id ? `Dept. ${id}` : '—');
}

export default function MilitantesPage() {
  const [data,       setData]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [cargando,   setCargando]   = useState(false);
  const [error,      setError]      = useState('');
  const [busqueda,   setBusqueda]   = useState('');
  const [depto,      setDepto]      = useState('');
  const [detalle,    setDetalle]    = useState(null);

  // Track mode: 'search' or 'browse'
  const q         = busqueda.trim();
  const esDigitos = /^\d+$/.test(q);
  const isSearch  = (q.length >= 2 && !esDigitos) || (q.length >= 3 && esDigitos);

  // For search: client-side pagination
  const pageUi        = isSearch ? page : 1;
  const totalPaginasUi = isSearch
    ? Math.ceil(data.length / PER_PAGE_DISPLAY) || 1
    : Math.ceil(total / PER_PAGE_BROWSE) || 1;
  const dataUi = isSearch
    ? data.slice((pageUi - 1) * PER_PAGE_DISPLAY, pageUi * PER_PAGE_DISPLAY)
    : data;

  // Fetch data from server
  const fetchData = useCallback(async (signal) => {
    setCargando(true);
    setError('');
    try {
      let params;
      let url;
      if (isSearch) {
        params = new URLSearchParams({ q, per_page: String(PER_PAGE_SEARCH) });
        url = `/api/admin/militantes?${params}`;
      } else {
        params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE_BROWSE) });
        if (depto) params.set('departamento', depto);
        url = `/api/admin/militantes?${params}`;
      }
      const res  = await fetch(url, { signal });
      if (!res.ok) throw new Error('Error API');
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      if (e.name !== 'AbortError') setError('No se pudo conectar con la API de militantes.');
    } finally {
      setCargando(false);
    }
  }, [isSearch, q, page, depto]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = isSearch ? 350 : 0;
    const timer = setTimeout(() => fetchData(controller.signal), delay);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [fetchData]);

  const handleDepto = (e) => {
    setDepto(e.target.value);
    setPage(1);
    setBusqueda('');
  };

  const limpiarTodo = () => {
    setBusqueda('');
    setDepto('');
    setPage(1);
  };

  const hayFiltros = q || depto;

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
              {isSearch
                ? data.length > 0
                  ? `${data.length} resultado${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`
                  : cargando ? 'Buscando…' : 'Busca por nombre o cédula'
                : total > 0
                  ? `${total.toLocaleString('es-CO')} registros${depto ? ` en ${nombreDepto(depto)}` : ' en total'}`
                  : cargando ? 'Cargando…' : 'Sin resultados'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            placeholder="Nombre (mín. 2 letras) o cédula (mín. 3 dígitos)"
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand bg-white w-80"
          />
          {busqueda && (
            <button type="button" onClick={() => { setBusqueda(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={depto} onChange={handleDepto}
            className="pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand bg-white appearance-none cursor-pointer text-gray-700 w-52">
            <option value="">Todos los departamentos</option>
            {DEPARTAMENTOS_API.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>

        {hayFiltros && (
          <button onClick={limpiarTodo}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl hover:border-red-200 transition-colors bg-white">
            <X size={13} /> Limpiar
          </button>
        )}
      </div>

      {/* Filter chips */}
      {hayFiltros && (
        <div className="flex gap-2 flex-wrap -mt-2">
          {q && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand text-xs font-semibold rounded-full">
              "{q}" <button onClick={() => { setBusqueda(''); setPage(1); }}><X size={11} /></button>
            </span>
          )}
          {depto && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand text-xs font-semibold rounded-full">
              <MapPin size={11} /> {nombreDepto(depto)}
              <button onClick={() => { setDepto(''); setPage(1); }}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

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
        ) : dataUi.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              {isSearch ? 'Sin resultados — intenta con otro término' : 'Usa el buscador o selecciona un departamento'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Nombre</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Documento</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Contacto</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Departamento</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Afiliación</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dataUi.map((m) => (
                  <tr key={m.id_militante} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{nombreCompleto(m)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-xs text-gray-400">{m.tipo_documento}</span>{' '}
                      <span className="font-mono text-sm">{m.numero_documento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {m.email   && <span className="text-xs text-gray-500 truncate max-w-[160px]">{m.email}</span>}
                        {m.celular && <span className="text-xs text-gray-400 font-mono">{m.celular}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {m.nombre_departamento ?? nombreDepto(m.id_departamento_residencia)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${estadoClass(m.estado_afiliacion)}`}>
                        {m.estado_afiliacion ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatFecha(m.fecha_afiliacion)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetalle(m)} className="text-xs font-semibold text-brand hover:underline">
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
      {!cargando && totalPaginasUi > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Página {isSearch ? pageUi : page} de {totalPaginasUi.toLocaleString('es-CO')}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={isSearch ? pageUi === 1 : page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} /> Anterior
            </button>
            <button disabled={isSearch ? pageUi >= totalPaginasUi : page >= totalPaginasUi}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
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

            <div className="px-6 py-5 flex flex-col gap-4">
              <span className={`self-start inline-flex px-3 py-1 rounded-full text-xs font-bold ${estadoClass(detalle.estado_afiliacion)}`}>
                {detalle.estado_afiliacion ?? '—'}{detalle.rol_electoral ? ` · ${detalle.rol_electoral}` : ''}
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
                <Campo icon={<MapPin size={14} />} label="Departamento" wide>
                  {detalle.nombre_departamento ?? nombreDepto(detalle.id_departamento_residencia)}
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
