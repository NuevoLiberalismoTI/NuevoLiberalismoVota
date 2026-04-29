'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Mail, CheckCircle, UserX } from 'lucide-react';

// Base simulada de militantes registrados { cedula, nombre, email }
const MILITANTES_DB = [
  { cedula: '1234567890', nombre: 'Juan David García', email: 'ju***@ejemplo.com', emailReal: 'juan@ejemplo.com' },
  { cedula: '9876543210', nombre: 'María López', email: 'ma***@ejemplo.com', emailReal: 'maria@ejemplo.com' },
  { cedula: '1111111111', nombre: 'Carlos Mendez', email: 'ca***@ejemplo.com', emailReal: 'carlos@ejemplo.com' },
];

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: cédula, 2: contraseña, 3: código, 4: éxito
  const [cedula, setCedula] = useState('');
  const [errorCedula, setErrorCedula] = useState('');
  const [militante, setMilitante] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errPass, setErrPass] = useState({});
  const [codigoEnviado, setCodigoEnviado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [errCodigo, setErrCodigo] = useState('');
  const [reenviando, setReenviando] = useState(false);

  // PASO 1 — Validar cédula
  const handleValidarCedula = () => {
    if (!cedula.trim()) { setErrorCedula('Ingresa tu número de cédula'); return; }
    const encontrado = MILITANTES_DB.find((m) => m.cedula === cedula.trim());
    if (!encontrado) {
      setErrorCedula('no_encontrado');
      return;
    }
    setErrorCedula('');
    setMilitante(encontrado);
    setStep(2);
  };

  // PASO 2 — Validar contraseña y "enviar" código
  const handleAsignarPassword = () => {
    const e = {};
    if (!password) e.password = 'Campo requerido';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrPass(e);
    if (Object.keys(e).length > 0) return;

    const codigo = generarCodigo();
    setCodigoEnviado(codigo);
    // En producción aquí se llamaría al API de envío de correo
    console.log(`Código enviado a ${militante.emailReal}: ${codigo}`);
    setStep(3);
  };

  // PASO 3 — Verificar código
  const handleVerificarCodigo = () => {
    if (!codigoIngresado.trim()) { setErrCodigo('Ingresa el código'); return; }
    if (codigoIngresado.trim() !== codigoEnviado) { setErrCodigo('Código incorrecto. Verifica tu correo.'); return; }
    setErrCodigo('');
    setStep(4);
  };

  const handleReenviar = () => {
    setReenviando(true);
    const codigo = generarCodigo();
    setCodigoEnviado(codigo);
    setCodigoIngresado('');
    setErrCodigo('');
    console.log(`Nuevo código enviado: ${codigo}`);
    setTimeout(() => setReenviando(false), 2000);
  };

  const Header = ({ subtitulo }) => (
    <header className="w-full bg-brand py-4 px-4 shadow-md">
      <div className="max-w-sm mx-auto flex items-center gap-3">
        <button onClick={() => step === 1 ? router.push('/') : setStep(step - 1)} className="text-white flex-shrink-0">
          <ArrowLeft size={22} />
        </button>
        <div className="flex flex-col">
          <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority />
          {subtitulo && <span className="text-brand-200 text-xs mt-0.5">{subtitulo}</span>}
        </div>
      </div>
    </header>
  );

  // ── PASO 1: Cédula ──────────────────────────────────────────────────────────
  if (step === 1) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Crear usuario" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <ShieldCheck size={36} className="text-brand mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Verifica tu cédula</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ingresa tu número de cédula. Solo los militantes registrados pueden crear un usuario.
          </p>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-semibold text-gray-700">Número de cédula</label>
            <input
              type="number"
              value={cedula}
              onChange={(e) => { setCedula(e.target.value); setErrorCedula(''); }}
              placeholder="Ej: 1234567890"
              className={`w-full border ${errorCedula && errorCedula !== 'no_encontrado' ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleValidarCedula()}
            />
            {errorCedula && errorCedula !== 'no_encontrado' && (
              <span className="text-xs text-red-500">{errorCedula}</span>
            )}
          </div>

          {/* No encontrado */}
          {errorCedula === 'no_encontrado' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex gap-3">
              <UserX size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">No estás registrado como militante</p>
                <p className="text-xs text-orange-700 mt-1">
                  Para crear un usuario debes estar inscrito como militante del Nuevo Liberalismo.
                </p>
                <a
                  href="/registro-militante"
                  className="inline-block mt-3 text-xs font-bold text-white bg-brand hover:bg-brand-hover px-4 py-2 rounded-lg transition-colors"
                >
                  Inscribirme como militante
                </a>
              </div>
            </div>
          )}

          <button
            onClick={handleValidarCedula}
            className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors"
          >
            Verificar cédula
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── PASO 2: Contraseña ──────────────────────────────────────────────────────
  if (step === 2) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Asigna tu contraseña" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">

          {/* Info militante */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">¡Militante verificado!</p>
              <p className="text-xs text-green-700 mt-0.5">{militante?.nombre}</p>
              <p className="text-xs text-green-600 mt-0.5">Cédula: {cedula}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Crea tu contraseña</h2>
          <p className="text-sm text-gray-500 mb-5">
            Tu usuario será tu número de cédula: <span className="font-bold text-gray-800">{cedula}</span>
          </p>

          <div className="flex flex-col gap-4">
            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrPass({ ...errPass, password: '' }); }}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full border ${errPass.password ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errPass.password && <span className="text-xs text-red-500">{errPass.password}</span>}
            </div>

            {/* Confirmar */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrPass({ ...errPass, confirmPassword: '' }); }}
                  placeholder="Repite la contraseña"
                  className={`w-full border ${errPass.confirmPassword ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errPass.confirmPassword && <span className="text-xs text-red-500">{errPass.confirmPassword}</span>}
            </div>

            <button
              onClick={handleAsignarPassword}
              className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors mt-1"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── PASO 3: Código de verificación ─────────────────────────────────────────
  if (step === 3) return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header subtitulo="Verifica tu correo" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-50 rounded-full p-4">
              <Mail size={36} className="text-brand" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">Código enviado</h2>
          <p className="text-sm text-gray-500 mb-1 text-center">
            Enviamos un código de 6 dígitos a:
          </p>
          <p className="text-sm font-bold text-gray-800 mb-6 text-center">{militante?.email}</p>

          {/* Demo: mostrar código en pantalla (solo para desarrollo) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-center">
            <p className="text-xs text-yellow-700 font-medium">Modo demo — código de prueba:</p>
            <p className="text-2xl font-bold text-yellow-800 tracking-widest mt-1">{codigoEnviado}</p>
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm font-semibold text-gray-700">Código de verificación</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigoIngresado}
              onChange={(e) => { setCodigoIngresado(e.target.value.replace(/\D/g, '')); setErrCodigo(''); }}
              placeholder="· · · · · ·"
              className={`w-full border ${errCodigo ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarCodigo()}
            />
            {errCodigo && <span className="text-xs text-red-500 text-center">{errCodigo}</span>}
          </div>

          <button
            onClick={handleVerificarCodigo}
            className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors mb-3"
          >
            Verificar código
          </button>

          <button
            onClick={handleReenviar}
            disabled={reenviando}
            className="w-full text-sm text-brand font-semibold py-2 hover:underline disabled:opacity-50"
          >
            {reenviando ? 'Código reenviado ✓' : '¿No recibiste el código? Reenviar'}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );

  // ── PASO 4: Éxito ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle size={64} className="text-brand mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Usuario creado!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 mb-1">Tu usuario es:</p>
            <p className="text-xl font-bold text-brand tracking-widest">{cedula}</p>
            <p className="text-xs text-gray-400 mt-2">Guarda este dato para iniciar sesión</p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors"
          >
            Ir a iniciar sesión
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
