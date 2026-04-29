'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { TIPOS_ASAMBLEA, COLECTIVOS, DEPARTAMENTOS_CON_CODIGO, generarConsecutivo } from '../../lib/data';
import { crearSesion } from '../../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const INIT = { tipo: '', colectivo: '', departamento: '', zona: '', fecha: '', hora: '', lugar: '' };

export default function NuevaSesionPage() {
  const router = useRouter();
  const [form, setForm]         = useState(INIT);
  const [errores, setErrores]   = useState({});
  const [consecutivo, setConsecutivo] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored || JSON.parse(stored).rol !== 'admin') { router.replace('/'); return; }
  }, [router]);

  useEffect(() => {
    const { tipo, colectivo, departamento, zona, fecha } = form;
    if (tipo && colectivo && departamento && zona && fecha) {
      setConsecutivo(generarConsecutivo({ tipo, colectivo, departamento, zona, fecha }));
    } else {
      setConsecutivo('');
    }
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: '' });
  };

  const validar = () => {
    const e = {};
    ['tipo','colectivo','departamento','zona','fecha','hora','lugar'].forEach((k) => {
      if (!form[k].trim()) e[k] = 'Campo requerido';
    });
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = () => {
    if (!validar()) return;
    const nuevaSesion = {
      id: consecutivo,
      nombre: `Asamblea ${form.tipo} ${form.colectivo} ${form.departamento} ${form.zona}`,
      tipo: form.tipo,
      colectivo: form.colectivo,
      departamento: form.departamento,
      zona: form.zona,
      fecha: form.fecha,
      hora: form.hora,
      lugar: form.lugar,
      estado: 'borrador',
      codigoAsistencia: consecutivo.split('-').slice(0,2).join(''),
      preguntas: [],
    };
    crearSesion(nuevaSesion);
    router.push(`/admin/sesion/${encodeURIComponent(consecutivo)}`);
  };

  const selectCls = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand transition`;
  const inputCls = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand transition`;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-white flex-shrink-0"><ArrowLeft size={22} /></button>
          <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority />
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Crear nueva sesión</h1>
          <p className="text-sm text-gray-500">Completa los datos para generar el consecutivo automáticamente</p>
        </div>

        {/* Consecutivo preview */}
        {consecutivo && (
          <div className="bg-brand-50 border-2 border-brand rounded-xl p-4 flex items-center gap-3">
            <Sparkles size={20} className="text-brand flex-shrink-0" />
            <div>
              <p className="text-xs text-brand font-semibold uppercase tracking-wide">Consecutivo generado</p>
              <p className="text-xl font-extrabold text-brand tracking-widest font-mono">{consecutivo}</p>
              <p className="text-xs text-brand-hover mt-0.5">Código de asistencia: <span className="font-bold">{consecutivo.split('-').slice(0,2).join('')}</span></p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Clasificación</h2>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Tipo de asamblea</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className={selectCls(errores.tipo)}>
              <option value="">Selecciona...</option>
              {TIPOS_ASAMBLEA.map((t) => <option key={t}>{t}</option>)}
            </select>
            {errores.tipo && <span className="text-xs text-red-500">{errores.tipo}</span>}
          </div>

          {/* Colectivo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Colectivo</label>
            <select name="colectivo" value={form.colectivo} onChange={handleChange} className={selectCls(errores.colectivo)}>
              <option value="">Selecciona...</option>
              {COLECTIVOS.map((c) => <option key={c}>{c}</option>)}
            </select>
            {errores.colectivo && <span className="text-xs text-red-500">{errores.colectivo}</span>}
          </div>

          {/* Departamento */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Departamento</label>
            <select name="departamento" value={form.departamento} onChange={handleChange} className={selectCls(errores.departamento)}>
              <option value="">Selecciona...</option>
              {DEPARTAMENTOS_CON_CODIGO.map((d) => <option key={d.codigo}>{d.nombre}</option>)}
            </select>
            {errores.departamento && <span className="text-xs text-red-500">{errores.departamento}</span>}
          </div>

          {/* Zona */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Zona</label>
            <input name="zona" value={form.zona} onChange={handleChange} placeholder="Ej: Norte, Z1, Centro" className={inputCls(errores.zona)} />
            {errores.zona && <span className="text-xs text-red-500">{errores.zona}</span>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Logística</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Fecha</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className={inputCls(errores.fecha)} />
              {errores.fecha && <span className="text-xs text-red-500">{errores.fecha}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Hora</label>
              <input type="time" name="hora" value={form.hora} onChange={handleChange} className={inputCls(errores.hora)} />
              {errores.hora && <span className="text-xs text-red-500">{errores.hora}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Lugar</label>
            <input name="lugar" value={form.lugar} onChange={handleChange} placeholder="Ciudad — Nombre del lugar" className={inputCls(errores.lugar)} />
            {errores.lugar && <span className="text-xs text-red-500">{errores.lugar}</span>}
          </div>
        </div>

        <button
          onClick={handleCrear}
          className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-4 rounded-xl transition-colors shadow-md"
        >
          Crear sesión y configurar preguntas
        </button>
      </div>
    </main>
  );
}
