'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Mail, Eye, EyeOff, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function enmascararEmail(email) {
  if (!email) return '***@***.com';
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
}

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [step, setStep]             = useState(1); // 1: cédula, 2: código, 3: nueva pass, 4: éxito
  const [cedula, setCedula]         = useState('');
  const [emailEnmascarado, setEmailEnmascarado] = useState('');
  const [codigo, setCodigo]         = useState('');
  const [password, setPassword]     = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [error, setError]           = useState('');
  const [cargando, setCargando]     = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // ── PASO 1: Solicitar código por cédula ──────────────────────────────────
  const handleSolicitar = async () => {
    if (!cedula.trim()) { setError('Ingresa tu número de cédula'); return; }
    setCargando(true); setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('enviar-codigo', {
        body: { cedula: cedula.trim(), tipo: 'cambio_password' },
      });
      if (err) throw err;
      if (!data?.ok) { setError(data?.error || 'Cédula no encontrada'); return; }
      setEmailEnmascarado(enmascararEmail(data.email));
      setStep(2);
    } catch {
      setError('Error al conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // ── PASO 2: Verificar código ──────────────────────────────────────────────
  const handleVerificarCodigo = () => {
    if (!codigo.trim() || codigo.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    setError('');
    setStep(3);
  };

  const handleReenviar = async () => {
    setReenviando(true); setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('enviar-codigo', {
        body: { cedula: cedula.trim(), tipo: 'cambio_password' },
      });
      if (err) throw err;
      if (!data?.ok) setError(data?.error || 'Error al reenviar');
      setCodigo('');
    } catch {
      setError('Error al reenviar.');
    } finally {
      setTimeout(() => setReenviando(false), 2000);
    }
  };

  // ── PASO 3: Cambiar contraseña ────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    if (!password) { setError('Ingresa la nueva contraseña'); return; }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true); setError('');
    try {
      const { data, error: err } = await supabase.rpc('cambiar_password', {
        p_cedula:          cedula.trim(),
        p_codigo:          codigo.trim(),
        p_nueva_password:  password,
      });
      if (err) throw err;
      if (!data?.ok) { setError(data?.error || 'Código incorrecto o expirado'); return; }
      setStep(4);
    } catch {
      setError('Error al cambiar la contraseña. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const Header = () => (
    <header className="w-full bg-brand py-4 px-4 shadow-md">
      <div className="max-w-sm mx-auto flex items-center gap-3">
        <button onClick={() => step === 1 ? router.push('/') : setStep(step - 1)} className="text-white flex-shrink-0">
          <ArrowLeft size={22}/>
        </button>
        <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority/>
      </div>
    </header>
  );

  const inputCls = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`;

  // ══ PASO 1: Cédula ══════════════════════════════════════════════════════
  if (step === 1) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><ShieldCheck size={36} className="text-brand"/></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Recuperar contraseña</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Ingresa tu cédula y te enviaremos un código de verificación a tu correo registrado.
          </p>

          <div className="flex flex-col gap-1 mb-5">
            <label className="text-sm font-semibold text-gray-700">Número de cédula</label>
            <input type="number" value={cedula}
              onChange={(e) => { setCedula(e.target.value); setError(''); }}
              placeholder="Ej: 1234567890"
              className={inputCls(error)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolicitar()}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          <button onClick={handleSolicitar} disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {cargando ? <Loader2 size={17} className="animate-spin"/> : <Mail size={17}/>}
            {cargando ? 'Enviando código...' : 'Enviar código al correo'}
          </button>
        </div>
      </div>
      <Footer/>
    </main>
  );

  // ══ PASO 2: Código ═══════════════════════════════════════════════════════
  if (step === 2) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4"><Mail size={36} className="text-brand"/></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código enviado</h2>
          <p className="text-sm text-gray-500 mb-1 text-center">Enviamos un código de 6 dígitos a:</p>
          <p className="text-sm font-bold text-gray-800 mb-2 text-center">{emailEnmascarado}</p>
          <p className="text-xs text-gray-400 mb-5 text-center">Vigencia: 15 minutos</p>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-semibold text-gray-700">Código de verificación</label>
            <input type="text" inputMode="numeric" maxLength={6}
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value.replace(/\D/g,'')); setError(''); }}
              placeholder="· · · · · ·"
              className={`w-full border ${error ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarCodigo()}
            />
            {error && <span className="text-xs text-red-500 text-center">{error}</span>}
          </div>

          <button onClick={handleVerificarCodigo}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors mb-3">
            Verificar código
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

  // ══ PASO 3: Nueva contraseña ═════════════════════════════════════════════
  if (step === 3) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Nueva contraseña</h2>
          <p className="text-sm text-gray-500 mb-6">Crea tu nueva contraseña de acceso</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Nueva contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls(error)} pr-11`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Confirmar contraseña</label>
              <div className="relative">
                <input type={showConf ? 'text' : 'password'} value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setError(''); }}
                  placeholder="Repite la contraseña"
                  className={`${inputCls(error)} pr-11`}
                />
                <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConf ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button onClick={handleCambiarPassword} disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-1">
              {cargando ? <Loader2 size={17} className="animate-spin"/> : <ShieldCheck size={17}/>}
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-500 text-sm mb-8">Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.</p>
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
