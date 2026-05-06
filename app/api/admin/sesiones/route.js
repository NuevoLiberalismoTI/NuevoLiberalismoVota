import { requireAdmin } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('asambleas')
    .select('*, tipos_asamblea(codigo,nombre), colectivos(codigo,nombre)')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const supabase = createServerClient();
  const { error } = await supabase.from('asambleas').insert([body]);

  if (error) return Response.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
  return Response.json({ ok: true });
}
