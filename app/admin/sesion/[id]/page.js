'use client';

import { useEffect, useState, useCallback } from 'react';

import { useRouter, useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Plus, Trash2, PlayCircle, Square, CheckCircle, Zap, Radio, Lock, Loader2, BarChart2, Users, User, AlertTriangle, Monitor, X, Shield, ShieldCheck, ShieldX, RefreshCw, Send, MapPin, ChevronLeft, ChevronRight, Search, Eye, EyeOff, FileSpreadsheet } from 'lucide-react';

const ACRED_CFG = {
  preinscrito:        { label: 'Pendiente',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  acreditado_voto:    { label: 'Ingreso + Voto', color: 'bg-green-100 text-green-700 border-green-200'   },
  acreditado_ingreso: { label: 'Solo Ingreso',   color: 'bg-blue-100 text-blue-700 border-blue-200'      },
  rechazado:          { label: 'Rechazado',      color: 'bg-red-100 text-red-600 border-red-200'         },
};

const ACRED_FILTROS = [
  { key: 'preinscrito',        label: 'Pendientes',   color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { key: 'acreditado_voto',    label: 'Ingreso+Voto', color: 'text-green-700 bg-green-50 border-green-200'    },
  { key: 'acreditado_ingreso', label: 'Solo Ingreso', color: 'text-blue-700 bg-blue-50 border-blue-200'       },
  { key: 'rechazado',          label: 'Rechazados',   color: 'text-red-600 bg-red-50 border-red-200'          },
];

const ESTADO_SESION = {
  borrador:   { label: 'Borrador',   color: 'bg-yellow-100 text-yellow-700', next: 'proxima',    nextLabel: 'Publicar como Próxima' },
  proxima:    { label: 'Próxima',    color: 'bg-blue-100 text-blue-700',     next: 'en_curso',   nextLabel: 'Iniciar sesión'        },
  en_curso:   { label: 'En curso',   color: 'bg-green-100 text-green-700',   next: 'finalizada', nextLabel: 'Finalizar sesión'      },
  finalizada: { label: 'Finalizada', color: 'bg-gray-100 text-gray-500',     next: null,         nextLabel: null                    },
};

const ESTADO_PREG = {
  pendiente: { label: 'Pendiente', bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  activa:    { label: 'Activa',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  cerrada:   { label: 'Cerrada',   bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400'  },
};

const OPCION_VACIA_INDIVIDUAL = () => ({ tipo: 'individual', nombre: '' });
const OPCION_VACIA_PLANCHA    = () => ({ tipo: 'plancha',    nombre: '', miembros: [{ nombre: '', cargo: '' }] });

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
  { id: '36', nombre: 'Colombiano En El Exterior' },
  { id: '10', nombre: 'Córdoba' },
  { id: '11', nombre: 'Cundinamarca' },
  { id: '34', nombre: 'Exterior' },
  { id: '30', nombre: 'Guainía' },
  { id: '31', nombre: 'Guaviare' },
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
  { id: '35', nombre: 'Urrego' },
  { id: '32', nombre: 'Vaichada' },
  { id: '24', nombre: 'Valle del Cauca' },
  { id: '42', nombre: 'Vaupés' },
  { id: '33', nombre: 'Vichada' },
  { id: '37', nombre: 'Rojas' },
  { id: '38', nombre: 'Gejen' },
  { id: '39', nombre: 'Lopez' },
  { id: '40', nombre: 'Fuente' },
  { id: '41', nombre: 'Mierda' },
  { id: '43', nombre: '3017700100' },
  { id: '44', nombre: 'La' },
  { id: '45', nombre: 'Cubillos' },
];

function nombreMilitante(m) {
  return [m.primer_nombre, m.segundo_nombre, m.primer_apellido, m.segundo_apellido]
    .filter(Boolean).join(' ');
}

function TabInvitaciones({ sesion }) {
  // Deriva el ID de departamento del API a partir del nombre guardado en la sesión
  const deptoInicial = (() => {
    if (!sesion.departamento) return ''; // NACIONAL u otro sin departamento → sin filtro
    return DEPARTAMENTOS_API.find(
      (d) => d.nombre.toLowerCase() === (sesion.departamento || '').toLowerCase()
    )?.id ?? '';
  })();

  const [depto,        setDepto]        = useState(deptoInicial);
  const [busqueda,     setBusqueda]     = useState('');
  const [militantes,   setMilitantes]   = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [cargando,     setCargando]     = useState(true);
  const [seleccionados,setSeleccionados]= useState(new Map());
  const [confirmacion, setConfirmacion] = useState(false);
  const [enviando,     setEnviando]     = useState(false);
  const [resultado,    setResultado]    = useState(null);
  const [errorInv,     setErrorInv]     = useState('');
  const [invitadosSet,   setInvitadosSet]   = useState(new Set());
  const [invitadosLista, setInvitadosLista] = useState([]);

  const PER_PAGE     = 20;
  const totalPaginas = Math.ceil(total / PER_PAGE) || 1;

  // Carga emails ya invitados para esta sesión
  const cargarInvitados = useCallback(async () => {
    try {
      const res  = await fetch(`/api/admin/sesion/${encodeURIComponent(sesion.id)}/invitados`);
      const json = await res.json();
      if (json.ok) {
        const data = json.data ?? [];
        setInvitadosSet(new Set(data.map((r) => r.email)));
        setInvitadosLista(data);
      }
    } catch { /* silencioso */ }
  }, [sesion.id]);

  useEffect(() => { cargarInvitados(); }, [cargarInvitados]);

  // Carga militantes siempre (con o sin filtro de departamento)
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setErrorInv('');
    (async () => {
      try {
        const params = new URLSearchParams({ page });
        if (depto) params.set('departamento', depto);
        const res  = await fetch(`/api/admin/militantes?${params}`);
        const json = await res.json();
        if (!activo) return;
        if (!res.ok) { setErrorInv(json.error || 'Error al cargar'); return; }
        setMilitantes(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch {
        if (activo) setErrorInv('No se pudo conectar con la API de militantes.');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, [depto, page]);

  // Filtrado local en tiempo real por nombre o número de documento
  const datosFiltrados = busqueda.trim()
    ? militantes.filter((m) => {
        const q = busqueda.trim().toLowerCase();
        return (
          nombreMilitante(m).toLowerCase().includes(q) ||
          (m.numero_documento ?? '').toLowerCase().includes(q)
        );
      })
    : militantes;

  const handleDeptoChange = (e) => {
    setDepto(e.target.value);
    setPage(1);
    setBusqueda('');
    setSeleccionados(new Map());
    setResultado(null);
    setErrorInv('');
  };

  const cambiarPagina = (nuevaPagina) => {
    setPage(nuevaPagina);
    setSeleccionados(new Map());
  };

  const toggle = (m) => {
    if (!m.email) return;
    setSeleccionados((prev) => {
      const next = new Map(prev);
      if (next.has(m.email)) next.delete(m.email);
      else next.set(m.email, { email: m.email, nombre: nombreMilitante(m) });
      return next;
    });
  };

  const listaSeleccionada = Array.from(seleccionados.values());

  const handleEnviar = async () => {
    if (listaSeleccionada.length === 0) return;
    setEnviando(true);
    setResultado(null);
    try {
      const res  = await fetch(`/api/admin/sesion/${encodeURIComponent(sesion.id)}/invitar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ militantes: listaSeleccionada }),
      });
      const json = await res.json();
      setResultado(json);
      if (json.ok) {
        setSeleccionados(new Map());
        cargarInvitados();
      }
    } catch {
      setResultado({ ok: false, error: 'Error de red al enviar.' });
    } finally {
      setEnviando(false);
      setConfirmacion(false);
    }
  };

  const nombreDepto = depto
    ? (DEPARTAMENTOS_API.find((d) => d.id === depto)?.nombre ?? depto)
    : 'todos los departamentos';

  return (
    <>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">

      {/* ── Panel izquierdo: ya invitados ── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <CheckCircle size={13} className="text-green-600 flex-shrink-0" />
          <h3 className="text-xs font-bold text-gray-700">Invitados ({invitadosLista.length})</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
          {invitadosLista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Send size={24} className="mb-2 text-gray-200" />
              <p className="text-sm text-center leading-relaxed text-gray-300">Sin invitaciones<br/>enviadas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invitadosLista.map((inv, i) => {
                const initials = inv.nombre.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{inv.nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(inv.enviado_en).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho: selección ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Cabecera: filtros ── */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center bg-gray-50 rounded-t-2xl">
        {/* Departamento */}
        <div className="relative">
          <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={depto}
            onChange={handleDeptoChange}
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white appearance-none text-gray-700 w-48"
          >
            <option value="">Todos los departamentos</option>
            {DEPARTAMENTOS_API.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o documento…"
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white w-52"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={12} />
            </button>
          )}
        </div>

        {!cargando && total > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {busqueda.trim()
              ? `${datosFiltrados.length} resultado${datosFiltrados.length !== 1 ? 's' : ''}`
              : `${total.toLocaleString('es-CO')} militante${total !== 1 ? 's' : ''} · ${nombreDepto}`
            }
          </span>
        )}
      </div>

      {/* ── Aviso pruebas ── */}
      <div className="px-4 py-2.5 border-b border-yellow-100 bg-yellow-50 flex items-start gap-2">
        <AlertTriangle size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 font-medium leading-relaxed">
          <strong>Fase de pruebas:</strong> selecciona destinatarios uno por uno. Se mostrará un resumen antes de enviar.
        </p>
      </div>

      {/* ── Mensajes ── */}
      {resultado && (
        <div className={`px-4 py-2.5 border-b text-sm font-semibold flex items-center gap-2 ${
          resultado.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {resultado.ok
            ? <><CheckCircle size={14} className="flex-shrink-0" />
                {resultado.enviados} invitación{resultado.enviados !== 1 ? 'es' : ''} enviada{resultado.enviados !== 1 ? 's' : ''}.
                {resultado.fallidos > 0 && <span className="text-orange-600 ml-1">{resultado.fallidos} fallida{resultado.fallidos !== 1 ? 's' : ''}.</span>}
              </>
            : <><AlertTriangle size={14} className="flex-shrink-0" />{resultado.error || 'Error al enviar'}</>
          }
        </div>
      )}
      {errorInv && (
        <div className="px-4 py-2.5 border-b border-red-100 bg-red-50 flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle size={14} className="flex-shrink-0" />{errorInv}
        </div>
      )}

      {/* ── Lista (scroll interno) ── */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
        {cargando && (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={24} className="text-brand animate-spin" />
          </div>
        )}
        {!cargando && datosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={28} className="mb-2 text-gray-200" />
            <p className="text-sm">{busqueda.trim() ? 'Sin resultados en esta página' : 'No hay militantes'}</p>
          </div>
        )}
        {!cargando && datosFiltrados.length > 0 && (
          <div className="divide-y divide-gray-50">
            {datosFiltrados.map((m) => {
              const sinEmail    = !m.email;
              const marcado     = m.email ? seleccionados.has(m.email) : false;
              const yaInvitado  = m.email ? invitadosSet.has(m.email) : false;
              const initials    = ((m.primer_nombre?.[0] ?? '') + (m.primer_apellido?.[0] ?? '')).toUpperCase() || '?';
              return (
                <div
                  key={m.id_militante}
                  onClick={() => toggle(m)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    sinEmail
                      ? 'opacity-40 cursor-not-allowed'
                      : marcado
                        ? 'bg-brand-50 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    disabled={sinEmail}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 text-brand flex-shrink-0 pointer-events-none"
                  />
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${marcado ? 'bg-brand text-white' : 'bg-brand-50 text-brand'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{nombreMilitante(m)}</p>
                      {yaInvitado && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                          <AlertTriangle size={9} /> Ya invitado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{m.tipo_documento} {m.numero_documento}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {m.email
                      ? <p className="text-xs text-gray-500 truncate max-w-[180px]">{m.email}</p>
                      : <p className="text-xs text-gray-300 italic">Sin email</p>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer: paginación + acciones ── */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3 flex-wrap">
        {/* Paginación */}
        <div className="flex items-center gap-2">
          {totalPaginas > 1 && (
            <>
              <button disabled={page === 1} onClick={() => cambiarPagina(page - 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={12} /> Anterior
              </button>
              <span className="text-xs text-gray-400">Pág. {page}/{totalPaginas}</span>
              <button disabled={page >= totalPaginas} onClick={() => cambiarPagina(page + 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente <ChevronRight size={12} />
              </button>
            </>
          )}
        </div>

        {/* Selección + envío */}
        <div className="flex items-center gap-3 ml-auto">
          {seleccionados.size > 0 && (
            <span className="text-xs font-semibold text-brand">
              {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
              <button onClick={() => setSeleccionados(new Map())}
                className="ml-2 text-gray-400 hover:text-red-500">× limpiar</button>
            </span>
          )}
          <button
            onClick={() => setConfirmacion(true)}
            disabled={seleccionados.size === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Send size={13} />
            Revisar y enviar {seleccionados.size > 0 ? `(${seleccionados.size})` : ''}
          </button>
        </div>
      </div>

      </div>{/* fin panel derecho */}
    </div>{/* fin tarjeta única */}

    {/* Modal de confirmación */}
    {confirmacion && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => !enviando && setConfirmacion(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-brand" />
              <h3 className="font-bold text-gray-900 text-sm">Confirmar envío de invitaciones</h3>
            </div>
            {!enviando && (
              <button onClick={() => setConfirmacion(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                Estás a punto de enviar correos electrónicos <strong>reales</strong> a militantes activos. Esta acción no se puede deshacer. Revisa bien la lista antes de confirmar.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-700">
              <p className="font-bold text-gray-900 mb-1">{sesion.nombre}</p>
              <p>📅 {sesion.fecha} · 🕐 {sesion.hora}</p>
              <p>📍 {sesion.lugar}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Se enviará a {listaSeleccionada.length} destinatario{listaSeleccionada.length !== 1 ? 's' : ''}:
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {listaSeleccionada.map(({ email, nombre }) => {
                  const reinvitacion = invitadosSet.has(email);
                  return (
                    <div key={email} className={`flex items-center gap-3 px-4 py-2.5 ${reinvitacion ? 'bg-yellow-50' : ''}`}>
                      <div className="h-7 w-7 rounded-full bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">
                        {nombre.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                          {reinvitacion && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                              <AlertTriangle size={9} /> Re-envío
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={() => setConfirmacion(false)} disabled={enviando}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleEnviar} disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-brand hover:bg-brand-hover text-white disabled:opacity-60 transition-colors">
              {enviando
                ? <><Loader2 size={14} className="animate-spin" /> Enviando…</>
                : <><Send size={14} /> Confirmar envío</>
              }
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function FormPregunta({ onGuardar, onCancelar, preguntasBase = [], enVivo = false }) {
  const [tipo, setTipo]               = useState('sino');
  const [tipoMayoria, setTipoMayoria] = useState('simple');
  const [texto, setTexto]             = useState('');
  const [opciones, setOpciones]       = useState([OPCION_VACIA_INDIVIDUAL(), OPCION_VACIA_INDIVIDUAL()]);
  const [baseId, setBaseId]           = useState('');
  const [err, setErr]                 = useState('');

  const selBase = (id) => {
    const pb = preguntasBase.find((p) => p.id === id);
    if (pb) { setTexto(pb.texto); setTipo(pb.tipo); }
    setBaseId(id);
  };

  const setOpcion = (i, patch) =>
    setOpciones((prev) => prev.map((o, j) => j === i ? { ...o, ...patch } : o));

  const setMiembro = (i, j, patch) =>
    setOpciones((prev) => prev.map((o, oi) => oi !== i ? o : {
      ...o, miembros: o.miembros.map((m, mi) => mi === j ? { ...m, ...patch } : m),
    }));

  const addMiembro = (i) =>
    setOpciones((prev) => prev.map((o, oi) => oi !== i ? o : {
      ...o, miembros: [...o.miembros, { nombre: '', cargo: '' }],
    }));

  const removeMiembro = (i, j) =>
    setOpciones((prev) => prev.map((o, oi) => oi !== i ? o : {
      ...o, miembros: o.miembros.filter((_, mi) => mi !== j),
    }));

  const guardar = () => {
    if (!texto.trim()) { setErr('Escribe el texto de la pregunta'); return; }
    if (tipo === 'candidatos') {
      if (opciones.some((o) => !o.nombre.trim())) { setErr('Completa el nombre de cada opción'); return; }
      if (opciones.some((o) => o.tipo === 'plancha' && o.miembros.some((m) => !m.nombre.trim()))) {
        setErr('Completa los nombres de todos los integrantes'); return;
      }
    }
    onGuardar({ tipo, tipoMayoria, texto: texto.trim(), opciones, enVivo, pregunta_base_id: baseId || null });
  };

  return (
    <div className={`border-2 rounded-2xl p-4 flex flex-col gap-3 ${enVivo ? 'border-orange-400 bg-orange-50' : 'border-brand bg-brand-50'}`}>
      {enVivo && (
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Pregunta en vivo</span>
        </div>
      )}

      {preguntasBase.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Usar pregunta predefinida (opcional)</label>
          <select value={baseId} onChange={(e) => selBase(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">— Escribir pregunta personalizada —</option>
            {preguntasBase.map((p) => <option key={p.id} value={p.id}>{p.texto}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        {['sino', 'candidatos'].map((t) => (
          <button key={t} onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${tipo === t ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
            {t === 'sino' ? '👍 Sí / No' : '👤 Candidatos / Planchas'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-500">Tipo de mayoría requerida</p>
        <div className="flex gap-2">
          {[
            { key: 'simple',   label: 'Simple',   desc: '50%+1 de asistentes' },
            { key: 'absoluta', label: 'Absoluta', desc: '50%+1 de inscritos'  },
          ].map(({ key, label, desc }) => (
            <button key={key} onClick={() => setTipoMayoria(key)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs border-2 transition-all flex flex-col items-center gap-0.5 ${
                tipoMayoria === key ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}>
              <span className="font-bold">{label}</span>
              <span className={`text-[10px] leading-tight ${tipoMayoria === key ? 'text-white opacity-80' : 'text-gray-400'}`}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setErr(''); }}
        placeholder="Escribe la pregunta..." rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />

      {tipo === 'candidatos' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-600">Opciones de votación:</p>

          {opciones.map((op, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-xl p-3 flex flex-col gap-2 bg-white">
              <div className="flex gap-2">
                {[
                  { key: 'individual', label: 'Persona',  Icon: User  },
                  { key: 'plancha',    label: 'Plancha',  Icon: Users },
                ].map(({ key, label, Icon }) => (
                  <button key={key}
                    onClick={() => setOpcion(i, key === 'plancha'
                      ? { tipo: 'plancha',    miembros: op.miembros?.length ? op.miembros : [{ nombre: '', cargo: '' }] }
                      : { tipo: 'individual', miembros: undefined }
                    )}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      op.tipo === key ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-500'
                    }`}>
                    <Icon size={12} />{label}
                  </button>
                ))}
                {opciones.length > 2 && (
                  <button onClick={() => setOpciones(opciones.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <input
                value={op.nombre}
                onChange={(e) => { setOpcion(i, { nombre: e.target.value }); setErr(''); }}
                placeholder={op.tipo === 'plancha' ? `Nombre de la plancha ${i + 1}` : `Nombre del candidato ${i + 1}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />

              {op.tipo === 'plancha' && (
                <div className="flex flex-col gap-2 pl-3 border-l-2 border-brand-200 ml-1">
                  <p className="text-xs font-semibold text-gray-500">Integrantes:</p>
                  {(op.miembros || []).map((m, j) => (
                    <div key={j} className="flex gap-2">
                      <input
                        value={m.nombre}
                        onChange={(e) => { setMiembro(i, j, { nombre: e.target.value }); setErr(''); }}
                        placeholder={`Nombre integrante ${j + 1}`}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <input
                        value={m.cargo}
                        onChange={(e) => setMiembro(i, j, { cargo: e.target.value })}
                        placeholder="Cargo (opcional)"
                        className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      {(op.miembros || []).length > 1 && (
                        <button onClick={() => removeMiembro(i, j)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addMiembro(i)}
                    className="text-xs text-brand font-bold hover:underline self-start">
                    + Agregar integrante
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={() => setOpciones([...opciones, OPCION_VACIA_INDIVIDUAL()])}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand hover:text-brand transition-colors">
              <User size={12} /> + Persona
            </button>
            <button onClick={() => setOpciones([...opciones, OPCION_VACIA_PLANCHA()])}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand hover:text-brand transition-colors">
              <Users size={12} /> + Plancha
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={guardar} className={`flex-1 py-2 rounded-lg text-sm font-bold text-white ${enVivo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-hover'}`}>
          {enVivo ? '⚡ Publicar en vivo' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSesionPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const sesionId = decodeURIComponent(id);

  const [sesion, setSesion]               = useState(null);
  const [preguntas, setPreguntas]         = useState([]);
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [stats, setStats]                 = useState(null);
  const [resultados, setResultados]       = useState([]);
  const [tab, setTab]                     = useState('preguntas');
  const [mostrarForm, setMostrarForm]     = useState(false);
  const [mostrarVivo, setMostrarVivo]         = useState(false);
  const [mostrarCodigo,      setMostrarCodigo]      = useState(false);
  const [mostrarCodigoTexto, setMostrarCodigoTexto] = useState(false);
  const [exportando,         setExportando]         = useState(false);
  const [cargando, setCargando]               = useState(false);
  const [cerrandoInsc, setCerrandoInsc]       = useState(false);
  const [cerrandoAsist, setCerrandoAsist]     = useState(false);
  const [qrTs, setQrTs]                   = useState(() => Math.floor(Date.now() / 30000));
  const [qrSegundos, setQrSegundos]       = useState(30);
  const [preinscritos, setPreinscritos]   = useState([]);
  const [cargandoPreins, setCargandoPreins] = useState(false);
  const [filtroAcred, setFiltroAcred]     = useState('todos');

  const handleAcreditar = async (cedula, estado) => {
    setCargandoPreins(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preinscritos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, estado_acreditacion: estado }),
    });
    await cargar();
    setCargandoPreins(false);
  };

  const handleAcreditarBulk = async (estado) => {
    const pendientes = preinscritos
      .filter((p) => p.estado_acreditacion === 'preinscrito')
      .map((p) => p.cedula);
    if (pendientes.length === 0) return;
    setCargandoPreins(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preinscritos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedulas: pendientes, estado_acreditacion: estado }),
    });
    await cargar();
    setCargandoPreins(false);
  };

  const handleCerrarInscripciones = async () => {
    if (!confirm('¿Cerrar inscripciones? Esta acción es permanente y no se puede revertir.')) return;
    setCerrandoInsc(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/cerrar-inscripciones`, { method: 'POST' });
    await cargar();
    setCerrandoInsc(false);
  };

  const handleCerrarAsistencias = async () => {
    if (!confirm('¿Cerrar registro de asistencias? Esta acción es permanente y no se puede revertir.')) return;
    setCerrandoAsist(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/cerrar-asistencias`, { method: 'POST' });
    await cargar();
    setCerrandoAsist(false);
  };

  useEffect(() => {
    if (!mostrarCodigo) return;
    const tick = () => {
      const ahora = Date.now();
      const elapsed = (ahora / 1000) % 30;
      setQrSegundos(Math.ceil(30 - elapsed));
      setQrTs(Math.floor(ahora / 30000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mostrarCodigo]);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}`);
    if (!res.ok) return;
    const json = await res.json();
    if (!json.ok) return;
    setSesion(json.sesion);
    setPreguntas(json.preguntas);
    setPreguntasBase(json.preguntasBase);
    setStats(json.stats);
    setPreinscritos(json.preinscritos || []);
    setResultados(json.resultados || []);
  }, [sesionId]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, [sesionId, cargar]);

  if (!sesion) return (
    <div className="flex h-full min-h-screen items-center justify-center bg-gray-50">
      <Loader2 size={30} className="text-brand animate-spin" />
    </div>
  );

  const cfg      = ESTADO_SESION[sesion.estado] || ESTADO_SESION.borrador;
  const enCurso  = sesion.estado === 'en_curso';
  const activaId = sesion.pregunta_activa_id;
  const hayActiva= !!activaId;

  const quorumRequerido  = stats ? Math.floor(stats.inscritos / 2) + 1 : 0;
  const quorumAlcanzado  = stats ? stats.asistentes >= quorumRequerido : false;
  const faltanParaQuorum = stats ? Math.max(0, quorumRequerido - stats.asistentes) : 0;
  const pctAsistencia    = stats?.inscritos > 0
    ? Math.min(100, Math.round((stats.asistentes / stats.inscritos) * 100))
    : 0;

  const handleGuardar = async ({ tipo, tipoMayoria, texto, opciones, enVivo, pregunta_base_id }) => {
    setCargando(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preguntas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, tipo_mayoria: tipoMayoria, texto, opciones, enVivo, pregunta_base_id }),
    });
    setMostrarForm(false); setMostrarVivo(false);
    await cargar(); setCargando(false);
  };

  const handleEliminar = async (pId) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await fetch(`/api/admin/pregunta/${pId}`, { method: 'DELETE' });
    await cargar();
  };

  const handlePublicar = async (pId) => {
    setCargando(true);
    await fetch(`/api/admin/pregunta/${pId}/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sesionId }),
    });
    await cargar(); setCargando(false);
  };

  const handleCerrar = async () => {
    setCargando(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/cerrar`, { method: 'POST' });
    await cargar(); setCargando(false);
  };

  const handleExportPDF = async () => {
    setExportando(true);
    try {
      const [{ pdf }, { InformePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./InformePDF'),
      ]);
      const blob = await pdf(
        <InformePDF sesion={sesion} stats={stats} resultados={resultados} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `informe-${sesion.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setExportando(false);
    }
  };

  const handleExportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ESTADO_LABEL = {
      preinscrito:        'Pendiente',
      acreditado_voto:    'Ingreso + Voto',
      acreditado_ingreso: 'Solo Ingreso',
      rechazado:          'Rechazado',
    };
    const filas = preinscritos.map((p) => ({
      'Nombre':               p.nombre,
      'Cédula':               p.cedula,
      'Email':                p.email ?? '',
      'Estado':               ESTADO_LABEL[p.estado_acreditacion] ?? p.estado_acreditacion,
      'Fecha inscripción':    p.created_at ? new Date(p.created_at).toLocaleString('es-CO') : '',
    }));
    const ws = utils.json_to_sheet(filas);
    ws['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 36 }, { wch: 18 }, { wch: 22 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Inscritos');
    writeFile(wb, `inscritos-${sesion.id}.xlsx`);
  };

  const handleCambiarEstado = async () => {
    if (!cfg.next) return;
    setCargando(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: cfg.next }),
    });
    await cargar(); setCargando(false);
  };

  // Active question (pre-computed to avoid IIFE in JSX)
  const preguntaActiva = enCurso && hayActiva ? preguntas.find((p) => p.id === activaId) ?? null : null;

  // Preinscritos computed values (calculated before render, no IIFE needed)
  const acredCounts = preinscritos.reduce((acc, p) => {
    const k = p.estado_acreditacion || 'preinscrito';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const acredFiltrados = filtroAcred === 'todos'
    ? preinscritos
    : preinscritos.filter((p) => (p.estado_acreditacion || 'preinscrito') === filtroAcred);
  const acredPendientes = acredCounts.preinscrito || 0;

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Left panel — session info, fixed ~360px */}
      <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Header: name + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-base leading-snug">{sesion.nombre}</h1>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{sesion.id}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <span>📅 {sesion.fecha} · {sesion.hora}</span>
            <span>📍 {sesion.lugar}</span>
            <span>🏷️ {sesion.tipos_asamblea?.nombre} · {sesion.colectivos?.nombre}</span>
            <span className="flex items-center gap-2">
              🔑
              <span className={`font-mono font-bold tracking-widest ${mostrarCodigoTexto ? 'text-gray-900 select-all' : 'text-gray-300'}`}>
                {mostrarCodigoTexto ? sesion.codigo_asistencia : '••••••'}
              </span>
              <button onClick={() => setMostrarCodigoTexto((v) => !v)}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                {mostrarCodigoTexto ? <EyeOff size={12}/> : <Eye size={12}/>}
              </button>
              <button onClick={() => setMostrarCodigo(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand-50 border border-brand px-2 py-0.5 rounded-full hover:bg-brand hover:text-white transition-colors">
                <Monitor size={10} /> Proyectar QR
              </button>
            </span>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                <span><Users size={11} className="inline mr-1" /><strong>{stats.inscritos}</strong> inscritos</span>
                <span className="text-green-600"><ShieldCheck size={11} className="inline mr-1" /><strong>{stats.acreditados ?? '—'}</strong> acreditados</span>
                {stats.pendientes > 0 && (
                  <button onClick={() => setTab('preinscritos')}
                    className="text-yellow-600 font-bold hover:underline">
                    ⚠ {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''}
                  </button>
                )}
                <span>✅ <strong>{stats.asistentes}</strong> asistentes</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-500">Asistencia</span>
                  <span className="text-xs font-bold text-gray-700">{pctAsistencia}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${quorumAlcanzado ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${pctAsistencia}%` }}
                  />
                  {stats.inscritos > 0 && (
                    <div
                      className="absolute top-0 h-2.5 w-0.5 bg-brand"
                      style={{ left: `${Math.min(100, Math.round((quorumRequerido / stats.inscritos) * 100))}%` }}
                    />
                  )}
                </div>
              </div>

              {quorumAlcanzado ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-green-700">Hay quorum — la asamblea puede iniciar</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <AlertTriangle size={15} className="text-orange-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-orange-600">
                    Sin quorum — faltan <strong>{faltanParaQuorum}</strong> asistente{faltanParaQuorum !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Close buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {sesion.inscripciones_cerradas ? (
                  <div className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 font-semibold py-2 rounded-xl text-xs border border-gray-200">
                    <Lock size={12} /> Inscripciones cerradas
                  </div>
                ) : (
                  <button onClick={handleCerrarInscripciones} disabled={cerrandoInsc}
                    className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl text-xs border border-red-200 transition-colors disabled:opacity-50">
                    {cerrandoInsc ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                    Cerrar inscripciones
                  </button>
                )}
                {sesion.asistencias_cerradas ? (
                  <div className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 font-semibold py-2 rounded-xl text-xs border border-gray-200">
                    <Lock size={12} /> Asistencias cerradas
                  </div>
                ) : (
                  <button onClick={handleCerrarAsistencias} disabled={cerrandoAsist}
                    className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl text-xs border border-red-200 transition-colors disabled:opacity-50">
                    {cerrandoAsist ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                    Cerrar asistencias
                  </button>
                )}
              </div>
            </div>
          )}

          {/* State change button */}
          {cfg.next ? (
            <button onClick={handleCambiarEstado} disabled={cargando}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm text-white transition-colors disabled:opacity-60 ${
                cfg.next==='en_curso'   ?'bg-green-500 hover:bg-green-600':
                cfg.next==='finalizada'?'bg-gray-500 hover:bg-gray-600':'bg-blue-500 hover:bg-blue-600'}`}>
              {cfg.next==='en_curso'    && <PlayCircle size={16}/>}
              {cfg.next==='finalizada'  && <Square size={16}/>}
              {cfg.next==='proxima'     && <CheckCircle size={16}/>}
              {cfg.nextLabel}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl text-sm">
                <CheckCircle size={14}/> Sesión finalizada
              </div>
              <button
                onClick={handleExportPDF}
                disabled={exportando}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {exportando
                  ? <><Loader2 size={14} className="animate-spin"/> Generando PDF…</>
                  : <><BarChart2 size={14}/> Exportar informe PDF</>
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — questions / results */}
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
        {/* Active question alert */}
        {preguntaActiva && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Pregunta activa ahora</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-3">{preguntaActiva.texto}</p>
            <button onClick={handleCerrar} disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              <Lock size={14}/> Cerrar pregunta
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'preinscritos',  label: 'Preinscritos',  Icon: Shield    },
            { key: 'preguntas',     label: 'Preguntas',     Icon: Radio     },
            { key: 'resultados',    label: 'Resultados',    Icon: BarChart2 },
            { key: 'invitaciones',  label: 'Invitaciones',  Icon: Send      },
          ].map(({ key, label, Icon }) => {
            const badge =
              key === 'preinscritos' ? preinscritos.filter((p) => p.estado_acreditacion === 'preinscrito').length :
              key === 'resultados'   ? resultados.filter((r) => r.total_votos > 0).length : 0;
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px ${
                  tab === key ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <Icon size={13}/>{label}
                {badge > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    key === 'preinscritos' ? 'bg-yellow-500 text-white' : 'bg-brand text-white'
                  }`}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Preinscritos */}
        {tab === 'preinscritos' && (
          <div className="flex flex-col gap-4">
            {/* Resumen */}
            <div className="grid grid-cols-4 gap-3">
              {ACRED_FILTROS.map(({ key, label, color }) => (
                <div key={key}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${color} ${filtroAcred === key ? 'ring-2 ring-offset-1 ring-brand' : ''}`}
                  onClick={() => setFiltroAcred(filtroAcred === key ? 'todos' : key)}>
                  <p className="text-2xl font-extrabold">{acredCounts[key] || 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Acciones bulk */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-semibold">
                {acredPendientes} pendiente{acredPendientes !== 1 ? 's' : ''} sin acreditar
              </span>
              <button onClick={handleExportExcel} disabled={preinscritos.length === 0}
                className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-40 transition-colors">
                <FileSpreadsheet size={13}/> Exportar Excel ({preinscritos.length})
              </button>
              {acredPendientes > 0 && (
                <>
                  <button onClick={() => handleAcreditarBulk('acreditado_voto')}
                    className="flex items-center gap-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    <ShieldCheck size={12}/> Acreditar todos (Ingreso + Voto)
                  </button>
                  <button onClick={() => handleAcreditarBulk('acreditado_ingreso')}
                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    <ShieldCheck size={12}/> Acreditar todos (Solo Ingreso)
                  </button>
                </>
              )}
              <button onClick={cargar} disabled={cargandoPreins}
                className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                <RefreshCw size={13} className={cargandoPreins ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Filtro activo */}
            {filtroAcred !== 'todos' && (
              <button onClick={() => setFiltroAcred('todos')}
                className="text-xs text-brand font-semibold hover:underline self-start">
                ← Ver todos ({preinscritos.length})
              </button>
            )}

            {/* Lista */}
            {acredFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm">
                  {preinscritos.length === 0 ? 'Aún no hay inscripciones' : 'Sin resultados para este filtro'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {acredFiltrados.map((p, idx) => {
                  const aCredCfg = ACRED_CFG[p.estado_acreditacion] || ACRED_CFG.preinscrito;
                  const nombreStr = String(p.nombre || p.cedula || '?');
                  const initials = nombreStr.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                  return (
                    <div key={p.cedula || idx} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{nombreStr}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.cedula}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${aCredCfg.color}`}>
                        {aCredCfg.label}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleAcreditar(p.cedula, 'acreditado_voto')}
                          title="Acreditar: Ingreso + Voto"
                          className={`p-1.5 rounded-lg transition-colors ${p.estado_acreditacion === 'acreditado_voto' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                          <ShieldCheck size={15}/>
                        </button>
                        <button onClick={() => handleAcreditar(p.cedula, 'acreditado_ingreso')}
                          title="Acreditar: Solo Ingreso"
                          className={`p-1.5 rounded-lg transition-colors ${p.estado_acreditacion === 'acreditado_ingreso' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                          <Shield size={15}/>
                        </button>
                        <button onClick={() => handleAcreditar(p.cedula, 'rechazado')}
                          title="Rechazar"
                          className={`p-1.5 rounded-lg transition-colors ${p.estado_acreditacion === 'rechazado' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                          <ShieldX size={15}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Resultados */}
        {tab === 'resultados' && (
          <div className="flex flex-col gap-4">
            {resultados.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No hay preguntas en esta sesión todavía</p>
            )}
            {resultados.map((preg) => {
              const total      = Number(preg.total_votos) || 0;
              const umbral     = Number(preg.umbral) || 0;
              const baseUmbral = Number(preg.base_umbral) || 0;
              const esValida   = preg.es_valida;
              const ganador    = preg.ganador;
              const esCerrada  = preg.estado === 'cerrada';
              const maxVotos   = preg.opciones?.length
                ? Math.max(...preg.opciones.map((o) => Number(o.total)))
                : 0;

              const pctParticipacion = baseUmbral > 0 ? Math.min(100, Math.round((total / baseUmbral) * 100)) : 0;
              const pctUmbral        = baseUmbral > 0 ? Math.min(100, Math.round((umbral / baseUmbral) * 100)) : 50;
              const baseLabel        = preg.tipo_mayoria === 'absoluta' ? 'inscritos' : 'asistentes';

              return (
                <div key={preg.id} className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-colors ${
                  esCerrada && esValida         ? 'border-green-200' :
                  esCerrada && esValida === false ? 'border-red-200'   : 'border-gray-100'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{preg.texto}</p>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        preg.estado === 'activa'  ? 'bg-green-100 text-green-700' :
                        preg.estado === 'cerrada' ? 'bg-slate-100 text-slate-600' : 'bg-gray-100 text-gray-400'
                      }`}>{preg.estado}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        preg.tipo_mayoria === 'absoluta' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                      }`}>{preg.tipo_mayoria === 'absoluta' ? 'M. Absoluta' : 'M. Simple'}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500">Participación</span>
                      <span className="text-xs text-gray-500">
                        <strong className={total >= umbral ? 'text-green-600' : 'text-orange-500'}>{total}</strong>
                        {' / '}{umbral} requeridos ({baseUmbral} {baseLabel})
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 relative">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${total >= umbral ? 'bg-green-500' : 'bg-orange-400'}`}
                        style={{ width: `${pctParticipacion}%` }}
                      />
                      <div
                        className="absolute top-0 h-3 w-0.5 bg-brand"
                        style={{ left: `${pctUmbral}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-300 text-right mt-0.5">│ = umbral 50%+1</p>
                  </div>

                  {esCerrada && (
                    <div className={`flex items-start gap-2 rounded-xl px-3 py-2 mb-3 ${
                      esValida ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {esValida ? (
                        <>
                          <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-green-700">VOTACIÓN VÁLIDA</p>
                            <p className="text-xs text-green-600">
                              {total} votos superaron el umbral de {umbral} ({baseLabel}).
                              {ganador && <span className="font-bold"> Resultado: {ganador}</span>}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-red-600">VOTACIÓN INVÁLIDA</p>
                            <p className="text-xs text-red-500">
                              Solo {total} votos de los {umbral} requeridos (50%+1 de {baseUmbral} {baseLabel}).
                              {ganador && <span> Opción más votada: {ganador}</span>}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {total === 0 ? (
                    <p className="text-xs text-gray-300 italic">Sin votos aún</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribución</p>
                      {(preg.opciones || []).map((op) => {
                        const opTotal  = Number(op.total);
                        const pctBarra = maxVotos > 0 ? Math.round((opTotal / maxVotos) * 100) : 0;
                        const pctTotal = total  > 0 ? Math.round((opTotal / total)   * 100) : 0;
                        const esGanador = esCerrada && op.respuesta === ganador;
                        const barColor  = op.respuesta === 'SI' ? 'bg-green-500'
                                        : op.respuesta === 'NO' ? 'bg-red-400' : 'bg-brand';
                        return (
                          <div key={op.respuesta}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${esGanador && esValida ? 'text-green-700' : 'text-gray-700'}`}>
                                {esGanador && esValida ? '✓ ' : ''}{op.respuesta}
                              </span>
                              <span className="text-xs text-gray-500">{opTotal} votos ({pctTotal}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${barColor} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${pctBarra}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Preguntas */}
        {tab === 'preguntas' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Preguntas ({preguntas.length})
              </h2>
              <div className="flex gap-2">
                {enCurso && (
                  <button onClick={() => { setMostrarVivo(!mostrarVivo); setMostrarForm(false); }}
                    disabled={!quorumAlcanzado}
                    title={!quorumAlcanzado ? `Sin quorum — faltan ${faltanParaQuorum} asistentes` : ''}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                    <Zap size={12}/> En vivo
                  </button>
                )}
                {sesion.estado !== 'finalizada' && (
                  <button onClick={() => { setMostrarForm(!mostrarForm); setMostrarVivo(false); }}
                    className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg">
                    <Plus size={12}/> Agregar
                  </button>
                )}
              </div>
            </div>

            {mostrarVivo && <div className="mb-3"><FormPregunta enVivo preguntasBase={preguntasBase} onGuardar={handleGuardar} onCancelar={() => setMostrarVivo(false)}/></div>}
            {mostrarForm && <div className="mb-3"><FormPregunta preguntasBase={preguntasBase} onGuardar={handleGuardar} onCancelar={() => setMostrarForm(false)}/></div>}

            {preguntas.length === 0 && !mostrarForm && !mostrarVivo && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm mb-3">No hay preguntas configuradas</p>
                {sesion.estado !== 'finalizada' && (
                  <button onClick={() => setMostrarForm(true)} className="text-brand text-sm font-bold hover:underline">
                    + Agregar primera pregunta
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {preguntas.map((p, idx) => {
                const est    = ESTADO_PREG[p.estado] || ESTADO_PREG.pendiente;
                const activa = p.id === activaId;
                return (
                  <div key={p.id} className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all ${activa ? 'border-green-500' : p.estado==='cerrada' ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">#{idx+1}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${est.bg} ${est.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${est.dot} ${activa?'animate-pulse':''}`}/>{est.label}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo==='sino'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                          {p.tipo==='sino'?'👍 Sí/No':'👤 Candidatos'}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo_mayoria==='absoluta'?'bg-purple-100 text-purple-700':'bg-teal-100 text-teal-700'}`}>
                          {p.tipo_mayoria==='absoluta'?'M. Absoluta':'M. Simple'}
                        </span>
                        {p.en_vivo && <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5"><Zap size={10}/>En vivo</span>}
                      </div>
                      {sesion.estado !== 'finalizada' && p.estado !== 'activa' && (
                        <button onClick={() => handleEliminar(p.id)} className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0">
                          <Trash2 size={15}/>
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-gray-900 leading-snug mb-2">{p.texto}</p>

                    {p.tipo === 'candidatos' && p.candidatos?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.candidatos.map((c) => (
                          <span key={c.id} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${c.es_plancha ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.es_plancha ? <Users size={10}/> : <User size={10}/>}
                            {c.nombre}
                            {c.es_plancha && c.miembros?.length > 0 && <span className="text-[10px] opacity-70">({c.miembros.length})</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {enCurso && (
                      <div className="mt-2">
                        {p.estado === 'pendiente' && (
                          !quorumAlcanzado ? (
                            <div className="w-full flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 text-orange-500 font-semibold py-2.5 rounded-xl text-xs">
                              <AlertTriangle size={13}/> Sin quorum — faltan {faltanParaQuorum} asistente{faltanParaQuorum !== 1 ? 's' : ''}
                            </div>
                          ) : (
                            <button onClick={() => handlePublicar(p.id)} disabled={hayActiva || cargando}
                              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                              <Radio size={13}/> {hayActiva ? 'Cierra la pregunta activa primero' : 'Publicar esta pregunta'}
                            </button>
                          )
                        )}
                        {p.estado === 'activa' && (
                          <button onClick={handleCerrar} disabled={cargando}
                            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                            <Lock size={13}/> Cerrar votación
                          </button>
                        )}
                        {p.estado === 'cerrada' && (
                          <div className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
                            <CheckCircle size={12}/> Votación cerrada
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Invitaciones */}
        {tab === 'invitaciones' && <TabInvitaciones sesion={sesion} />}
      </div>

      {/* Modal pantalla completa: QR de asistencia */}
      {mostrarCodigo && (
        <div
          className="fixed inset-0 z-50 bg-brand flex flex-col items-center justify-center gap-5"
          onClick={() => setMostrarCodigo(false)}>
          <button
            onClick={() => setMostrarCodigo(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors">
            <X size={32} />
          </button>

          <p className="text-white/70 text-sm font-bold uppercase tracking-widest">
            Escanea el QR para registrar tu asistencia
          </p>

          <div className="bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <QRCode
              value={`${window.location.origin}/asistir/${sesion.id}?c=${sesion.codigo_asistencia}&ts=${qrTs}`}
              size={Math.min(280, window.innerWidth - 96)}
              level="M"
            />
          </div>

          <div className="flex flex-col items-center gap-2 w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-1000"
                style={{ width: `${(qrSegundos / 30) * 100}%` }}
              />
            </div>
            <p className="text-white/60 text-xs font-semibold">
              Código actualiza en {qrSegundos}s
            </p>
          </div>

          <p className="text-white/40 text-xs font-medium">{sesion.nombre}</p>

          <p className="text-white/25 text-xs">Toca en cualquier lugar para cerrar</p>
        </div>
      )}
    </div>
  );
}
