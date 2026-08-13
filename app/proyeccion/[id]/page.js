'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Users, MapPin, Calendar, ThumbsUp, ThumbsDown, Zap, CheckCircle, Lock, UserCheck, Vote, Radio, ChevronLeft, ChevronRight, Award } from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function ProyeccionPage() {
  const { id } = useParams();
  const sesionId = decodeURIComponent(id);

  const [datos, setDatos]     = useState(null);
  const [error, setError]     = useState(null);
  const [qrTs,  setQrTs]     = useState(() => Math.floor(Date.now() / 30000));
  const [qrSeg, setQrSeg]    = useState(30);
  const [timer, setTimer]    = useState(null);
  const [histIdx, setHistIdx] = useState(-1); // -1 = most recent auto
  const timerRef   = useRef(null);
  const prevPregId = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`/api/proyeccion/${encodeURIComponent(sesionId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setDatos(json);
      const pa = json.preguntaActiva;
      if (pa?.id !== prevPregId.current) {
        prevPregId.current = pa?.id ?? null;
        setTimer(pa?.segundos_restantes ?? null);
        // Reset history navigation when a new active question appears
        if (pa) setHistIdx(-1);
      }
    } catch { setError('Error de conexión'); }
  }, [sesionId]);

  useEffect(() => { cargar(); const iv = setInterval(cargar, 5000); return () => clearInterval(iv); }, [cargar]);

  // QR rotation
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
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-xl">{error}</p>
    </div>
  );

  if (!datos) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent animate-spin" />
    </div>
  );

  const { sesion, quorum, preguntaActiva, historial = [] } = datos;
  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/asistir/${sesion.id}?c=${sesion.codigo_asistencia}&ts=${qrTs}`;

  const quorumPct       = quorum.acreditados_voto > 0
    ? Math.round((quorum.asistentes / quorum.acreditados_voto) * 100)
    : 0;
  const quorumAlcanzado = quorumPct >= 50;

  // Which historical question to display
  const histLen       = historial.length;
  const efectivoIdx   = histIdx === -1 ? histLen - 1 : Math.min(histIdx, histLen - 1);
  const histActual    = histLen > 0 ? historial[efectivoIdx] : null;
  const puedeRetro    = efectivoIdx > 0;
  const puedeAdelantar = efectivoIdx < histLen - 1;

  // Pantalla completa QR cuando aún no han iniciado preguntas
  if (!preguntaActiva && histLen === 0 && sesion.estado !== 'finalizada') {
    return (
      <div className="h-screen w-screen flex flex-col bg-brand select-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-12 pt-8 pb-4">
          <LogoNL />
          <div className="text-right">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{sesion.fecha} · {sesion.hora} · {sesion.lugar}</p>
            <h1 className="text-white text-2xl font-extrabold">{sesion.nombre}</h1>
          </div>
        </div>

        {/* Centro: QR grande */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <p className="text-white/70 text-base font-semibold">Escanea el QR para registrar tu asistencia</p>
          {sesion.asistencias_cerradas ? (
            <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-16 flex flex-col items-center gap-4">
              <Lock size={96} className="text-white/40" />
              <p className="text-white/60 text-lg font-bold uppercase tracking-widest">Registro cerrado</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl p-5 shadow-2xl">
                <QRCode value={qrValue} size={340} level="M" />
              </div>
              <div className="flex flex-col items-center gap-2 w-80">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5 transition-all duration-1000" style={{ width: `${(qrSeg / 30) * 100}%` }} />
                </div>
                <p className="text-white/40 text-xs font-semibold">Actualiza en {qrSeg}s</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Código manual</p>
                <p className="text-white text-5xl font-mono font-black tracking-[0.4em]">{sesion.codigo_asistencia}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer: stats quórum */}
        <div className="px-12 pb-8 grid grid-cols-4 gap-4">
          {[
            { label: 'Inscritos',        value: quorum.inscritos },
            { label: 'Con voto',         value: quorum.acreditados_voto },
            { label: 'Solo ingreso',     value: quorum.acreditados_ingreso },
            { label: 'Asistentes',       value: quorum.asistentes },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 flex flex-col items-center">
              <span className="text-white text-3xl font-extrabold">{value}</span>
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden select-none">

      {/* ── Panel izquierdo: QR + quórum ─────── */}
      <div className="w-[28%] flex-shrink-0 bg-brand flex flex-col items-center justify-between py-8 px-5">
        <LogoNL />

        {/* QR o cerrado */}
        <div className="flex flex-col items-center gap-4 w-full">
          {sesion.asistencias_cerradas ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 flex flex-col items-center gap-3">
                <Lock size={64} className="text-white/40" />
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest text-center">Registro cerrado</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white/70 text-xs font-semibold text-center">Escanea el QR para registrar tu asistencia</p>
              <div className="bg-white rounded-2xl p-3 shadow-2xl">
                <QRCode value={qrValue} size={180} level="M" />
              </div>
              <div className="flex flex-col items-center gap-1 w-full">
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div className="bg-white rounded-full h-1 transition-all duration-1000" style={{ width: `${(qrSeg / 30) * 100}%` }} />
                </div>
                <p className="text-white/40 text-[10px] font-semibold">Actualiza en {qrSeg}s</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Código manual</p>
                <p className="text-white text-3xl font-mono font-black tracking-[0.3em]">{sesion.codigo_asistencia}</p>
              </div>
            </>
          )}
        </div>

        {/* Stats + quórum */}
        <div className="w-full flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <StatLeft icon={<Users size={13}/>}    label="Asistentes"       value={quorum.asistentes}          bold />
            <StatLeft icon={<Vote size={13}/>}     label="Con voto"         value={quorum.acreditados_voto} />
            <StatLeft icon={<UserCheck size={13}/>} label="Solo ingreso"    value={quorum.acreditados_ingreso} />
            <StatLeft icon={<Users size={13}/>}    label="Inscritos"        value={quorum.inscritos} />
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-xs font-bold uppercase tracking-wide">Quórum</span>
              <span className={`text-sm font-extrabold ${quorumAlcanzado ? 'text-green-300' : 'text-yellow-300'}`}>
                {quorum.asistentes}/{quorum.acreditados_voto} · {quorumPct}%
              </span>
            </div>
            <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${quorumAlcanzado ? 'bg-green-400' : 'bg-yellow-400'}`}
                style={{ width: `${Math.min(100, quorumPct)}%` }} />
            </div>
            <p className={`text-[11px] font-bold mt-1.5 ${quorumAlcanzado ? 'text-green-300' : 'text-yellow-300'}`}>
              {quorumAlcanzado
                ? '✓ Quórum alcanzado'
                : `Faltan ${Math.max(0, Math.ceil(quorum.acreditados_voto * 0.5) - quorum.asistentes)} para quórum (50%)`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho ─────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-10 py-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {sesion.estado === 'en_curso' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 uppercase tracking-widest">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  En curso
                </span>
              )}
              {sesion.estado === 'finalizada' && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Finalizada</span>}
              {sesion.estado === 'proxima' && <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Próxima</span>}
            </div>
            <h1 className="text-gray-900 text-2xl font-extrabold leading-tight">{sesion.nombre}</h1>
          </div>
          <div className="flex items-center gap-5 text-gray-400 text-sm">
            {sesion.fecha && <span className="flex items-center gap-1.5"><Calendar size={13}/>{sesion.fecha} · {sesion.hora}</span>}
            {sesion.lugar && <span className="flex items-center gap-1.5"><MapPin size={13}/>{sesion.lugar}</span>}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 py-8 overflow-hidden">

          {/* Finalizada sin historial */}
          {sesion.estado === 'finalizada' && !preguntaActiva && histLen === 0 && (
            <div className="flex flex-col items-center gap-5 text-center">
              <CheckCircle size={72} className="text-green-500" />
              <p className="text-gray-900 text-4xl font-extrabold">Sesión finalizada</p>
              <p className="text-gray-400 text-lg">Gracias por participar</p>
            </div>
          )}

          {/* Esperando pregunta — sin historial */}
          {!preguntaActiva && sesion.estado !== 'finalizada' && histLen === 0 && (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <Radio size={15} className="text-brand" />
                  <span className="text-brand text-sm font-bold uppercase tracking-widest">Esperando votación</span>
                </div>
                <p className="text-gray-400 text-sm">El moderador publicará la primera pregunta en breve</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full">
                <BigStatRight value={quorum.inscritos}        label="Inscritos"              accent="text-gray-500"  />
                <BigStatRight value={quorum.acreditados_voto} label="Habilitados para votar" accent="text-green-600" />
                <BigStatRight value={quorum.asistentes}       label="Asistentes presentes"   accent="text-brand"     />
              </div>
              <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Quórum deliberativo</span>
                  <span className={`text-3xl font-extrabold tabular-nums ${quorumAlcanzado ? 'text-green-600' : 'text-orange-500'}`}>{quorumPct}%</span>
                </div>
                <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-5 rounded-full transition-all duration-700 ${quorumAlcanzado ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(100, quorumPct)}%` }} />
                </div>
                <p className={`text-sm font-semibold mt-2 ${quorumAlcanzado ? 'text-green-600' : 'text-orange-500'}`}>
                  {quorumAlcanzado
                    ? `✓ Quórum alcanzado — ${quorum.asistentes} de ${quorum.acreditados_voto} habilitados presentes`
                    : `Faltan ${Math.max(0, Math.ceil(quorum.acreditados_voto * 0.5) - quorum.asistentes)} asistentes para alcanzar quórum (50%)`}
                </p>
              </div>
            </div>
          )}

          {/* Resultado histórico — cuando no hay pregunta activa pero sí hay historial */}
          {!preguntaActiva && histLen > 0 && histActual && (
            <ResultadoCerrado
              preg={histActual}
              quorum={quorum}
              idx={efectivoIdx}
              total={histLen}
              puedeRetro={puedeRetro}
              puedeAdelantar={puedeAdelantar}
              onRetro={() => setHistIdx(Math.max(0, efectivoIdx - 1))}
              onAdelantar={() => setHistIdx(Math.min(histLen - 1, efectivoIdx + 1))}
            />
          )}

          {/* ── Pregunta activa ── */}
          {preguntaActiva && (() => {
            const opciones      = preguntaActiva.opciones ?? [];
            const totalVotos    = opciones.reduce((s, o) => s + Number(o.total), 0);
            const maxVotos      = Math.max(...opciones.map((o) => Number(o.total)), 1);
            const tipoMayoria   = preguntaActiva.tipo_mayoria ?? 'simple';
            const baseM         = quorum.acreditados_voto;
            const baseLabel     = 'acreditados con voto';
            const umbral        = Math.floor(baseM / 2) + 1;
            const mayorPct      = umbral > 0 ? Math.min(100, Math.round((totalVotos / umbral) * 100)) : 0;
            const mayorAlcanzada = totalVotos >= umbral && umbral > 0;
            const hayPlanchas = opciones.some((o) => o.es_plancha);
            const colsCls = hayPlanchas
              ? opciones.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
              : '';
            return (
              <div className="flex flex-col gap-4 w-full" style={{ maxWidth: hayPlanchas ? '100%' : '48rem' }}>
                {/* Indicador + timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                    </span>
                    <span className="text-green-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Zap size={12}/> Votación en curso
                    </span>
                  </div>
                  {timer != null && (
                    <span className={`font-extrabold tabular-nums tracking-tight ${timer <= 30 ? 'text-brand animate-pulse text-4xl' : 'text-gray-700 text-3xl'}`}>
                      {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Pregunta */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-7 py-4">
                  <p className="text-gray-900 font-extrabold leading-snug" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
                    {preguntaActiva.texto}
                  </p>
                </div>

                {/* Opciones */}
                {opciones.length > 0 && (
                  <div className={hayPlanchas ? `grid ${colsCls} gap-3` : 'flex flex-col gap-2.5'}>
                    {opciones.map((op, i) => {
                      const votos     = Number(op.total);
                      const pct       = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                      const bar       = Math.round((votos / maxVotos) * 100);
                      const esSI      = op.respuesta === 'SI';
                      const esNO      = op.respuesta === 'NO';
                      const esPlancha = op.es_plancha && op.miembros?.length > 0;
                      const barBg     = esSI ? 'bg-green-500' : esNO ? 'bg-red-500' : 'bg-brand';
                      const textColor = esSI ? 'text-green-700' : esNO ? 'text-red-600' : 'text-gray-900';
                      return (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                            <span className={`font-extrabold text-sm flex items-center gap-1.5 ${textColor}`}>
                              {esSI && <ThumbsUp size={14} className="text-green-500" />}
                              {esNO && <ThumbsDown size={14} className="text-red-500" />}
                              {op.respuesta}
                            </span>
                            <span className="text-xs font-bold text-gray-500 tabular-nums flex-shrink-0">
                              {votos} voto{votos !== 1 ? 's' : ''} · <span className="text-gray-800">{pct}%</span>
                            </span>
                          </div>
                          {esPlancha && (
                            <div className="px-4 pb-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                              {op.miembros.map((m, mi) => (
                                <div key={mi} className="flex items-baseline gap-1 min-w-0">
                                  <span className="text-brand/50 text-[9px] font-bold tabular-nums flex-shrink-0">#{mi + 1}</span>
                                  <span className="text-[11px] font-semibold text-gray-700 truncate">{m.nombre}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="px-4 pb-3 mt-auto">
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-3 rounded-full transition-all duration-700 ease-out ${barBg}`}
                                style={{ width: `${bar}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Indicador de mayoría */}
                {opciones.length > 0 && (
                  <div className={`rounded-2xl border shadow-sm px-5 py-3 ${mayorAlcanzada ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tipoMayoria === 'absoluta' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                          {tipoMayoria === 'absoluta' ? 'Mayoría Absoluta' : 'Mayoría Simple'}
                        </span>
                        <span className="text-gray-400 text-xs">50%+1 de {baseLabel} · umbral: {umbral} votos</span>
                      </div>
                      <span className={`text-xl font-extrabold tabular-nums ${mayorAlcanzada ? 'text-green-600' : 'text-gray-700'}`}>
                        {totalVotos}<span className="text-sm font-semibold text-gray-400">/{umbral}</span>
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-3 rounded-full transition-all duration-700 ${mayorAlcanzada ? 'bg-green-500' : 'bg-brand'}`}
                        style={{ width: `${mayorPct}%` }} />
                    </div>
                    <p className={`text-xs font-semibold mt-1.5 ${mayorAlcanzada ? 'text-green-600' : 'text-gray-500'}`}>
                      {mayorAlcanzada
                        ? `✓ Mayoría alcanzada — ${totalVotos} de ${umbral} votos requeridos`
                        : `Faltan ${umbral - totalVotos} votos para mayoría (${mayorPct}% del objetivo)`}
                    </p>
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

function calcDhondt(opciones, cupos) {
  if (!cupos || !opciones?.length) return [];
  const seats = opciones.map((o) => ({ ...o, cupos_ganados: 0 }));
  for (let i = 0; i < cupos; i++) {
    let maxQ = -1, maxTotal = -1, maxIdx = 0;
    seats.forEach((s, idx) => {
      const q = Number(s.total) / (s.cupos_ganados + 1);
      const t = Number(s.total);
      if (q > maxQ + 1e-10 || (Math.abs(q - maxQ) < 1e-10 && t > maxTotal)) {
        maxQ = q; maxTotal = t; maxIdx = idx;
      }
    });
    seats[maxIdx].cupos_ganados++;
  }
  return [...seats].sort((a, b) => b.cupos_ganados - a.cupos_ganados || Number(b.total) - Number(a.total));
}

function buildDhondtTable(opciones, cupos) {
  if (!cupos || !opciones?.length) return null;
  // Replay the exact same algorithm as calcDhondt to get the correct winning cells
  const seats   = opciones.map((o) => ({ respuesta: o.respuesta, total: Number(o.total), cupos_ganados: 0 }));
  const winners = new Set();
  for (let i = 0; i < cupos; i++) {
    let maxQ = -1, maxTotal = -1, maxIdx = 0;
    seats.forEach((s, idx) => {
      const q = s.total / (s.cupos_ganados + 1);
      const t = s.total;
      if (q > maxQ + 1e-10 || (Math.abs(q - maxQ) < 1e-10 && t > maxTotal)) {
        maxQ = q; maxTotal = t; maxIdx = idx;
      }
    });
    const divisor = seats[maxIdx].cupos_ganados + 1;
    winners.add(`${seats[maxIdx].respuesta}-${divisor}`);
    seats[maxIdx].cupos_ganados++;
  }
  const divisors = Array.from({ length: cupos }, (_, i) => i + 1);
  return { divisors, winners };
}

function ResultadoCerrado({ preg, quorum, idx, total, puedeRetro, puedeAdelantar, onRetro, onAdelantar }) {
  const [verTabla, setVerTabla] = useState(false);
  const opciones     = preg.opciones ?? [];
  const totalVotos   = preg.total_votos || opciones.reduce((s, o) => s + Number(o.total), 0);
  const maxVotos     = Math.max(...opciones.map((o) => Number(o.total)), 1);
  const ganador      = preg.ganador;
  const hayPlanchas  = opciones.some((o) => o.es_plancha);
  const colsCls      = hayPlanchas ? (opciones.length <= 2 ? 'grid-cols-2' : 'grid-cols-3') : '';
  const ganadorOp    = ganador ? opciones.find((o) => o.respuesta === ganador) : null;

  return (
    <div className="flex flex-col gap-4 w-full" style={{ maxWidth: hayPlanchas ? '100%' : '48rem' }}>

      {/* Cabecera: badge resultado + navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-slate-600 text-xs font-bold uppercase tracking-widest">
            <Award size={12}/> Resultado — votación {idx + 1} de {total}
          </span>
          {ganador && (
            <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-green-700 text-xs font-bold">
              ✓ {ganador}
            </span>
          )}
        </div>
        {total > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={onRetro} disabled={!puedeRetro}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14}/> Anterior
            </button>
            <button onClick={onAdelantar} disabled={!puedeAdelantar}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Siguiente <ChevronRight size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* Pregunta */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-7 py-4">
        <p className="text-gray-900 font-extrabold leading-snug" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
          {preg.texto}
        </p>
      </div>

      {/* Opciones con resultado */}
      {opciones.length > 0 && (
        <div className={hayPlanchas ? `grid ${colsCls} gap-3` : 'flex flex-col gap-2.5'}>
          {opciones.map((op, i) => {
            const votos     = Number(op.total);
            const pct       = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
            const bar       = Math.round((votos / maxVotos) * 100);
            const esSI      = op.respuesta === 'SI';
            const esNO      = op.respuesta === 'NO';
            const esPlancha = op.es_plancha && op.miembros?.length > 0;
            const esGanador = op.respuesta === ganador;
            const barBg     = esGanador ? 'bg-green-500' : esSI ? 'bg-green-500' : esNO ? 'bg-red-500' : 'bg-gray-300';
            const textColor = esGanador ? 'text-green-700' : esSI ? 'text-green-700' : esNO ? 'text-red-600' : 'text-gray-500';
            const cardBg    = esGanador ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200';
            return (
              <div key={i} className={`rounded-xl border shadow-sm flex flex-col ${cardBg}`}>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                  <span className={`font-extrabold text-sm flex items-center gap-1.5 ${textColor}`}>
                    {esGanador && <CheckCircle size={13} className="text-green-600 flex-shrink-0"/>}
                    {esSI && !esGanador && <span className="text-green-500">↑</span>}
                    {esNO && !esGanador && <span className="text-red-500">↓</span>}
                    {op.respuesta}
                  </span>
                  <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${esGanador ? 'text-green-700' : 'text-gray-500'}`}>
                    {votos} voto{votos !== 1 ? 's' : ''} · <span className={esGanador ? 'text-green-800 font-extrabold' : 'text-gray-800'}>{pct}%</span>
                  </span>
                </div>
                {esPlancha && (
                  <div className="px-4 pb-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {op.miembros.map((m, mi) => (
                      <div key={mi} className="flex items-baseline gap-1 min-w-0">
                        <span className={`text-[9px] font-bold tabular-nums flex-shrink-0 ${esGanador ? 'text-green-600/70' : 'text-brand/50'}`}>#{mi + 1}</span>
                        <span className={`text-[11px] font-semibold truncate ${esGanador ? 'text-green-800' : 'text-gray-700'}`}>{m.nombre}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 pb-3 mt-auto">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-3 rounded-full transition-all duration-700 ease-out ${barBg}`}
                      style={{ width: `${bar}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner ganador plancha — integrantes */}
      {ganadorOp?.es_plancha && ganadorOp.miembros?.length > 0 && !preg.cupos && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Users size={12}/> Integrantes de la plancha ganadora — {ganador}
          </p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
            {ganadorOp.miembros.map((m, mi) => (
              <div key={mi} className="flex items-baseline gap-1.5 text-sm min-w-0">
                <span className="font-bold text-green-600/60 text-xs tabular-nums flex-shrink-0">#{mi + 1}</span>
                {m.cargo && <span className="font-bold text-green-700 flex-shrink-0">{m.cargo}:</span>}
                <span className="text-green-900 font-semibold truncate">{m.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D'Hondt — cupos asignados por plancha con sus integrantes */}
      {preg.cupos && preg.tipo === 'candidatos' && (() => {
        const dhondt      = calcDhondt(opciones, preg.cupos);
        const tabla       = buildDhondtTable(opciones, preg.cupos);
        const ganadoresDh = dhondt.filter((c) => c.cupos_ganados > 0);
        if (!ganadoresDh.length) return null;
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            {/* Cabecera con toggle */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                <Award size={12}/> D'Hondt — {preg.cupos} cupo{preg.cupos !== 1 ? 's' : ''} distribuidos
              </p>
              <button
                onClick={() => setVerTabla((v) => !v)}
                className="text-[11px] font-bold text-blue-500 hover:text-blue-700 border border-blue-300 bg-white rounded-lg px-3 py-1 transition-colors"
              >
                {verTabla ? 'Ocultar cálculo' : 'Ver cálculo'}
              </button>
            </div>

            {/* Asignaciones por plancha — columnas horizontales */}
            <div className={`grid gap-3 mb-3 ${ganadoresDh.length === 1 ? 'grid-cols-1' : ganadoresDh.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {ganadoresDh.map((c, i) => {
                const op        = opciones.find((o) => o.respuesta === c.respuesta);
                const miembros  = op?.miembros ?? [];
                const elegidos  = miembros.slice(0, c.cupos_ganados);
                const suplentes = miembros.slice(c.cupos_ganados, c.cupos_ganados * 2);
                return (
                  <div key={i} className="bg-white border border-blue-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="font-extrabold text-blue-900 text-xs">{c.respuesta}</span>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {c.cupos_ganados} cupo{c.cupos_ganados !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-blue-400">· {c.total} votos</span>
                    </div>
                    {elegidos.length > 0 && (
                      <div className="mb-1.5">
                        <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide mb-0.5">Elegidos</p>
                        <div className="border-l-2 border-green-400 pl-1.5 flex flex-col gap-0.5">
                          {elegidos.map((m, mi) => (
                            <div key={mi} className="flex items-baseline gap-1 text-[11px] min-w-0">
                              <span className="font-bold text-green-600 flex-shrink-0 tabular-nums">#{mi + 1}</span>
                              <span className="text-green-900 font-semibold truncate">{m.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suplentes.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Suplentes</p>
                        <div className="border-l-2 border-gray-300 pl-1.5 flex flex-col gap-0.5">
                          {suplentes.map((m, mi) => (
                            <div key={mi} className="flex items-baseline gap-1 text-[11px] min-w-0">
                              <span className="font-bold text-gray-400 flex-shrink-0 tabular-nums">#{elegidos.length + mi + 1}</span>
                              <span className="text-gray-500 truncate">{m.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tabla de cocientes (toggle) */}
            {verTabla && tabla && (
              <div className="mt-2 pt-4 border-t border-blue-200">
                <p className="text-[11px] text-blue-600 mb-3 leading-relaxed">
                  Se dividen los votos de cada plancha entre 1, 2, 3… Los <strong>{preg.cupos} cocientes más altos</strong> ganan un cupo. En caso de empate en el cociente, gana la plancha con más votos totales.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse bg-white rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="text-left py-1.5 px-2 text-blue-700 font-bold border-b border-blue-200">Plancha</th>
                        <th className="text-center py-1.5 px-2 text-blue-700 font-bold border-b border-blue-200">Votos</th>
                        {tabla.divisors.map((d) => (
                          <th key={d} className="text-center py-1.5 px-2 text-blue-700 font-bold border-b border-blue-200">÷{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {opciones.slice().sort((a, b) => Number(b.total) - Number(a.total)).map((op, ri) => (
                        <tr key={ri} className="border-b border-blue-100 last:border-0">
                          <td className="py-1.5 px-2 font-semibold text-blue-900 max-w-[130px] truncate">{op.respuesta}</td>
                          <td className="py-1.5 px-2 text-center text-blue-600 font-bold">{op.total}</td>
                          {tabla.divisors.map((d) => {
                            const key      = `${op.respuesta}-${d}`;
                            const isWinner = tabla.winners.has(key);
                            return (
                              <td key={d} className={`py-1.5 px-2 text-center font-mono rounded ${isWinner ? 'bg-blue-600 text-white font-extrabold' : 'text-blue-400'}`}>
                                {(Number(op.total) / d).toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-blue-400 mt-2 font-semibold">
                  Cupos asignados: {dhondt.filter((c) => c.cupos_ganados > 0).map((c) => `${c.respuesta} (${c.cupos_ganados})`).join(' · ')}
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function LogoNL() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm flex items-center justify-center" style={{ minWidth: 140, minHeight: 44 }}>
      {failed ? (
        <div className="flex flex-col items-center leading-none">
          <p className="text-brand font-extrabold text-base tracking-widest uppercase">Nuevo</p>
          <p className="text-brand font-extrabold text-base tracking-widest uppercase">Liberalismo</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO}
          alt="Nuevo Liberalismo"
          width={140}
          height={40}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function StatLeft({ icon, label, value, bold }) {
  return (
    <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
      <span className="text-white/50 flex-shrink-0">{icon}</span>
      <div>
        <p className={`text-white leading-none tabular-nums ${bold ? 'text-xl font-extrabold' : 'text-lg font-bold'}`}>{value}</p>
        <p className="text-white/40 text-[10px] font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function BigStatRight({ value, label, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center gap-2">
      <p className={`text-6xl font-extrabold tabular-nums ${accent}`}>{value}</p>
      <p className="text-gray-400 text-xs font-semibold text-center leading-tight">{label}</p>
    </div>
  );
}
