import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('invitaciones_enviadas')
    .select('email, nombre, enviado_en')
    .eq('sesion_id', sesionId)
    .order('enviado_en', { ascending: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, data: data ?? [] });
}
