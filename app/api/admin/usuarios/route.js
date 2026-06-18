import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('cedula, nombre, rol')
    .eq('rol', 'admin')
    .order('nombre');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, data: data || [] });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula, nombre, email, password } = await request.json();

  if (!cedula?.trim() || !nombre?.trim() || !email?.trim() || !password) {
    return Response.json({ ok: false, error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ ok: false, error: 'La contraseña debe tener mínimo 8 caracteres' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert en militantes para satisfacer la FK constraint de usuarios
  await supabase.from('militantes').upsert(
    { cedula: cedula.trim(), nombres: nombre.trim(), apellidos: '', email: email.trim(), estado: 'activo' },
    { onConflict: 'cedula' }
  );

  // Crear el usuario admin
  const { data, error } = await supabase.rpc('crear_usuario_admin', {
    p_cedula:   cedula.trim(),
    p_nombre:   nombre.trim(),
    p_email:    email.trim(),
    p_password: password,
  });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  if (!data?.ok) return Response.json({ ok: false, error: data?.error || 'Error al crear usuario' }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula } = await request.json();
  if (!cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });
  if (cedula === session.cedula) {
    return Response.json({ ok: false, error: 'No puedes eliminar tu propio usuario' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.from('usuarios').delete().eq('cedula', cedula).eq('rol', 'admin');
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
