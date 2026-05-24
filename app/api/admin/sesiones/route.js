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

  // Si viene base_id, asignar secuencial server-side
  if (body.base_id) {
    const base = body.base_id;
    delete body.base_id;

    const [{ count: exacto }, { count: secuenciados }] = await Promise.all([
      supabase.from('asambleas').select('id', { count: 'exact', head: true }).eq('id', base),
      supabase.from('asambleas').select('id', { count: 'exact', head: true }).like('id', `${base}-%`),
    ]);

    const total = (exacto || 0) + (secuenciados || 0);
    body.id = `${base}-${String(total + 1).padStart(2, '0')}`;
  }

  const { error } = await supabase.from('asambleas').insert([body]);

  if (error) return Response.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
  return Response.json({ ok: true, id: body.id });
}
