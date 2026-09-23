'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Megaphone, Upload, Send, CheckCircle, ChevronRight, Loader2,
  FileSpreadsheet, X, Phone, User, AlertCircle, Eye, EyeOff,
  MessageSquare, ArrowLeft, ArrowRight, RefreshCw, Download,
  History, ChevronDown, ChevronUp,
} from 'lucide-react';

const PASOS = ['Datos de la convocatoria', 'Cargar contactos', 'Revisar y enviar'];

const INIT = {
  departamento:            '',
  fechaAsamblea:           '',
  horaAsamblea:            '',
  lugar:                   '',
  inicioPostFecha:         '',
  inicioPostHora:          '00:00',
  cierrePostFecha:         '',
  cierrePostHora:          '23:59',
  linkFormulario:          '',
};

function fmtFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtHora(h) {
  if (!h) return '';
  const [hh, mm] = h.split(':').map(Number);
  const suffix = hh < 12 ? 'a. m.' : 'p. m.';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

const normStr = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export default function ConvocatoriaPage() {
  const [paso, setPaso]           = useState(0);
  const [form, setForm]           = useState(INIT);
  const [errores, setErrores]     = useState({});
  const [contactos, setContactos] = useState([]);
  const [archivo, setArchivo]     = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState(true);
  const [enviando, setEnviando]       = useState(false);
  const [resultado, setResultado]     = useState(null);
  const [historial, setHistorial]     = useState([]);
  const [histAbierto, setHistAbierto] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/convocatoria/historial')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setHistorial(j.historial); });
  }, [resultado]);

  // ── Variables calculadas ────────────────────────────────────────────────────
  const vars = {
    v1: form.departamento,
    v2: fmtFecha(form.fechaAsamblea),
    v3: fmtHora(form.horaAsamblea),
    v4: form.lugar,
    v5: form.inicioPostFecha
      ? `${fmtFecha(form.inicioPostFecha)}, a las ${fmtHora(form.inicioPostHora)}`
      : '',
    v6: form.cierrePostFecha
      ? `${fmtFecha(form.cierrePostFecha)}, a las ${fmtHora(form.cierrePostHora)}`
      : '',
    v7: form.linkFormulario,
  };

  const mensajePreview = `📢 CONVOCATORIA ASAMBLEA TERRITORIAL DE ${vars.v1 || '[DEPARTAMENTO]'}

¡Atención, militancia del Nuevo Liberalismo en ${vars.v1 || '[DEPARTAMENTO]'}! 👋

Es momento de dar un nuevo paso en la construcción de nuestro proyecto político en el departamento. Tu participación es fundamental para fortalecer la organización, elegir nuestros liderazgos y seguir construyendo juntos el Nuevo Liberalismo.

Por eso, te invitamos a participar en la Asamblea Territorial de ${vars.v1 || '[DEPARTAMENTO]'}:

📅 Fecha: ${vars.v2 || '[FECHA]'}
⏰ Hora: ${vars.v3 || '[HORA]'}
📍 Lugar: ${vars.v4 || '[LUGAR]'}

📌 Apertura y cierre de postulación de Delegados.

El periodo de postulación estará habilitado desde el ${vars.v5 || '[INICIO POSTULACIÓN]'}, hasta el ${vars.v6 || '[CIERRE POSTULACIÓN]'}.

👉 Realiza tu postulación en el siguiente formulario:
${vars.v7 || '[LINK FORMULARIO]'}

¡Construyamos juntos el Nuevo Liberalismo en ${vars.v1 || '[DEPARTAMENTO]'}! 🚩`;

  // ── Validación paso 1 ───────────────────────────────────────────────────────
  const validarPaso1 = () => {
    const e = {};
    if (!form.departamento.trim())   e.departamento   = 'Requerido';
    if (!form.fechaAsamblea)         e.fechaAsamblea  = 'Requerido';
    if (!form.horaAsamblea)          e.horaAsamblea   = 'Requerido';
    if (!form.lugar.trim())          e.lugar          = 'Requerido';
    if (!form.inicioPostFecha)       e.inicioPostFecha = 'Requerido';
    if (!form.cierrePostFecha)       e.cierrePostFecha = 'Requerido';
    if (!form.linkFormulario.trim()) e.linkFormulario = 'Requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Parsear Excel ───────────────────────────────────────────────────────────
  const parsearExcel = useCallback(async (file) => {
    try {
      const { read, utils } = await import('xlsx');
      const buf  = await file.arrayBuffer();
      const wb   = read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { defval: '' });

      const parsed = rows.map((row) => {
        const keys     = Object.keys(row);
        const find     = (...cs) => keys.find((k) => cs.includes(normStr(k)));
        const nomKey   = find('nombre', 'name', 'nombres');
        const telKey   = find('telefono', 'celular', 'phone', 'cel', 'movil', 'tel', 'whatsapp');
        const emailKey = find('email', 'correo', 'mail');
        return {
          nombre:   nomKey   ? String(row[nomKey]).trim()   : '',
          telefono: telKey   ? String(row[telKey]).trim()   : '',
          email:    emailKey ? String(row[emailKey]).trim() : '',
        };
      }).filter((c) => c.telefono);

      setContactos(parsed);
      setArchivo(file.name);
    } catch {
      alert('Error al leer el archivo. Asegúrate de que sea .xlsx, .xls o .csv');
    }
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) parsearExcel(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parsearExcel(f);
  };

  // ── Enviar ──────────────────────────────────────────────────────────────────
  const handleEnviar = async () => {
    setEnviando(true);
    setResultado(null);
    try {
      const res  = await fetch('/api/admin/convocatoria/enviar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ variables: vars, contactos }),
      });
      const json = await res.json();
      setResultado(json);
    } catch (err) {
      setResultado({ ok: false, error: err.message });
    }
    setEnviando(false);
  };

  // ── Helpers UI ──────────────────────────────────────────────────────────────
  const inp = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand transition`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errores[name]) setErrores((er) => ({ ...er, [name]: '' }));
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone size={22} className="text-brand" />
          Convocatoria masiva por WhatsApp
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Envía la convocatoria de asamblea usando la plantilla aprobada por Meta
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-7">
        {PASOS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors ${
                i < paso ? 'bg-green-500 text-white' :
                i === paso ? 'bg-brand text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < paso ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${i === paso ? 'text-brand' : i < paso ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`h-px w-10 mx-3 ${i < paso ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── PASO 0: Datos de la convocatoria ── */}
      {paso === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Variables del mensaje</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Departamento <span className="text-red-500">*</span></label>
              <input name="departamento" value={form.departamento} onChange={handleChange}
                placeholder="Ej: Caldas" className={inp(errores.departamento)} />
              {errores.departamento && <span className="text-xs text-red-500">{errores.departamento}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Fecha de la asamblea <span className="text-red-500">*</span></label>
                <input type="date" name="fechaAsamblea" value={form.fechaAsamblea} onChange={handleChange} className={inp(errores.fechaAsamblea)} />
                {errores.fechaAsamblea && <span className="text-xs text-red-500">{errores.fechaAsamblea}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Hora de la asamblea <span className="text-red-500">*</span></label>
                <input type="time" name="horaAsamblea" value={form.horaAsamblea} onChange={handleChange} className={inp(errores.horaAsamblea)} />
                {errores.horaAsamblea && <span className="text-xs text-red-500">{errores.horaAsamblea}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Lugar <span className="text-red-500">*</span></label>
              <input name="lugar" value={form.lugar} onChange={handleChange}
                placeholder="Ej: Restaurante a la leña cra 24 # 27-45 (Manizales)" className={inp(errores.lugar)} />
              {errores.lugar && <span className="text-xs text-red-500">{errores.lugar}</span>}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Periodo de postulación</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Fecha inicio <span className="text-red-500">*</span></label>
                  <input type="date" name="inicioPostFecha" value={form.inicioPostFecha} onChange={handleChange} className={inp(errores.inicioPostFecha)} />
                  {errores.inicioPostFecha && <span className="text-xs text-red-500">{errores.inicioPostFecha}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Hora inicio</label>
                  <input type="time" name="inicioPostHora" value={form.inicioPostHora} onChange={handleChange} className={inp(false)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Fecha cierre <span className="text-red-500">*</span></label>
                  <input type="date" name="cierrePostFecha" value={form.cierrePostFecha} onChange={handleChange} className={inp(errores.cierrePostFecha)} />
                  {errores.cierrePostFecha && <span className="text-xs text-red-500">{errores.cierrePostFecha}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Hora cierre</label>
                  <input type="time" name="cierrePostHora" value={form.cierrePostHora} onChange={handleChange} className={inp(false)} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Link del formulario de postulación <span className="text-red-500">*</span></label>
              <input name="linkFormulario" value={form.linkFormulario} onChange={handleChange}
                placeholder="https://nuevoliberalismo.org/postulacion-..." className={inp(errores.linkFormulario)} />
              {errores.linkFormulario && <span className="text-xs text-red-500">{errores.linkFormulario}</span>}
            </div>

            <button onClick={() => { if (validarPaso1()) setPaso(1); }}
              className="mt-2 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
              Siguiente — Cargar contactos <ArrowRight size={16} />
            </button>
          </div>

          {/* Vista previa del mensaje */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-green-600" /> Vista previa del mensaje
              </p>
              <button onClick={() => setPreview((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {preview && (
              <div className="bg-[#ECE5DD] rounded-2xl p-4 shadow-sm">
                {/* Burbuja WhatsApp */}
                <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm p-4 max-w-sm">
                  <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed font-[system-ui]">
                    {mensajePreview}
                  </p>
                  <p className="text-[10px] text-gray-400 text-right mt-2">ahora ✓✓</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-3 text-center">
                  Plantilla: <strong>convocatoria_asamblea_territorial</strong> · Idioma: es
                </p>
              </div>
            )}

            {/* Resumen de variables */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Variables que se enviarán</p>
              <div className="flex flex-col gap-1.5">
                {[
                  ['{{1}} Departamento', vars.v1],
                  ['{{2}} Fecha asamblea', vars.v2],
                  ['{{3}} Hora', vars.v3],
                  ['{{4}} Lugar', vars.v4],
                  ['{{5}} Inicio postulación', vars.v5],
                  ['{{6}} Cierre postulación', vars.v6],
                  ['{{7}} Link formulario', vars.v7],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-gray-400 flex-shrink-0 w-40">{label}</span>
                    <span className={`truncate ${val ? 'text-gray-800' : 'text-red-300 italic'}`}>
                      {val || 'Sin completar'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 1: Cargar contactos ── */}
      {paso === 1 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Cargar archivo de contactos</h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400">
                El archivo debe tener columnas: <strong>nombre</strong>, <strong>telefono</strong> (requerido), <strong>email</strong> (opcional).
                Formatos aceptados: .xlsx, .xls, .csv
              </p>
              <button
                onClick={async () => {
                  const { utils, writeFile } = await import('xlsx');
                  const ws = utils.aoa_to_sheet([
                    ['nombre', 'telefono', 'email'],
                    ['Juan Pérez', '3001234567', 'juan@ejemplo.com'],
                    ['María López', '3109876543', 'maria@ejemplo.com'],
                  ]);
                  ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 30 }];
                  const wb = utils.book_new();
                  utils.book_append_sheet(wb, ws, 'Contactos');
                  writeFile(wb, 'plantilla_contactos_convocatoria.xlsx');
                }}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 rounded-lg px-3 py-1.5 transition-colors ml-4">
                <Download size={13} /> Descargar plantilla
              </button>
            </div>

            {/* Zona de carga */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                dragOver ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}>
              <FileSpreadsheet size={40} className={dragOver ? 'text-brand' : 'text-gray-300'} />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {archivo ? `Archivo cargado: ${archivo}` : 'Arrastra el archivo aquí o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">.xlsx · .xls · .csv</p>
              </div>
              {archivo && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <CheckCircle size={13} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">{contactos.length} contactos con teléfono encontrados</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />

            {/* Tabla de contactos */}
            {contactos.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-600">{contactos.length} contactos cargados</p>
                  <button onClick={() => { setContactos([]); setArchivo(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                    <X size={13} /> Limpiar
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-bold text-gray-500">#</th>
                          <th className="text-left py-2 px-3 font-bold text-gray-500">
                            <span className="flex items-center gap-1"><User size={11} /> Nombre</span>
                          </th>
                          <th className="text-left py-2 px-3 font-bold text-gray-500">
                            <span className="flex items-center gap-1"><Phone size={11} /> Teléfono</span>
                          </th>
                          <th className="text-left py-2 px-3 font-bold text-gray-500">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactos.map((c, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                            <td className="py-2 px-3 font-semibold text-gray-800">{c.nombre || '—'}</td>
                            <td className="py-2 px-3 font-mono text-gray-700">{c.telefono}</td>
                            <td className="py-2 px-3 text-gray-500 truncate max-w-[180px]">{c.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(0)}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} /> Anterior
            </button>
            <button onClick={() => { if (contactos.length > 0) setPaso(2); else alert('Carga al menos un contacto con teléfono'); }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              disabled={contactos.length === 0}>
              Siguiente — Revisar y enviar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Revisar y enviar ── */}
      {paso === 2 && (
        <div className="flex flex-col gap-5">

          {!resultado ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Resumen */}
                <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen del envío</h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-brand">{contactos.length}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">Destinatarios</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-lg font-extrabold text-green-700 truncate">{vars.v1}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">Departamento</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    {[
                      ['📅 Fecha asamblea', vars.v2],
                      ['⏰ Hora',            vars.v3],
                      ['📍 Lugar',           vars.v4],
                      ['🟢 Inicio postulación', vars.v5],
                      ['🔴 Cierre postulación', vars.v6],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-0.5 border-b border-gray-50 pb-2 last:border-0">
                        <span className="font-bold text-gray-400">{label}</span>
                        <span className="text-gray-800 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Esta acción enviará <strong>{contactos.length} mensajes de WhatsApp</strong> de forma inmediata. Verifica los datos antes de continuar.
                    </p>
                  </div>
                </div>

                {/* Vista previa mensaje */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-green-600" /> Mensaje que se enviará
                  </p>
                  <div className="bg-[#ECE5DD] rounded-2xl p-4 shadow-sm flex-1">
                    <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm p-4">
                      <p className="text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed font-[system-ui]">
                        {mensajePreview}
                      </p>
                      <p className="text-[10px] text-gray-400 text-right mt-2">ahora ✓✓</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)}
                  className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button onClick={handleEnviar} disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors shadow-md">
                  {enviando
                    ? <><Loader2 size={18} className="animate-spin" /> Enviando {contactos.length} mensajes...</>
                    : <><Send size={18} /> Enviar {contactos.length} convocatorias por WhatsApp</>}
                </button>
              </div>
            </>
          ) : (
            /* Resultados */
            <div className="flex flex-col gap-5">
              {resultado.ok ? (
                <>
                  {/* Resumen resultados */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                      <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
                      <p className="text-4xl font-extrabold text-green-700">{resultado.enviados}</p>
                      <p className="text-sm font-semibold text-green-600 mt-1">Enviados exitosamente</p>
                    </div>
                    <div className={`border rounded-2xl p-5 text-center ${resultado.fallidos > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      {resultado.fallidos > 0
                        ? <AlertCircle size={28} className="text-red-600 mx-auto mb-2" />
                        : <CheckCircle size={28} className="text-gray-300 mx-auto mb-2" />}
                      <p className={`text-4xl font-extrabold ${resultado.fallidos > 0 ? 'text-red-700' : 'text-gray-400'}`}>{resultado.fallidos}</p>
                      <p className={`text-sm font-semibold mt-1 ${resultado.fallidos > 0 ? 'text-red-600' : 'text-gray-400'}`}>Con error</p>
                    </div>
                    <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 text-center">
                      <Send size={28} className="text-brand mx-auto mb-2" />
                      <p className="text-4xl font-extrabold text-brand">{resultado.total}</p>
                      <p className="text-sm font-semibold text-gray-600 mt-1">Total procesados</p>
                    </div>
                  </div>

                  {/* Tabla de detalles */}
                  {resultado.resultados?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Detalle por contacto</p>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Nombre</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Teléfono</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Estado</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resultado.resultados.map((r, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="py-2 px-3 font-semibold text-gray-800">{r.nombre || '—'}</td>
                                  <td className="py-2 px-3 font-mono text-gray-600">{r.telefono}</td>
                                  <td className="py-2 px-3">
                                    {r.ok
                                      ? <span className="inline-flex items-center gap-1 text-green-700 font-bold"><CheckCircle size={11} /> Enviado</span>
                                      : <span className="inline-flex items-center gap-1 text-red-600 font-bold"><X size={11} /> Error</span>}
                                  </td>
                                  <td className="py-2 px-3 text-gray-400 max-w-[200px] truncate">
                                    {r.ok ? '—' : r.error?.slice(0, 80) || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700">Error al enviar</p>
                    <p className="text-sm text-red-600 mt-1">{resultado.error}</p>
                  </div>
                </div>
              )}

              <button onClick={() => { setPaso(0); setForm(INIT); setContactos([]); setArchivo(null); setResultado(null); }}
                className="flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <RefreshCw size={16} /> Nueva convocatoria
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL DE ENVÍOS ── */}
      {historial.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-4">
            <History size={15} className="text-gray-400" /> Historial de envíos
          </h2>
          <div className="flex flex-col gap-3">
            {historial.map((h) => {
              const abierto = histAbierto === h.id;
              const fecha   = new Date(h.enviado_en).toLocaleString('es-CO', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              });
              const contactos = h.contactos || [];
              const exitosos  = contactos.filter((c) => c.ok);
              const fallidos  = contactos.filter((c) => !c.ok);
              return (
                <div key={h.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  {/* Cabecera */}
                  <button
                    onClick={() => setHistAbierto(abierto ? null : h.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{h.departamento}</span>
                        <span className="text-xs text-gray-400">{fecha} · por {h.enviado_por}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                          {h.total} contactos
                        </span>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                          ✓ {h.enviados} enviados
                        </span>
                        {h.fallidos > 0 && (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                            ✗ {h.fallidos} fallidos
                          </span>
                        )}
                      </div>
                    </div>
                    {abierto ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  </button>

                  {/* Detalle expandible */}
                  {abierto && (
                    <div className="border-t border-gray-100 px-5 pb-5 pt-3">
                      {/* Info del mensaje */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 text-xs">
                        {[
                          ['Fecha asamblea', h.variables?.v2],
                          ['Hora',           h.variables?.v3],
                          ['Lugar',          h.variables?.v4],
                          ['Inicio post.',   h.variables?.v5],
                          ['Cierre post.',   h.variables?.v6],
                          ['Link',           h.variables?.v7],
                        ].map(([label, val]) => (
                          <div key={label} className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-400 uppercase tracking-wide text-[10px]">{label}</span>
                            <span className="text-gray-700 truncate">{val || '—'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tabla de contactos */}
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">#</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Nombre</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Teléfono</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Email</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-500">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contactos.map((c, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-gray-800">{c.nombre || '—'}</td>
                                  <td className="py-2 px-3 font-mono text-gray-600">{c.telefono}</td>
                                  <td className="py-2 px-3 text-gray-500">{c.email || '—'}</td>
                                  <td className="py-2 px-3">
                                    {c.ok
                                      ? <span className="inline-flex items-center gap-1 text-green-700 font-bold"><CheckCircle size={11} /> Enviado</span>
                                      : <span className="inline-flex items-center gap-1 text-red-600 font-bold"><X size={11} /> Error</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Botón exportar este envío */}
                      <button
                        onClick={async () => {
                          const { utils, writeFile } = await import('xlsx');
                          const rows = contactos.map((c, i) => ({
                            '#':        i + 1,
                            Nombre:     c.nombre || '',
                            Teléfono:   c.telefono,
                            Email:      c.email || '',
                            Estado:     c.ok ? 'Enviado' : 'Error',
                            Detalle:    c.ok ? '' : (c.error || ''),
                          }));
                          const ws = utils.json_to_sheet(rows);
                          ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 40 }];
                          const wb = utils.book_new();
                          utils.book_append_sheet(wb, ws, 'Soporte');
                          writeFile(wb, `soporte_convocatoria_${h.departamento}_${h.enviado_en.slice(0, 10)}.xlsx`);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 rounded-lg px-3 py-1.5 transition-colors">
                        <Download size={13} /> Exportar soporte en Excel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
