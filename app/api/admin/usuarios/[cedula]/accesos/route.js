import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('coordinador_accesos')
    .select('asamblea_id')
    .eq('coordinador_cedula', cedula);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, ids: (data || []).map((a) => a.asamblea_id) });
}

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula } = await params;
  const { asamblea_id } = await request.json();
  if (!asamblea_id) return Response.json({ ok: false, error: 'asamblea_id requerido' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from('coordinador_accesos')
    .upsert({ coordinador_cedula: cedula, asamblea_id, otorgado_por: session.cedula });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { cedula } = await params;
  const { asamblea_id } = await request.json();
  if (!asamblea_id) return Response.json({ ok: false, error: 'asamblea_id requerido' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from('coordinador_accesos')
    .delete()
    .eq('coordinador_cedula', cedula)
    .eq('asamblea_id', asamblea_id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
