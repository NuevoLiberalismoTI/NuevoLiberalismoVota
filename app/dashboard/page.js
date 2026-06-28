'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Clock, CheckCircle, PlayCircle, UserPlus, UserMinus, Loader2, MapPin, Calendar, Radio, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const ESTADO_CFG = {
  en_curso:   { label: 'En curso',   color: 'bg-green-100 text-green-700', dot: 'bg-green-500',  Icon: PlayCircle  },
  proxima:    { label: 'Próxima',    color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400',   Icon: Clock       },
  finalizada: { label: 'Finalizada', color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400',   Icon: CheckCircle },
};

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario]       = useState(null);
  const [sesiones, setSesiones]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [accionId, setAccionId]     = useState(null);
  const [tab, setTab]               = useState('activas');

  const cargar = async (cedula) => {
    const [{ data, error }, { data: acredData }] = await Promise.all([
      supabase.rpc('get_asambleas_usuario', { p_cedula: cedula }),
      supabase.from('inscripciones').select('asamblea_id, estado_acreditacion').eq('cedula', cedula),
    ]);
    if (!error && data) {
      const acredMap = {};
      (acredData || []).forEach((i) => { acredMap[i.asamblea_id] = i.estado_acreditacion; });
      setSesiones(data.map((s) => ({ ...s, estado_acreditacion: acredMap[s.id] || null })));
    }
    setCargando(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    const u = JSON.parse(stored);
    setUsuario(u);
    cargar(u.cedula);

    // Polling cada 5 segundos para detectar cambios de estado en asambleas
    const interval = setInterval(() => cargar(u.cedula), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleInscribirse = async (id) => {
    setAccionId(id);
    const res = await fetch('/api/inscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asambleaId: id, cedula: usuario.cedula }),
    });
    const data = await res.json();
    if (!data.ok) alert(data.error || 'Error al inscribirse');
    await cargar(usuario.cedula);
    setAccionId(null);
  };

  const handleCancelar = async (id) => {
    setAccionId(id);
    const { data } = await supabase.rpc('cancelar_inscripcion', { p_asamblea_id: id, p_cedula: usuario.cedula });
    if (!data?.ok) alert(data?.error || 'Error al cancelar');
    await cargar(usuario.cedula);
    setAccionId(null);
  };

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={140} height={46} className="object-contain" priority />
          <button onClick={() => { sessionStorage.removeItem('usuario'); router.push('/'); }}
            className="flex items-center gap-1.5 text-white text-xs font-semibold hover:text-brand-200 transition-colors">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-5 flex flex-col gap-4 flex-1">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Bienvenido(a)</p>
          <h1 className="text-xl font-bold text-gray-900">{usuario.nombre}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Cédula: {usuario.cedula}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'activas',     label: 'En curso / Próximas', Icon: Radio        },
            { key: 'finalizadas', label: 'Finalizadas',          Icon: CheckCircle  },
          ].map(({ key, label, Icon }) => {
            const count = key === 'activas'
              ? sesiones.filter((s) => s.estado !== 'finalizada').length
              : sesiones.filter((s) => s.estado === 'finalizada').length;
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  tab === key ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={12} />{label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    tab === key ? 'bg-brand text-white' : 'bg-gray-300 text-gray-600'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {cargando && (
          <div className="flex justify-center py-12">
            <Loader2 size={30} className="text-brand animate-spin" />
          </div>
        )}

        {!cargando && sesiones.filter((s) =>
          tab === 'activas' ? s.estado !== 'finalizada' : s.estado === 'finalizada'
        ).length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">
              {tab === 'activas' ? 'No hay asambleas activas o próximas' : 'No hay asambleas finalizadas'}
            </p>
          </div>
        )}

        {sesiones.filter((s) =>
          tab === 'activas' ? s.estado !== 'finalizada' : s.estado === 'finalizada'
        ).map((s) => {
          const cfg    = ESTADO_CFG[s.estado] || ESTADO_CFG.proxima;
          const activa = s.estado === 'en_curso';
          const busy   = accionId === s.id;
          const cuposAgotados = s.cupo_maximo && s.total_inscritos >= s.cupo_maximo;

          return (
            <div key={s.id} className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all ${activa && s.esta_inscrito ? 'border-brand' : 'border-gray-100'}`}>

              {/* Cabecera */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{s.nombre}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{s.id}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>

              {/* Detalles */}
              <div className="flex flex-col gap-1 mb-4">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={11} /> {s.fecha} · {s.hora}
                </span>
                {s.lugar && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} /> {s.lugar}
                  </span>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.tipo_nombre}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.colectivo_nombre}</span>
                  {s.cupo_maximo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cuposAgotados ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {s.total_inscritos}/{s.cupo_maximo} cupos
                    </span>
                  )}
                </div>
              </div>

              {/* Badge de acreditación */}
              {s.esta_inscrito && s.estado_acreditacion && (
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl mb-3 border ${
                  s.estado_acreditacion === 'acreditado_voto'    ? 'bg-green-50 text-green-700 border-green-200' :
                  s.estado_acreditacion === 'acreditado_ingreso' ? 'bg-blue-50 text-blue-700 border-blue-200'   :
                  s.estado_acreditacion === 'rechazado'          ? 'bg-red-50 text-red-600 border-red-200'       :
                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {s.estado_acreditacion === 'acreditado_voto'    && <><ShieldCheck size={13} /> Acreditado — Ingreso y Voto</>}
                  {s.estado_acreditacion === 'acreditado_ingreso' && <><ShieldCheck size={13} /> Acreditado — Solo Ingreso (sin voto)</>}
                  {s.estado_acreditacion === 'rechazado'          && <><ShieldX size={13} /> Acceso rechazado — Contacta al administrador</>}
                  {s.estado_acreditacion === 'preinscrito'        && <><Shield size={13} /> Preinscrito — pendiente de acreditación</>}
                </div>
              )}

              {/* Acciones */}
              {s.estado === 'finalizada' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                      s.esta_inscrito
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {s.esta_inscrito ? <CheckCircle size={13} /> : <UserMinus size={13} />}
                      {s.esta_inscrito ? 'Inscrito' : 'No inscrito'}
                    </div>
                    <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                      s.ya_asistio
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {s.ya_asistio ? <CheckCircle size={13} /> : <UserMinus size={13} />}
                      {s.ya_asistio ? 'Asistió' : 'No asistió'}
                    </div>
                  </div>
                  {s.ya_asistio && (
                    <button onClick={() => router.push(`/sesion/${encodeURIComponent(s.id)}`)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-colors">
                      <CheckCircle size={13} /> Ver resumen de votación
                    </button>
                  )}
                </div>
              ) : s.esta_inscrito ? (
                <div className="flex flex-col gap-2">
                  {activa ? (
                    <button onClick={() => router.push(`/sesion/${encodeURIComponent(s.id)}`)}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
                      <PlayCircle size={18} /> Ingresar a la sesión
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-semibold py-2.5 rounded-xl text-sm border border-blue-200">
                      <CheckCircle size={14} /> Inscrito — sesión próximamente
                    </div>
                  )}
                  <button onClick={() => handleCancelar(s.id)} disabled={busy}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 py-1.5 transition-colors disabled:opacity-50">
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
                    Cancelar inscripción
                  </button>
                </div>
              ) : cuposAgotados ? (
                <div className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 font-semibold py-2.5 rounded-xl text-sm border border-red-200">
                  Sin cupos disponibles
                </div>
              ) : (
                <button onClick={() => handleInscribirse(s.id)} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand text-brand hover:bg-brand-50 font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {busy ? 'Inscribiendo...' : 'Inscribirme'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-4">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}
