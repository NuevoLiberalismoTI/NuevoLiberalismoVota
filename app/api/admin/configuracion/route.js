import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase.from('configuracion_sistema').select('*');
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function PATCH(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { clave, valor } = await request.json();
  if (!clave) return Response.json({ ok: false, error: 'Clave requerida' }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from('configuracion_sistema')
    .update({ valor: String(valor) })
    .eq('clave', clave);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
