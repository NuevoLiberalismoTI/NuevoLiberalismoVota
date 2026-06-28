import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const update = {};
  if (body.nombre !== undefined) update.nombre = body.nombre.trim().toUpperCase();
  if (body.codigo !== undefined) update.codigo = body.codigo.trim().toUpperCase();
  if (body.activo !== undefined) update.activo = body.activo;
  if (body.orden  !== undefined) update.orden  = body.orden;

  const { error } = await supabase.from('tipos_asamblea').update(update).eq('id', id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  // Verificar si hay asambleas que usan este tipo
  const { count } = await supabase
    .from('asambleas')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_asamblea_id', id);

  if (count > 0) {
    return Response.json({
      ok: false,
      error: `No se puede eliminar: hay ${count} asamblea${count !== 1 ? 's' : ''} usando este tipo. Puedes desactivarlo en su lugar.`,
    }, { status: 409 });
  }

  const { error } = await supabase.from('tipos_asamblea').delete().eq('id', id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
