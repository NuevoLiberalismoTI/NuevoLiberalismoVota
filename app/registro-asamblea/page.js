'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle, MapPin, Clock } from 'lucide-react';

const ASAMBLEAS = [
  {
    id: 1,
    nombre: 'Asamblea Nacional Ordinaria 2025',
    fecha: '15 de mayo de 2025',
    hora: '9:00 AM',
    lugar: 'Bogotá D.C. — Centro de Convenciones',
    cupos: 150,
  },
  {
    id: 2,
    nombre: 'Asamblea Regional Antioquia',
    fecha: '22 de mayo de 2025',
    hora: '10:00 AM',
    lugar: 'Medellín — Palacio de Exposiciones',
    cupos: 80,
  },
  {
    id: 3,
    nombre: 'Asamblea Regional Valle del Cauca',
    fecha: '29 de mayo de 2025',
    hora: '8:00 AM',
    lugar: 'Cali — Centro Cultural',
    cupos: 60,
  },
  {
    id: 4,
    nombre: 'Asamblea Regional Costa Caribe',
    fecha: '5 de junio de 2025',
    hora: '9:30 AM',
    lugar: 'Barranquilla — Hotel Dann Carlton',
    cupos: 70,
  },
];

export default function RegistroAsambleaPage() {
  const router = useRouter();
  const [asambleaSeleccionada, setAsambleaSeleccionada] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    email: '',
    celular: '',
    condicion: '',
  });
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: '' });
  };

  const validar = () => {
    const e = {};
    if (!asambleaSeleccionada) e.asamblea = 'Selecciona una asamblea';
    if (!form.nombres.trim()) e.nombres = 'Campo requerido';
    if (!form.apellidos.trim()) e.apellidos = 'Campo requerido';
    if (!form.cedula.trim()) e.cedula = 'Campo requerido';
    if (!form.email.trim()) e.email = 'Campo requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.celular.trim()) e.celular = 'Campo requerido';
    if (!form.condicion) e.condicion = 'Campo requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validar()) setEnviado(true);
  };

  const asamblea = ASAMBLEAS.find((a) => a.id === asambleaSeleccionada);

  if (enviado) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <header className="w-full bg-red-600 py-5 px-4 flex flex-col items-center shadow-md">
          <h1 className="text-white text-2xl font-extrabold">Nuevo Liberalismo</h1>
          <span className="text-red-200 text-xs mt-1">Registro a asamblea</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle size={64} className="text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-500 text-sm mb-4">
              Quedaste registrado(a) en:
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-gray-900 text-sm mb-2">{asamblea?.nombre}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar size={13} /> {asamblea?.fecha} — {asamblea?.hora}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={13} /> {asamblea?.lugar}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Recibirás la confirmación y detalles en{' '}
              <span className="font-medium text-gray-700">{form.email}</span>
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="w-full bg-red-600 py-5 px-4 shadow-md">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-white text-lg font-extrabold leading-none">Nuevo Liberalismo</h1>
            <span className="text-red-200 text-xs">Registro a una asamblea</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-center px-4 py-6 pb-10 gap-5">

        {/* Selección de asamblea */}
        <div className="w-full max-w-sm">
          <h2 className="text-base font-bold text-gray-900 mb-1">Selecciona una asamblea</h2>
          <p className="text-xs text-gray-500 mb-3">Elige el evento al que deseas asistir</p>
          {errores.asamblea && <p className="text-xs text-red-500 mb-2">{errores.asamblea}</p>}

          <div className="flex flex-col gap-3">
            {ASAMBLEAS.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => { setAsambleaSeleccionada(a.id); setErrores({ ...errores, asamblea: '' }); }}
                className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                  asambleaSeleccionada === a.id
                    ? 'border-red-600 bg-red-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{a.nombre}</p>
                  {asambleaSeleccionada === a.id && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-600 mt-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                  <Calendar size={12} /> {a.fecha}
                  <span className="mx-1">·</span>
                  <Clock size={12} /> {a.hora}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <MapPin size={12} /> {a.lugar}
                </div>
                <div className="mt-2">
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    {a.cupos} cupos disponibles
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Datos personales */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Tus datos</h2>
          <p className="text-xs text-gray-500 mb-4">Información para tu inscripción</p>

          <div className="flex flex-col gap-4">
            <Field label="Nombres" name="nombres" placeholder="Ej: Juan David" value={form.nombres} onChange={handleChange} error={errores.nombres} />
            <Field label="Apellidos" name="apellidos" placeholder="Ej: García Ruiz" value={form.apellidos} onChange={handleChange} error={errores.apellidos} />
            <Field label="Número de cédula" name="cedula" type="number" placeholder="Ej: 1234567890" value={form.cedula} onChange={handleChange} error={errores.cedula} />
            <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} error={errores.email} />
            <Field label="Celular" name="celular" type="tel" placeholder="Ej: 3001234567" value={form.celular} onChange={handleChange} error={errores.celular} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Condición de asistencia</label>
              <select name="condicion" value={form.condicion} onChange={handleChange}
                className={`w-full border ${errores.condicion ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}>
                <option value="">Selecciona...</option>
                <option>Militante activo</option>
                <option>Invitado</option>
                <option>Delegado regional</option>
                <option>Prensa</option>
              </select>
              {errores.condicion && <span className="text-xs text-red-500">{errores.condicion}</span>}
            </div>
          </div>
        </div>

        {/* Botón enviar */}
        <div className="w-full max-w-sm">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
          >
            <Calendar size={18} />
            Confirmar inscripción
          </button>
        </div>

      </form>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}

function Field({ label, name, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={`w-full border ${error ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition`} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
