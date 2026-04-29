'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Plus, Trash2, Radio, PlayCircle, Square, CheckCircle,
  ThumbsUp, ThumbsDown, Users, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { getSesion, actualizarSesion, agregarPregunta, eliminarPregunta, cambiarEstado, EVENTO_UPDATE } from '../../../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_CFG = {
  borrador:   { label: 'Borrador',   color: 'bg-yellow-100 text-yellow-700', next: 'proxima',  nextLabel: 'Publicar como Próxima' },
  proxima:    { label: 'Próxima',    color: 'bg-blue-100 text-blue-700',     next: 'en_curso', nextLabel: 'Iniciar sesión' },
  en_curso:   { label: 'En curso',   color: 'bg-green-100 text-green-700',   next: 'finalizada',nextLabel: 'Finalizar sesión' },
  finalizada: { label: 'Finalizada', color: 'bg-gray-100 text-gray-500',     next: null,        nextLabel: null },
};

function PreguntaForm({ onGuardar, onCancelar, enVivo = false }) {
  const [tipo, setTipo]         = useState('sino');
  const [texto, setTexto]       = useState('');
  const [opciones, setOpciones] = useState(['', '']);
  const [err, setErr]           = useState('');

  const handleGuardar = () => {
    if (!texto.trim()) { setErr('Escribe el texto de la pregunta'); return; }
    if (tipo === 'candidatos' && opciones.some((o) => !o.trim())) { setErr('Completa todos los candidatos'); return; }
    onGuardar({ tipo, texto: texto.trim(), opciones: tipo === 'candidatos' ? opciones.map((o) => o.trim()) : undefined, enVivo });
  };

  return (
    <div className={`border-2 rounded-2xl p-4 flex flex-col gap-3 ${enVivo ? 'border-orange-400 bg-orange-50' : 'border-brand bg-brand-50'}`}>
      {enVivo && (
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Pregunta en vivo — los usuarios la verán inmediatamente</span>
        </div>
      )}

      {/* Tipo */}
      <div className="flex gap-2">
        {['sino', 'candidatos'].map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
              tipo === t ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-600'
            }`}
          >
            {t === 'sino' ? '👍 Sí / No' : '👤 Candidatos'}
          </button>
        ))}
      </div>

      {/* Texto */}
      <textarea
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setErr(''); }}
        placeholder="Escribe la pregunta..."
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
      />

      {/* Opciones candidatos */}
      {tipo === 'candidatos' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600">Candidatos:</p>
          {opciones.map((op, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={op}
                onChange={(e) => { const o = [...opciones]; o[i] = e.target.value; setOpciones(o); setErr(''); }}
                placeholder={`Candidato ${i + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              {opciones.length > 2 && (
                <button onClick={() => setOpciones(opciones.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setOpciones([...opciones, ''])} className="text-xs text-brand font-bold hover:underline self-start">
            + Agregar candidato
          </button>
        </div>
      )}

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className={`flex-1 py-2 rounded-lg text-sm font-bold text-white transition-colors ${enVivo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-hover'}`}
        >
          {enVivo ? '⚡ Publicar en vivo' : 'Guardar pregunta'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSesionPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const sesionId = decodeURIComponent(id);

  const [sesion, setSesion]             = useState(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [mostrarVivo, setMostrarVivo]   = useState(false);
  const [cambiandoEstado, setCambiando] = useState(false);

  const cargar = () => {
    const s = getSesion(sesionId);
    if (s) setSesion({ ...s });
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored || JSON.parse(stored).rol !== 'admin') { router.replace('/'); return; }
    cargar();
    window.addEventListener(EVENTO_UPDATE, cargar);
    window.addEventListener('storage', cargar);
    return () => {
      window.removeEventListener(EVENTO_UPDATE, cargar);
      window.removeEventListener('storage', cargar);
    };
  }, [sesionId, router]);

  if (!sesion) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando sesión...</p>
    </main>
  );

  const cfg = ESTADO_CFG[sesion.estado] || ESTADO_CFG.borrador;

  const handleCambiarEstado = () => {
    if (!cfg.next) return;
    setCambiando(true);
    cambiarEstado(sesionId, cfg.next);
    setTimeout(() => { cargar(); setCambiando(false); }, 300);
  };

  const handleGuardarPregunta = (pregunta) => {
    agregarPregunta(sesionId, pregunta);
    setMostrarForm(false);
    setMostrarVivo(false);
    cargar();
  };

  const handleEliminar = (preguntaId) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    eliminarPregunta(sesionId, preguntaId);
    cargar();
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-white flex-shrink-0"><ArrowLeft size={22} /></button>
          <Image src={LOGO} alt="Nuevo Liberalismo" width={120} height={40} className="object-contain" priority />
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* Info sesión */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-base leading-snug">{sesion.nombre}</h1>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{sesion.id}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
            <span>📅 {sesion.fecha} · {sesion.hora}</span>
            <span>📍 {sesion.lugar}</span>
            <span>🏷️ {sesion.tipo} · {sesion.colectivo}</span>
            <span>🔑 Código: <strong className="text-gray-800 font-mono">{sesion.codigoAsistencia}</strong></span>
          </div>

          {/* Cambiar estado */}
          {cfg.next && (
            <button
              onClick={handleCambiarEstado}
              disabled={cambiandoEstado}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors text-sm ${
                cfg.next === 'en_curso'    ? 'bg-green-500 hover:bg-green-600 text-white' :
                cfg.next === 'finalizada'  ? 'bg-gray-500 hover:bg-gray-600 text-white' :
                'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {cfg.next === 'en_curso'   && <PlayCircle size={16} />}
              {cfg.next === 'finalizada' && <Square size={16} />}
              {cfg.next === 'proxima'    && <CheckCircle size={16} />}
              {cambiandoEstado ? 'Actualizando...' : cfg.nextLabel}
            </button>
          )}
          {sesion.estado === 'finalizada' && (
            <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl text-sm">
              <CheckCircle size={16} /> Sesión finalizada
            </div>
          )}
        </div>

        {/* Preguntas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Preguntas ({sesion.preguntas.length})
            </h2>
            <div className="flex gap-2">
              {/* Agregar en vivo — solo cuando está en curso */}
              {sesion.estado === 'en_curso' && (
                <button
                  onClick={() => { setMostrarVivo(!mostrarVivo); setMostrarForm(false); }}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                >
                  <Zap size={13} />
                  En vivo
                </button>
              )}
              {/* Agregar normal */}
              {sesion.estado !== 'finalizada' && (
                <button
                  onClick={() => { setMostrarForm(!mostrarForm); setMostrarVivo(false); }}
                  className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={13} />
                  Agregar
                </button>
              )}
            </div>
          </div>

          {/* Formulario en vivo */}
          {mostrarVivo && (
            <div className="mb-3">
              <PreguntaForm enVivo onGuardar={handleGuardarPregunta} onCancelar={() => setMostrarVivo(false)} />
            </div>
          )}

          {/* Formulario normal */}
          {mostrarForm && (
            <div className="mb-3">
              <PreguntaForm onGuardar={handleGuardarPregunta} onCancelar={() => setMostrarForm(false)} />
            </div>
          )}

          {/* Lista de preguntas */}
          {sesion.preguntas.length === 0 && !mostrarForm && !mostrarVivo && (
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
            {sesion.preguntas.map((p, idx) => (
              <div
                key={p.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 p-4 ${p.enVivo ? 'border-orange-400' : 'border-brand'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo === 'sino' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.tipo === 'sino' ? '👍 Sí/No' : '👤 Candidatos'}
                      </span>
                      {p.enVivo && <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Zap size={10} />En vivo</span>}
                    </div>
                    <p className="text-sm text-gray-900 leading-snug">{p.texto}</p>
                    {p.tipo === 'candidatos' && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.opciones?.map((o, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{o}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {sesion.estado !== 'finalizada' && (
                    <button onClick={() => handleEliminar(p.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
