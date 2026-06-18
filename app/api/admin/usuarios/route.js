import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

async function consultarMilitanteAPI(cedula) {
  const token = process.env.MILITANTES_API_TOKEN;
  if (!token) throw new Error('Token de API no configurado');
  const res = await fetch(
    `https://mcetest.com/nl/wp-json/nl/v1/militantes/cedula/${encodeURIComponent(cedula)}?token=${token}`,
    { cache: 'no-store' }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error al consultar el sistema de militantes');
  return res.json();
}

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

  // Validar existencia del militante en la API externa
  let militante;
  try {
    militante = await consultarMilitanteAPI(cedula.trim());
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 502 });
  }

  if (!militante) {
    return Response.json({ ok: false, error: 'No se encontró militante registrado con esa cédula' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert en militantes para satisfacer la FK constraint de usuarios
  const nombres   = [militante.primer_nombre, militante.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [militante.primer_apellido, militante.segundo_apellido].filter(Boolean).join(' ');
  await supabase.from('militantes').upsert(
    { cedula: cedula.trim(), nombres, apellidos, email: militante.email || email.trim(), estado: 'activo' },
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
