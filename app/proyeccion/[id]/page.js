'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Users, MapPin, Calendar, ThumbsUp, ThumbsDown, Zap, CheckCircle, Lock, UserCheck, Vote } from 'lucide-react';
import Image from 'next/image';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function ProyeccionPage() {
  const { id } = useParams();
  const sesionId = decodeURIComponent(id);

  const [datos, setDatos]   = useState(null);
  const [error, setError]   = useState(null);
  const [qrTs,  setQrTs]   = useState(() => Math.floor(Date.now() / 30000));
  const [qrSeg, setQrSeg]  = useState(30);
  const [timer, setTimer]  = useState(null);
  const timerRef   = useRef(null);
  const prevPregId = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`/api/proyeccion/${encodeURIComponent(sesionId)}`);
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setDatos(json);
      const pa = json.preguntaActiva;
      if (pa?.id !== prevPregId.current) {
        prevPregId.current = pa?.id ?? null;
        setTimer(pa?.segundos_restantes ?? null);
      }
    } catch { setError('Error de conexión'); }
  }, [sesionId]);

  useEffect(() => { cargar(); const iv = setInterval(cargar, 5000); return () => clearInterval(iv); }, [cargar]);

  // QR rotation ticker
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      setQrSeg(Math.ceil(30 - (now / 1000) % 30));
      setQrTs(Math.floor(now / 30000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Question countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!timer) return;
    timerRef.current = setInterval(() => {
      setTimer((p) => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [datos?.preguntaActiva?.id]);

  if (error) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#0e0505' }}>
      <p className="text-xl" style={{ color: 'rgba(255,180,180,0.5)' }}>{error}</p>
    </div>
  );

  if (!datos) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#0e0505' }}>
      <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-spin" />
    </div>
  );

  const { sesion, quorum, preguntaActiva } = datos;
  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/asistir/${sesion.id}?c=${sesion.codigo_asistencia}&ts=${qrTs}`;

  const quorumPct       = quorum.acreditados_voto > 0
    ? Math.round((quorum.asistentes / quorum.acreditados_voto) * 100)
    : 0;
  const quorumAlcanzado = quorumPct >= 50;

  return (
    <div className="h-screen w-screen flex overflow-hidden select-none" style={{ background: '#0e0505' }}>

      {/* ── Panel izquierdo: QR + quórum ────────────────────── */}
      <div className="w-[38%] flex-shrink-0 bg-brand flex flex-col items-center justify-between py-8 px-6">
        {/* Logo */}
        <Image src={LOGO} alt="Nuevo Liberalismo" width={140} height={46} className="object-contain brightness-0 invert opacity-90" />

        {/* QR o cerrado */}
        <div className="flex flex-col items-center gap-4 w-full">
          {sesion.asistencias_cerradas ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 flex flex-col items-center gap-3">
                <Lock size={64} className="text-white/40" />
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest text-center">Registro de asistencia cerrado</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm font-semibold text-center">Escanea el QR para registrar tu asistencia</p>
              <div className="bg-white rounded-3xl p-5 shadow-2xl">
                <QRCode value={qrValue} size={220} level="M" />
              </div>
              {/* Rotation bar */}
              <div className="flex flex-col items-center gap-1.5 w-56">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5 transition-all duration-1000" style={{ width: `${(qrSeg / 30) * 100}%` }} />
                </div>
                <p className="text-white/40 text-xs font-semibold">Código actualiza en {qrSeg}s</p>
              </div>
              {/* Código manual */}
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Código manual</p>
                <p className="text-white text-4xl font-mono font-black tracking-[0.3em]">{sesion.codigo_asistencia}</p>
              </div>
            </>
          )}
        </div>

        {/* Quórum */}
        <div className="w-full flex flex-col gap-3">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox icon={<Users size={14}/>} label="Asistentes" value={quorum.asistentes} highlight />
            <StatBox icon={<Vote size={14}/>} label="Con derecho a voto" value={quorum.acreditados_voto} />
            <StatBox icon={<UserCheck size={14}/>} label="Solo ingreso" value={quorum.acreditados_ingreso} />
            <StatBox icon={<Users size={14}/>} label="Inscritos" value={quorum.inscritos} />
          </div>
          {/* Quórum bar */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-xs font-bold uppercase tracking-wide">Quórum</span>
              <span className={`text-sm font-extrabold tabular-nums ${quorumAlcanzado ? 'text-green-300' : 'text-orange-300'}`}>
                {quorum.asistentes} / {quorum.acreditados_voto}
                <span className="text-xs ml-1 font-bold">({quorumPct}%)</span>
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${quorumAlcanzado ? 'bg-green-400' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(100, quorumPct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-white/30 text-[10px]">0%</p>
              <p className={`text-[10px] font-bold ${quorumAlcanzado ? 'text-green-300' : 'text-orange-300'}`}>
                {quorumAlcanzado ? '✓ Quórum alcanzado' : `Falta ${Math.max(0, Math.ceil(quorum.acreditados_voto * 0.5) - quorum.asistentes)} para quórum`}
              </p>
              <p className="text-white/30 text-[10px]">50%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho: contenido dinámico ───────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#160808' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-10 py-5 border-b" style={{ borderColor: 'rgba(220,50,50,0.15)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,180,180,0.5)' }}>
              {sesion.estado === 'en_curso' ? '● En curso' : sesion.estado === 'finalizada' ? 'Finalizada' : 'Próxima'}
            </p>
            <h1 className="text-white text-2xl font-extrabold leading-tight">{sesion.nombre}</h1>
          </div>
          <div className="flex items-center gap-5 text-sm" style={{ color: 'rgba(255,180,180,0.4)' }}>
            {sesion.fecha && <span className="flex items-center gap-1.5"><Calendar size={13}/>{sesion.fecha} · {sesion.hora}</span>}
            {sesion.lugar && <span className="flex items-center gap-1.5"><MapPin size={13}/>{sesion.lugar}</span>}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 py-8 overflow-hidden">

          {/* Sesión finalizada */}
          {sesion.estado === 'finalizada' && !preguntaActiva && (
            <div className="flex flex-col items-center gap-5 text-center">
              <CheckCircle size={80} className="text-green-400 opacity-70" />
              <p className="text-white text-4xl font-extrabold">Sesión finalizada</p>
              <p className="text-white/40 text-lg">Gracias por participar</p>
            </div>
          )}

          {/* Sin pregunta activa → stats + quórum */}
          {!preguntaActiva && sesion.estado !== 'finalizada' && (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl text-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#e53535' }} />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#e53535' }} />
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e88888' }}>Esperando votación</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,180,180,0.3)' }}>El moderador publicará la primera pregunta en breve</p>
              </div>

              {/* Métricas grandes */}
              <div className="grid grid-cols-3 gap-5 w-full">
                <BigStat value={quorum.inscritos}        label="Inscritos"              color="text-white/50"  bg="rgba(255,255,255,0.04)" border="rgba(220,80,80,0.12)" />
                <BigStat value={quorum.acreditados_voto} label="Habilitados para votar" color="text-green-400" bg="rgba(0,200,80,0.06)"     border="rgba(0,180,60,0.2)"  />
                <BigStat value={quorum.asistentes}       label="Asistentes presentes"   color="#ff6666"        bg="rgba(220,30,30,0.1)"     border="rgba(220,50,50,0.25)" />
              </div>

              {/* Quórum grande */}
              <div className="w-full rounded-3xl p-6" style={{ background: 'rgba(220,30,30,0.08)', border: '1px solid rgba(220,60,60,0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgba(255,180,180,0.6)' }}>Quórum deliberativo</span>
                  <span className={`text-3xl font-extrabold tabular-nums ${quorumAlcanzado ? 'text-green-400' : 'text-orange-400'}`}>{quorumPct}%</span>
                </div>
                <div className="h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className={`h-6 rounded-full transition-all duration-700 ${quorumAlcanzado ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(100, quorumPct)}%` }}
                  />
                </div>
                <p className={`text-sm font-bold mt-3 ${quorumAlcanzado ? 'text-green-400' : 'text-orange-400'}`}>
                  {quorumAlcanzado
                    ? `✓ Quórum alcanzado — ${quorum.asistentes} de ${quorum.acreditados_voto} habilitados presentes`
                    : `Faltan ${Math.max(0, Math.ceil(quorum.acreditados_voto * 0.5) - quorum.asistentes)} asistentes para quórum (50%)`
                  }
                </p>
              </div>
            </div>
          )}

          {/* ── Pregunta activa ── */}
          {preguntaActiva && (() => {
            const opciones   = preguntaActiva.opciones ?? [];
            const totalVotos = opciones.reduce((s, o) => s + Number(o.total), 0);
            const maxVotos   = Math.max(...opciones.map((o) => Number(o.total)), 1);
            return (
              <div className="flex flex-col gap-7 w-full max-w-3xl">
                {/* Indicador + timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                    </span>
                    <span className="text-green-400 text-sm font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Zap size={13}/> Votación en curso
                    </span>
                  </div>
                  {timer != null && (
                    <span className={`font-extrabold tabular-nums tracking-tight ${timer <= 30 ? 'text-red-400 animate-pulse text-6xl' : 'text-white text-5xl'}`}>
                      {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Texto pregunta */}
                <p className="text-white font-extrabold leading-snug" style={{ fontSize: 'clamp(1.6rem, 3.8vw, 3.2rem)', textShadow: '0 2px 20px rgba(220,50,50,0.3)' }}>
                  {preguntaActiva.texto}
                </p>

                {/* Barras de resultados */}
                {opciones.length > 0 && (
                  <div className="flex flex-col gap-5">
                    {opciones.map((op, i) => {
                      const votos = Number(op.total);
                      const pct   = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                      const bar   = Math.round((votos / maxVotos) * 100);
                      const esSI  = op.respuesta === 'SI';
                      const esNO  = op.respuesta === 'NO';
                      const barColor = esSI ? '#22c55e' : esNO ? '#ef4444' : '#c41e1e';
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="text-white text-2xl font-bold flex items-center gap-2">
                              {esSI && <ThumbsUp size={20} className="text-green-400" />}
                              {esNO && <ThumbsDown size={20} className="text-red-400" />}
                              {op.respuesta}
                            </span>
                            <span className="text-lg font-semibold tabular-nums" style={{ color: 'rgba(255,200,200,0.7)' }}>
                              {votos} voto{votos !== 1 ? 's' : ''} · {pct}%
                            </span>
                          </div>
                          <div className="h-8 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div
                              className="h-8 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${bar}%`, background: barColor, boxShadow: `0 0 20px ${barColor}55` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-sm text-right" style={{ color: 'rgba(255,180,180,0.3)' }}>Total emitidos: {totalVotos} votos</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
      <span className="text-white/50">{icon}</span>
      <div>
        <p className="text-white text-lg font-extrabold tabular-nums leading-none">{value}</p>
        <p className="text-white/40 text-[10px] font-semibold leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function BigStat({ value, label, color, bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.08)' }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col items-center gap-2" style={{ background: bg, border: `1px solid ${border}` }}>
      <p className={`text-6xl font-extrabold tabular-nums ${color}`} style={typeof color === 'string' && color.startsWith('#') ? { color } : {}}>{value}</p>
      <p className="text-xs font-semibold text-center leading-tight" style={{ color: 'rgba(255,200,200,0.45)' }}>{label}</p>
    </div>
  );
}
