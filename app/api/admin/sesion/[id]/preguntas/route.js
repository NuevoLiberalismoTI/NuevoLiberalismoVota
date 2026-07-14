import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const { tipo, tipo_mayoria, texto, opciones, enVivo, pregunta_base_id, duracion_segundos, cupos } = await request.json();

  const supabase = createServerClient();
  const { data: preg, error } = await supabase
    .from('asamblea_preguntas')
    .insert([{
      asamblea_id: sesionId, texto, tipo,
      tipo_mayoria: tipo_mayoria || 'simple',
      en_vivo: enVivo, estado: 'pendiente', pregunta_base_id,
      duracion_segundos: duracion_segundos || null,
      cupos: cupos || null,
    }])
    .select()
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  if (tipo === 'candidatos' && opciones?.length) {
    for (let i = 0; i < opciones.length; i++) {
      const op = opciones[i];
      const esPlancha = op.tipo === 'plancha';
      const nombre = typeof op === 'string' ? op : op.nombre;

      const { data: cand, error: candErr } = await supabase
        .from('candidatos')
        .insert({ pregunta_id: preg.id, nombre: nombre.trim(), orden: i, es_plancha: esPlancha })
        .select()
        .single();

      if (candErr) continue;

      if (esPlancha && op.miembros?.length && cand) {
        const miembros = op.miembros
          .filter((m) => m.nombre?.trim())
          .map((m, j) => ({ candidato_id: cand.id, nombre: m.nombre.trim(), cargo: m.cargo?.trim() || null, orden: j }));
        if (miembros.length) {
          await supabase.from('miembros_plancha').insert(miembros);
        }
      }
    }
  }

  return Response.json({ ok: true });
}
