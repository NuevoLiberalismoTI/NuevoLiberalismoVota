'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';

const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
];

export default function RegistroMilitantePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    fechaNacimiento: '',
    genero: '',
    departamento: '',
    municipio: '',
    email: '',
    celular: '',
    contrasena: '',
    confirmarContrasena: '',
    terminos: false,
  });
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrores({ ...errores, [name]: '' });
  };

  const validarPaso1 = () => {
    const e = {};
    if (!form.nombres.trim()) e.nombres = 'Campo requerido';
    if (!form.apellidos.trim()) e.apellidos = 'Campo requerido';
    if (!form.cedula.trim()) e.cedula = 'Campo requerido';
    if (!form.fechaNacimiento) e.fechaNacimiento = 'Campo requerido';
    if (!form.genero) e.genero = 'Campo requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso2 = () => {
    const e = {};
    if (!form.departamento) e.departamento = 'Campo requerido';
    if (!form.municipio.trim()) e.municipio = 'Campo requerido';
    if (!form.email.trim()) e.email = 'Campo requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.celular.trim()) e.celular = 'Campo requerido';
    if (!form.contrasena) e.contrasena = 'Campo requerido';
    else if (form.contrasena.length < 8) e.contrasena = 'Mínimo 8 caracteres';
    if (form.contrasena !== form.confirmarContrasena) e.confirmarContrasena = 'Las contraseñas no coinciden';
    if (!form.terminos) e.terminos = 'Debes aceptar los términos';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSiguiente = () => {
    if (validarPaso1()) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarPaso2()) setEnviado(true);
  };

  if (enviado) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
          <Image src="https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png" alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
          <span className="text-brand-200 text-xs mt-2">Registro de militante</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle size={64} className="text-brand mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-500 text-sm mb-2">
              Bienvenido(a), <span className="font-semibold text-gray-800">{form.nombres}</span>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Tu cuenta ha sido creada. Revisa tu correo para activarla.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="w-full bg-brand py-4 px-4 shadow-md">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <button onClick={() => step === 1 ? router.push('/') : setStep(1)} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <Image src="https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png" alt="Nuevo Liberalismo" width={140} height={46} className="object-contain" priority />
        </div>
      </header>

      {/* Indicador de pasos */}
      <div className="w-full max-w-sm mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-gray-200'}`} />
        </div>
        <p className="text-xs text-gray-400 text-right mb-2">Paso {step} de 2</p>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">

          {/* PASO 1 — Datos personales */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
                <p className="text-sm text-gray-500">Información básica de identificación</p>
              </div>

              <Field label="Nombres" name="nombres" placeholder="Ej: Juan David" value={form.nombres} onChange={handleChange} error={errores.nombres} />
              <Field label="Apellidos" name="apellidos" placeholder="Ej: García Ruiz" value={form.apellidos} onChange={handleChange} error={errores.apellidos} />
              <Field label="Número de cédula" name="cedula" type="number" placeholder="Ej: 1234567890" value={form.cedula} onChange={handleChange} error={errores.cedula} />
              <Field label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} error={errores.fechaNacimiento} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Género</label>
                <select name="genero" value={form.genero} onChange={handleChange} className={selectClass(errores.genero)}>
                  <option value="">Selecciona...</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>No binario</option>
                  <option>Prefiero no decir</option>
                </select>
                {errores.genero && <span className="text-xs text-brand">{errores.genero}</span>}
              </div>

              <button onClick={handleSiguiente} className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors mt-2">
                Siguiente
              </button>
            </div>
          )}

          {/* PASO 2 — Contacto y acceso */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Contacto y acceso</h2>
                <p className="text-sm text-gray-500">Ubicación, correo y contraseña</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Departamento</label>
                <select name="departamento" value={form.departamento} onChange={handleChange} className={selectClass(errores.departamento)}>
                  <option value="">Selecciona...</option>
                  {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                </select>
                {errores.departamento && <span className="text-xs text-brand">{errores.departamento}</span>}
              </div>

              <Field label="Municipio" name="municipio" placeholder="Ej: Medellín" value={form.municipio} onChange={handleChange} error={errores.municipio} />
              <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} error={errores.email} />
              <Field label="Celular" name="celular" type="tel" placeholder="Ej: 3001234567" value={form.celular} onChange={handleChange} error={errores.celular} />

              {/* Contraseña */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <div className="relative">
                  <input name="contrasena" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={form.contrasena} onChange={handleChange}
                    className={inputClass(errores.contrasena) + ' pr-11'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errores.contrasena && <span className="text-xs text-brand">{errores.contrasena}</span>}
              </div>

              {/* Confirmar contraseña */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Confirmar contraseña</label>
                <div className="relative">
                  <input name="confirmarContrasena" type={showConfirm ? 'text' : 'password'} placeholder="Repite la contraseña" value={form.confirmarContrasena} onChange={handleChange}
                    className={inputClass(errores.confirmarContrasena) + ' pr-11'} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errores.confirmarContrasena && <span className="text-xs text-brand">{errores.confirmarContrasena}</span>}
              </div>

              {/* Términos */}
              <div className="flex flex-col gap-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="terminos" checked={form.terminos} onChange={handleChange} className="mt-0.5 accent-brand w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    Acepto los <a href="#" className="text-brand underline">términos y condiciones</a> y la{' '}
                    <a href="#" className="text-brand underline">política de privacidad</a>
                  </span>
                </label>
                {errores.terminos && <span className="text-xs text-brand">{errores.terminos}</span>}
              </div>

              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors mt-1">
                <UserPlus size={18} />
                Registrarme como militante
              </button>
            </form>
          )}

        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}

function inputClass(error) {
  return `w-full border ${error ? 'border-brand-200' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`;
}

function selectClass(error) {
  return `w-full border ${error ? 'border-brand-200' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition`;
}

function Field({ label, name, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} className={inputClass(error)} />
      {error && <span className="text-xs text-brand">{error}</span>}
    </div>
  );
}
