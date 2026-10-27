'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Users, UserCheck, Target, Monitor, MapPin } from 'lucide-react';

const BRAND = '#C20A00';
const VERDE = '#16a34a';

// Misma regla del panel admin y del registro al publicar: 50% + 1 de los acreditados (invitados únicos)
export function calcQuorum(quorum) {
  const base       = quorum?.invitados ?? 0;
  const presentes  = quorum?.asistentes ?? 0;
  const umbral     = base > 0 ? Math.floor(base / 2) + 1 : 0;
  const alcanzado  = umbral > 0 && presentes >= umbral;
  return {
    base,
    presentes,
    umbral,
    alcanzado,
    faltan:    Math.max(0, umbral - presentes),
    pct:       base > 0 ? Math.min(100, Math.round((presentes / base) * 100)) : 0,
    pctUmbral: base > 0 ? Math.min(100, (umbral / base) * 100) : 50,
    virtuales: quorum?.virtuales ?? 0,
  };
}

const horaCO = (ms) => new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });

function useCountUp(valor, ms = 900) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);
  useEffect(() => {
    const inicio = performance.now(), de = desde.current;
    if (de === valor) return;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - inicio) / ms);
      const v = Math.round(de + (valor - de) * (1 - Math.pow(1 - p, 3)));
      setMostrado(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else desde.current = valor;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); desde.current = valor; };
  }, [valor, ms]);
  return mostrado;
}

// Barra de progreso con la marca del umbral de quórum
function BarraQuorum({ q, alto = 12, oscuro }) {
  return (
    <div className="relative" style={{ paddingTop: 18 }}>
      <div className={`absolute top-0 flex flex-col items-center ${q.pctUmbral > 85 ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: `${q.pctUmbral}%` }}>
        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${oscuro ? 'text-white/70' : 'text-gray-500'}`}>
          Quórum {q.umbral}
        </span>
      </div>
      <div className={`relative rounded-full overflow-hidden ${oscuro ? 'bg-white/15' : 'bg-gray-100'}`} style={{ height: alto }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${q.pct}%`, background: q.alcanzado ? VERDE : oscuro ? '#fbbf24' : BRAND }} />
      </div>
      <div className={`absolute w-0.5 ${oscuro ? 'bg-white' : 'bg-gray-800'}`}
        style={{ left: `${q.pctUmbral}%`, top: 14, height: alto + 8 }} />
    </div>
  );
}

// Indicador compacto: lateral oscuro de la proyección o tarjeta clara en la vista de espera
export function QuorumPanel({ quorum, oscuro = false }) {
  const q         = calcQuorum(quorum);
  const presentes = useCountUp(q.presentes);
  const okCls     = oscuro ? 'text-green-300' : 'text-green-600';
  const pendCls   = oscuro ? 'text-yellow-300' : 'text-brand';

  return (
    <div className={oscuro
      ? 'bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5'
      : 'w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5'}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-widest ${oscuro ? 'text-white/70' : 'text-gray-500'}`}>Verificación de quórum</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          q.alcanzado
            ? oscuro ? 'bg-green-400/20 text-green-200' : 'bg-green-50 text-green-700 border border-green-200'
            : oscuro ? 'bg-yellow-400/20 text-yellow-200' : 'bg-brand-50 text-brand border border-brand-200'}`}>
          {q.alcanzado ? 'Quórum alcanzado' : 'En verificación'}
        </span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className={`font-extrabold tabular-nums leading-none ${oscuro ? 'text-white text-3xl' : 'text-gray-900 text-5xl'}`}>
          {presentes}
          <span className={`font-semibold ${oscuro ? 'text-white/50 text-base' : 'text-gray-400 text-xl'}`}> / {q.base} acreditados</span>
        </p>
        <span className={`font-extrabold tabular-nums ${q.alcanzado ? okCls : pendCls} ${oscuro ? 'text-xl' : 'text-3xl'}`}>{q.pct}%</span>
      </div>

      <BarraQuorum q={q} alto={oscuro ? 10 : 14} oscuro={oscuro} />

      <p className={`text-xs font-semibold mt-2 ${q.alcanzado ? okCls : oscuro ? 'text-white/70' : 'text-gray-500'}`}>
        {q.alcanzado
          ? `✓ ${q.presentes} presentes de ${q.umbral} requeridos (50% + 1)`
          : `Faltan ${q.faltan} acreditado${q.faltan !== 1 ? 's' : ''} para el quórum (${q.umbral} requeridos, 50% + 1)`}
      </p>

      {!oscuro && quorum?.evolucion?.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Evolución de la asistencia</p>
          <GraficaEvolucion evolucion={quorum.evolucion} umbral={q.umbral} base={q.base} alto={110} compacta />
        </div>
      )}
    </div>
  );
}

// Gráfica de la asistencia acumulada en el tiempo con la línea del umbral de quórum
function GraficaEvolucion({ evolucion, umbral, base, alto = 220, compacta = false }) {
  const contRef = useRef(null);
  const [W, setW] = useState(1000);
  useEffect(() => {
    if (!contRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(contRef.current);
    return () => ro.disconnect();
  }, []);
  const H = alto;
  const pad = compacta ? { l: 8, r: 8, t: 10, b: 18 } : { l: 48, r: 24, t: 20, b: 34 };
  const t0 = evolucion[0][0], t1 = evolucion[evolucion.length - 1][0];
  const maxY = Math.max(umbral, base, evolucion[evolucion.length - 1][1], 1);
  const x = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - (v / maxY) * (H - pad.t - pad.b);

  // Escalones: la asistencia sube por saltos, no en diagonal
  let d = `M ${x(evolucion[0][0])} ${y(evolucion[0][1])}`;
  for (let i = 1; i < evolucion.length; i++) d += ` H ${x(evolucion[i][0])} V ${y(evolucion[i][1])}`;
  const area = `${d} V ${y(0)} H ${x(t0)} Z`;

  const cruce  = umbral > 0 ? evolucion.find(([, v]) => v >= umbral) : null;
  const ultimo = evolucion[evolucion.length - 1];
  const yU     = y(umbral);
  const ticks  = compacta ? [] : [0, 0.25, 0.5, 0.75, 1].map((f) => t0 + f * (t1 - t0));

  return (
    <div ref={contRef} className="w-full">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
      <defs>
        <linearGradient id={`gq-${compacta ? 'c' : 'g'}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.22" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {!compacta && [0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y(maxY * f)} y2={y(maxY * f)} stroke="#e5e7eb" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <text x={pad.l - 8} y={y(maxY * f) + 4} textAnchor="end" fontSize="13" fill="#9ca3af">{Math.round(maxY * f)}</text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="#d1d5db" strokeWidth="1" vectorEffect="non-scaling-stroke" />

      <path d={area} fill={`url(#gq-${compacta ? 'c' : 'g'})`} />
      <path d={d} fill="none" stroke={BRAND} strokeWidth={compacta ? 2 : 3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />

      {umbral > 0 && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={yU} y2={yU} stroke={VERDE} strokeWidth="2" strokeDasharray="8 6" vectorEffect="non-scaling-stroke" />
          <text x={pad.l + 6} y={yU - 6} textAnchor="start" fontSize={compacta ? 11 : 14} fontWeight="700" fill={VERDE}>Quórum · {umbral}</text>
        </g>
      )}

      {cruce && (
        <g>
          <line x1={x(cruce[0])} x2={x(cruce[0])} y1={pad.t} y2={y(0)} stroke={VERDE} strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <circle cx={x(cruce[0])} cy={yU} r={compacta ? 4 : 6} fill={VERDE} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {!compacta && (
            <text x={x(cruce[0]) + (x(cruce[0]) > W * 0.7 ? -8 : 8)} y={pad.t + 12} textAnchor={x(cruce[0]) > W * 0.7 ? 'end' : 'start'}
              fontSize="13" fontWeight="700" fill={VERDE}>Quórum alcanzado · {horaCO(cruce[0])}</text>
          )}
        </g>
      )}

      <circle cx={x(ultimo[0])} cy={y(ultimo[1])} r={compacta ? 4 : 6} fill={BRAND} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke">
        <animate attributeName="r" values={compacta ? '4;6;4' : '6;9;6'} dur="1.6s" repeatCount="indefinite" />
      </circle>

      {ticks.map((t, i) => (
        <text key={i} x={x(t)} y={H - 10} textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'} fontSize="13" fill="#9ca3af">{horaCO(t)}</text>
      ))}
    </svg>
    </div>
  );
}

// Anillo de progreso con la marca del umbral
function Anillo({ q, size = 340 }) {
  const presentes = useCountUp(q.presentes);
  const r = 140, c = 2 * Math.PI * r;
  const frac = q.base > 0 ? Math.min(1, q.presentes / q.base) : 0;
  const ang  = (q.pctUmbral / 100) * 2 * Math.PI - Math.PI / 2;
  const color = q.alcanzado ? VERDE : BRAND;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 320 320" className="w-full h-full -rotate-90">
        <circle cx="160" cy="160" r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        <circle cx="160" cy="160" r={r} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.6s' }} />
      </svg>
      {/* Marca del umbral 50% + 1 */}
      <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
        <line x1={160 + Math.cos(ang) * 122} y1={160 + Math.sin(ang) * 122} x2={160 + Math.cos(ang) * 158} y2={160 + Math.sin(ang) * 158}
          stroke="#111827" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.25em]">Presentes</p>
        <p className="font-black tabular-nums leading-none text-gray-900" style={{ fontSize: size * 0.27 }}>{presentes}</p>
        <p className="text-gray-400 font-semibold text-lg">de {q.base} acreditados</p>
        <p className="font-extrabold tabular-nums text-2xl mt-1" style={{ color }}>{q.pct}%</p>
      </div>
    </div>
  );
}

function Kpi({ icon, valor, etiqueta, acento = 'text-gray-900', fondo = 'bg-white border-gray-200' }) {
  const v = useCountUp(valor);
  return (
    <div className={`rounded-2xl border shadow-sm px-6 py-5 flex items-center gap-4 ${fondo}`}>
      <div className="rounded-xl bg-gray-50 p-3 text-gray-400 flex-shrink-0">{icon}</div>
      <div>
        <p className={`text-4xl font-black tabular-nums leading-none ${acento}`}>{v}</p>
        <p className="text-gray-500 text-sm font-semibold mt-1">{etiqueta}</p>
      </div>
    </div>
  );
}

// Vista completa del quórum para proyectar
export function QuorumPantalla({ quorum, sesion, Logo, qr }) {
  const q      = calcQuorum(quorum);
  const [ahora, setAhora] = useState(() => Date.now());
  const [celebrar, setCelebrar] = useState(false);
  const previo = useRef(q.alcanzado);

  useEffect(() => { const iv = setInterval(() => setAhora(Date.now()), 15000); return () => clearInterval(iv); }, []);

  // Al cruzar el umbral se muestra un aviso breve
  useEffect(() => {
    if (q.alcanzado && !previo.current) {
      setCelebrar(true);
      const t = setTimeout(() => setCelebrar(false), 6000);
      previo.current = true;
      return () => clearTimeout(t);
    }
    previo.current = q.alcanzado;
  }, [q.alcanzado]);

  const presenciales = Math.max(0, q.presentes - q.virtuales);

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col select-none font-montserrat" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-10 py-4 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: q.alcanzado ? '#4ade80' : '#f87171' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: q.alcanzado ? VERDE : BRAND }} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: q.alcanzado ? VERDE : BRAND }}>
                Verificación de quórum
              </span>
            </div>
            <h1 className="text-gray-900 text-xl font-extrabold leading-tight">{sesion.nombre}</h1>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-gray-900 text-3xl font-black tabular-nums">{horaCO(ahora)}</p>
            <p className="text-gray-400 text-xs font-semibold">{sesion.fecha}{sesion.lugar ? ` · ${sesion.lugar}` : ''}</p>
          </div>
          {qr && (
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider text-right leading-tight">Registra tu<br />asistencia</p>
              {qr}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-6 px-12 py-8">
        <div className="flex items-center gap-12 min-h-0">
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <Anillo q={q} size={Math.min(360, typeof window !== 'undefined' ? window.innerHeight * 0.42 : 340)} />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className={`rounded-2xl border px-6 py-4 flex items-center gap-4 transition-colors duration-700 ${q.alcanzado ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
              {q.alcanzado
                ? <CheckCircle size={36} className="text-green-600 flex-shrink-0" />
                : <Target size={36} className="text-brand flex-shrink-0" />}
              <div>
                <p className={`text-2xl font-black ${q.alcanzado ? 'text-green-700' : 'text-gray-900'}`}>
                  {q.alcanzado ? 'Quórum alcanzado' : `Faltan ${q.faltan} para el quórum`}
                </p>
                <p className="text-gray-500 text-sm font-semibold">
                  Se requiere la presencia del 50% + 1 de los acreditados: {q.umbral} de {q.base}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Kpi icon={<Users size={26} />}     valor={q.base}      etiqueta="Acreditados" />
              <Kpi icon={<UserCheck size={26} />} valor={q.presentes} etiqueta="Presentes" acento="text-brand" />
              <Kpi icon={<Target size={26} />}    valor={q.umbral}    etiqueta="Requeridos (50% + 1)" acento="text-green-600" />
            </div>
            <BarraQuorum q={q} alto={18} />
            {q.virtuales > 0 && (
              <div className="flex items-center gap-6 text-sm font-semibold text-gray-500">
                <span className="flex items-center gap-1.5"><MapPin size={15} /> {presenciales} presenciales</span>
                <span className="flex items-center gap-1.5"><Monitor size={15} /> {q.virtuales} virtuales</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 pt-4 pb-2 flex flex-col">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Evolución de la asistencia</p>
          {quorum?.evolucion?.length > 1 ? (
            <div className="flex-1 min-h-0 flex items-end">
              <GraficaEvolucion evolucion={quorum.evolucion} umbral={q.umbral} base={q.base}
                alto={Math.max(160, typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.26) : 220)} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-lg font-semibold">
              La gráfica aparecerá con los primeros registros de asistencia
            </div>
          )}
        </div>
      </div>

      {celebrar && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="flex flex-col items-center gap-4" style={{ animation: 'zoomBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <CheckCircle size={110} className="text-green-600" />
            <p className="text-gray-900 font-black text-center" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>QUÓRUM ALCANZADO</p>
            <p className="text-gray-500 text-2xl font-semibold">{q.presentes} acreditados presentes de {q.umbral} requeridos</p>
          </div>
        </div>
      )}
    </div>
  );
}
