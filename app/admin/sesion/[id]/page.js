'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

import { useRouter, useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Plus, Trash2, PlayCircle, Square, CheckCircle, Zap, Radio, Lock, Loader2, BarChart2, Users, User, AlertTriangle, Monitor, X, Shield, ShieldCheck, ShieldX, RefreshCw, Send, MapPin, ChevronLeft, ChevronRight, Search, Eye, EyeOff, FileSpreadsheet, Timer, Award, UsersRound, Calendar, Clock, Tag, Key, SpellCheck, Copy, Download } from 'lucide-react';

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
const OPCION_VACIA_PLANCHA    = () => ({ tipo: 'plancha',    nombre: '', miembros: [{ nombre: '', cargo: '', suplente: '' }] });

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
  const [modo,           setModo]           = useState('manual');
  const [seleccionados,  setSeleccionados]  = useState(new Map());
  const [confirmacion,   setConfirmacion]   = useState(false);
  const [enviando,       setEnviando]       = useState(false);
  const [resultado,      setResultado]      = useState(null);
  const [invitadosSet,   setInvitadosSet]   = useState(new Set());
  const [invitadosLista, setInvitadosLista] = useState([]);
  const [mNombre,    setMNombre]    = useState('');
  const [mEmail,     setMEmail]     = useState('');
  const [mCedula,    setMCedula]    = useState('');
  const [mTelefono,  setMTelefono]  = useState('');
  const [mError,  setMError]  = useState('');
  const [xlsFile,          setXlsFile]          = useState(null);
  const [xlsPreview,       setXlsPreview]       = useState([]);
  const [xlsError,         setXlsError]         = useState('');
  const [filtroInvitados,  setFiltroInvitados]  = useState('todos');
  const fileRef = useRef(null);

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

  const listaSeleccionada = Array.from(seleccionados.values());

  const agregarManual = () => {
    const nombre    = mNombre.trim();
    const email     = mEmail.trim().toLowerCase();
    const cedula    = mCedula.trim();
    const telefono  = mTelefono.trim() || null;
    if (!nombre) { setMError('El nombre es requerido.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMError('Ingresa un correo válido.'); return; }
    if (!cedula) { setMError('El número de documento es requerido.'); return; }
    setSeleccionados((prev) => { const next = new Map(prev); next.set(email, { email, nombre, cedula, telefono }); return next; });
    setMNombre(''); setMEmail(''); setMCedula(''); setMTelefono(''); setMError('');
  };

  const parsearExcel = async (file) => {
    setXlsError(''); setXlsPreview([]); setXlsFile(file);
    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb   = read(buffer, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { defval: '' });
      const norm = (s) => String(s ?? '').toLowerCase().trim().replace(/[^a-z]/g, '');
      const COLS_NOMBRE    = ['nombre', 'nombres', 'name', 'fullname'];
      const COLS_EMAIL     = ['email', 'correo', 'mail', 'correoelectronico'];
      const COLS_CEDULA    = ['cedula', 'documento', 'cc', 'numerodocumento', 'numdoc', 'id'];
      const COLS_TELEFONO  = ['telefono', 'celular', 'movil', 'phone', 'cel', 'whatsapp'];
      const findCol = (keys, candidates) => keys.find((k) => candidates.includes(norm(k)));
      if (rows.length === 0) { setXlsError('El archivo está vacío.'); return; }
      const keys        = Object.keys(rows[0]);
      const colNombre   = findCol(keys, COLS_NOMBRE);
      const colEmail    = findCol(keys, COLS_EMAIL);
      const colCedula   = findCol(keys, COLS_CEDULA);
      const colTelefono = findCol(keys, COLS_TELEFONO);
      if (!colNombre || !colEmail) { setXlsError('El archivo debe tener columnas "nombre" y "correo" (o email).'); return; }
      const parsed = rows
        .map((r) => ({
          nombre:   String(r[colNombre]   ?? '').trim(),
          email:    String(r[colEmail]    ?? '').trim().toLowerCase(),
          cedula:   colCedula   ? (String(r[colCedula]   ?? '').trim() || null) : null,
          telefono: colTelefono ? (String(r[colTelefono] ?? '').trim().replace(/\D/g, '') || null) : null,
        }))
        .filter((r) => r.nombre && r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
      if (parsed.length === 0) { setXlsError('No se encontraron filas válidas con nombre y correo.'); return; }
      setXlsPreview(parsed);
    } catch { setXlsError('Error al leer el archivo. Asegúrate de que sea .xlsx o .csv válido.'); }
  };

  const descargarPendientes = async () => {
    const pendientes = invitadosLista.filter((i) => !i.preinscrito);
    if (pendientes.length === 0) return;
    const { utils, writeFile } = await import('xlsx');
    const filas = [
      ['Nombre', 'Correo', 'Cédula', 'Fecha invitación'],
      ...pendientes.map((p) => [
        p.nombre || '',
        p.email  || '',
        p.cedula || '',
        p.enviado_en ? new Date(p.enviado_en).toLocaleDateString('es-CO') : '',
      ]),
    ];
    const ws = utils.aoa_to_sheet(filas);
    ws['!cols'] = [{ wch: 30 }, { wch: 34 }, { wch: 16 }, { wch: 18 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Pendientes');
    writeFile(wb, `pendientes_${sesion.id.slice(0, 8)}.xlsx`);
  };

  const descargarPlantilla = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['nombre', 'correo', 'cedula', 'telefono'],
      ['María García López', 'maria.garcia@correo.com', '1012345678', '3001234567'],
      ['Carlos Rodríguez Pérez', 'carlos.rodriguez@correo.com', '79654321', '3109876543'],
    ]);
    ws['!cols'] = [{ wch: 30 }, { wch: 32 }, { wch: 16 }, { wch: 14 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Invitados');
    writeFile(wb, 'plantilla_invitados.xlsx');
  };

  const agregarDesdeExcel = () => {
    setSeleccionados((prev) => {
      const next = new Map(prev);
      xlsPreview.forEach(({ email, nombre, cedula, telefono }) => next.set(email, { email, nombre, cedula, telefono }));
      return next;
    });
    setXlsPreview([]); setXlsFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const quitarDeQueue = (email) => {
    setSeleccionados((prev) => { const next = new Map(prev); next.delete(email); return next; });
  };

  const handleEnviar = async () => {
    if (listaSeleccionada.length === 0) return;
    setEnviando(true); setResultado(null);
    try {
      const res  = await fetch(`/api/admin/sesion/${encodeURIComponent(sesion.id)}/invitar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ militantes: listaSeleccionada }),
      });
      const json = await res.json();
      setResultado(json);
      if (json.ok) { setSeleccionados(new Map()); cargarInvitados(); }
    } catch { setResultado({ ok: false, error: 'Error de red al enviar.' }); }
    finally   { setEnviando(false); setConfirmacion(false); }
  };

  return (
    <>
    <div className="flex gap-4">

      {/* Panel izquierdo: invitados con estado de preinscripción */}
      <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        {/* Header con contadores */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-700">Invitados ({invitadosLista.length})</h3>
            <div className="flex items-center gap-2">
              {invitadosLista.some((i) => !i.preinscrito) && (
                <button
                  onClick={descargarPendientes}
                  title="Descargar pendientes"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Download size={12} />
                </button>
              )}
              <button onClick={cargarInvitados} className="text-gray-400 hover:text-brand transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
          {invitadosLista.length > 0 && (() => {
            const inscritos  = invitadosLista.filter((i) => i.preinscrito).length;
            const pendientes = invitadosLista.length - inscritos;
            return (
              <div className="flex gap-2">
                <span className="flex-1 text-center text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-lg py-1">
                  ✓ {inscritos} inscritos
                </span>
                <span className="flex-1 text-center text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200 rounded-lg py-1">
                  ⏳ {pendientes} pendientes
                </span>
              </div>
            );
          })()}
        </div>

        {/* Filtros */}
        {invitadosLista.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-50 flex gap-1">
            {[
              { key: 'todos',      label: 'Todos'      },
              { key: 'inscritos',  label: 'Inscritos'  },
              { key: 'pendientes', label: 'Pendientes' },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => setFiltroInvitados(key)}
                className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-colors ${
                  filtroInvitados === key ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1" style={{ maxHeight: '460px' }}>
          {invitadosLista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Send size={24} className="mb-2 text-gray-200" />
              <p className="text-sm text-center leading-relaxed text-gray-300">Sin invitaciones<br/>enviadas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invitadosLista
                .filter((inv) =>
                  filtroInvitados === 'inscritos'  ? inv.preinscrito  :
                  filtroInvitados === 'pendientes' ? !inv.preinscrito :
                  true
                )
                .map((inv, i) => {
                  const initials = inv.nombre.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${inv.preinscrito ? 'bg-green-50/40' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        inv.preinscrito ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{inv.nombre}</p>
                          {inv.preinscrito
                            ? <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                            : <span className="text-[9px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex-shrink-0">PENDIENTE</span>
                          }
                        </div>
                        <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 rounded-t-2xl overflow-hidden">
          {[
            { key: 'manual', label: 'Agregar manual',  Icon: Plus            },
            { key: 'excel',  label: 'Cargar Excel',    Icon: FileSpreadsheet },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setModo(key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
                modo === key ? 'border-brand text-brand bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Formulario manual */}
        {modo === 'manual' && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-3 mb-2">
              <input type="text" value={mNombre} onChange={(e) => { setMNombre(e.target.value); setMError(''); }}
                placeholder="Nombre completo *"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <input type="email" value={mEmail} onChange={(e) => { setMEmail(e.target.value); setMError(''); }}
                placeholder="Correo electrónico *"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <input type="text" value={mCedula} onChange={(e) => { setMCedula(e.target.value); setMError(''); }}
                placeholder="Núm. documento *"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <div className="flex gap-2">
                <input type="tel" value={mTelefono} onChange={(e) => { setMTelefono(e.target.value); setMError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && agregarManual()}
                  placeholder="Celular WhatsApp"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                <button onClick={agregarManual}
                  className="flex items-center gap-1 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">
                  <Plus size={13} /> Agregar
                </button>
              </div>
            </div>
            {mError && <p className="text-xs text-red-600 font-medium">{mError}</p>}
            <p className="text-xs text-gray-400 mt-1">* Todos los campos son obligatorios. El número de documento vincula la invitación con el acceso del invitado.</p>
          </div>
        )}

        {/* Carga Excel */}
        {modo === 'excel' && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parsearExcel(f); }}>
              <FileSpreadsheet size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Arrastra un archivo o haz clic para seleccionar</p>
              <p className="text-xs text-gray-400 mt-1">Formato .xlsx o .csv · Columnas: <strong>nombre</strong>, <strong>correo</strong>, <strong>cedula</strong> · Opcional: <strong>telefono</strong> (WhatsApp)</p>
              {xlsFile && <p className="text-xs text-brand font-semibold mt-2">{xlsFile.name}</p>}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f) parsearExcel(f); }} />
            <div className="mt-2 flex items-center justify-end">
              <button onClick={descargarPlantilla}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                <FileSpreadsheet size={12} /> Descargar plantilla de ejemplo
              </button>
            </div>
            {xlsError && <p className="text-xs text-red-600 font-medium mt-1">{xlsError}</p>}
            {xlsPreview.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700">{xlsPreview.length} fila{xlsPreview.length !== 1 ? 's' : ''} válida{xlsPreview.length !== 1 ? 's' : ''}</p>
                  <button onClick={agregarDesdeExcel}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-colors">
                    <Plus size={12} /> Agregar todos a la cola
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-bold">Nombre</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-bold">Correo</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-bold">Cédula</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-bold">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {xlsPreview.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-gray-800">{r.nombre}</td>
                          <td className="px-3 py-1.5 text-gray-500">{r.email}</td>
                          <td className="px-3 py-1.5 text-gray-400">{r.cedula || '-'}</td>
                          <td className="px-3 py-1.5 text-gray-400">{r.telefono ? `+57${r.telefono}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cola de envio */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
          {seleccionados.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Users size={28} className="mb-2 text-gray-200" />
              <p className="text-sm">La cola está vacía. Agrega destinatarios arriba.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {listaSeleccionada.map(({ email, nombre, cedula }) => {
                const initials   = nombre.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                const reinvitado = invitadosSet.has(email);
                return (
                  <div key={email} className={`flex items-center gap-3 px-4 py-3 ${reinvitado ? 'bg-yellow-50' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                        {reinvitado && (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                            <AlertTriangle size={9} /> Re-envío
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{email}{cedula ? ` · ${cedula}` : ''}</p>
                    </div>
                    <button onClick={() => quitarDeQueue(email)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center gap-3 flex-wrap">
          {resultado && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${resultado.ok ? 'text-green-600' : 'text-red-600'}`}>
              {resultado.ok
                ? <><CheckCircle size={13} />{resultado.enviados} enviada{resultado.enviados !== 1 ? 's' : ''}{resultado.fallidos > 0 ? `, ${resultado.fallidos} fallida${resultado.fallidos !== 1 ? 's' : ''}` : ''}</>
                : <><AlertTriangle size={13} />{resultado.error || 'Error al enviar'}</>
              }
            </span>
          )}
          {seleccionados.size > 0 && (
            <button onClick={() => setSeleccionados(new Map())} className="text-xs text-gray-400 hover:text-red-500 font-semibold">
              × limpiar cola
            </button>
          )}
          <button onClick={() => setConfirmacion(true)} disabled={seleccionados.size === 0}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors">
            <Send size={13} />
            Revisar y enviar {seleccionados.size > 0 ? `(${seleccionados.size})` : ''}
          </button>
        </div>
      </div>
    </div>

    {/* Modal confirmacion */}
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
              <button onClick={() => setConfirmacion(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                Estás a punto de enviar correos electrónicos <strong>reales</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-700">
              <p className="font-bold text-gray-900 mb-1">{sesion.nombre}</p>
              <p className="flex items-center gap-1"><Calendar size={11} className="flex-shrink-0" /> {sesion.fecha} · <Clock size={11} className="flex-shrink-0" /> {sesion.hora}</p>
              <p className="flex items-center gap-1"><MapPin size={11} className="flex-shrink-0" /> {sesion.lugar}</p>
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
              {enviando ? <><Loader2 size={14} className="animate-spin" /> Enviando…</> : <><Send size={14} /> Confirmar envío</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function FormPregunta({ onGuardar, onCancelar, preguntasBase = [], enVivo = false, initialData = null }) {
  const [tipo, setTipo]               = useState(initialData?.tipo ?? 'sino');
  const [tipoMayoria, setTipoMayoria] = useState(initialData?.tipoMayoria ?? 'simple');
  const [texto, setTexto]             = useState(initialData?.texto ?? '');
  const [opciones, setOpciones]       = useState(initialData?.opciones?.length ? initialData.opciones : [OPCION_VACIA_INDIVIDUAL(), OPCION_VACIA_INDIVIDUAL()]);
  const [baseId, setBaseId]           = useState(initialData?.pregunta_base_id ?? '');
  const [duracion, setDuracion]       = useState(initialData?.duracion ? String(initialData.duracion) : '');
  const [cupos, setCupos]             = useState(initialData?.cupos ? String(initialData.cupos) : '');
  const [err, setErr]                 = useState('');
  const [corrector, setCorrector]     = useState({ cargando: false, errores: [], revisado: false });
  const xlsRefCands                   = useRef(null);

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
      ...o, miembros: [...o.miembros, { nombre: '', cargo: '', suplente: '' }],
    }));

  const removeMiembro = (i, j) =>
    setOpciones((prev) => prev.map((o, oi) => oi !== i ? o : {
      ...o, miembros: o.miembros.filter((_, mi) => mi !== j),
    }));

  const parsearExcelCandidatos = async (file) => {
    try {
      const { read, utils } = await import('xlsx');
      const wb   = read(await file.arrayBuffer(), { type: 'array' });
      const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const nuevas = [];
      let planchaActual = null;
      for (const row of rows) {
        const t      = String(row.tipo ?? '').toLowerCase().trim();
        const nombre = String(row.nombre ?? '').trim();
        if (!nombre) continue;
        if (t === 'candidato') {
          planchaActual = null;
          nuevas.push({ tipo: 'individual', nombre });
        } else if (t === 'plancha') {
          planchaActual = { tipo: 'plancha', nombre, miembros: [] };
          nuevas.push(planchaActual);
        } else if (t === 'miembro' && planchaActual) {
          planchaActual.miembros.push({ nombre, cargo: String(row.cargo ?? '').trim(), suplente: String(row.suplente ?? '').trim() });
        }
      }
      if (nuevas.length > 0) { setOpciones(nuevas); setErr(''); }
      else setErr('No se encontraron filas válidas. Verifica que la columna "tipo" tenga los valores: candidato, plancha, miembro.');
    } catch { setErr('Error al leer el archivo Excel.'); }
  };

  const descargarPlantillaCandidatos = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['tipo', 'nombre', 'cargo', 'suplente'],
      ['candidato', 'Juan García Pérez', '', ''],
      ['plancha', 'Plancha Unidad', '', ''],
      ['miembro', 'Ana López Torres', 'Presidenta', 'María Rodríguez'],
      ['miembro', 'Carlos Peñaranda', 'Secretario', 'Luis Martínez'],
      ['plancha', 'Plancha Progreso', '', ''],
      ['miembro', 'Pedro González', '', 'Sofía Martínez'],
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Candidatos');
    writeFile(wb, 'plantilla_candidatos.xlsx');
  };

  const guardar = () => {
    if (!texto.trim()) { setErr('Escribe el texto de la pregunta'); return; }
    if (tipo === 'candidatos') {
      if (opciones.some((o) => !o.nombre.trim())) { setErr('Completa el nombre de cada opción'); return; }
      if (opciones.some((o) => o.tipo === 'plancha' && o.miembros.some((m) => !m.nombre.trim()))) {
        setErr('Completa los nombres de todos los integrantes'); return;
      }
    }
    onGuardar({ tipo, tipoMayoria, texto: texto.trim(), opciones, enVivo, pregunta_base_id: baseId || null, duracion, cupos });
  };

  const revisarOrtografia = async () => {
    if (!texto.trim()) return;
    setCorrector({ cargando: true, errores: [], revisado: false });
    try {
      const res  = await fetch('https://api.languagetool.org/v2/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({ text: texto, language: 'es' }),
      });
      const data = await res.json();
      setCorrector({ cargando: false, errores: data.matches ?? [], revisado: true });
    } catch {
      setCorrector({ cargando: false, errores: [], revisado: true });
    }
  };

  const aplicarCorreccion = (match, valor) => {
    const nuevo = texto.slice(0, match.offset) + valor + texto.slice(match.offset + match.length);
    setTexto(nuevo);
    setCorrector((prev) => ({ ...prev, errores: [], revisado: false }));
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

      <div className="flex flex-col gap-1.5">
        <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setErr(''); setCorrector({ cargando: false, errores: [], revisado: false }); }}
          placeholder="Escribe la pregunta..." rows={2} spellCheck lang="es"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
        <div className="flex items-center justify-between">
          <button type="button" onClick={revisarOrtografia} disabled={corrector.cargando || !texto.trim()}
            className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {corrector.cargando
              ? <><Loader2 size={11} className="animate-spin" /> Revisando...</>
              : <><SpellCheck size={11} /> Revisar ortografía</>}
          </button>
          {corrector.revisado && (
            <span className={`text-[11px] font-semibold ${corrector.errores.length === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {corrector.errores.length === 0 ? '✓ Sin errores detectados' : `${corrector.errores.length} sugerencia${corrector.errores.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        {corrector.errores.length > 0 && (
          <div className="flex flex-col gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
            {corrector.errores.map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-[11px] text-orange-700 font-semibold">
                  «{texto.slice(m.offset, m.offset + m.length)}» — {m.message}
                </p>
                {m.replacements.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.replacements.slice(0, 4).map((r, j) => (
                      <button key={j} type="button" onClick={() => aplicarCorreccion(m, r.value)}
                        className="text-[11px] font-bold bg-white border border-orange-300 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-100 transition-colors">
                        {r.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
                    <div key={j} className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input
                          value={m.nombre}
                          onChange={(e) => { setMiembro(i, j, { nombre: e.target.value }); setErr(''); }}
                          placeholder={`Principal ${j + 1}`}
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
                      <input
                        value={m.suplente ?? ''}
                        onChange={(e) => setMiembro(i, j, { suplente: e.target.value })}
                        placeholder={`Suplente ${j + 1} (opcional)`}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50"
                      />
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
          <div className="flex gap-2 mt-1">
            <button onClick={() => xlsRefCands.current?.click()}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border border-green-300 text-green-700 hover:bg-green-50 transition-colors">
              <FileSpreadsheet size={12} /> Importar Excel
            </button>
            <button onClick={descargarPlantillaCandidatos}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet size={12} /> Plantilla
            </button>
            <input ref={xlsRefCands} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f) { parsearExcelCandidatos(f); e.target.value = ''; } }} />
          </div>
        </div>
      )}

      {/* Cronómetro + Cupos */}
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Timer size={11}/> Duración (min, opcional)
          </label>
          <input type="number" min="1" max="120" value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            placeholder="Sin límite"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        {tipo === 'candidatos' && (
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Award size={11}/> Cupos D'Hondt
            </label>
            <input type="number" min="1" max="50" value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              placeholder="Sin D'Hondt"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={guardar} className={`flex-1 py-2 rounded-lg text-sm font-bold text-white ${enVivo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-hover'}`}>
          {enVivo ? <><Zap size={13} className="inline mr-1" />Publicar en vivo</> : 'Guardar'}
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
  const [mostrarVivo, setMostrarVivo]     = useState(false);
  const [duplicarData, setDuplicarData]   = useState(null);
  const [mostrarCodigo,       setMostrarCodigo]       = useState(false);
  const [mostrarCodigoTexto,  setMostrarCodigoTexto]  = useState(false);
  const [mostrarProyeccion,   setMostrarProyeccion]   = useState(false);
  const [timerSeg,            setTimerSeg]            = useState(null);
  const [modalPartId,         setModalPartId]         = useState(null);
  const [partData,            setPartData]            = useState(null);
  const [partCargando,        setPartCargando]        = useState(false);
  const timerRef = useRef(null);
  const [exportando,         setExportando]         = useState(false);
  const [cargando, setCargando]               = useState(false);
  const [cerrandoInsc, setCerrandoInsc]       = useState(false);
  const [cerrandoAsist, setCerrandoAsist]     = useState(false);
  const [qrTs, setQrTs]                   = useState(() => Math.floor(Date.now() / 30000));
  const [qrSegundos, setQrSegundos]       = useState(30);
  const [preinscritos,    setPreinscritos]    = useState([]);
  const [asistenciaList,  setAsistenciaList]  = useState([]);
  const [cargandoPreins, setCargandoPreins] = useState(false);
  const [filtroAcred, setFiltroAcred]     = useState('todos');
  const [importandoAcred, setImportandoAcred] = useState(false);
  const [importAcredResultado, setImportAcredResultado] = useState(null);
  const importAcredRef = useRef(null);

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
    setAsistenciaList(json.asistenciaList || []);
    setResultados(json.resultados || []);
  }, [sesionId]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, [sesionId, cargar]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const activaId = sesion?.pregunta_activa_id;
    const pa = activaId ? preguntas.find((p) => p.id === activaId) : null;
    if (pa?.duracion_segundos && pa?.publicada_en) {
      const rem = () => Math.max(0, pa.duracion_segundos - Math.floor((Date.now() - new Date(pa.publicada_en).getTime()) / 1000));
      setTimerSeg(rem());
      timerRef.current = setInterval(() => {
        const r = rem();
        setTimerSeg(r);
        if (r <= 0) {
          clearInterval(timerRef.current);
          fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/cerrar`, { method: 'POST' }).then(() => cargar());
        }
      }, 1000);
    } else {
      setTimerSeg(null);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sesion?.pregunta_activa_id, preguntas, sesionId, cargar]);

  if (!sesion) return (
    <div className="flex h-full min-h-screen items-center justify-center bg-gray-50">
      <Loader2 size={30} className="text-brand animate-spin" />
    </div>
  );

  const cfg      = ESTADO_SESION[sesion.estado] || ESTADO_SESION.borrador;
  const enCurso  = sesion.estado === 'en_curso';
  const activaId = sesion.pregunta_activa_id;
  const hayActiva= !!activaId;

  const quorumRequerido  = stats ? Math.floor((stats.invitados ?? stats.acreditados_voto ?? stats.inscritos) / 2) + 1 : 0;
  const quorumAlcanzado  = stats ? stats.asistentes >= quorumRequerido : false;
  const faltanParaQuorum = stats ? Math.max(0, quorumRequerido - stats.asistentes) : 0;
  const baseQuorum       = stats?.invitados ?? stats?.acreditados_voto ?? stats?.inscritos ?? 0;
  const pctAsistencia    = baseQuorum > 0
    ? Math.min(100, Math.round((stats.asistentes / baseQuorum) * 100))
    : 0;

  const handleGuardar = async ({ tipo, tipoMayoria, texto, opciones, enVivo, pregunta_base_id, duracion, cupos }) => {
    setCargando(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preguntas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo, tipo_mayoria: tipoMayoria, texto, opciones, enVivo, pregunta_base_id,
        duracion_segundos: duracion ? Number(duracion) * 60 : null,
        cupos: cupos ? Number(cupos) : null,
      }),
    });
    setMostrarForm(false); setMostrarVivo(false); setDuplicarData(null);
    await cargar(); setCargando(false);
  };

  const handleDuplicar = (p) => {
    const opciones = (p.candidatos || []).map((c) =>
      c.es_plancha
        ? { tipo: 'plancha', nombre: c.nombre, miembros: (c.miembros || []).map((m) => ({ nombre: m.nombre, cargo: m.cargo || '', suplente: m.suplente || '' })) }
        : { tipo: 'individual', nombre: c.nombre }
    );
    setDuplicarData({
      tipo:             p.tipo,
      tipoMayoria:      p.tipo_mayoria,
      texto:            p.texto,
      opciones:         opciones.length ? opciones : undefined,
      duracion:         p.duracion ?? '',
      cupos:            p.cupos ?? '',
      pregunta_base_id: p.pregunta_base_id ?? '',
    });
    setMostrarForm(false); setMostrarVivo(false);
    setTimeout(() => document.getElementById('form-duplicar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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

  const calcDhondt = (opciones, cupos) => {
    if (!cupos || !opciones?.length) return [];
    const seats = opciones.map((o) => ({
      ...o,
      cupos_ganados: 0,
      capacidad: o.es_plancha ? (o.miembros?.length ?? Infinity) : Infinity,
    }));
    for (let i = 0; i < cupos; i++) {
      let maxQ = -1, maxTotal = -1, maxIdx = -1;
      seats.forEach((s, idx) => {
        if (s.cupos_ganados >= s.capacidad) return;
        const q = Number(s.total) / (s.cupos_ganados + 1);
        const t = Number(s.total);
        if (maxIdx === -1 || q > maxQ + 1e-10 || (Math.abs(q - maxQ) < 1e-10 && t > maxTotal)) {
          maxQ = q; maxTotal = t; maxIdx = idx;
        }
      });
      if (maxIdx === -1) break;
      seats[maxIdx].cupos_ganados++;
    }
    return [...seats].sort((a, b) => b.cupos_ganados - a.cupos_ganados || Number(b.total) - Number(a.total));
  };

  // Construye la tabla de cocientes D'Hondt usando el mismo algoritmo para consistencia
  const buildDhondtExplanation = (opciones, cupos) => {
    if (!cupos || !opciones?.length) return null;
    const seats = opciones.map((o) => ({
      respuesta: o.respuesta,
      total: Number(o.total),
      cupos_ganados: 0,
      capacidad: o.es_plancha ? (o.miembros?.length ?? Infinity) : Infinity,
    }));
    const winners = new Set();
    for (let i = 0; i < cupos; i++) {
      let maxQ = -1, maxTotal = -1, maxIdx = -1;
      seats.forEach((s, idx) => {
        if (s.cupos_ganados >= s.capacidad) return;
        const q = s.total / (s.cupos_ganados + 1);
        const t = s.total;
        if (maxIdx === -1 || q > maxQ + 1e-10 || (Math.abs(q - maxQ) < 1e-10 && t > maxTotal)) {
          maxQ = q; maxTotal = t; maxIdx = idx;
        }
      });
      if (maxIdx === -1) break;
      const divisor = seats[maxIdx].cupos_ganados + 1;
      winners.add(`${seats[maxIdx].respuesta}-${divisor}`);
      seats[maxIdx].cupos_ganados++;
    }
    const divisors = Array.from({ length: cupos }, (_, i) => i + 1);
    return { divisors, winners };
  };

  const handleVerParticipacion = async (preguntaId) => {
    setModalPartId(preguntaId);
    setPartData(null);
    setPartCargando(true);
    const res  = await fetch(`/api/admin/pregunta/${preguntaId}/participacion?sesionId=${encodeURIComponent(sesionId)}`);
    const json = await res.json();
    if (json.ok) setPartData(json);
    setPartCargando(false);
  };

  const handleExportPDF = async () => {
    setExportando(true);
    try {
      const [{ pdf }, { InformePDF }, logoRes] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./InformePDF'),
        fetch('/api/logo'),
      ]);
      const { data: logoData } = await logoRes.json();
      const blob = await pdf(
        <InformePDF sesion={sesion} stats={stats} resultados={resultados} logoData={logoData} />
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

  const descargarPlantillaAcred = async () => {
    const { utils, writeFile } = await import('xlsx');

    const header = [['cedula', 'nombre', 'email', 'estado_acreditacion']];
    const rows   = preinscritos.map((p) => [
      p.cedula,
      p.nombre,
      p.email || '',
      p.estado_acreditacion || 'preinscrito',
    ]);

    const ws = utils.aoa_to_sheet([...header, ...rows]);
    ws['!cols'] = [{ wch: 16 }, { wch: 38 }, { wch: 34 }, { wch: 22 }];

    if (rows.length > 0) {
      ws['!dataValidations'] = [{
        ref:            `D2:D${rows.length + 1}`,
        type:           'list',
        formula1:       '"acreditado_voto,acreditado_ingreso,rechazado,preinscrito"',
        showDropDown:   false,
        showErrorMessage: true,
        errorTitle:     'Estado inválido',
        error:          'Use: acreditado_voto · acreditado_ingreso · rechazado · preinscrito',
      }];
    }

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Acreditacion');

    const wsRef = utils.aoa_to_sheet([
      ['Valor',               'Descripción'],
      ['acreditado_voto',     'Aprobado — Ingreso y Voto'],
      ['acreditado_ingreso',  'Aprobado — Solo Ingreso (sin voto)'],
      ['rechazado',           'Acceso denegado'],
      ['preinscrito',         'Pendiente de revisión (sin cambio)'],
    ]);
    wsRef['!cols'] = [{ wch: 22 }, { wch: 38 }];
    utils.book_append_sheet(wb, wsRef, 'Referencia');

    writeFile(wb, `acreditacion-${sesionId}.xlsx`);
  };

  const importarExcelAcred = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportandoAcred(true);
    setImportAcredResultado(null);

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb     = read(buffer, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      const filas  = utils.sheet_to_json(ws, { defval: '' });

      const ESTADOS = ['acreditado_voto', 'acreditado_ingreso', 'rechazado'];
      const validas = filas
        .map((f) => ({
          cedula: String(f['cedula'] || f['Cedula'] || f['CEDULA'] || '').trim(),
          estado: String(f['estado_acreditacion'] || f['Estado'] || f['estado'] || '').trim(),
        }))
        .filter((f) => f.cedula && ESTADOS.includes(f.estado));

      if (validas.length === 0) {
        setImportAcredResultado({ ok: false, error: 'No se encontraron filas válidas. Revisa que las columnas sean "cedula" y "estado_acreditacion".' });
        return;
      }

      const byEstado = {};
      validas.forEach(({ cedula, estado }) => {
        if (!byEstado[estado]) byEstado[estado] = [];
        byEstado[estado].push(cedula);
      });

      await Promise.all(
        Object.entries(byEstado).map(([estado, cedulas]) =>
          fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preinscritos`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedulas, estado_acreditacion: estado }),
          })
        )
      );

      await cargar();
      setImportAcredResultado({ ok: true, total: validas.length });
    } catch (err) {
      setImportAcredResultado({ ok: false, error: err.message });
    } finally {
      setImportandoAcred(false);
    }
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
            <span className="flex items-center gap-1"><Calendar size={11} className="flex-shrink-0" /> {sesion.fecha} · {sesion.hora}</span>
            <span className="flex items-center gap-1"><MapPin size={11} className="flex-shrink-0" /> {sesion.lugar}</span>
            <span className="flex items-center gap-1"><Tag size={11} className="flex-shrink-0" /> {sesion.tipos_asamblea?.nombre} · {sesion.colectivos?.nombre}</span>
            <span className="flex items-center gap-2">
              <Key size={11} className="flex-shrink-0" />
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

          {/* Botón proyección pública — fila propia */}
          <button
            onClick={() => window.open(`/proyeccion/${encodeURIComponent(sesionId)}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 border border-purple-300 px-3 py-2 rounded-xl hover:bg-purple-600 hover:text-white transition-colors">
            <Monitor size={14} /> Proyección al público
          </button>

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
                <span className="flex items-center gap-1"><CheckCircle size={11} className="inline text-gray-400" /> <strong>{stats.asistentes}</strong> asistentes</span>
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
                  {baseQuorum > 0 && (
                    <div
                      className="absolute top-0 h-2.5 w-0.5 bg-brand"
                      style={{ left: `${Math.min(100, Math.round((quorumRequerido / baseQuorum) * 100))}%` }}
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
              <button
                onClick={() => setMostrarProyeccion(true)}
                className="ml-auto flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-green-300 text-green-700 hover:bg-green-100 transition-colors">
                <Monitor size={12}/> Proyectar
              </button>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-3">{preguntaActiva.texto}</p>
            {timerSeg !== null && (
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl ${timerSeg <= 30 ? 'bg-red-100' : 'bg-white/70'}`}>
                <div className="flex items-center gap-1.5">
                  <Timer size={13} className={timerSeg <= 30 ? 'text-red-500' : 'text-green-600'} />
                  <span className={`text-xs font-bold ${timerSeg <= 30 ? 'text-red-600' : 'text-green-700'}`}>
                    Tiempo restante
                  </span>
                </div>
                <span className={`font-mono text-lg font-extrabold ${timerSeg <= 30 ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>
                  {Math.floor(timerSeg / 60).toString().padStart(2, '0')}:{(timerSeg % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
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
            { key: 'asistentes',    label: 'Asistentes',    Icon: Users     },
            { key: 'preguntas',     label: 'Preguntas',     Icon: Radio     },
            { key: 'resultados',    label: 'Resultados',    Icon: BarChart2 },
            { key: 'invitaciones',  label: 'Invitaciones',  Icon: Send      },
          ].map(({ key, label, Icon }) => {
            const asistentes = preinscritos.filter((p) => p.estado_acreditacion === 'acreditado_voto' || p.estado_acreditacion === 'acreditado_ingreso');
            const badge =
              key === 'preinscritos' ? preinscritos.filter((p) => p.estado_acreditacion === 'preinscrito').length :
              key === 'asistentes'   ? asistentes.length :
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

            {/* Importar acreditación desde Excel */}
            <div className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <FileSpreadsheet size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 flex-1">Importar acreditación masiva desde Excel</span>
              <button onClick={descargarPlantillaAcred}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 transition-colors flex-shrink-0">
                Plantilla
              </button>
              <input ref={importAcredRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importarExcelAcred} />
              <button onClick={() => importAcredRef.current?.click()} disabled={importandoAcred}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-50 transition-colors flex-shrink-0">
                {importandoAcred ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                {importandoAcred ? 'Procesando...' : 'Importar Excel'}
              </button>
            </div>

            {importAcredResultado && (
              <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border ${importAcredResultado.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {importAcredResultado.ok
                  ? <><CheckCircle size={13}/> {importAcredResultado.total} registro{importAcredResultado.total !== 1 ? 's' : ''} actualizados correctamente</>
                  : <><AlertTriangle size={13}/> {importAcredResultado.error}</>
                }
                <button onClick={() => setImportAcredResultado(null)} className="ml-auto text-current opacity-50 hover:opacity-100"><X size={12}/></button>
              </div>
            )}

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

        {/* Tab: Asistentes */}
        {tab === 'asistentes' && (() => {
          const asistieronSet  = new Set(asistenciaList.map((a) => a.cedula));
          const asistieronMap  = Object.fromEntries(asistenciaList.map((a) => [a.cedula, a.asistio_en]));
          const habilitados    = preinscritos.filter((p) => p.estado_acreditacion === 'acreditado_voto' || p.estado_acreditacion === 'acreditado_ingreso');
          const yaAsistieron   = habilitados.filter((p) => asistieronSet.has(p.cedula));
          const faltan         = habilitados.filter((p) => !asistieronSet.has(p.cedula));

          const FilaAsistente = ({ p, i, hora }) => (
            <tr key={p.cedula} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
              <td className="px-5 py-3 font-semibold text-gray-800">{p.nombre}</td>
              <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.cedula}</td>
              <td className="px-5 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ACRED_CFG[p.estado_acreditacion]?.color}`}>
                  {ACRED_CFG[p.estado_acreditacion]?.label}
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-gray-400">
                {hora ? new Date(hora).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
              </td>
            </tr>
          );

          const Tabla = ({ rows, hora }) => (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-2.5">#</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-2.5">Nombre</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-2.5">Cédula</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-2.5">Acreditación</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-2.5">{hora ? 'Hora ingreso' : 'Inscripción'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => <FilaAsistente key={p.cedula} p={p} i={i} hora={hora ? asistieronMap[p.cedula] : null} />)}
              </tbody>
            </table>
          );

          return (
            <div className="flex flex-col gap-4">
              {/* Ya asistieron */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-green-50">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-green-800">Ya marcaron asistencia</span>
                  <span className="text-xs bg-green-600 text-white font-bold px-2 py-0.5 rounded-full ml-1">{yaAsistieron.length}</span>
                </div>
                {yaAsistieron.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nadie ha marcado asistencia aún</p>
                  </div>
                ) : (
                  <Tabla rows={yaAsistieron} hora={true} />
                )}
              </div>

              {/* Faltan */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-orange-50">
                  <Clock size={14} className="text-orange-500" />
                  <span className="text-sm font-bold text-orange-800">Faltan por asistir</span>
                  <span className="text-xs bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full ml-1">{faltan.length}</span>
                </div>
                {faltan.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle size={28} className="text-green-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Todos los habilitados ya asistieron</p>
                  </div>
                ) : (
                  <Tabla rows={faltan} hora={false} />
                )}
              </div>
            </div>
          );
        })()}

        {/* Tab: Resultados */}
        {tab === 'resultados' && (
          <div className="flex flex-col gap-4">
            {resultados.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No hay preguntas en esta sesión todavía</p>
            )}
            {resultados.map((preg) => {
              const total      = Number(preg.total_votos) || 0;
              const esAbsoluta = preg.tipo_mayoria === 'absoluta';
              const baseUmbral = esAbsoluta
                ? (stats?.invitados ?? stats?.acreditados_voto ?? 0)
                : (stats?.asistentes ?? 0);
              const umbral     = baseUmbral > 0 ? Math.floor(baseUmbral / 2) + 1 : (Number(preg.umbral) || 0);
              const esValida   = total >= umbral && umbral > 0;
              const ganador    = preg.ganador;
              const esCerrada  = preg.estado === 'cerrada';
              const maxVotos   = preg.opciones?.length
                ? Math.max(...preg.opciones.map((o) => Number(o.total)))
                : 0;

              const pctParticipacion = baseUmbral > 0 ? Math.min(100, Math.round((total / baseUmbral) * 100)) : 0;
              const pctUmbral        = baseUmbral > 0 ? Math.min(100, Math.round((umbral / baseUmbral) * 100)) : 50;
              const baseLabel        = esAbsoluta ? 'invitados' : 'asistentes';

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

                  {/* Integrantes de la plancha ganadora */}
                  {esCerrada && ganador && preg.tipo === 'candidatos' && (() => {
                    const pregData    = preguntas.find((p) => p.id === preg.id);
                    const ganadorCand = pregData?.candidatos?.find((c) => c.nombre === ganador);
                    if (!ganadorCand?.es_plancha || !ganadorCand.miembros?.length) return null;
                    return (
                      <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Users size={11}/> Integrantes de la plancha ganadora
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {ganadorCand.miembros.map((m) => (
                            <div key={m.id} className="text-xs">
                              {m.cargo && <span className="font-bold text-green-700">{m.cargo}: </span>}
                              <span className="text-gray-700">{m.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

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

                  {/* D'Hondt */}
                  {esCerrada && preg.tipo === 'candidatos' && (() => {
                    const cuposPreg = preguntas.find((p) => p.id === preg.id)?.cupos;
                    if (!cuposPreg || !preg.opciones?.length || total === 0) return null;
                    const dhondt = calcDhondt(preg.opciones, cuposPreg);
                    const expl   = buildDhondtExplanation(preg.opciones, cuposPreg);
                    return (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Award size={12}/> D'Hondt — {cuposPreg} cupo{cuposPreg !== 1 ? 's' : ''} a repartir
                        </p>
                        <div className="flex flex-col gap-2">
                          {dhondt.map((c, i) => {
                            const pregData  = preguntas.find((p) => p.id === preg.id);
                            const cand      = pregData?.candidatos?.find((ca) => ca.nombre === c.respuesta);
                            const miembrosCand = c.cupos_ganados > 0
                              ? (cand?.es_plancha ? (cand.miembros || []) : []).slice(0, c.cupos_ganados)
                              : [];
                            return (
                              <div key={i} className={`rounded-lg border ${c.cupos_ganados > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center gap-3 px-3 py-2">
                                  <span className={`text-sm font-bold w-5 text-center ${c.cupos_ganados > 0 ? 'text-green-700' : 'text-gray-300'}`}>{i + 1}</span>
                                  <span className={`flex-1 text-xs font-semibold ${c.cupos_ganados > 0 ? 'text-green-800' : 'text-gray-500'}`}>{c.respuesta}</span>
                                  <span className="text-xs text-gray-400">{c.total} votos</span>
                                  {c.cupos_ganados > 0 && (
                                    <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                                      {c.cupos_ganados} cupo{c.cupos_ganados !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                {miembrosCand.length > 0 && (
                                  <div className="px-3 pb-2.5 border-t border-green-200 pt-2 ml-8">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                      {miembrosCand.map((m, mi) => (
                                        <div key={mi} className="text-[11px] flex items-baseline gap-1">
                                          <span className="font-bold text-green-600 tabular-nums flex-shrink-0">#{mi + 1}</span>
                                          {m.cargo && <span className="font-semibold text-green-700 flex-shrink-0">{m.cargo}:</span>}
                                          <span className="text-gray-700 truncate">{m.nombre}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Tabla de cocientes */}
                        {expl && (
                          <details className="mt-3">
                            <summary className="text-[11px] font-semibold text-brand cursor-pointer select-none hover:underline">
                              ¿Cómo se calculó? Ver tabla de cocientes
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                                La fórmula D'Hondt divide los votos de cada candidato entre divisores sucesivos (÷1, ÷2, ÷3…). Los <strong>{cuposPreg} cocientes más altos</strong> de toda la tabla determinan quién obtiene cada cupo. Las celdas resaltadas en verde son las ganadoras.
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[11px] border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="text-left py-1 px-2 text-gray-500 font-semibold border-b border-gray-200">Candidato</th>
                                      <th className="text-center py-1 px-1.5 text-gray-500 font-semibold border-b border-gray-200">Votos</th>
                                      {expl.divisors.map((d) => (
                                        <th key={d} className="text-center py-1 px-1.5 text-gray-500 font-semibold border-b border-gray-200">÷{d}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {preg.opciones.slice().sort((a, b) => Number(b.total) - Number(a.total)).map((op, ri) => (
                                      <tr key={ri} className="border-b border-gray-100 last:border-0">
                                        <td className="py-1.5 px-2 font-semibold text-gray-700 max-w-[120px] truncate">{op.respuesta}</td>
                                        <td className="py-1.5 px-1.5 text-center text-gray-500">{op.total}</td>
                                        {expl.divisors.map((d) => {
                                          const cociente = (Number(op.total) / d).toFixed(2);
                                          const key      = `${op.respuesta}-${d}`;
                                          const isWinner = expl.winners.has(key);
                                          return (
                                            <td key={d} className={`py-1.5 px-1.5 text-center rounded font-mono ${isWinner ? 'bg-green-100 text-green-800 font-bold' : 'text-gray-400'}`}>
                                              {cociente}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-2">
                                Cupos asignados: {dhondt.filter((c) => c.cupos_ganados > 0).map((c) => `${c.respuesta} (${c.cupos_ganados})`).join(' · ')}
                              </p>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}
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
            {duplicarData && <div id="form-duplicar" className="mb-3"><FormPregunta preguntasBase={preguntasBase} onGuardar={handleGuardar} onCancelar={() => setDuplicarData(null)} initialData={duplicarData}/></div>}

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
                      {sesion.estado !== 'finalizada' && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => handleDuplicar(p)} title="Duplicar pregunta" className="text-gray-300 hover:text-blue-500 p-1">
                            <Copy size={15}/>
                          </button>
                          {p.estado !== 'activa' && (
                            <button onClick={() => handleEliminar(p.id)} title="Eliminar pregunta" className="text-gray-300 hover:text-red-500 p-1">
                              <Trash2 size={15}/>
                            </button>
                          )}
                        </div>
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
                          <div className="flex items-center gap-2">
                            <button onClick={handleCerrar} disabled={cargando}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                              <Lock size={13}/> Cerrar votación
                            </button>
                            <button onClick={() => handleVerParticipacion(p.id)}
                              className="flex items-center gap-1 text-xs font-bold px-2.5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                              <UsersRound size={12}/> Participación
                            </button>
                          </div>
                        )}
                        {p.estado === 'cerrada' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
                              <CheckCircle size={12}/> Votación cerrada
                            </div>
                            <button onClick={() => handleVerParticipacion(p.id)}
                              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                              <UsersRound size={12}/> Participación
                            </button>
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

      {/* Modal pantalla completa: Proyección pregunta activa */}
      {mostrarProyeccion && preguntaActiva && (() => {
        const res = resultados.find((r) => r.id === preguntaActiva.id);
        const opciones = res?.opciones ?? preguntaActiva.candidatos?.map((c) => ({ respuesta: c.nombre, total: 0 })) ?? [];
        const totalVotos = opciones.reduce((s, o) => s + Number(o.total), 0);
        const maxVotos   = Math.max(...opciones.map((o) => Number(o.total)), 1);
        return (
          <div
            className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center gap-8 px-10"
            onClick={() => setMostrarProyeccion(false)}>
            <button onClick={() => setMostrarProyeccion(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
              <X size={32}/>
            </button>

            {/* Indicador en vivo + timer */}
            <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"/>
                </span>
                <span className="text-green-400 text-sm font-bold uppercase tracking-widest">Votación en curso</span>
              </div>
              {timerSeg != null && (
                <div className={`text-7xl font-extrabold tabular-nums tracking-tight ${timerSeg <= 30 ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
                  {String(Math.floor(timerSeg / 60)).padStart(2, '0')}:{String(timerSeg % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Texto de la pregunta */}
            <p className="text-white text-4xl font-extrabold text-center leading-tight max-w-4xl" onClick={(e) => e.stopPropagation()}>
              {preguntaActiva.texto}
            </p>

            {/* Opciones con barras */}
            {opciones.length > 0 && (
              <div className="w-full max-w-2xl flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                {opciones.map((op, i) => {
                  const votos = Number(op.total);
                  const pct   = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                  const bar   = Math.round((votos / maxVotos) * 100);
                  const color = op.respuesta === 'SI' ? 'bg-green-500'
                    : op.respuesta === 'NO' ? 'bg-red-500'
                    : `bg-brand`;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-white text-xl font-bold">{op.respuesta}</span>
                        <span className="text-white/60 text-lg font-semibold">{votos} voto{votos !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-4 rounded-full transition-all duration-700 ${color}`} style={{ width: `${bar}%` }}/>
                      </div>
                    </div>
                  );
                })}
                <p className="text-white/30 text-sm text-center mt-2">Total: {totalVotos} votos</p>
              </div>
            )}

            <p className="text-white/20 text-sm absolute bottom-6">{sesion.nombre} · Toca para cerrar</p>
          </div>
        );
      })()}

      {/* Modal: Participación por pregunta */}
      {modalPartId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setModalPartId(null); setPartData(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><UsersRound size={15} className="text-brand"/>Participación en votación</h3>
              <button onClick={() => { setModalPartId(null); setPartData(null); }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {partCargando && <div className="flex justify-center py-8"><Loader2 size={24} className="text-brand animate-spin"/></div>}
              {partData && !partCargando && (
                <>
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-2xl font-extrabold text-green-700">{partData.votaron.length}</p>
                      <p className="text-xs text-green-600 font-semibold">Votaron</p>
                    </div>
                    <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-2xl font-extrabold text-orange-600">{partData.no_votaron.length}</p>
                      <p className="text-xs text-orange-500 font-semibold">No votaron</p>
                    </div>
                  </div>
                  {partData.votaron.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Votaron</p>
                      <div className="flex flex-col gap-1 mb-4">
                        {partData.votaron.map((v) => (
                          <div key={v.cedula} className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg">
                            <span className="text-xs font-semibold text-gray-700">{v.nombre}</span>
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{v.respuesta}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {partData.no_votaron.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">No votaron</p>
                      <div className="flex flex-col gap-1">
                        {partData.no_votaron.map((v) => (
                          <div key={v.cedula} className="flex items-center px-3 py-2 bg-orange-50 rounded-lg">
                            <span className="text-xs font-semibold text-gray-600">{v.nombre}</span>
                            <span className="text-xs text-gray-400 ml-auto font-mono">{v.cedula}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

          {mostrarCodigoTexto && (
            <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Código de acceso</p>
              <p className="text-white text-4xl font-mono font-black tracking-[0.25em] select-all">
                {sesion.codigo_asistencia}
              </p>
            </div>
          )}

          <p className="text-white/40 text-xs font-medium">{sesion.nombre}</p>

          <p className="text-white/25 text-xs">Toca en cualquier lugar para cerrar</p>
        </div>
      )}
    </div>
  );
}
