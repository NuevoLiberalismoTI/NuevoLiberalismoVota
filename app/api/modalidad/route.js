import { getSession } from '../../lib/session';
import { createServerClient } from '../../lib/supabase-server';

const MODALIDADES = ['presencial', 'virtual'];

// Inscripciones del usuario en asambleas no finalizadas que aún no tienen modalidad elegida
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data: insc, error } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('usuario_cedula', session.cedula);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  // Si la migración aún no se aplicó, la columna no existe: no bloquear al usuario
  if (insc?.length && !('modalidad_asistencia' in insc[0])) return Response.json({ ok: true, pendientes: [] });

  const sinModalidad = (insc || []).filter((i) => !i.modalidad_asistencia && i.estado_acreditacion !== 'rechazado');
  if (sinModalidad.length === 0) return Response.json({ ok: true, pendientes: [] });

  const { data: asambleas } = await supabase
    .from('asambleas')
    .select('id, nombre, fecha, hora, lugar, estado')
    .in('id', sinModalidad.map((i) => i.asamblea_id))
    .neq('estado', 'finalizada');

  return Response.json({ ok: true, pendientes: asambleas || [] });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { asambleaId, modalidad } = await request.json();
  if (!asambleaId || !MODALIDADES.includes(modalidad)) {
    return Response.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('inscripciones')
    .update({ modalidad_asistencia: modalidad, modalidad_actualizada_en: new Date().toISOString() })
    .eq('asamblea_id', asambleaId)
    .eq('usuario_cedula', session.cedula)
    .select('asamblea_id');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  if (!data?.length) return Response.json({ ok: false, error: 'No estás inscrito en esta asamblea' }, { status: 404 });

  return Response.json({ ok: true });
}
