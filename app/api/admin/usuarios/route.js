import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('cedula, nombre, rol')
    .in('rol', ['admin', 'coordinador'])
    .order('nombre');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, data: data || [] });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula, nombre, email, password, rol = 'admin' } = await request.json();

  if (!cedula?.trim() || !nombre?.trim() || !email?.trim() || !password) {
    return Response.json({ ok: false, error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ ok: false, error: 'La contraseña debe tener mínimo 8 caracteres' }, { status: 400 });
  }
  if (rol !== 'admin' && rol !== 'coordinador') {
    return Response.json({ ok: false, error: 'Rol inválido' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Use the existing RPC (creates with rol=admin) then update if coordinador
  const { data, error } = await supabase.rpc('crear_usuario_admin', {
    p_cedula:   cedula.trim(),
    p_nombre:   nombre.trim(),
    p_email:    email.trim(),
    p_password: password,
  });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  if (!data?.ok) return Response.json({ ok: false, error: data?.error || 'Error al crear usuario' }, { status: 400 });

  if (rol === 'coordinador') {
    const { error: updErr } = await supabase
      .from('usuarios')
      .update({ rol: 'coordinador' })
      .eq('cedula', cedula.trim());
    if (updErr) {
      // Rollback: remove the user we just created
      await supabase.from('usuarios').delete().eq('cedula', cedula.trim());
      return Response.json({ ok: false, error: updErr.message }, { status: 400 });
    }
  }

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
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('cedula', cedula)
    .in('rol', ['admin', 'coordinador']);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
