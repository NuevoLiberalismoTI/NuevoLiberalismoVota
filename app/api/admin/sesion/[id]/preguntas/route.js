import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const { tipo, tipo_mayoria, texto, opciones, enVivo, pregunta_base_id } = await request.json();

  const supabase = createServerClient();
  const { data: preg, error } = await supabase
    .from('asamblea_preguntas')
    .insert([{ asamblea_id: sesionId, texto, tipo, tipo_mayoria: tipo_mayoria || 'simple', en_vivo: enVivo, estado: 'pendiente', pregunta_base_id }])
    .select()
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  if (tipo === 'candidatos' && opciones?.length) {
    await supabase.from('candidatos').insert(
      opciones.map((nombre, i) => ({ pregunta_id: preg.id, nombre, orden: i }))
    );
  }

  return Response.json({ ok: true });
}
