'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, ThumbsUp, ThumbsDown, User, CheckCircle, Clock } from 'lucide-react';
import { getSesion, EVENTO_UPDATE } from '../../lib/storage';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

// paso: 'codigo' | 'esperando' | 'votando' | 'confirmado' | 'resumen'
export default function SesionPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const sesionId = decodeURIComponent(id);

  const [sesion, setSesion]         = useState(null);
  const [usuario, setUsuario]       = useState(null);
  const [paso, setPaso]             = useState('codigo');
  const [codigo, setCodigo]         = useState('');
  const [errCodigo, setErrCodigo]   = useState('');
  const [respuestas, setRespuestas] = useState({});   // { preguntaId: respuesta }
  const [seleccion, setSeleccion]   = useState(null);
  const [ultimaVotada, setUltima]   = useState(null); // pregunta recién votada (para pantalla confirmado)

  const cargar = () => {
    const s = getSesion(sesionId);
    if (!s) return;
    setSesion({ ...s });
  };

  // Cuando la sesión cambia, reaccionar al estado y a la pregunta activa
  useEffect(() => {
    if (!sesion || paso === 'codigo') return;

    // Si la sesión finalizó → resumen
    if (sesion.estado === 'finalizada') { setPaso('resumen'); return; }

    const activaId = sesion.preguntaActivaId;

    if (activaId === null || activaId === undefined) {
      // No hay pregunta activa → sala de espera
      if (paso !== 'esperando') setPaso('esperando');
      return;
    }

    // Hay pregunta activa
    const yaVotada = activaId in respuestas;
    if (yaVotada) {
      // Ya voté esta → sala de espera
      if (paso !== 'esperando') setPaso('esperando');
    } else {
      // No he votado → mostrar pregunta
      setSeleccion(null);
      setPaso('votando');
    }
  }, [sesion]);

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

  const preguntas  = sesion.preguntas || [];
  const activaId   = sesion.preguntaActivaId;
  const preguntaActiva = preguntas.find((p) => p.id === activaId) || null;
  const respondidas = preguntas.filter((p) => p.id in respuestas).length;

  const handleVerificarCodigo = () => {
    if (!codigo.trim()) { setErrCodigo('Ingresa el código de asistencia'); return; }
    if (codigo.trim().toUpperCase() !== sesion.codigoAsistencia.toUpperCase()) {
      setErrCodigo('Código incorrecto. Solicítalo al moderador.'); return;
    }
    setErrCodigo('');
    setPaso(activaId ? 'votando' : 'esperando');
  };

  const handleConfirmarVoto = () => {
    if (!seleccion || !preguntaActiva) return;
    const nuevas = { ...respuestas, [preguntaActiva.id]: seleccion };
    setRespuestas(nuevas);
    setUltima({ pregunta: preguntaActiva, respuesta: seleccion });
    setSeleccion(null);
    setPaso('confirmado');
    // Vuelve a sala de espera tras 2 segundos
    setTimeout(() => setPaso('esperando'), 2000);
  };

  const Header = () => (
    <header className="w-full bg-brand shadow-md">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-white flex-shrink-0">
          <ArrowLeft size={22}/>
        </button>
        <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority/>
      </div>
    </header>
  );

  // ══ CÓDIGO DE ASISTENCIA ════════════════════════════════════════════════════
  if (paso === 'codigo') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><ShieldCheck size={36} className="text-brand"/></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código de asistencia</h2>
          <p className="text-sm font-medium text-gray-700 mb-1 text-center">{sesion.nombre}</p>
          <p className="text-xs text-gray-400 mb-6 text-center">Ingresa el código que el moderador compartió para registrar tu asistencia</p>

          <div className="flex flex-col gap-1 mb-5">
            <label className="text-sm font-semibold text-gray-700">Código de sesión</label>
            <input type="text" value={codigo} onChange={(e) => { setCodigo(e.target.value); setErrCodigo(''); }}
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
      <Footer/>
    </main>
  );

  // ══ SALA DE ESPERA ══════════════════════════════════════════════════════════
  if (paso === 'esperando') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">

          {/* Animación de espera */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
                <Clock size={36} className="text-brand"/>
              </div>
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-40"/>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-brand"/>
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Esperando la siguiente pregunta</h2>
          <p className="text-sm text-gray-500 mb-6">El moderador publicará la próxima pregunta en breve. Esta pantalla se actualiza automáticamente.</p>

          {/* Contador de votos realizados */}
          {respondidas > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 inline-block">
              <p className="text-2xl font-bold text-brand">{respondidas}</p>
              <p className="text-xs text-gray-500">{respondidas === 1 ? 'pregunta respondida' : 'preguntas respondidas'}</p>
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ VOTANDO ═════════════════════════════════════════════════════════════════
  if (paso === 'votando' && preguntaActiva) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Indicador */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"/>
            </span>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Pregunta activa — vota ahora</span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
            <p className="text-base font-bold text-gray-900 leading-snug mb-6">{preguntaActiva.texto}</p>

            {/* SÍ / NO */}
            {preguntaActiva.tipo === 'sino' && (
              <div className="grid grid-cols-2 gap-3">
                {['SI','NO'].map((opt) => (
                  <button key={opt} onClick={() => setSeleccion(opt)}
                    className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 font-bold text-lg transition-all ${
                      seleccion === opt
                        ? opt === 'SI' ? 'border-green-500 bg-green-50 text-green-700 scale-[1.03] shadow-md'
                                       : 'border-red-400 bg-red-50 text-red-600 scale-[1.03] shadow-md'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {opt === 'SI' ? <ThumbsUp size={30}/> : <ThumbsDown size={30}/>}
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* CANDIDATOS */}
            {preguntaActiva.tipo === 'candidatos' && (
              <div className="flex flex-col gap-3">
                {preguntaActiva.opciones?.map((opcion, i) => (
                  <button key={i} onClick={() => setSeleccion(opcion)}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                      seleccion === opcion ? 'border-brand bg-brand-50 scale-[1.01] shadow-sm' : 'border-gray-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${seleccion === opcion ? 'border-brand bg-brand' : 'border-gray-300'}`}>
                      {seleccion === opcion && <div className="w-2 h-2 rounded-full bg-white"/>}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={15} className={seleccion === opcion ? 'text-brand' : 'text-gray-400'}/>
                      <span className={`text-sm font-semibold ${seleccion === opcion ? 'text-brand' : 'text-gray-700'}`}>{opcion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleConfirmarVoto} disabled={seleccion === null}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors text-base">
            Confirmar voto
          </button>
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ CONFIRMACIÓN (flash 2 segundos) ════════════════════════════════════════
  if (paso === 'confirmado') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-5 animate-bounce">
              <CheckCircle size={48} className="text-green-600"/>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Voto registrado!</h2>
          <p className="text-sm text-gray-500 mb-4">Tu respuesta fue guardada correctamente.</p>
          {ultimaVotada && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              ultimaVotada.respuesta === 'SI' ? 'bg-green-100 text-green-700' :
              ultimaVotada.respuesta === 'NO' ? 'bg-red-100 text-red-600' :
              'bg-brand-50 text-brand'
            }`}>
              {ultimaVotada.respuesta === 'SI' && <ThumbsUp size={14}/>}
              {ultimaVotada.respuesta === 'NO' && <ThumbsDown size={14}/>}
              {ultimaVotada.respuesta !== 'SI' && ultimaVotada.respuesta !== 'NO' && <User size={14}/>}
              {ultimaVotada.respuesta}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ RESUMEN FINAL ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority/>
      </header>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-4"><CheckCircle size={64} className="text-brand"/></div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Sesión finalizada</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Gracias por participar. Tus votos han sido registrados.</p>

          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen de tu voto</h3>
            {preguntas.filter((p) => p.id in respuestas).map((p) => (
              <div key={p.id} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <p className="text-xs text-gray-500 mb-1 leading-snug">{p.texto}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  respuestas[p.id]==='SI' ? 'bg-green-100 text-green-700' :
                  respuestas[p.id]==='NO' ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand'
                }`}>
                  {respuestas[p.id]==='SI' && <ThumbsUp size={12}/>}
                  {respuestas[p.id]==='NO' && <ThumbsDown size={12}/>}
                  {respuestas[p.id]!=='SI' && respuestas[p.id]!=='NO' && <User size={12}/>}
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
      <Footer/>
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
