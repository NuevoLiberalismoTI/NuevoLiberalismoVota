'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, ThumbsUp, ThumbsDown, User, Users, CheckCircle, Clock, UserX, Loader2, Zap, Camera, X, AlertTriangle, Timer } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function SesionPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const sesionId = decodeURIComponent(id);

  const [usuario, setUsuario]       = useState(null);
  const [estado, setEstado]         = useState(null);   // get_estado_sesion_usuario result
  const [paso, setPaso]             = useState('cargando'); // cargando|no_inscrito|codigo|esperando|votando|confirmado|resumen
  const [codigo, setCodigo]         = useState('');
  const [errCodigo, setErrCodigo]   = useState('');
  const [seleccion, setSeleccion]   = useState(null);
  const [ultimoVoto, setUltimoVoto] = useState(null);
  const [cargando, setCargando]     = useState(false);
  const [camAbierta, setCamAbierta] = useState(false);
  const [soportaCam, setSoportaCam] = useState(false);
  const [timerSeg, setTimerSeg]     = useState(null);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const scanRef   = useRef(null);
  const timerRef  = useRef(null);

  const cargarEstado = useCallback(async (cedula) => {
    const stored = sessionStorage.getItem('usuario');
    const token  = stored ? (JSON.parse(stored).tokenDispositivo ?? '') : '';
    const res = await fetch(
      `/api/sesion/${encodeURIComponent(sesionId)}/estado?cedula=${encodeURIComponent(cedula)}`,
      { headers: { 'x-device-token': token } },
    );
    if (res.status === 401) {
      const err = await res.json();
      if (err.error === 'dispositivo_invalido') {
        sessionStorage.removeItem('usuario');
        router.replace('/?kicked=1');
        return;
      }
    }
    const data = await res.json();
    if (!data?.ok) { router.replace('/dashboard'); return; }
    setEstado(data);

    if (data.asamblea_estado === 'finalizada') { setPaso('resumen'); return; }
    if (!data.inscrito) { setPaso('no_inscrito'); return; }
    if (!data.asistio)  { setPaso('codigo');      return; }

    const pa = data.pregunta_activa;
    if (pa && !pa.ya_vote) { setPaso('votando'); }
    else                   { setPaso('esperando'); }
  }, [sesionId, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    const u = JSON.parse(stored);
    setUsuario(u);
    cargarEstado(u.cedula);

    // Polling cada 10 segundos para detectar pregunta activa, cambios de estado, etc.
    const interval = setInterval(() => cargarEstado(u.cedula), 10000);
    return () => clearInterval(interval);
  }, [sesionId, router, cargarEstado]);

  useEffect(() => {
    setSoportaCam(typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCamAbierta(true);
    } catch { alert('No se pudo acceder a la cámara'); }
  };

  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (scanRef.current) cancelAnimationFrame(scanRef.current);
    scanRef.current = null;
    setCamAbierta(false);
  };

  useEffect(() => {
    if (!camAbierta || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play();

    const hasBarcodeDetector = 'BarcodeDetector' in window;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const handleQR = (raw) => {
      let c = raw;
      try { c = new URL(raw).searchParams.get('c') || raw; } catch {}
      cerrarCamara();
      setCodigo(c.toUpperCase().trim());
    };

    if (hasBarcodeDetector) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) { handleQR(codes[0].rawValue); return; }
        } catch {}
        scanRef.current = requestAnimationFrame(scan);
      };
      scanRef.current = requestAnimationFrame(scan);
    } else {
      // Fallback para Safari iOS: jsQR via canvas
      import('jsqr').then(({ default: jsQR }) => {
        const scan = () => {
          if (!video.videoWidth) { scanRef.current = requestAnimationFrame(scan); return; }
          canvas.width  = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) { handleQR(code.data); return; }
          scanRef.current = requestAnimationFrame(scan);
        };
        scanRef.current = requestAnimationFrame(scan);
      });
    }

    return () => { if (scanRef.current) cancelAnimationFrame(scanRef.current); };
  }, [camAbierta]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rem = estado?.pregunta_activa?.segundos_restantes;
    if (rem != null && rem > 0) {
      setTimerSeg(rem);
      timerRef.current = setInterval(() => {
        setTimerSeg((prev) => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
      }, 1000);
    } else { setTimerSeg(null); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [estado?.pregunta_activa?.id, estado?.pregunta_activa?.segundos_restantes]);

  // Cuando cambia el estado, reaccionar a la pregunta activa
  useEffect(() => {
    if (!estado || !usuario) return;
    if (paso === 'cargando' || paso === 'no_inscrito' || paso === 'codigo') return;

    if (estado.asamblea_estado === 'finalizada') { setPaso('resumen'); return; }

    const pa = estado.pregunta_activa;
    if (pa && !pa.ya_vote) {
      setSeleccion(null);
      if (paso !== 'votando') setPaso('votando');
    } else if (paso === 'votando') {
      setPaso('esperando');
    }
  }, [estado]);

  const handleVerificarCodigo = async () => {
    if (!codigo.trim()) { setErrCodigo('Ingresa el código de asistencia'); return; }
    setCargando(true); setErrCodigo('');
    const res = await fetch('/api/asistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sesionId,
        cedula: usuario.cedula,
        codigo: codigo.trim(),
        ts:     Math.floor(Date.now() / 30000),
      }),
    });
    const data = await res.json();
    if (!data?.ok) {
      if (data?.error === 'no_inscrito') setPaso('no_inscrito');
      else setErrCodigo(data?.error || 'Código incorrecto');
    } else {
      await cargarEstado(usuario.cedula);
    }
    setCargando(false);
  };

  const handleConfirmarVoto = async () => {
    if (!seleccion || !estado?.pregunta_activa) return;
    setCargando(true);
    const { data } = await supabase.rpc('registrar_voto', {
      p_pregunta_id:  estado.pregunta_activa.id,
      p_cedula:       usuario.cedula,
      p_respuesta:    seleccion.respuesta,
      p_candidato_id: seleccion.candidato_id || null,
    });
    if (!data?.ok) { alert(data?.error || 'Error al registrar voto'); setCargando(false); return; }
    setUltimoVoto({ pregunta: estado.pregunta_activa.texto, respuesta: seleccion.respuesta });
    setSeleccion(null);
    setPaso('confirmado');
    setTimeout(() => {
      cargarEstado(usuario.cedula);
      setPaso('esperando');
    }, 2000);
    setCargando(false);
  };

  if (!usuario || paso === 'cargando') return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={36} className="text-brand animate-spin" />
    </main>
  );

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

  // ── No inscrito ─────────────────────────────────────────────────────────────
  if (paso === 'no_inscrito') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7 text-center">
          <UserX size={48} className="text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No estás inscrito</h2>
          <p className="text-sm text-gray-500 mb-6">
            Debes inscribirte a esta asamblea desde el panel principal para poder ingresar.
          </p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Volver e inscribirme
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── Código de asistencia ────────────────────────────────────────────────────
  if (paso === 'codigo') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><ShieldCheck size={36} className="text-brand" /></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código de asistencia</h2>
          <p className="text-sm font-medium text-gray-700 mb-1 text-center">{estado?.asamblea_nombre}</p>
          <p className="text-xs text-gray-400 mb-6 text-center">
            Ingresa el código que el moderador compartió para registrar tu asistencia
          </p>
          <div className="flex flex-col gap-1 mb-5">
            <label className="text-sm font-semibold text-gray-700">Código de sesión</label>
            <input type="text" value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErrCodigo(''); }}
              placeholder="Ej: TGANTE"
              className={`w-full border ${errCodigo ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-lg font-bold uppercase tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarCodigo()}
            />
            {errCodigo && <span className="text-xs text-red-500 text-center">{errCodigo}</span>}
          </div>
          <button onClick={handleVerificarCodigo} disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {cargando ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {cargando ? 'Verificando...' : 'Registrar asistencia'}
          </button>
          {soportaCam && (
            <button onClick={abrirCamara} type="button"
              className="w-full mt-2 flex items-center justify-center gap-2 border-2 border-brand text-brand font-bold py-3 rounded-xl hover:bg-brand-50 transition-colors">
              <Camera size={18}/> Escanear QR
            </button>
          )}
        </div>
      </div>
      {camAbierta && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4">
          <button onClick={cerrarCamara} className="absolute top-5 right-5 text-white/70 hover:text-white"><X size={28}/></button>
          <p className="text-white text-sm font-bold uppercase tracking-widest">Apunta al código QR</p>
          <div className="w-72 h-72 relative rounded-2xl overflow-hidden border-4 border-white/30">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          </div>
          <p className="text-white/40 text-xs">El código se leerá automáticamente</p>
        </div>
      )}
      <Footer />
    </main>
  );

  // ── Sala de espera ───────────────────────────────────────────────────────────
  if (paso === 'esperando') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
                <Clock size={36} className="text-brand" />
              </div>
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-40" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-brand" />
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Esperando la siguiente pregunta</h2>
          <p className="text-sm text-gray-500 mb-6">
            El moderador publicará la próxima pregunta en breve. Esta pantalla se actualiza automáticamente.
          </p>
          {estado?.votos?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 inline-block mb-4">
              <p className="text-2xl font-bold text-brand">{estado.votos.length}</p>
              <p className="text-xs text-gray-500">{estado.votos.length === 1 ? 'pregunta respondida' : 'preguntas respondidas'}</p>
            </div>
          )}
          {estado?.preguntas_perdidas?.length > 0 && (
            <div className="w-full max-w-sm bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left mt-2">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13}/> No participaste en estas votaciones
              </p>
              {estado.preguntas_perdidas.map((txt, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                  <p className="text-xs text-orange-600">{txt}</p>
                </div>
              ))}
              <p className="text-[10px] text-orange-400 mt-2">El tiempo de estas votaciones se agotó</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── Votando ──────────────────────────────────────────────────────────────────
  if (paso === 'votando' && estado?.pregunta_activa) {
    const pa = estado.pregunta_activa;
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">
                {pa.en_vivo ? <><Zap size={11} className="inline mr-1" />Pregunta en vivo</> : 'Pregunta activa — vota ahora'}
              </span>
            </div>

            {timerSeg !== null && (
              <div className={`flex items-center justify-between mb-3 px-4 py-2.5 rounded-xl ${timerSeg <= 30 ? 'bg-red-100 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-1.5">
                  <Timer size={14} className={timerSeg <= 30 ? 'text-red-500' : 'text-green-600'}/>
                  <span className={`text-xs font-bold ${timerSeg <= 30 ? 'text-red-600' : 'text-green-700'}`}>Tiempo para votar</span>
                </div>
                <span className={`font-mono text-xl font-extrabold ${timerSeg <= 30 ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>
                  {Math.floor(timerSeg / 60).toString().padStart(2, '0')}:{(timerSeg % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
              <p className="text-base font-bold text-gray-900 leading-snug mb-6">{pa.texto}</p>

              {pa.tipo === 'sino' && (
                <div className="grid grid-cols-2 gap-3">
                  {['SI','NO'].map((opt) => (
                    <button key={opt} onClick={() => setSeleccion({ respuesta: opt, candidato_id: null })}
                      className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 font-bold text-lg transition-all ${
                        seleccion?.respuesta === opt
                          ? opt === 'SI' ? 'border-green-500 bg-green-50 text-green-700 scale-[1.03] shadow-md'
                                         : 'border-red-400 bg-red-50 text-red-600 scale-[1.03] shadow-md'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}>
                      {opt === 'SI' ? <ThumbsUp size={30} /> : <ThumbsDown size={30} />}
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {pa.tipo === 'candidatos' && (
                <div className="flex flex-col gap-3">
                  {pa.candidatos?.map((c) => {
                    const seleccionado = seleccion?.candidato_id === c.id;
                    return (
                      <button key={c.id} onClick={() => setSeleccion({ respuesta: c.nombre, candidato_id: c.id })}
                        className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                          seleccionado ? 'border-brand bg-brand-50 scale-[1.01] shadow-sm' : 'border-gray-200 bg-white hover:border-brand-200'
                        }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${seleccionado ? 'border-brand bg-brand' : 'border-gray-300'}`}>
                          {seleccionado && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {c.es_plancha
                              ? <Users size={15} className={seleccionado ? 'text-brand' : 'text-gray-400'} />
                              : <User  size={15} className={seleccionado ? 'text-brand' : 'text-gray-400'} />
                            }
                            <span className={`text-sm font-semibold ${seleccionado ? 'text-brand' : 'text-gray-700'}`}>{c.nombre}</span>
                            {c.es_plancha && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${seleccionado ? 'bg-brand text-white' : 'bg-blue-100 text-blue-600'}`}>
                                Plancha
                              </span>
                            )}
                          </div>
                          {c.es_plancha && c.miembros?.length > 0 && (
                            <div className="mt-2 flex flex-col gap-1 pl-1">
                              {c.miembros.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <span className={`w-1 h-1 rounded-full flex-shrink-0 ${seleccionado ? 'bg-brand' : 'bg-gray-400'}`} />
                                  {m.cargo
                                    ? <><span className="font-semibold text-gray-600">{m.cargo}:</span> {m.nombre}</>
                                    : m.nombre
                                  }
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={handleConfirmarVoto} disabled={!seleccion || cargando}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors">
              {cargando ? <Loader2 size={18} className="animate-spin" /> : null}
              {cargando ? 'Guardando...' : 'Confirmar voto'}
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Confirmación flash ──────────────────────────────────────────────────────
  if (paso === 'confirmado') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-5 animate-bounce">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Voto registrado!</h2>
          {ultimoVoto && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-2 ${
              ultimoVoto.respuesta === 'SI' ? 'bg-green-100 text-green-700' :
              ultimoVoto.respuesta === 'NO' ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand'
            }`}>
              {ultimoVoto.respuesta === 'SI' && <ThumbsUp size={14} />}
              {ultimoVoto.respuesta === 'NO' && <ThumbsDown size={14} />}
              {ultimoVoto.respuesta !== 'SI' && ultimoVoto.respuesta !== 'NO' && <User size={14} />}
              {ultimoVoto.respuesta}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── Resumen final ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
      </header>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-4"><CheckCircle size={64} className="text-brand" /></div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Sesión finalizada</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Gracias por participar. Tus votos han sido registrados.</p>

          {estado?.votos?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen de tu voto</h3>
              {estado.votos.map((v, i) => (
                <div key={i} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-xs text-gray-500 mb-1 leading-snug">{v.pregunta_texto}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    v.respuesta === 'SI' ? 'bg-green-100 text-green-700' :
                    v.respuesta === 'NO' ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand'
                  }`}>
                    {v.respuesta === 'SI' && <ThumbsUp size={12} />}
                    {v.respuesta === 'NO' && <ThumbsDown size={12} />}
                    {v.respuesta !== 'SI' && v.respuesta !== 'NO' && <User size={12} />}
                    {v.respuesta}
                  </div>
                </div>
              ))}
            </div>
          )}

          {estado?.preguntas_perdidas?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <AlertTriangle size={14}/> No participaste en
              </h3>
              <div className="flex flex-col gap-2">
                {estado.preguntas_perdidas.map((txt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-sm text-orange-800 leading-snug">{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
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
