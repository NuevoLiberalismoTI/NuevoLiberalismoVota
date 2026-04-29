'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus, Trash2, PlayCircle, Square, CheckCircle, Zap, Radio, Lock, Clock } from 'lucide-react';
import {
  getSesion, agregarPregunta, eliminarPregunta, cambiarEstado,
  publicarPregunta, cerrarPreguntaActiva, EVENTO_UPDATE,
} from '../../../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_SESION = {
  borrador:   { label: 'Borrador',   color: 'bg-yellow-100 text-yellow-700', next: 'proxima',    nextLabel: 'Publicar como Próxima' },
  proxima:    { label: 'Próxima',    color: 'bg-blue-100 text-blue-700',     next: 'en_curso',   nextLabel: 'Iniciar sesión' },
  en_curso:   { label: 'En curso',   color: 'bg-green-100 text-green-700',   next: 'finalizada', nextLabel: 'Finalizar sesión' },
  finalizada: { label: 'Finalizada', color: 'bg-gray-100 text-gray-500',     next: null,         nextLabel: null },
};

const ESTADO_PREGUNTA = {
  pendiente: { label: 'Pendiente', bg: 'bg-gray-100',    text: 'text-gray-500',   dot: 'bg-gray-400'   },
  activa:    { label: 'Activa',    bg: 'bg-green-100',   text: 'text-green-700',  dot: 'bg-green-500'  },
  cerrada:   { label: 'Cerrada',   bg: 'bg-slate-100',   text: 'text-slate-500',  dot: 'bg-slate-400'  },
};

function FormPregunta({ onGuardar, onCancelar, enVivo = false }) {
  const [tipo, setTipo]     = useState('sino');
  const [texto, setTexto]   = useState('');
  const [opciones, setOpc]  = useState(['', '']);
  const [err, setErr]       = useState('');

  const guardar = () => {
    if (!texto.trim()) { setErr('Escribe el texto de la pregunta'); return; }
    if (tipo === 'candidatos' && opciones.some((o) => !o.trim())) { setErr('Completa todos los candidatos'); return; }
    onGuardar({ tipo, texto: texto.trim(), opciones: tipo === 'candidatos' ? opciones.map((o) => o.trim()) : undefined, enVivo });
  };

  return (
    <div className={`border-2 rounded-2xl p-4 flex flex-col gap-3 ${enVivo ? 'border-orange-400 bg-orange-50' : 'border-brand bg-brand-50'}`}>
      {enVivo && (
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Pregunta en vivo</span>
        </div>
      )}
      <div className="flex gap-2">
        {['sino','candidatos'].map((t) => (
          <button key={t} onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${tipo === t ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
            {t === 'sino' ? '👍 Sí / No' : '👤 Candidatos'}
          </button>
        ))}
      </div>
      <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setErr(''); }}
        placeholder="Escribe la pregunta..." rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
      {tipo === 'candidatos' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600">Candidatos:</p>
          {opciones.map((op, i) => (
            <div key={i} className="flex gap-2">
              <input value={op} onChange={(e) => { const o=[...opciones]; o[i]=e.target.value; setOpc(o); setErr(''); }}
                placeholder={`Candidato ${i+1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              {opciones.length > 2 && (
                <button onClick={() => setOpc(opciones.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={15}/></button>
              )}
            </div>
          ))}
          <button onClick={() => setOpc([...opciones,''])} className="text-xs text-brand font-bold hover:underline self-start">+ Agregar candidato</button>
        </div>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
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

  const [sesion, setSesion]           = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarVivo, setMostrarVivo] = useState(false);

  const cargar = () => { const s = getSesion(sesionId); if (s) setSesion({...s}); };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored || JSON.parse(stored).rol !== 'admin') { router.replace('/'); return; }
    cargar();
    window.addEventListener(EVENTO_UPDATE, cargar);
    window.addEventListener('storage', cargar);
    return () => { window.removeEventListener(EVENTO_UPDATE, cargar); window.removeEventListener('storage', cargar); };
  }, [sesionId]);

  if (!sesion) return <main className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Cargando...</p></main>;

  const cfg       = ESTADO_SESION[sesion.estado] || ESTADO_SESION.borrador;
  const enCurso   = sesion.estado === 'en_curso';
  const activaId  = sesion.preguntaActivaId;
  const hayActiva = activaId !== null && activaId !== undefined;

  const handleGuardar = (pregunta) => {
    agregarPregunta(sesionId, pregunta);
    setMostrarForm(false); setMostrarVivo(false); cargar();
  };

  const handlePublicar = (preguntaId) => { publicarPregunta(sesionId, preguntaId); cargar(); };
  const handleCerrar   = ()            => { cerrarPreguntaActiva(sesionId); cargar(); };
  const handleEliminar = (pId)         => { if (!confirm('¿Eliminar?')) return; eliminarPregunta(sesionId, pId); cargar(); };
  const handleEstado   = ()            => { if (!cfg.next) return; cambiarEstado(sesionId, cfg.next); cargar(); };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-white flex-shrink-0"><ArrowLeft size={22}/></button>
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
          {cfg.next && (
            <button onClick={handleEstado}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm text-white transition-colors ${cfg.next==='en_curso'?'bg-green-500 hover:bg-green-600':cfg.next==='finalizada'?'bg-gray-500 hover:bg-gray-600':'bg-blue-500 hover:bg-blue-600'}`}>
              {cfg.next==='en_curso' && <PlayCircle size={16}/>}
              {cfg.next==='finalizada' && <Square size={16}/>}
              {cfg.next==='proxima' && <CheckCircle size={16}/>}
              {cfg.nextLabel}
            </button>
          )}
        </div>

        {/* Banner pregunta activa */}
        {enCurso && hayActiva && (() => {
          const pActiva = sesion.preguntas.find((p) => p.id === activaId);
          return pActiva ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"/>
                </span>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Pregunta activa ahora</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-3">{pActiva.texto}</p>
              <button onClick={handleCerrar}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                <Lock size={14}/> Cerrar pregunta
              </button>
            </div>
          ) : null;
        })()}

        {/* Preguntas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Preguntas ({sesion.preguntas.length})
            </h2>
            <div className="flex gap-2">
              {enCurso && (
                <button onClick={() => { setMostrarVivo(!mostrarVivo); setMostrarForm(false); }}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                  <Zap size={13}/> En vivo
                </button>
              )}
              {sesion.estado !== 'finalizada' && (
                <button onClick={() => { setMostrarForm(!mostrarForm); setMostrarVivo(false); }}
                  className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                  <Plus size={13}/> Agregar
                </button>
              )}
            </div>
          </div>

          {mostrarVivo  && <div className="mb-3"><FormPregunta enVivo onGuardar={handleGuardar} onCancelar={() => setMostrarVivo(false)}/></div>}
          {mostrarForm  && <div className="mb-3"><FormPregunta onGuardar={handleGuardar} onCancelar={() => setMostrarForm(false)}/></div>}

          {sesion.preguntas.length === 0 && !mostrarForm && !mostrarVivo && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No hay preguntas configuradas</p>
              {sesion.estado !== 'finalizada' && (
                <button onClick={() => setMostrarForm(true)} className="text-brand text-sm font-bold hover:underline">+ Agregar primera pregunta</button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {sesion.preguntas.map((p, idx) => {
              const est   = ESTADO_PREGUNTA[p.estado] || ESTADO_PREGUNTA.pendiente;
              const esActiva = p.id === activaId;
              return (
                <div key={p.id} className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all ${esActiva ? 'border-green-500' : p.estado === 'cerrada' ? 'border-gray-200 opacity-70' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">#{idx+1}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${est.bg} ${est.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${est.dot} ${esActiva ? 'animate-pulse' : ''}`}/>
                        {est.label}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo==='sino' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.tipo==='sino' ? '👍 Sí/No' : '👤 Candidatos'}
                      </span>
                      {p.enVivo && <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5"><Zap size={10}/>En vivo</span>}
                    </div>
                    {sesion.estado !== 'finalizada' && p.estado !== 'activa' && (
                      <button onClick={() => handleEliminar(p.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"><Trash2 size={15}/></button>
                    )}
                  </div>

                  <p className="text-sm text-gray-900 leading-snug mb-2">{p.texto}</p>

                  {p.tipo === 'candidatos' && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.opciones?.map((o,i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{o}</span>)}
                    </div>
                  )}

                  {/* Acciones de publicación — solo en_curso */}
                  {enCurso && (
                    <div className="mt-2">
                      {p.estado === 'pendiente' && (
                        <button
                          onClick={() => handlePublicar(p.id)}
                          disabled={hayActiva}
                          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                        >
                          <Radio size={14}/>
                          {hayActiva ? 'Cierra la pregunta activa primero' : 'Publicar esta pregunta'}
                        </button>
                      )}
                      {p.estado === 'activa' && (
                        <button onClick={handleCerrar}
                          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                          <Lock size={14}/> Cerrar votación
                        </button>
                      )}
                      {p.estado === 'cerrada' && (
                        <div className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
                          <CheckCircle size={13}/> Votación cerrada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
