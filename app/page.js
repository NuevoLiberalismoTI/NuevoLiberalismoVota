'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, UserPlus, Loader2, AlertTriangle } from 'lucide-react';
export default function HomePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]     = useState({ usuario: '', contrasena: '' });
  const [error, setError]   = useState('');
  const [cargando, setCargando] = useState(false);
  const [kickedMsg, setKickedMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('kicked') === '1') {
      setKickedMsg('Tu sesión fue iniciada en otro dispositivo. Inicia sesión nuevamente.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.usuario.trim() || !form.contrasena) {
      setError('Completa todos los campos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: form.usuario.trim(), contrasena: form.contrasena }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Usuario o contraseña incorrectos');
        return;
      }
      const user = { ...json.user, tokenDispositivo: json.tokenDispositivo ?? null };
      sessionStorage.setItem('usuario', JSON.stringify(user));
      const params = new URLSearchParams(window.location.search);
      const retorno = params.get('retorno');
      if (retorno && user.rol !== 'admin') {
        router.push(retorno);
      } else {
        router.push(user.rol === 'admin' ? '/admin' : '/dashboard');
      }
    } catch {
      setError('Error al conectar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <Image
          src="https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png"
          alt="Nuevo Liberalismo" width={180} height={60} className="object-contain" priority
        />
        <span className="text-brand-200 text-xs mt-2">Plataforma oficial de participación</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-6">

        {kickedMsg && (
          <div className="w-full max-w-sm flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700 font-medium">{kickedMsg}</p>
          </div>
        )}

        {/* Card Login */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresa con tu cuenta de militante</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700" htmlFor="usuario">Usuario (No. de identificación)</label>
              <input
                id="usuario" name="usuario" type="text" autoComplete="username"
                value={form.usuario} onChange={handleChange} placeholder="Ingresa tu número de identificación"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700" htmlFor="contrasena">Contraseña</label>
              <div className="relative">
                <input
                  id="contrasena" name="contrasena"
                  type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.contrasena} onChange={handleChange} placeholder="Ingresa tu contraseña"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              <a href="/recuperar-password" className="text-xs text-brand hover:underline self-end mt-1">¿Olvidaste tu contraseña?</a>
            </div>

            {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}

            <button type="submit" disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover active:bg-brand-active disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-1">
              {cargando ? <Loader2 size={18} className="animate-spin"/> : <LogIn size={18}/>}
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <div className="w-full max-w-sm flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"/>
          <span className="text-xs text-gray-400 font-medium">¿No tienes cuenta?</span>
          <div className="flex-1 h-px bg-gray-300"/>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <a href="/crear-usuario"
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">
            <UserPlus size={18}/> Crear usuario
          </a>
          <a href="https://nuevoliberalismo.org/militancia/" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand text-brand hover:bg-brand-50 active:bg-brand-100 font-bold py-3.5 rounded-xl transition-colors shadow-sm">
            <UserPlus size={18}/> Registrarme como militante
          </a>
       
        </div>

      </div>

      <footer className="text-center text-xs text-gray-400 py-4 px-4 border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}
