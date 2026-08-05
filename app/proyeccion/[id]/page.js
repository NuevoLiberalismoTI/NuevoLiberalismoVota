'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Users, MapPin, Calendar, ThumbsUp, ThumbsDown, Zap, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function ProyeccionPage() {
  const { id } = useParams();
  const sesionId = decodeURIComponent(id);

  const [datos, setDatos]       = useState(null);
  const [error, setError]       = useState(null);
  const [qrTs,  setQrTs]        = useState(() => Math.floor(Date.now() / 30000));
  const [qrSeg, setQrSeg]       = useState(30);
  const [timer, setTimer]       = useState(null);
  const timerRef  = useRef(null);
  const prevPregRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`/api/proyeccion/${encodeURIComponent(sesionId)}`);
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setDatos(json);

      const pa = json.preguntaActiva;
      if (pa?.id !== prevPregRef.current) {
        prevPregRef.current = pa?.id ?? null;
        if (pa?.segundos_restantes != null) {
          setTimer(pa.segundos_restantes);
        } else {
          setTimer(null);
        }
      }
    } catch {
      setError('Error de conexión');
    }
  }, [sesionId]);

  // Polling cada 5 segundos
  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 5000);
    return () => clearInterval(iv);
  }, [cargar]);

  // Countdown QR (cada segundo)
  useEffect(() => {
    const iv = setInterval(() => {
      const ahora   = Date.now();
      const elapsed = (ahora / 1000) % 30;
      setQrSeg(Math.ceil(30 - elapsed));
      setQrTs(Math.floor(ahora / 30000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Countdown timer pregunta
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timer == null || timer <= 0) return;
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [datos?.preguntaActiva?.id]);

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white/50 text-lg">{error}</p>
    </div>
  );

  if (!datos) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
    </div>
  );

  const { sesion, asistentes, preguntaActiva } = datos;
  const esFinalizada = sesion.estado === 'finalizada';

  // ── Vista: pregunta activa ────────────────────────────────────────────────
  if (preguntaActiva) {
    const opciones    = preguntaActiva.opciones ?? [];
    const totalVotos  = opciones.reduce((s, o) => s + Number(o.total), 0);
    const maxVotos    = Math.max(...opciones.map((o) => Number(o.total)), 1);

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col select-none overflow-hidden">
        {/* Barra superior */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-white/5">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={140} height={46} className="object-contain opacity-90" />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/50 text-sm font-semibold">
              <Users size={15} />
              <span>{asistentes} asistente{asistentes !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-green-400 text-sm font-bold uppercase tracking-widest">
                {preguntaActiva.tipo === 'sino' ? <><Zap size={13} className="inline mr-1" />Votación en curso</> : 'Votación en curso'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-16 gap-10">
          {/* Timer */}
          {timer != null && (
            <div className={`text-8xl font-extrabold tabular-nums tracking-tight ${timer <= 30 ? 'text-red-400 animate-pulse' : 'text-white/70'}`}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </div>
          )}

          {/* Pregunta */}
          <p className="text-white text-5xl font-extrabold text-center leading-tight max-w-5xl drop-shadow-lg">
            {preguntaActiva.texto}
          </p>

          {/* Opciones */}
          {opciones.length > 0 && (
            <div className="w-full max-w-3xl flex flex-col gap-5">
              {opciones.map((op, i) => {
                const votos = Number(op.total);
                const pct   = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                const bar   = Math.round((votos / maxVotos) * 100);
                const esSI  = op.respuesta === 'SI';
                const esNO  = op.respuesta === 'NO';
                const color = esSI ? 'bg-green-500' : esNO ? 'bg-red-500' : 'bg-brand';
                return (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-white text-2xl font-bold flex items-center gap-2">
                        {esSI && <ThumbsUp size={20} className="text-green-400" />}
                        {esNO && <ThumbsDown size={20} className="text-red-400" />}
                        {op.respuesta}
                      </span>
                      <span className="text-white/60 text-xl font-semibold tabular-nums">
                        {votos} voto{votos !== 1 ? 's' : ''} · {pct}%
                      </span>
                    </div>
                    <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all duration-700 ease-out ${color}`}
                        style={{ width: `${bar}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-white/25 text-base text-right mt-1">Total: {totalVotos} votos</p>
            </div>
          )}
        </div>

        <div className="px-10 py-4 text-white/20 text-sm text-center">{sesion.nombre}</div>
      </div>
    );
  }

  // ── Vista: sesión finalizada ──────────────────────────────────────────────
  if (esFinalizada) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 select-none">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={180} height={60} className="object-contain opacity-80" />
        <CheckCircle size={80} className="text-green-400 opacity-80" />
        <p className="text-white text-4xl font-extrabold text-center">{sesion.nombre}</p>
        <p className="text-white/40 text-xl">Sesión finalizada — Gracias por participar</p>
        <div className="flex items-center gap-2 text-white/30 text-base">
          <Users size={16} /> {asistentes} asistente{asistentes !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }

  // ── Vista: espera / QR ───────────────────────────────────────────────────
  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/asistir/${sesion.id}?c=${sesion.codigo_asistencia}&ts=${qrTs}`;

  return (
    <div className="min-h-screen bg-brand flex flex-col select-none overflow-hidden">
      {/* Logo */}
      <div className="flex justify-center pt-10">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain brightness-0 invert opacity-90" />
      </div>

      {/* Nombre de sesión */}
      <div className="text-center mt-6 px-8">
        <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">{sesion.tipos_asamblea?.nombre ?? 'Asamblea'}</p>
        <h1 className="text-white text-3xl font-extrabold leading-tight">{sesion.nombre}</h1>
        <div className="flex items-center justify-center gap-5 mt-3 text-white/50 text-sm font-medium">
          {sesion.fecha && <span className="flex items-center gap-1.5"><Calendar size={13} />{sesion.fecha} · {sesion.hora}</span>}
          {sesion.lugar && <span className="flex items-center gap-1.5"><MapPin size={13} />{sesion.lugar}</span>}
        </div>
      </div>

      {/* QR + código */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <p className="text-white/70 text-lg font-semibold">Escanea el QR para registrar tu asistencia</p>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <QRCode value={qrValue} size={260} level="M" />
        </div>

        {/* Barra de rotación */}
        <div className="flex flex-col items-center gap-2 w-72">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-1000"
              style={{ width: `${(qrSeg / 30) * 100}%` }}
            />
          </div>
          <p className="text-white/50 text-xs font-semibold">Código actualiza en {qrSeg}s</p>
        </div>

        {/* Código alfanumérico */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Código de acceso manual</p>
          <p className="text-white text-5xl font-mono font-black tracking-[0.35em]">{sesion.codigo_asistencia}</p>
        </div>
      </div>

      {/* Contador asistentes */}
      <div className="flex justify-center pb-10">
        <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-8 py-4">
          <Users size={28} className="text-white/70" />
          <div>
            <p className="text-white text-4xl font-extrabold tabular-nums">{asistentes}</p>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wide">asistente{asistentes !== 1 ? 's' : ''} registrados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
