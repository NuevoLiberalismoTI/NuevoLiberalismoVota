import { createServerClient } from '../../../lib/supabase-server';
import { preinscribirUsuarioEnInvitaciones } from '../../../lib/preinscripcion';

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
    // Ya no es usuario rápido: o ya completó su registro (p. ej. un intento anterior sí se guardó),
    // o no tiene usuario. En el primer caso debe iniciar sesión; en el segundo, crear el usuario normal.
    const { data: existente } = await supabase.from('usuarios').select('cedula').eq('cedula', cedula).maybeSingle();
    if (existente) {
      return Response.json({ ok: false, tipo: 'ya_existe', error: 'Tu usuario ya fue creado. Inicia sesión con tu número de identificación y contraseña.' });
    }

    const { data, error } = await supabase.rpc('verificar_y_crear_usuario', {
      p_cedula:   cedula,
      p_codigo:   codigo,
      p_password: password,
      p_nombre:   nombre || '',
      p_email:    email  || '',
    });
    if (error || !data?.ok) {
      return Response.json({ ok: false, error: data?.error || 'Código incorrecto o expirado' });
    }
    await preinscribirUsuarioEnInvitaciones(supabase, cedula).catch((e) => console.error('preinscripción al crear usuario:', e));
    return Response.json({ ok: true });
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

  // Preinscribir en las asambleas activas a las que fue invitado
  // (al borrar el usuario rápido se pueden perder sus inscripciones)
  await preinscribirUsuarioEnInvitaciones(supabase, cedula).catch((e) => console.error('preinscripción al completar usuario:', e));

  return Response.json({ ok: true });
}
