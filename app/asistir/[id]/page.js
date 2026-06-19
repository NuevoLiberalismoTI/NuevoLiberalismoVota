'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, XCircle, Loader2, LogIn, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function Header() {
  return (
    <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
      <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
    </header>
  );
}

function AsistirContent({ sesionId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigo = searchParams.get('c');

  const [estado, setEstado] = useState('cargando');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!codigo || !sesionId) {
      setEstado('error');
      setMensaje('El enlace no es válido. Escanea el código QR nuevamente.');
      return;
    }

    const usuarioStr = sessionStorage.getItem('usuario');
    if (!usuarioStr) {
      setEstado('sin_auth');
      return;
    }

    const usuario = JSON.parse(usuarioStr);
    registrar(usuario.cedula);
  }, []);

  const registrar = async (cedula) => {
    try {
      const { data, error } = await supabase.rpc('verificar_y_registrar_asistencia', {
        p_asamblea_id: sesionId,
        p_cedula:      cedula,
        p_codigo:      codigo,
      });

      if (error || !data?.ok) {
        setEstado('error');
        setMensaje(data?.error || error?.message || 'No se pudo registrar la asistencia.');
      } else {
        setEstado('exito');
      }
    } catch {
      setEstado('error');
      setMensaje('Error de conexión. Intenta de nuevo.');
    }
  };

  const irALogin = () => {
    router.push(`/?retorno=${encodeURIComponent(`/asistir/${sesionId}?c=${codigo}`)}`);
  };

  if (estado === 'cargando') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <Loader2 size={48} className="text-brand animate-spin" />
        <p className="text-gray-600 font-medium">Registrando asistencia...</p>
      </div>
    </main>
  );

  if (estado === 'sin_auth') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="bg-brand-50 rounded-full p-4 w-fit mx-auto mb-4">
            <LogIn size={40} className="text-brand" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión primero</h2>
          <p className="text-sm text-gray-500 mb-6">
            Necesitas iniciar sesión para registrar tu asistencia a la asamblea.
          </p>
          <button onClick={irALogin}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Iniciar sesión
          </button>
        </div>
      </div>
    </main>
  );

  if (estado === 'exito') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle size={72} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Asistencia registrada!</h2>
          <p className="text-gray-500 text-sm mb-8">
            Tu asistencia ha sido registrada exitosamente.
          </p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Ir al inicio
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertTriangle size={64} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No se pudo registrar</h2>
          <p className="text-sm text-gray-500 mb-8">{mensaje}</p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors">
            Ir al inicio
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AsistirPage({ params }) {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-brand animate-spin" />
      </main>
    }>
      <AsistirContent sesionId={params.id} />
    </Suspense>
  );
}
