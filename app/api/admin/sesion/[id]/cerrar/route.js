import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);

  const supabase = createServerClient();
  const { error } = await supabase.rpc('cerrar_pregunta_activa', { p_asamblea_id: sesionId });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
