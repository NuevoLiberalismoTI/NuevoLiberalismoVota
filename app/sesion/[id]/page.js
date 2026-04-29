'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, CheckCircle, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { SESIONES } from '../../lib/data';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

// paso: 'codigo' | 'votando' | 'resumen'
export default function SesionPage() {
  const router = useRouter();
  const { id } = useParams();
  const sesion = SESIONES.find((s) => s.id === id);

  const [usuario, setUsuario] = useState(null);
  const [paso, setPaso] = useState('codigo');
  const [codigo, setCodigo] = useState('');
  const [errCodigo, setErrCodigo] = useState('');
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [respuestas, setRespuestas] = useState({}); // { [preguntaId]: respuesta }
  const [seleccion, setSeleccion] = useState(null); // selección actual antes de confirmar

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    setUsuario(JSON.parse(stored));
    if (!sesion) { router.replace('/dashboard'); return; }
  }, [router, sesion]);

  if (!usuario || !sesion) return null;

  const pregunta = sesion.preguntas[preguntaIdx];
  const totalPreguntas = sesion.preguntas.length;
  const progreso = Math.round(((preguntaIdx) / totalPreguntas) * 100);

  // ── Verificar código ────────────────────────────────────────────────────────
  const handleVerificarCodigo = () => {
    if (!codigo.trim()) { setErrCodigo('Ingresa el código de asistencia'); return; }
    if (codigo.trim().toUpperCase() !== sesion.codigoAsistencia.toUpperCase()) {
      setErrCodigo('Código incorrecto. Solicítalo al moderador de la sesión.');
      return;
    }
    setErrCodigo('');
    setPaso('votando');
  };

  // ── Confirmar voto de la pregunta actual ────────────────────────────────────
  const handleConfirmarVoto = () => {
    if (seleccion === null) return;
    setRespuestas({ ...respuestas, [pregunta.id]: seleccion });
    setSeleccion(null);
    if (preguntaIdx + 1 < totalPreguntas) {
      setPreguntaIdx(preguntaIdx + 1);
    } else {
      setPaso('resumen');
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

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 1 — Código de asistencia
  // ══════════════════════════════════════════════════════════════════════════
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
          <p className="text-sm text-gray-500 mb-1 text-center font-medium">{sesion.nombre}</p>
          <p className="text-xs text-gray-400 mb-6 text-center">
            Ingresa el código que el moderador compartió para registrar tu asistencia
          </p>

          <div className="flex flex-col gap-1 mb-5">
            <label className="text-sm font-semibold text-gray-700">Código de sesión</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErrCodigo(''); }}
              placeholder="Ej: NL2025"
              className={`w-full border ${errCodigo ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-lg font-bold uppercase tracking-widest text-gray-900 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarCodigo()}
            />
            {errCodigo && <span className="text-xs text-red-500 text-center">{errCodigo}</span>}
          </div>

          <button
            onClick={handleVerificarCodigo}
            className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors"
          >
            Registrar asistencia
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 2 — Votación pregunta por pregunta
  // ══════════════════════════════════════════════════════════════════════════
  if (paso === 'votando') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 h-1.5">
        <div
          className="bg-brand h-1.5 transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Contador */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Pregunta {preguntaIdx + 1} de {totalPreguntas}
            </span>
            <span className="text-xs font-bold text-brand">{progreso}%</span>
          </div>

          {/* Tarjeta de pregunta */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
            <p className="text-base font-bold text-gray-900 leading-snug mb-6">
              {pregunta.texto}
            </p>

            {/* Tipo SÍ / NO */}
            {pregunta.tipo === 'sino' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSeleccion('SI')}
                  className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 font-bold text-lg transition-all ${
                    seleccion === 'SI'
                      ? 'border-green-500 bg-green-50 text-green-700 scale-[1.02]'
                      : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp size={28} />
                  SÍ
                </button>
                <button
                  onClick={() => setSeleccion('NO')}
                  className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 font-bold text-lg transition-all ${
                    seleccion === 'NO'
                      ? 'border-red-400 bg-red-50 text-red-600 scale-[1.02]'
                      : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  <ThumbsDown size={28} />
                  NO
                </button>
              </div>
            )}

            {/* Tipo CANDIDATOS */}
            {pregunta.tipo === 'candidatos' && (
              <div className="flex flex-col gap-3">
                {pregunta.opciones.map((opcion, i) => (
                  <button
                    key={i}
                    onClick={() => setSeleccion(opcion)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      seleccion === opcion
                        ? 'border-brand bg-brand-50 scale-[1.01]'
                        : 'border-gray-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      seleccion === opcion ? 'border-brand bg-brand' : 'border-gray-300'
                    }`}>
                      {seleccion === opcion && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={15} className={seleccion === opcion ? 'text-brand' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${seleccion === opcion ? 'text-brand' : 'text-gray-700'}`}>
                        {opcion}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón confirmar */}
          <button
            onClick={handleConfirmarVoto}
            disabled={seleccion === null}
            className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {preguntaIdx + 1 < totalPreguntas ? 'Confirmar y siguiente' : 'Confirmar y finalizar'}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 3 — Resumen / Éxito
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-brand" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">¡Votación completada!</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Tus votos han sido registrados exitosamente. Gracias por participar.
          </p>

          {/* Resumen de respuestas */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen de tu voto</h3>
            {sesion.preguntas.map((p) => (
              <div key={p.id} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <p className="text-xs text-gray-500 mb-1 leading-snug">{p.texto}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  respuestas[p.id] === 'SI'
                    ? 'bg-green-100 text-green-700'
                    : respuestas[p.id] === 'NO'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-brand-50 text-brand'
                }`}>
                  {respuestas[p.id] === 'SI' && <ThumbsUp size={12} />}
                  {respuestas[p.id] === 'NO' && <ThumbsDown size={12} />}
                  {respuestas[p.id] !== 'SI' && respuestas[p.id] !== 'NO' && <User size={12} />}
                  {respuestas[p.id]}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors"
          >
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
