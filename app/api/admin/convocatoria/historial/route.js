import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('convocatorias_enviadas')
    .select('id, departamento, variables, enviado_por, enviado_en, total, enviados, fallidos, contactos')
    .order('enviado_en', { ascending: false })
    .limit(50);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, historial: data || [] });
}
