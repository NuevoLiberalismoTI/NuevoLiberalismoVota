import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const cedula = (body.cedula || '').trim();
    const contrasena = body.contrasena || '';

    if (!cedula || !contrasena) {
      return NextResponse.json({ ok: false, error: 'Faltan credenciales' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.rpc('verificar_login', {
      p_cedula: cedula,
      p_password: contrasena,
    });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const user = data[0];
    const response = NextResponse.json({ ok: true, user });

    response.cookies.set('session', JSON.stringify({ cedula: user.cedula, rol: user.rol, nombre: user.nombre }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
