'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { DEPARTAMENTOS_CON_CODIGO, generarConsecutivo } from '../../lib/data';

const INIT  = { tipo: '', colectivo: '', departamento: '', zona: '', fecha: '', hora: '', lugar: '' };

export default function NuevaSesionPage() {
  const router = useRouter();
  const [form, setForm]                     = useState(INIT);
  const [errores, setErrores]               = useState({});
  const [consecutivoBase, setConsecutivoBase] = useState('');
  const [consecutivo, setConsecutivo]       = useState('');
  const [cargandoSeq, setCargandoSeq]       = useState(false);
  const [tipos, setTipos]                   = useState([]);
  const [colectivos, setColectivos]         = useState([]);
  const [guardando, setGuardando]           = useState(false);
  const [errServidor, setErrServidor]       = useState('');

  useEffect(() => {
    fetch('/api/admin/parametricas').then((r) => r.json()).then((json) => {
      if (json.ok) { setTipos(json.tipos); setColectivos(json.colectivos); }
    });
  }, []);

  // Genera la base del consecutivo (sin secuencial) cuando el formulario está completo
  useEffect(() => {
    const { tipo, colectivo, departamento, zona, fecha } = form;
    const deptoOk = tipo === 'NACIONAL' || !!departamento;
    if (tipo && colectivo && deptoOk && zona && fecha) {
      const tipoObj      = tipos.find((t) => t.nombre === tipo);
      const colectivoObj = colectivos.find((c) => c.nombre === colectivo);
      setConsecutivoBase(generarConsecutivo({
        tipo, colectivo, departamento, zona, fecha,
        codigoTipo:      tipoObj?.codigo,
        codigoColectivo: colectivoObj?.codigo,
      }));
    } else {
      setConsecutivoBase('');
      setConsecutivo('');
    }
  }, [form]);

  // Consulta al servidor el secuencial disponible cuando cambia la base
  useEffect(() => {
    if (!consecutivoBase) return;
    setCargandoSeq(true);
    setConsecutivo('');
    fetch(`/api/admin/sesiones/consecutivo?base=${encodeURIComponent(consecutivoBase)}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setConsecutivo(json.consecutivo); })
      .finally(() => setCargandoSeq(false));
  }, [consecutivoBase]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: '' });
    setErrServidor('');
  };

  const validar = () => {
    const e = {};
    const camposRequeridos = form.tipo === 'NACIONAL'
      ? ['tipo','colectivo','zona','fecha','hora','lugar']
      : ['tipo','colectivo','departamento','zona','fecha','hora','lugar'];
    camposRequeridos.forEach((k) => {
      if (!form[k].trim()) e[k] = 'Campo requerido';
    });
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async () => {
    if (!validar()) return;
    setGuardando(true); setErrServidor('');

    const tipoObj      = tipos.find((t) => t.nombre === form.tipo);
    const colectivoObj = colectivos.find((c) => c.nombre === form.colectivo);

    const res = await fetch('/api/admin/sesiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_id:          consecutivoBase,
        nombre:           `Asamblea ${form.tipo} ${form.colectivo} ${form.departamento} ${form.zona}`,
        tipo_asamblea_id: tipoObj?.id,
        colectivo_id:     colectivoObj?.id,
        departamento:     form.tipo === 'NACIONAL' ? null : form.departamento,
        zona:             form.zona,
        fecha:            form.fecha,
        hora:             form.hora,
        lugar:            form.lugar,
        estado:           'borrador',
        codigo_asistencia: Array.from({length:6}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join(''),
      }),
    });
    const json = await res.json();

    if (!json.ok) {
      setErrServidor('Error al crear la sesión: ' + json.error);
      setGuardando(false); return;
    }

    router.push(`/admin/sesion/${encodeURIComponent(json.id)}`);
  };

  const sel = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand transition`;
  const inp = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand transition`;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Nueva sesión</h1>
      <p className="text-sm text-gray-500 mb-5">Completa los datos para generar el consecutivo</p>

      {consecutivoBase && (
        <div className="bg-brand-50 border-2 border-brand rounded-xl p-4 flex items-center gap-3 mb-5">
          <Sparkles size={20} className="text-brand flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-brand font-semibold uppercase tracking-wide">Consecutivo generado</p>
            {cargandoSeq ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 size={16} className="text-brand animate-spin" />
                <span className="text-sm text-brand font-mono">{consecutivoBase}-...</span>
              </div>
            ) : (
              <p className="text-xl font-extrabold text-brand tracking-widest font-mono">{consecutivo}</p>
            )}
          </div>
        </div>
      )}

      {/* Clasificación */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 mb-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Clasificación</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Tipo de asamblea</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className={sel(errores.tipo)}>
              <option value="">Selecciona...</option>
              {tipos.map((t) => <option key={t.id}>{t.nombre}</option>)}
            </select>
            {errores.tipo && <span className="text-xs text-red-500">{errores.tipo}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Colectivo</label>
            <select name="colectivo" value={form.colectivo} onChange={handleChange} className={sel(errores.colectivo)}>
              <option value="">Selecciona...</option>
              {colectivos.map((c) => <option key={c.id}>{c.nombre}</option>)}
            </select>
            {errores.colectivo && <span className="text-xs text-red-500">{errores.colectivo}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Departamento</label>
            <select name="departamento" value={form.departamento} onChange={handleChange}
              className={sel(errores.departamento)} disabled={form.tipo === 'NACIONAL'}>
              <option value="">{form.tipo === 'NACIONAL' ? 'N/A — asamblea nacional' : 'Selecciona...'}</option>
              {DEPARTAMENTOS_CON_CODIGO.map((d) => <option key={d.codigo}>{d.nombre}</option>)}
            </select>
            {errores.departamento && <span className="text-xs text-red-500">{errores.departamento}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Zona</label>
            <input name="zona" value={form.zona} onChange={handleChange}
              placeholder="Ej: Norte, Z1, Centro" className={inp(errores.zona)} />
            {errores.zona && <span className="text-xs text-red-500">{errores.zona}</span>}
          </div>
        </div>
      </div>

      {/* Logística */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 mb-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Logística</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Fecha</label>
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className={inp(errores.fecha)} />
            {errores.fecha && <span className="text-xs text-red-500">{errores.fecha}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Hora</label>
            <input type="time" name="hora" value={form.hora} onChange={handleChange} className={inp(errores.hora)} />
            {errores.hora && <span className="text-xs text-red-500">{errores.hora}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Lugar</label>
          <input name="lugar" value={form.lugar} onChange={handleChange}
            placeholder="Ciudad — Nombre del lugar" className={inp(errores.lugar)} />
          {errores.lugar && <span className="text-xs text-red-500">{errores.lugar}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Cupo máximo <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input type="number" name="cupo_maximo" value={form.cupo_maximo || ''} onChange={handleChange}
            placeholder="Sin límite" className={inp(false)} />
        </div>
      </div>

      {errServidor && <p className="text-sm text-red-500 text-center mb-4">{errServidor}</p>}

      <button onClick={handleCrear} disabled={guardando}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors shadow-md">
        {guardando ? <Loader2 size={18} className="animate-spin" /> : null}
        {guardando ? 'Creando...' : 'Crear sesión y configurar preguntas'}
      </button>
    </div>
  );
}
