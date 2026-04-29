'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, CheckCircle, ThumbsUp, ThumbsDown, User, Zap } from 'lucide-react';
import { getSesion, EVENTO_UPDATE } from '../../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function SesionPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const sesionId = decodeURIComponent(id);

  const [sesion, setSesion]           = useState(null);
  const [usuario, setUsuario]         = useState(null);
  const [paso, setPaso]               = useState('codigo');
  const [codigo, setCodigo]           = useState('');
  const [errCodigo, setErrCodigo]     = useState('');
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [respuestas, setRespuestas]   = useState({});
  const [seleccion, setSeleccion]     = useState(null);
  const [nuevasAlert, setNuevasAlert] = useState(false);

  const cargar = () => {
    const s = getSesion(sesionId);
    if (s) setSesion((prev) => {
      if (prev && paso === 'resumen' && s.preguntas.length > prev.preguntas.length) {
        setNuevasAlert(true);
      }
      return { ...s };
    });
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    setUsuario(JSON.parse(stored));
    const s = getSesion(sesionId);
    if (!s) { router.replace('/dashboard'); return; }
    setSesion(s);
    window.addEventListener(EVENTO_UPDATE, cargar);
    window.addEventListener('storage', cargar);
    return () => {
      window.removeEventListener(EVENTO_UPDATE, cargar);
      window.removeEventListener('storage', cargar);
    };
  }, [sesionId, router]);

  if (!usuario || !sesion) return null;

  const preguntas     = sesion.preguntas || [];
  const totalPreguntas = preguntas.length;
  const pregunta      = preguntas[preguntaIdx];
  const progreso      = totalPreguntas ? Math.round((preguntaIdx / totalPreguntas) * 100) : 0;
  const preguntasPendientes = preguntas.filter((p) => !(p.id in respuestas));

  const handleVerificarCodigo = () => {
    if (!codigo.trim()) { setErrCodigo('Ingresa el código de asistencia'); return; }
    if (codigo.trim().toUpperCase() !== sesion.codigoAsistencia.toUpperCase()) {
      setErrCodigo('Código incorrecto. Solicítalo al moderador de la sesión.');
      return;
    }
    setErrCodigo('');
    if (totalPreguntas === 0) { setPaso('resumen'); return; }
    setPaso('votando');
  };

  const handleConfirmarVoto = () => {
    if (seleccion === null) return;
    const nuevasResp = { ...respuestas, [pregunta.id]: seleccion };
    setRespuestas(nuevasResp);
    setSeleccion(null);

    // Buscar siguiente pregunta no respondida
    const siguiente = preguntas.findIndex((p, i) => i > preguntaIdx && !(p.id in nuevasResp));
    if (siguiente !== -1) {
      setPreguntaIdx(siguiente);
    } else {
      // Verificar si todas las preguntas han sido respondidas
      const sinResponder = preguntas.filter((p) => !(p.id in nuevasResp));
      if (sinResponder.length === 0) {
        setPaso('resumen');
      } else {
        // Hay preguntas no respondidas (añadidas en vivo antes de llegar aquí)
        const primeraSinResponder = preguntas.findIndex((p) => !(p.id in nuevasResp));
        setPreguntaIdx(primeraSinResponder);
      }
    }
  };

  const handleContinuarVotando = () => {
    setNuevasAlert(false);
    const primera = preguntas.findIndex((p) => !(p.id in respuestas));
    if (primera !== -1) {
      setPreguntaIdx(primera);
      setPaso('votando');
    }
  };

  const Header = () => (
    <header className="w-full bg-brand shadow-md">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-white flex-shrink-0">
          <ArrowLeft size={22} />
        </button>
        <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority />
      </div>
    </header>
  );

  // ══ PASO 1 — Código de asistencia ══════════════════════════════════════════
  if (paso === 'codigo') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4">
              <ShieldCheck size={36} className="text-brand" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código de asistencia</h2>
          <p className="text-sm font-medium text-gray-700 mb-1 text-center">{sesion.nombre}</p>
          <p className="text-xs text-gray-400 mb-6 text-center">
            Ingresa el código que el moderador compartió para registrar tu asistencia
          </p>
          <div className="flex flex-col gap-1 mb-5">
            <label className="text-sm font-semibold text-gray-700">Código de sesión</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErrCodigo(''); }}
              placeholder="Ej: TGANTE"
              className={`w-full border ${errCodigo ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-lg font-bold uppercase tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarCodigo()}
            />
            {errCodigo && <span className="text-xs text-red-500 text-center">{errCodigo}</span>}
          </div>
          <button onClick={handleVerificarCodigo} className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors">
            Registrar asistencia
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ══ PASO 2 — Votación ═══════════════════════════════════════════════════════
  if (paso === 'votando' && pregunta) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="w-full bg-gray-200 h-1.5">
        <div className="bg-brand h-1.5 transition-all duration-500" style={{ width: `${progreso}%` }} />
      </div>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Pregunta {preguntaIdx + 1} de {totalPreguntas}
            </span>
            <div className="flex items-center gap-1.5">
              {pregunta.enVivo && <span className="flex items-center gap-1 text-xs font-bold text-orange-500"><Zap size={11} />En vivo</span>}
              <span className="text-xs font-bold text-brand">{progreso}%</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
            <p className="text-base font-bold text-gray-900 leading-snug mb-6">{pregunta.texto}</p>

            {pregunta.tipo === 'sino' && (
              <div className="grid grid-cols-2 gap-3">
                {['SI', 'NO'].map((opt) => (
                  <button key={opt} onClick={() => setSeleccion(opt)}
                    className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 font-bold text-lg transition-all ${
                      seleccion === opt
                        ? opt === 'SI' ? 'border-green-500 bg-green-50 text-green-700 scale-[1.02]' : 'border-red-400 bg-red-50 text-red-600 scale-[1.02]'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {opt === 'SI' ? <ThumbsUp size={28} /> : <ThumbsDown size={28} />}
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {pregunta.tipo === 'candidatos' && (
              <div className="flex flex-col gap-3">
                {pregunta.opciones?.map((opcion, i) => (
                  <button key={i} onClick={() => setSeleccion(opcion)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      seleccion === opcion ? 'border-brand bg-brand-50 scale-[1.01]' : 'border-gray-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${seleccion === opcion ? 'border-brand bg-brand' : 'border-gray-300'}`}>
                      {seleccion === opcion && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={15} className={seleccion === opcion ? 'text-brand' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${seleccion === opcion ? 'text-brand' : 'text-gray-700'}`}>{opcion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleConfirmarVoto} disabled={seleccion === null}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {preguntaIdx + 1 < totalPreguntas ? 'Confirmar y siguiente' : 'Confirmar y finalizar'}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ══ PASO 3 — Resumen ════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
      </header>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Alerta de nuevas preguntas en vivo */}
          {nuevasAlert && preguntasPendientes.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4 mb-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-orange-500" />
                <p className="text-sm font-bold text-orange-700">¡Nuevas preguntas disponibles!</p>
              </div>
              <p className="text-xs text-orange-600">El moderador agregó {preguntasPendientes.length} pregunta(s) nueva(s) en vivo.</p>
              <button onClick={handleContinuarVotando} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 rounded-lg transition-colors">
                Continuar votando
              </button>
            </div>
          )}

          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-brand" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">¡Votación completada!</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Tus votos han sido registrados. Gracias por participar.</p>

          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen de tu voto</h3>
            {preguntas.filter((p) => p.id in respuestas).map((p) => (
              <div key={p.id} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <p className="text-xs text-gray-500 mb-1 leading-snug">{p.texto}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  respuestas[p.id] === 'SI' ? 'bg-green-100 text-green-700' :
                  respuestas[p.id] === 'NO' ? 'bg-red-100 text-red-600'    :
                  'bg-brand-50 text-brand'
                }`}>
                  {respuestas[p.id] === 'SI' && <ThumbsUp size={12} />}
                  {respuestas[p.id] === 'NO' && <ThumbsDown size={12} />}
                  {respuestas[p.id] !== 'SI' && respuestas[p.id] !== 'NO' && <User size={12} />}
                  {respuestas[p.id]}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => router.push('/dashboard')} className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Volver al inicio
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
      © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
    </footer>
  );
}
