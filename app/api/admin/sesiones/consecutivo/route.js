import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base');
  if (!base) return Response.json({ ok: false, error: 'Parámetro base requerido' }, { status: 400 });

  const supabase = createServerClient();

  const [{ count: exacto }, { count: secuenciados }] = await Promise.all([
    supabase.from('asambleas').select('id', { count: 'exact', head: true }).eq('id', base),
    supabase.from('asambleas').select('id', { count: 'exact', head: true }).like('id', `${base}-%`),
  ]);

  const total = (exacto || 0) + (secuenciados || 0);
  const secuencia = String(total + 1).padStart(2, '0');

  return Response.json({ ok: true, consecutivo: `${base}-${secuencia}` });
}
