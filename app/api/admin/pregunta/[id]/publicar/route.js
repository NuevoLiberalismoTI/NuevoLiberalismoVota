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

  // Constancia del quórum al publicar (misma regla del panel: 50% + 1 de los invitados).
  // Se permite publicar sin quórum; queda registrado para el informe.
  const [{ data: invit }, { count: asistentes }] = await Promise.all([
    supabase.from('invitaciones_enviadas').select('cedula').eq('sesion_id', sesionId),
    supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('asamblea_id', sesionId),
  ]);
  const invitados       = new Set((invit || []).map((i) => String(i.cedula)).filter(Boolean)).size;
  const quorumRequerido = Math.floor(invitados / 2) + 1;
  const { error: qErr } = await supabase
    .from('asamblea_preguntas')
    .update({
      sin_quorum:             (asistentes || 0) < quorumRequerido,
      asistentes_al_publicar: asistentes || 0,
      quorum_requerido:       quorumRequerido,
    })
    .eq('id', id);
  if (qErr) console.error('No se pudo registrar el quórum de la pregunta (¿migración pendiente?):', qErr.message);

  return Response.json({ ok: true });
}
