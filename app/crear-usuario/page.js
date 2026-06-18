'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle, UserX, Loader2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function enmascararEmail(email) {
  if (!email) return '***@***.com';
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
}

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [step, setStep]             = useState(1);
  const [cedula, setCedula]         = useState('');
  const [errorCedula, setErrorCedula] = useState('');
  const [militante, setMilitante]   = useState(null);
  const [cargando, setCargando]     = useState(false);

  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [password, setPassword]     = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [errPass, setErrPass]       = useState({});

  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [errCodigo, setErrCodigo]             = useState('');
  const [reenviando, setReenviando]           = useState(false);

  // ── PASO 1: Validar cédula contra Supabase ───────────────────────────────
  const handleValidarCedula = async () => {
    if (!cedula.trim()) { setErrorCedula('Ingresa tu número de cédula'); return; }
    setCargando(true);
    setErrorCedula('');
    try {
      const res = await fetch(`/api/militante?cedula=${encodeURIComponent(cedula.trim())}`);
      const json = await res.json();

      if (!json.ok) {
        setErrorCedula(json.tipo || json.error || 'no_encontrado');
        return;
      }

      setMilitante(json.militante);
      setStep(2);
    } catch {
      setErrorCedula('Error al verificar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // ── PASO 2: Validar contraseña y generar código en Supabase ─────────────
  const handleAsignarPassword = async () => {
    const e = {};
    if (!password) e.password = 'Campo requerido';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrPass(e);
    if (Object.keys(e).length > 0) return;

    setCargando(true);
    try {
      const nombreCompleto = [militante.nombres, militante.apellidos].filter(Boolean).join(' ');
      const { data, error } = await supabase.functions.invoke('enviar-codigo', {
        body: { cedula: cedula.trim(), tipo: 'creacion', email: militante.email, nombre: nombreCompleto },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error al enviar código');
      setCodigoIngresado('');
      setStep(3);
    } catch (err) {
      setErrPass({ ...errPass, password: err.message || 'Error al enviar código. Intenta de nuevo.' });
    } finally {
      setCargando(false);
    }
  };

  // ── PASO 3: Verificar código en Supabase y crear usuario ─────────────────
  const handleVerificarYCrear = async () => {
    if (!codigoIngresado.trim()) { setErrCodigo('Ingresa el código'); return; }
    setCargando(true);
    setErrCodigo('');
    try {
      const nombreCompleto = [militante.nombres, militante.apellidos].filter(Boolean).join(' ');
      const { data, error } = await supabase.rpc('verificar_y_crear_usuario', {
        p_cedula:   cedula.trim(),
        p_codigo:   codigoIngresado.trim(),
        p_password: password,
        p_nombre:   nombreCompleto,
        p_email:    militante.email || '',
      });
      if (error) throw error;
      if (!data?.ok) { setErrCodigo(data?.error || 'Código incorrecto o expirado'); return; }
      setStep(4);
    } catch {
      setErrCodigo('Error al verificar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const handleReenviar = async () => {
    setReenviando(true);
    setErrCodigo('');
    try {
      const { data, error } = await supabase.functions.invoke('enviar-codigo', {
        body: { cedula: cedula.trim(), tipo: 'creacion' },
      });
      if (error) throw error;
      if (!data?.ok) setErrCodigo(data?.error || 'Error al reenviar');
      setCodigoIngresado('');
    } catch {
      setErrCodigo('Error al reenviar el código.');
    } finally {
      setTimeout(() => setReenviando(false), 2000);
    }
  };

  const Header = ({ subtitulo }) => (
    <header className="w-full bg-brand py-4 px-4 shadow-md">
      <div className="max-w-sm mx-auto flex items-center gap-3">
        <button onClick={() => step === 1 ? router.push('/') : setStep(step - 1)} className="text-white flex-shrink-0">
          <ArrowLeft size={22}/>
        </button>
        <div className="flex flex-col">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority/>
          {subtitulo && <span className="text-brand-200 text-xs mt-0.5">{subtitulo}</span>}
        </div>
      </div>
    </header>
  );

  // ══ PASO 1: Cédula ══════════════════════════════════════════════════════
  if (step === 1) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Crear usuario"/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><ShieldCheck size={36} className="text-brand"/></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Verifica tu cédula</h2>
          <p className="text-sm text-gray-500 mb-6">Solo los militantes registrados y activos pueden crear un usuario.</p>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-semibold text-gray-700">Número de cédula</label>
            <input type="number" value={cedula}
              onChange={(e) => { setCedula(e.target.value); setErrorCedula(''); }}
              placeholder="Ej: 1234567890"
              className={`w-full border ${errorCedula && !['no_encontrado','no_activo','ya_existe'].includes(errorCedula) ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleValidarCedula()}
            />
            {errorCedula && !['no_encontrado','no_activo','ya_existe'].includes(errorCedula) && (
              <span className="text-xs text-red-500">{errorCedula}</span>
            )}
          </div>

          {/* Alertas específicas */}
          {(errorCedula === 'no_encontrado' || errorCedula === 'no_activo') && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex gap-3">
              <UserX size={20} className="text-orange-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  {errorCedula === 'no_activo' ? 'Tu inscripción está pendiente de aprobación' : 'No estás registrado como militante'}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {errorCedula === 'no_activo'
                    ? 'Contacta al coordinador de tu zona para activar tu inscripción.'
                    : 'Debes inscribirte primero como militante del Nuevo Liberalismo.'}
                </p>
                {errorCedula === 'no_encontrado' && (
                  <a href="https://nuevoliberalismo.org/militancia/" target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs font-bold text-white bg-brand hover:bg-brand-hover px-4 py-2 rounded-lg transition-colors">
                    Inscribirme como militante
                  </a>
                )}
              </div>
            </div>
          )}

          {errorCedula === 'ya_existe' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-blue-800">Ya tienes un usuario creado</p>
              <p className="text-xs text-blue-700 mt-1">Usa tu cédula y contraseña para iniciar sesión.</p>
              <a href="/" className="inline-block mt-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                Ir a iniciar sesión
              </a>
            </div>
          )}

          <button onClick={handleValidarCedula} disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {cargando ? <Loader2 size={17} className="animate-spin"/> : <ShieldCheck size={17}/>}
            {cargando ? 'Verificando...' : 'Verificar cédula'}
          </button>
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ PASO 2: Contraseña ═══════════════════════════════════════════════════
  if (step === 2) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Crea tu contraseña"/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-semibold text-green-800">¡Militante verificado!</p>
              <p className="text-xs text-green-700 mt-0.5">{militante?.nombres} {militante?.apellidos}</p>
              <p className="text-xs text-green-600 mt-0.5">Cédula: {cedula}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Crea tu contraseña</h2>
          <p className="text-sm text-gray-500 mb-5">
            Tu usuario será tu número de cédula: <span className="font-bold text-gray-800">{cedula}</span>
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrPass({...errPass, password:''}); }}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full border ${errPass.password ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errPass.password && <span className="text-xs text-red-500">{errPass.password}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Confirmar contraseña</label>
              <div className="relative">
                <input type={showConf ? 'text' : 'password'} value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setErrPass({...errPass, confirmar:''}); }}
                  placeholder="Repite la contraseña"
                  className={`w-full border ${errPass.confirmar ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
                />
                <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConf ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errPass.confirmar && <span className="text-xs text-red-500">{errPass.confirmar}</span>}
            </div>

            <button onClick={handleAsignarPassword}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors mt-1">
              Continuar
            </button>
          </div>
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ PASO 3: Código de verificación ═══════════════════════════════════════
  if (step === 3) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Verifica tu correo"/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><Mail size={36} className="text-brand"/></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código enviado</h2>
          <p className="text-sm text-gray-500 mb-1 text-center">Enviamos un código de 6 dígitos a:</p>
          <p className="text-sm font-bold text-gray-800 mb-5 text-center">{enmascararEmail(militante?.email)}</p>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-5 text-center">
            <p className="text-xs text-brand font-medium">El código tiene vigencia de 15 minutos</p>
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-semibold text-gray-700">Código de verificación</label>
            <input type="text" inputMode="numeric" maxLength={6}
              value={codigoIngresado}
              onChange={(e) => { setCodigoIngresado(e.target.value.replace(/\D/g,'')); setErrCodigo(''); }}
              placeholder="· · · · · ·"
              className={`w-full border ${errCodigo ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarYCrear()}
            />
            {errCodigo && <span className="text-xs text-red-500 text-center">{errCodigo}</span>}
          </div>

          <button onClick={handleVerificarYCrear} disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mb-3">
            {cargando ? <Loader2 size={17} className="animate-spin"/> : <CheckCircle size={17}/>}
            {cargando ? 'Creando cuenta...' : 'Verificar y crear cuenta'}
          </button>

          <button onClick={handleReenviar} disabled={reenviando}
            className="w-full text-sm text-brand font-semibold py-2 hover:underline disabled:opacity-50">
            {reenviando ? 'Código reenviado ✓' : '¿No recibiste el código? Reenviar'}
          </button>
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ PASO 4: Éxito ════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority/>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle size={64} className="text-brand mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Usuario creado!</h2>
          <p className="text-gray-500 text-sm mb-6">Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 mb-1">Tu usuario es:</p>
            <p className="text-xl font-bold text-brand tracking-widest">{cedula}</p>
            <p className="text-xs text-gray-400 mt-2">Guarda este dato para iniciar sesión</p>
          </div>
          <button onClick={() => router.push('/')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Ir a iniciar sesión
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
