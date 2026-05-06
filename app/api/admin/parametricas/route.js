import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const [{ data: tipos }, { data: colectivos }] = await Promise.all([
    supabase.from('tipos_asamblea').select('*').eq('activo', true).order('orden'),
    supabase.from('colectivos').select('*').eq('activo', true).order('orden'),
  ]);

  return Response.json({ ok: true, tipos: tipos || [], colectivos: colectivos || [] });
}
