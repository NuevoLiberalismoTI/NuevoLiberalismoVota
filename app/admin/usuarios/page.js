'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, UserPlus, Eye, EyeOff, Loader2, Trash2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuario, setUsuario]     = useState(null);
  const [admins, setAdmins]       = useState([]);
  const [cargando, setCargando]   = useState(true);

  const [cedula, setCedula]       = useState('');
  const [nombre, setNombre]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [errores, setErrores]     = useState({});
  const [creando, setCreando]     = useState(false);
  const [exito, setExito]         = useState(false);
  const [elimError, setElimError] = useState('');
  const [eliminando, setEliminando] = useState(null);

  const cargar = async () => {
    const res = await fetch('/api/admin/usuarios');
    if (res.ok) {
      const json = await res.json();
      if (json.ok) setAdmins(json.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (!stored) { router.replace('/'); return; }
    const u = JSON.parse(stored);
    if (u.rol !== 'admin') { router.replace('/dashboard'); return; }
    setUsuario(u);
    cargar();
  }, [router]);

  const validar = () => {
    const e = {};
    if (!cedula.trim()) e.cedula = 'Campo requerido';
    if (!nombre.trim()) e.nombre = 'Campo requerido';
    if (!email.trim()) e.email = 'Campo requerido';
    if (!password) e.password = 'Campo requerido';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden';
    return e;
  };

  const handleCrear = async () => {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setCreando(true);
    setExito(false);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula.trim(), nombre: nombre.trim(), email: email.trim(), password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setErrores({ general: json.error || 'Error al crear el usuario' });
        return;
      }
      setExito(true);
      setCedula('');
      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmar('');
      setErrores({});
      await cargar();
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (c) => {
    if (!confirm(`¿Eliminar acceso admin de ${c}?`)) return;
    setEliminando(c);
    setElimError('');
    const res = await fetch('/api/admin/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: c }),
    });
    const json = await res.json();
    if (!json.ok) setElimError(json.error || 'Error al eliminar');
    else await cargar();
    setEliminando(null);
  };

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-brand shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <Image src={LOGO} alt="Nuevo Liberalismo" width={130} height={44} className="object-contain" priority />
          <span className="text-brand-200 text-xs font-semibold ml-1">Gestión de admins</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Crear nuevo admin */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={20} className="text-brand" />
            <h2 className="text-base font-bold text-gray-900">Crear usuario administrador</h2>
          </div>

          {exito && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 font-medium">Usuario administrador creado correctamente.</span>
            </div>
          )}

          {errores.general && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{errores.general}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cédula</label>
                <input
                  type="text" inputMode="numeric" value={cedula}
                  onChange={(e) => { setCedula(e.target.value); setErrores((p) => ({ ...p, cedula: '' })); setExito(false); }}
                  placeholder="Ej: 1234567890"
                  className={`border ${errores.cedula ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand`}
                />
                {errores.cedula && <span className="text-xs text-red-500">{errores.cedula}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nombre completo</label>
                <input
                  type="text" value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })); setExito(false); }}
                  placeholder="Nombre del administrador"
                  className={`border ${errores.nombre ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand`}
                />
                {errores.nombre && <span className="text-xs text-red-500">{errores.nombre}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico</label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: '' })); setExito(false); }}
                placeholder="correo@ejemplo.com"
                className={`border ${errores.email ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand`}
              />
              {errores.email && <span className="text-xs text-red-500">{errores.email}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrores((p) => ({ ...p, password: '', confirmar: '' })); setExito(false); }}
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full border ${errores.password ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errores.password && <span className="text-xs text-red-500">{errores.password}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConf ? 'text' : 'password'} value={confirmar}
                    onChange={(e) => { setConfirmar(e.target.value); setErrores((p) => ({ ...p, confirmar: '' })); setExito(false); }}
                    placeholder="Repite la contraseña"
                    className={`w-full border ${errores.confirmar ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand`}
                  />
                  <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errores.confirmar && <span className="text-xs text-red-500">{errores.confirmar}</span>}
              </div>
            </div>

            <button onClick={handleCrear} disabled={creando}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
              {creando ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
              {creando ? 'Creando...' : 'Crear administrador'}
            </button>
          </div>
        </div>

        {/* Lista de admins */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Administradores actuales
          </h2>

          {elimError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{elimError}</span>
            </div>
          )}

          {cargando && (
            <div className="flex justify-center py-8">
              <Loader2 size={26} className="text-brand animate-spin" />
            </div>
          )}

          {!cargando && admins.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No hay administradores registrados</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {admins.map((a) => (
              <div key={a.cedula} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-50 rounded-full p-2">
                    <ShieldCheck size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.cedula}</p>
                  </div>
                </div>
                {a.cedula !== usuario.cedula && (
                  <button
                    onClick={() => handleEliminar(a.cedula)}
                    disabled={eliminando === a.cedula}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0">
                    {eliminando === a.cedula
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-6">
        © {new Date().getFullYear()} Nuevo Liberalismo · Panel de Administración
      </footer>
    </main>
  );
}
