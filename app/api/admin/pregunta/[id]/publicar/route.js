import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const { id } = await params;
  const { sesionId } = await request.json();

  const supabase = createServerClient();
  const session = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { error } = await supabase.rpc('publicar_pregunta', { p_asamblea_id: sesionId, p_pregunta_id: id });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  await supabase
    .from('asamblea_preguntas')
    .update({ publicada_en: new Date().toISOString() })
    .eq('id', id);

  return Response.json({ ok: true });
}
