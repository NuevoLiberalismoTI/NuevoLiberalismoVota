'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const LOGO = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

function Header() {
  return (
    <header className="w-full bg-brand py-5 px-4 flex flex-col items-center shadow-md">
      <Image src={LOGO} alt="Nuevo Liberalismo" width={160} height={54} className="object-contain" priority />
    </header>
  );
}

function AsistirContent() {
  const router = useRouter();
  const { id: sesionId } = useParams();
  const searchParams = useSearchParams();
  const codigo = searchParams.get('c');
  const ts     = searchParams.get('ts');

  const [estado, setEstado]   = useState('cargando');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!codigo || !sesionId) {
      setEstado('error');
      setMensaje('El enlace no es válido. Escanea el código QR nuevamente.');
      return;
    }

    const usuarioStr = sessionStorage.getItem('usuario');
    if (!usuarioStr) {
      router.replace(`/?retorno=${encodeURIComponent(`/asistir/${sesionId}?c=${codigo}&ts=${ts}`)}`);
      return;
    }

    const usuario = JSON.parse(usuarioStr);
    registrar(usuario.cedula);
  }, [sesionId, codigo]);

  const registrar = async (cedula) => {
    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesionId, cedula, codigo, ts: ts ? Number(ts) : Math.floor(Date.now() / 30000) }),
      });
      const data = await res.json();

      if (!data.ok) {
        setEstado(data.expirado ? 'expirado' : 'error');
        setMensaje(data.error || 'No se pudo registrar la asistencia.');
      } else {
        setEstado('exito');
      }
    } catch {
      setEstado('error');
      setMensaje('Error de conexión. Intenta de nuevo.');
    }
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

  if (estado === 'exito') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle size={72} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Asistencia registrada!</h2>
          <p className="text-gray-500 text-sm mb-8">Ingresando a la asamblea...</p>
          {/* Redirige automáticamente a la sesión */}
          <AutoRedirect destino={`/sesion/${sesionId}`} />
        </div>
      </div>
    </main>
  );

  if (estado === 'expirado') return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <RefreshCw size={64} className="text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Código QR expirado</h2>
          <p className="text-sm text-gray-500 mb-2">{mensaje}</p>
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

function AutoRedirect({ destino }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace(destino), 1500);
    return () => clearTimeout(t);
  }, [destino]);
  return null;
}

export default function AsistirPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-brand animate-spin" />
      </main>
    }>
      <AsistirContent />
    </Suspense>
  );
}
