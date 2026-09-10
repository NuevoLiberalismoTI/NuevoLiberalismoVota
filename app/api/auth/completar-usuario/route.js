import { createServerClient } from '../../../lib/supabase-server';

export async function POST(request) {
  const { cedula, codigo, password, nombre, email } = await request.json();

  if (!cedula || !codigo || !password) {
    return Response.json({ ok: false, error: 'Parámetros incompletos' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verificar que sea un usuario rápido
  const { data: usr } = await supabase
    .from('usuarios')
    .select('cedula, nombre, email')
    .eq('cedula', cedula)
    .eq('es_rapido', true)
    .maybeSingle();

  if (!usr) {
    return Response.json({ ok: false, error: 'No aplica para este usuario' }, { status: 400 });
  }

  // Eliminar el usuario rápido para que el RPC pueda crear uno nuevo verificado
  await supabase.from('usuarios').delete().eq('cedula', cedula).eq('es_rapido', true);

  // Llamar al RPC normal de creación (verifica el código y crea con contraseña real)
  const { data, error } = await supabase.rpc('verificar_y_crear_usuario', {
    p_cedula:   cedula,
    p_codigo:   codigo,
    p_password: password,
    p_nombre:   nombre  || usr.nombre,
    p_email:    email   || usr.email,
  });

  if (error || !data?.ok) {
    // Restaurar el usuario rápido si el código era incorrecto
    await supabase.rpc('crear_usuario_rapido', {
      p_cedula: cedula,
      p_nombre: usr.nombre,
      p_email:  usr.email,
    });
    return Response.json({ ok: false, error: data?.error || 'Código incorrecto o expirado' });
  }

  // Auto-inscribir en sesiones pendientes
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auto-inscribir`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ cedula }),
  }).catch(() => {});

  return Response.json({ ok: true });
}
