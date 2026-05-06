'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus, Trash2, PlayCircle, Square, CheckCircle, Zap, Radio, Lock, Loader2, BarChart2, Users, AlertTriangle } from 'lucide-react';
const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

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

function FormPregunta({ onGuardar, onCancelar, preguntasBase = [], enVivo = false }) {
  const [tipo, setTipo]        = useState('sino');
  const [texto, setTexto]      = useState('');
  const [opciones, setOpciones]= useState(['', '']);
  const [baseId, setBaseId]    = useState('');
  const [err, setErr]          = useState('');

  const selBase = (id) => {
    const pb = preguntasBase.find((p) => p.id === id);
    if (pb) { setTexto(pb.texto); setTipo(pb.tipo); }
    setBaseId(id);
  };

  const guardar = () => {
    if (!texto.trim()) { setErr('Escribe el texto de la pregunta'); return; }
    if (tipo === 'candidatos' && opciones.some((o) => !o.trim())) { setErr('Completa todos los candidatos'); return; }
    onGuardar({ tipo, texto: texto.trim(), opciones: tipo === 'candidatos' ? opciones.map((o) => o.trim()) : [], enVivo, pregunta_base_id: baseId || null });
  };

  return (
    <div className={`border-2 rounded-2xl p-4 flex flex-col gap-3 ${enVivo ? 'border-orange-400 bg-orange-50' : 'border-brand bg-brand-50'}`}>
      {enVivo && (
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Pregunta en vivo</span>
        </div>
      )}

      {/* Seleccionar desde base */}
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
              <input value={op} onChange={(e) => { const o=[...opciones]; o[i]=e.target.value; setOpciones(o); setErr(''); }}
                placeholder={`Candidato ${i+1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              {opciones.length > 2 && (
                <button onClick={() => setOpciones(opciones.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setOpciones([...opciones,''])} className="text-xs text-brand font-bold hover:underline self-start">
            + Agregar candidato
          </button>
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
  const [tab, setTab]                     = useState('preguntas'); // 'preguntas' | 'resultados'
  const [mostrarForm, setMostrarForm]     = useState(false);
  const [mostrarVivo, setMostrarVivo]     = useState(false);
  const [cargando, setCargando]           = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}`);
    if (!res.ok) return;
    const json = await res.json();
    if (!json.ok) return;
    setSesion(json.sesion);
    setPreguntas(json.preguntas);
    setPreguntasBase(json.preguntasBase);
    setStats(json.stats);
    setResultados(json.resultados || []);
  }, [sesionId]);

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored || JSON.parse(stored).rol !== 'admin') { router.replace('/'); return; }
    cargar();

    // Polling cada 2 segundos para ver inscripciones, asistentes y estado de preguntas
    const interval = setInterval(cargar, 2000);
    return () => clearInterval(interval);
  }, [sesionId, router, cargar]);

  if (!sesion) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={30} className="text-brand animate-spin" />
    </main>
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

  const handleGuardar = async ({ tipo, texto, opciones, enVivo, pregunta_base_id }) => {
    setCargando(true);
    await fetch(`/api/admin/sesion/${encodeURIComponent(sesionId)}/preguntas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, texto, opciones, enVivo, pregunta_base_id }),
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-white flex-shrink-0"><ArrowLeft size={22} /></button>
          <Image src={LOGO} alt="Nuevo Liberalismo" width={120} height={40} className="object-contain" priority />
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* Info + estado */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-base leading-snug">{sesion.nombre}</h1>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{sesion.id}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
            <span>📅 {sesion.fecha} · {sesion.hora}</span>
            <span>📍 {sesion.lugar}</span>
            <span>🏷️ {sesion.tipos_asamblea?.nombre} · {sesion.colectivos?.nombre}</span>
            <span>🔑 <span className="font-mono font-bold text-gray-800">{sesion.codigo_asistencia}</span></span>
          </div>

          {stats && (
            <div className="flex flex-col gap-3 mb-4">
              {/* Contadores */}
              <div className="flex gap-4 text-xs text-gray-500">
                <span><Users size={11} className="inline mr-1" /><strong>{stats.inscritos}</strong> inscritos</span>
                <span>✅ <strong>{stats.asistentes}</strong> asistentes</span>
                <span className="text-gray-400">Quorum: <strong>{quorumRequerido}</strong></span>
              </div>

              {/* Barra de progreso */}
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
                  {/* Marcador de quorum */}
                  {stats.inscritos > 0 && (
                    <div
                      className="absolute top-0 h-2.5 w-0.5 bg-brand"
                      style={{ left: `${Math.min(100, Math.round((quorumRequerido / stats.inscritos) * 100))}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Indicador quorum */}
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
            </div>
          )}

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
            <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl text-sm">
              <CheckCircle size={14}/> Sesión finalizada
            </div>
          )}
        </div>

        {/* Pregunta activa ahora */}
        {enCurso && hayActiva && (() => {
          const pa = preguntas.find((p) => p.id === activaId);
          return pa ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Pregunta activa ahora</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-3">{pa.texto}</p>
              <button onClick={handleCerrar} disabled={cargando}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                <Lock size={14}/> Cerrar pregunta
              </button>
            </div>
          ) : null;
        })()}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'preguntas',  label: 'Preguntas',  Icon: Radio     },
            { key: 'resultados', label: 'Resultados', Icon: BarChart2 },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <Icon size={13}/>{label}
              {key === 'resultados' && resultados.length > 0 && (
                <span className="ml-1 bg-brand text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                  {resultados.filter((r) => r.total_votos > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Resultados */}
        {tab === 'resultados' && (
          <div className="flex flex-col gap-4">
            {resultados.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No hay preguntas en esta sesión todavía</p>
            )}
            {resultados.map((preg) => {
              const total = Number(preg.total_votos) || 0;
              const maxVotos = preg.opciones?.length
                ? Math.max(...preg.opciones.map((o) => Number(o.total)))
                : 0;
              return (
                <div key={preg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{preg.texto}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      preg.estado === 'activa'  ? 'bg-green-100 text-green-700' :
                      preg.estado === 'cerrada' ? 'bg-slate-100 text-slate-600' :
                                                  'bg-gray-100 text-gray-400'
                    }`}>{preg.estado}</span>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    {total} {total === 1 ? 'voto' : 'votos'}
                    {stats?.asistentes > 0 && (
                      <span className="ml-1 text-gray-300">
                        · {Math.round((total / stats.asistentes) * 100)}% participación
                      </span>
                    )}
                  </p>

                  {total === 0 ? (
                    <p className="text-xs text-gray-300 italic">Sin votos aún</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(preg.opciones || []).map((op) => {
                        const pct = maxVotos > 0 ? Math.round((Number(op.total) / maxVotos) * 100) : 0;
                        const pctTotal = total > 0 ? Math.round((Number(op.total) / total) * 100) : 0;
                        const esSI  = op.respuesta === 'SI';
                        const esNO  = op.respuesta === 'NO';
                        const barColor = esSI ? 'bg-green-500' : esNO ? 'bg-red-400' : 'bg-brand';
                        return (
                          <div key={op.respuesta}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-700">{op.respuesta}</span>
                              <span className="text-xs text-gray-500">{op.total} ({pctTotal}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }} />
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
        {tab === 'preguntas' && <div>
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
                        <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.nombre}</span>
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
        </div>}

      </div>
    </main>
  );
}
