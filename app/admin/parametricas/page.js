'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Trash2, Loader2, CheckCircle, AlertCircle, Pencil, X, Save,
  ToggleLeft, ToggleRight, Tag,
} from 'lucide-react';

export default function ParametricasPage() {
  const [tipos, setTipos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm]     = useState({ nombre: '', codigo: '' });

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');
  const [exito, setExito]             = useState('');

  const cargar = async () => {
    const res = await fetch('/api/admin/tipos-asamblea');
    const json = await res.json();
    if (json.ok) setTipos(json.data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setExito(msg); setError('');
    setTimeout(() => setExito(''), 3000);
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim() || !nuevoCodigo.trim()) {
      setError('Completa nombre y código');
      return;
    }
    setGuardando(true); setError('');
    const res = await fetch('/api/admin/tipos-asamblea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoNombre, codigo: nuevoCodigo }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error || 'Error al crear'); }
    else { setNuevoNombre(''); setNuevoCodigo(''); mostrarExito('Tipo creado correctamente'); await cargar(); }
    setGuardando(false);
  };

  const handleToggleActivo = async (tipo) => {
    const res = await fetch(`/api/admin/tipos-asamblea/${tipo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !tipo.activo }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); return; }
    mostrarExito(tipo.activo ? 'Tipo desactivado' : 'Tipo activado');
    await cargar();
  };

  const handleToggleColectivos = async (tipo) => {
    const res = await fetch(`/api/admin/tipos-asamblea/${tipo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permite_colectivos: !tipo.permite_colectivos }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); return; }
    mostrarExito(tipo.permite_colectivos ? 'Selección de colectivo deshabilitada' : 'Selección de colectivo habilitada');
    await cargar();
  };

  const iniciarEdicion = (tipo) => {
    setEditandoId(tipo.id);
    setEditForm({ nombre: tipo.nombre, codigo: tipo.codigo });
  };

  const cancelarEdicion = () => { setEditandoId(null); setEditForm({ nombre: '', codigo: '' }); };

  const handleGuardarEdicion = async (id) => {
    if (!editForm.nombre.trim() || !editForm.codigo.trim()) {
      setError('Nombre y código son requeridos');
      return;
    }
    const res = await fetch(`/api/admin/tipos-asamblea/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editForm.nombre, codigo: editForm.codigo }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); return; }
    mostrarExito('Tipo actualizado');
    cancelarEdicion();
    await cargar();
  };

  const handleEliminar = async (tipo) => {
    if (!confirm(`¿Eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/tipos-asamblea/${tipo.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.ok) { setError(json.error); return; }
    mostrarExito('Tipo eliminado');
    await cargar();
  };

  const inp = `border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-brand transition`;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Parámetricas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona los tipos de asamblea disponibles en la plataforma</p>
      </div>

      {/* Mensajes */}
      {exito && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
          <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">{exito}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header de la sección */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-brand" />
            <h2 className="text-sm font-bold text-gray-800">Tipos de Asamblea</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
              {tipos.length}
            </span>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="text-brand animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3">Nombre</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3 w-36">Código</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3 w-28">Estado</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3 w-40">Colectivos</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3 w-28">Orden</th>
                <th className="px-6 py-3 w-36" />
              </tr>
            </thead>
            <tbody>
              {tipos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-gray-400 py-10">
                    No hay tipos de asamblea registrados
                  </td>
                </tr>
              )}
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  {editandoId === tipo.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value.toUpperCase() })}
                          className={`${inp} w-full`}
                          placeholder="Nombre del tipo"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          value={editForm.codigo}
                          onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value.toUpperCase() })}
                          className={`${inp} w-20 font-mono`}
                          placeholder="TER"
                          maxLength={5}
                        />
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400 italic">—</td>
                      <td className="px-6 py-3 text-xs text-gray-400 italic">—</td>
                      <td className="px-6 py-3 text-xs text-gray-400 italic">—</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleGuardarEdicion(tipo.id)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-hover transition-colors">
                            <Save size={12} /> Guardar
                          </button>
                          <button onClick={cancelarEdicion}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{tipo.nombre}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-sm font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                          {tipo.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <button onClick={() => handleToggleActivo(tipo)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                            tipo.activo
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                          }`}>
                          {tipo.activo
                            ? <><ToggleRight size={13} /> Activo</>
                            : <><ToggleLeft size={13} /> Inactivo</>
                          }
                        </button>
                      </td>
                      <td className="px-6 py-3.5">
                        <button onClick={() => handleToggleColectivos(tipo)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                            tipo.permite_colectivos
                              ? 'bg-brand-50 text-brand border-brand-200 hover:bg-brand-100'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                          }`}>
                          {tipo.permite_colectivos
                            ? <><ToggleRight size={13} /> Habilitado</>
                            : <><ToggleLeft size={13} /> General</>
                          }
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-mono">{tipo.orden}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => iniciarEdicion(tipo)}
                            className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand-50 rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleEliminar(tipo)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Fila para agregar nuevo */}
              <tr className="bg-gray-50 border-t-2 border-dashed border-gray-200">
                <td className="px-6 py-3">
                  <input
                    value={nuevoNombre}
                    onChange={(e) => { setNuevoNombre(e.target.value.toUpperCase()); setError(''); }}
                    className={`${inp} w-full`}
                    placeholder="Ej: REGIONAL"
                    onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    value={nuevoCodigo}
                    onChange={(e) => { setNuevoCodigo(e.target.value.toUpperCase()); setError(''); }}
                    className={`${inp} w-20 font-mono`}
                    placeholder="REG"
                    maxLength={5}
                    onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
                  />
                </td>
                <td className="px-6 py-3 text-xs text-gray-400 italic">Activo por defecto</td>
                <td className="px-6 py-3 text-xs text-gray-400 italic">General por defecto</td>
                <td className="px-6 py-3 text-xs text-gray-400 italic">Auto</td>
                <td className="px-6 py-3">
                  <button onClick={handleCrear} disabled={guardando}
                    className="flex items-center gap-1.5 text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-60 whitespace-nowrap">
                    {guardando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Agregar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <AlertCircle size={11} />
        El <strong>código</strong> se usa para generar el consecutivo de cada sesión. Una vez que hay sesiones activas, cambiarlo afectará futuros consecutivos.
      </p>
    </div>
  );
}
