'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Eye, EyeOff, Loader2, Trash2, ShieldCheck, Shield,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp, Lock, Unlock,
} from 'lucide-react';

const ESTADO_BADGE = {
  en_curso:   { label: 'En curso',   cls: 'bg-green-100 text-green-700' },
  proxima:    { label: 'Próxima',    cls: 'bg-blue-100 text-blue-700'   },
  finalizada: { label: 'Finalizada', cls: 'bg-gray-100 text-gray-500'   },
  borrador:   { label: 'Borrador',   cls: 'bg-yellow-100 text-yellow-700'},
};

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuario,     setUsuario]     = useState(null);
  const [admins,      setAdmins]      = useState([]);
  const [coords,      setCoords]      = useState([]);
  const [cargando,    setCargando]    = useState(true);

  // Create form
  const [rolForm,   setRolForm]   = useState('admin');
  const [cedula,    setCedula]    = useState('');
  const [nombre,    setNombre]    = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errores,   setErrores]   = useState({});
  const [creando,   setCreando]   = useState(false);
  const [exito,     setExito]     = useState(false);

  // Delete
  const [elimError,   setElimError]   = useState('');
  const [eliminando,  setEliminando]  = useState(null);

  // Accesos management
  const [expandidoCedula, setExpandidoCedula] = useState(null);
  const [sesionesAll,     setSesionesAll]     = useState(null); // null=no cargadas
  const [accesosMap,      setAccesosMap]      = useState({});   // { cedula: Set<asamblea_id> }
  const [toggleando,      setToggleando]      = useState(null); // { cedula, asamblea_id }
  const [cargandoAccesos, setCargandoAccesos] = useState(false);

  const cargar = async () => {
    const res = await fetch('/api/admin/usuarios');
    if (res.ok) {
      const json = await res.json();
      if (json.ok) {
        setAdmins(json.data.filter((u) => u.rol === 'admin'));
        setCoords(json.data.filter((u) => u.rol === 'coordinador'));
      }
    }
    setCargando(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('usuario');
    if (stored) setUsuario(JSON.parse(stored));
    cargar();
  }, []);

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
        body: JSON.stringify({ cedula: cedula.trim(), nombre: nombre.trim(), email: email.trim(), password, rol: rolForm }),
      });
      const json = await res.json();
      if (!json.ok) { setErrores({ general: json.error || 'Error al crear el usuario' }); return; }
      setExito(true);
      setCedula(''); setNombre(''); setEmail('');
      setPassword(''); setConfirmar('');
      setErrores({});
      await cargar();
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (c) => {
    if (!confirm(`¿Eliminar acceso de ${c}?`)) return;
    setEliminando(c);
    setElimError('');
    const res = await fetch('/api/admin/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: c }),
    });
    const json = await res.json();
    if (!json.ok) setElimError(json.error || 'Error al eliminar');
    else {
      if (expandidoCedula === c) setExpandidoCedula(null);
      await cargar();
    }
    setEliminando(null);
  };

  const handleGestionarAccesos = async (cedula) => {
    if (expandidoCedula === cedula) {
      setExpandidoCedula(null);
      return;
    }
    setExpandidoCedula(cedula);
    setCargandoAccesos(true);

    const [sesRes, accRes] = await Promise.all([
      sesionesAll === null ? fetch('/api/admin/sesiones').then((r) => r.json()) : Promise.resolve(null),
      accesosMap[cedula]   ? Promise.resolve(null) : fetch(`/api/admin/usuarios/${cedula}/accesos`).then((r) => r.json()),
    ]);

    if (sesRes?.ok) setSesionesAll(sesRes.data || []);
    if (accRes?.ok) {
      setAccesosMap((prev) => ({ ...prev, [cedula]: new Set(accRes.ids || []) }));
    }
    setCargandoAccesos(false);
  };

  const handleToggleAcceso = async (coordinadorCedula, asambleaId) => {
    const tieneAcceso = accesosMap[coordinadorCedula]?.has(asambleaId);
    setToggleando({ cedula: coordinadorCedula, asamblea_id: asambleaId });

    const res = await fetch(`/api/admin/usuarios/${coordinadorCedula}/accesos`, {
      method: tieneAcceso ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asamblea_id: asambleaId }),
    });
    const json = await res.json();

    if (json.ok) {
      setAccesosMap((prev) => {
        const s = new Set(prev[coordinadorCedula] || []);
        tieneAcceso ? s.delete(asambleaId) : s.add(asambleaId);
        return { ...prev, [coordinadorCedula]: s };
      });
    }
    setToggleando(null);
  };

  const inp = (err) =>
    `border ${err ? 'border-red-400' : 'border-gray-300'} rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand w-full`;

  return (
    <div className="p-6">
      <div className="flex gap-6 items-start">

        {/* Left: create form */}
        <div className="flex-1 max-w-xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck size={20} className="text-brand" />
              <h2 className="text-base font-bold text-gray-900">Crear usuario</h2>
            </div>

            {/* Role selector */}
            <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
              {[
                { val: 'admin',       label: 'Super Administrador', Icon: ShieldCheck },
                { val: 'coordinador', label: 'Coordinador',          Icon: Shield      },
              ].map(({ val, label, Icon }) => (
                <button key={val} onClick={() => { setRolForm(val); setExito(false); setErrores({}); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    rolForm === val ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {rolForm === 'coordinador' && (
              <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4">
                <Shield size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700">
                  El coordinador verá solo las sesiones que tú le asignes. Podrá gestionar esas sesiones (acreditación, preguntas, invitaciones) pero no crear nuevas.
                </p>
              </div>
            )}

            {exito && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  {rolForm === 'coordinador' ? 'Coordinador creado.' : 'Administrador creado.'} Ahora puedes asignarle sesiones.
                </span>
              </div>
            )}
            {errores.general && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{errores.general}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cédula</label>
                  <input type="text" inputMode="numeric" value={cedula}
                    onChange={(e) => { setCedula(e.target.value); setErrores((p) => ({ ...p, cedula: '' })); setExito(false); }}
                    placeholder="Ej: 1234567890" className={inp(errores.cedula)} />
                  {errores.cedula && <span className="text-xs text-red-500">{errores.cedula}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nombre completo</label>
                  <input type="text" value={nombre}
                    onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })); setExito(false); }}
                    placeholder="Nombre completo" className={inp(errores.nombre)} />
                  {errores.nombre && <span className="text-xs text-red-500">{errores.nombre}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: '' })); setExito(false); }}
                  placeholder="correo@ejemplo.com" className={inp(errores.email)} />
                {errores.email && <span className="text-xs text-red-500">{errores.email}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrores((p) => ({ ...p, password: '', confirmar: '' })); setExito(false); }}
                      placeholder="Mínimo 8 caracteres" className={inp(errores.password)} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errores.password && <span className="text-xs text-red-500">{errores.password}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Confirmar</label>
                  <div className="relative">
                    <input type={showConf ? 'text' : 'password'} value={confirmar}
                      onChange={(e) => { setConfirmar(e.target.value); setErrores((p) => ({ ...p, confirmar: '' })); setExito(false); }}
                      placeholder="Repite la contraseña" className={inp(errores.confirmar)} />
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
                {creando ? 'Creando...' : rolForm === 'coordinador' ? 'Crear coordinador' : 'Crear administrador'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: lists */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-6">

          {elimError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{elimError}</span>
            </div>
          )}

          {cargando && <div className="flex justify-center py-8"><Loader2 size={26} className="text-brand animate-spin" /></div>}

          {/* Admins */}
          {!cargando && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-brand" /> Super Administradores
              </h2>
              {admins.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-gray-400 text-sm">Sin administradores</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {admins.map((a) => (
                  <div key={a.cedula} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-50 rounded-full p-2">
                        <ShieldCheck size={15} className="text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{a.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono">{a.cedula}</p>
                      </div>
                    </div>
                    {usuario && a.cedula !== usuario.cedula && (
                      <button onClick={() => handleEliminar(a.cedula)} disabled={eliminando === a.cedula}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0">
                        {eliminando === a.cedula ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinadores */}
          {!cargando && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Shield size={13} className="text-indigo-500" /> Coordinadores
                <span className="text-gray-300 font-normal">— vista restringida por sesión</span>
              </h2>
              {coords.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-gray-400 text-sm">Sin coordinadores</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {coords.map((a) => {
                  const expandido   = expandidoCedula === a.cedula;
                  const accesos     = accesosMap[a.cedula];
                  const numAccesos  = accesos?.size ?? null;

                  return (
                    <div key={a.cedula} className={`bg-white rounded-xl border shadow-sm transition-all ${expandido ? 'border-indigo-200' : 'border-gray-100'}`}>
                      {/* Card header */}
                      <div className="px-4 py-3.5 flex items-center gap-3">
                        <div className="bg-indigo-50 rounded-full p-2 flex-shrink-0">
                          <Shield size={15} className="text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{a.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 font-mono">{a.cedula}</p>
                            {numAccesos !== null && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                {numAccesos} {numAccesos === 1 ? 'sesión' : 'sesiones'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleGestionarAccesos(a.cedula)}
                            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                              expandido
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                            }`}>
                            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            Accesos
                          </button>
                          {usuario && a.cedula !== usuario.cedula && (
                            <button onClick={() => handleEliminar(a.cedula)} disabled={eliminando === a.cedula}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                              {eliminando === a.cedula ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Accesos panel */}
                      {expandido && (
                        <div className="border-t border-gray-100 px-4 py-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Sesiones con acceso
                          </p>

                          {cargandoAccesos && !accesosMap[a.cedula] && (
                            <div className="flex justify-center py-4">
                              <Loader2 size={18} className="text-brand animate-spin" />
                            </div>
                          )}

                          {(!cargandoAccesos || accesosMap[a.cedula]) && sesionesAll?.length === 0 && (
                            <p className="text-xs text-gray-400 py-2">No hay sesiones creadas</p>
                          )}

                          {sesionesAll && sesionesAll.length > 0 && (
                            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pr-1">
                              {sesionesAll.map((s) => {
                                const tieneAcceso = accesosMap[a.cedula]?.has(s.id);
                                const toggling    = toggleando?.cedula === a.cedula && toggleando?.asamblea_id === s.id;
                                const badge       = ESTADO_BADGE[s.estado] || ESTADO_BADGE.borrador;

                                return (
                                  <label key={s.id}
                                    className={`flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors ${tieneAcceso ? 'bg-indigo-50/50' : ''}`}>
                                    {toggling ? (
                                      <Loader2 size={13} className="animate-spin text-indigo-500 flex-shrink-0" />
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={!!tieneAcceso}
                                        onChange={() => handleToggleAcceso(a.cedula, s.id)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                                      />
                                    )}
                                    <span className="flex-1 text-xs text-gray-700 truncate">{s.nombre}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                                      {badge.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
