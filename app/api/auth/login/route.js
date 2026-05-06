import { cookies } from 'next/headers';
import { createServerClient } from '../../../lib/supabase-server';

export async function POST(request) {
  const body = await request.json();
  const cedula = (body.cedula || '').trim();
  const contrasena = body.contrasena || '';

  if (!cedula || !contrasena) {
    return Response.json({ ok: false, error: 'Faltan credenciales' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('verificar_login', {
    p_cedula: cedula,
    p_password: contrasena,
  });

  if (error || !data || data.length === 0) {
    return Response.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const user = data[0];
  const cookieStore = await cookies();

  cookieStore.set('session', JSON.stringify({ cedula: user.cedula, rol: user.rol, nombre: user.nombre }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return Response.json({ ok: true, user });
}
