'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Users, MapPin, Calendar, ThumbsUp, ThumbsDown, Zap, CheckCircle, Lock, UserCheck, Vote, Radio } from 'lucide-react';
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
      const res  = await fetch(`/api/proyeccion/${encodeURIComponent(sesionId)}`, { cache: 'no-store' });
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

  const { sesion, quorum, preguntaActiva } = datos;
  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/asistir/${sesion.id}?c=${sesion.codigo_asistencia}&ts=${qrTs}`;

  const quorumPct       = quorum.acreditados_voto > 0
    ? Math.round((quorum.asistentes / quorum.acreditados_voto) * 100)
    : 0;
  const quorumAlcanzado = quorumPct >= 50;

  return (
    <div className="h-screen w-screen flex overflow-hidden select-none">

      {/* ── Panel izquierdo: QR + quórum — rojo marca ─────── */}
      <div className="w-[36%] flex-shrink-0 bg-brand flex flex-col items-center justify-between py-8 px-6">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={140} height={46} className="object-contain brightness-0 invert opacity-90" />

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
              <p className="text-white/70 text-sm font-semibold text-center">Escanea el QR para registrar tu asistencia</p>
              <div className="bg-white rounded-3xl p-5 shadow-2xl">
                <QRCode value={qrValue} size={210} level="M" />
              </div>
              <div className="flex flex-col items-center gap-1.5 w-56">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5 transition-all duration-1000" style={{ width: `${(qrSeg / 30) * 100}%` }} />
                </div>
                <p className="text-white/40 text-xs font-semibold">Actualiza en {qrSeg}s</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Código manual</p>
                <p className="text-white text-4xl font-mono font-black tracking-[0.3em]">{sesion.codigo_asistencia}</p>
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

      {/* ── Panel derecho: blanco, estilo admin ─────────────── */}
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

          {/* Finalizada */}
          {sesion.estado === 'finalizada' && !preguntaActiva && (
            <div className="flex flex-col items-center gap-5 text-center">
              <CheckCircle size={72} className="text-green-500" />
              <p className="text-gray-900 text-4xl font-extrabold">Sesión finalizada</p>
              <p className="text-gray-400 text-lg">Gracias por participar</p>
            </div>
          )}

          {/* Esperando pregunta */}
          {!preguntaActiva && sesion.estado !== 'finalizada' && (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
              {/* Estado */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <Radio size={15} className="text-brand" />
                  <span className="text-brand text-sm font-bold uppercase tracking-widest">Esperando votación</span>
                </div>
                <p className="text-gray-400 text-sm">El moderador publicará la primera pregunta en breve</p>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4 w-full">
                <BigStatRight value={quorum.inscritos}        label="Inscritos"              accent="text-gray-500"  />
                <BigStatRight value={quorum.acreditados_voto} label="Habilitados para votar" accent="text-green-600" />
                <BigStatRight value={quorum.asistentes}       label="Asistentes presentes"   accent="text-brand"     />
              </div>

              {/* Quórum */}
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

          {/* ── Pregunta activa ── */}
          {preguntaActiva && (() => {
            const opciones      = preguntaActiva.opciones ?? [];
            const totalVotos    = opciones.reduce((s, o) => s + Number(o.total), 0);
            const maxVotos      = Math.max(...opciones.map((o) => Number(o.total)), 1);
            const tipoMayoria   = preguntaActiva.tipo_mayoria ?? 'simple';
            const baseM         = tipoMayoria === 'absoluta' ? quorum.inscritos : quorum.asistentes;
            const baseLabel     = tipoMayoria === 'absoluta' ? 'inscritos' : 'asistentes';
            const umbral        = Math.floor(baseM / 2) + 1;
            const mayorPct      = umbral > 0 ? Math.min(100, Math.round((totalVotos / umbral) * 100)) : 0;
            const mayorAlcanzada = totalVotos >= umbral && umbral > 0;
            return (
              <div className="flex flex-col gap-6 w-full max-w-3xl">
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
                    <span className={`font-extrabold tabular-nums tracking-tight ${timer <= 30 ? 'text-brand animate-pulse text-6xl' : 'text-gray-700 text-5xl'}`}>
                      {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Pregunta */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-6">
                  <p className="text-gray-900 font-extrabold leading-snug" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 3rem)' }}>
                    {preguntaActiva.texto}
                  </p>
                </div>

                {/* Barras */}
                {opciones.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {opciones.map((op, i) => {
                      const votos  = Number(op.total);
                      const pct    = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                      const bar    = Math.round((votos / maxVotos) * 100);
                      const esSI   = op.respuesta === 'SI';
                      const esNO   = op.respuesta === 'NO';
                      const barBg  = esSI ? 'bg-green-500' : esNO ? 'bg-red-500' : 'bg-brand';
                      const textColor = esSI ? 'text-green-700' : esNO ? 'text-red-600' : 'text-gray-900';
                      return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-2xl font-extrabold flex items-center gap-2 ${textColor}`}>
                              {esSI && <ThumbsUp size={20} className="text-green-500" />}
                              {esNO && <ThumbsDown size={20} className="text-red-500" />}
                              {op.respuesta}
                            </span>
                            <span className="text-lg font-bold text-gray-500 tabular-nums">
                              {votos} voto{votos !== 1 ? 's' : ''} · <span className="text-gray-800 font-extrabold">{pct}%</span>
                            </span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-6 rounded-full transition-all duration-700 ease-out ${barBg}`}
                              style={{ width: `${bar}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {/* Indicador de mayoría */}
                    <div className={`rounded-2xl border shadow-sm px-6 py-4 ${mayorAlcanzada ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tipoMayoria === 'absoluta' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                            {tipoMayoria === 'absoluta' ? 'Mayoría Absoluta' : 'Mayoría Simple'}
                          </span>
                          <span className="text-gray-400 text-xs">50%+1 de {baseLabel} · umbral: {umbral} votos</span>
                        </div>
                        <span className={`text-2xl font-extrabold tabular-nums ${mayorAlcanzada ? 'text-green-600' : 'text-gray-700'}`}>
                          {totalVotos}<span className="text-sm font-semibold text-gray-400">/{umbral}</span>
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-700 ${mayorAlcanzada ? 'bg-green-500' : 'bg-brand'}`}
                          style={{ width: `${mayorPct}%` }}
                        />
                      </div>
                      <p className={`text-sm font-semibold mt-2 ${mayorAlcanzada ? 'text-green-600' : 'text-gray-500'}`}>
                        {mayorAlcanzada
                          ? `✓ Mayoría alcanzada — ${totalVotos} de ${umbral} votos requeridos`
                          : `Faltan ${umbral - totalVotos} votos para mayoría (${mayorPct}% del objetivo)`}
                      </p>
                    </div>
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
