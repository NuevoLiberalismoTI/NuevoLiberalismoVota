import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tipos_asamblea')
    .select('*')
    .order('orden');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, data: data || [] });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { nombre, codigo } = await request.json();
  if (!nombre?.trim() || !codigo?.trim()) {
    return Response.json({ ok: false, error: 'Nombre y código son requeridos' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Obtener el mayor orden actual para agregar al final
  const { data: last } = await supabase
    .from('tipos_asamblea')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('tipos_asamblea')
    .insert({
      nombre:  nombre.trim().toUpperCase(),
      codigo:  codigo.trim().toUpperCase(),
      activo:  true,
      orden:   (last?.orden ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, data });
}
