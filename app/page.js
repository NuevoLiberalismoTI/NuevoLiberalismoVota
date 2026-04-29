'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Calendar } from 'lucide-react';

export default function HomePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ usuario: '', contrasena: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // lógica de login próximamente
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
        <span className="text-white text-xs font-bold uppercase tracking-widest mb-1">
          Partido
        </span>
        <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
          Nuevo Liberalismo
        </h1>
        <span className="text-brand-200 text-xs mt-1">Plataforma oficial de participación</span>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-6">

        {/* Card Login */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresa con tu cuenta de militante</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* Usuario */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700" htmlFor="usuario">
                Usuario
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                value={form.usuario}
                onChange={handleChange}
                placeholder="Ingresa tu usuario"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700" htmlFor="contrasena">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  name="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.contrasena}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <a href="#" className="text-xs text-brand hover:underline self-end mt-1">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón iniciar sesión */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold py-3 rounded-xl transition-colors mt-1"
            >
              <LogIn size={18} />
              Iniciar sesión
            </button>
          </form>
        </div>

        {/* Divisor */}
        <div className="w-full max-w-sm flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs text-gray-400 font-medium">¿No tienes cuenta?</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Botones de registro */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <a
            href="/registro-militante"
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand text-brand hover:bg-brand-50 active:bg-brand-100 font-bold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            <UserPlus size={18} />
            Registrarme como militante
          </a>
          <a
            href="/registro-asamblea"
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 font-bold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            <Calendar size={18} />
            Registrarme a una asamblea
          </a>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 px-4 border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>

    </main>
  );
}
