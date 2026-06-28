import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

const ESTADOS_VALIDOS = ['preinscrito', 'acreditado_voto', 'acreditado_ingreso', 'rechazado'];

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  // Columnas reales: usuario_cedula, fecha_inscripcion, estado_acreditacion
  const { data, error } = await supabase
    .from('inscripciones')
    .select('usuario_cedula, estado_acreditacion, fecha_inscripcion')
    .eq('asamblea_id', sesionId)
    .order('fecha_inscripcion', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  const cedulas = (data || []).map((i) => i.usuario_cedula).filter(Boolean);

  let nombresMap = {};
  if (cedulas.length > 0) {
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('cedula, nombre, email')
      .in('cedula', cedulas);
    (usuarios || []).forEach((u) => { nombresMap[u.cedula] = u; });
  }

  const preinscritos = (data || [])
    .filter((i) => i.usuario_cedula)
    .map((i) => ({
      cedula:              String(i.usuario_cedula),
      nombre:              nombresMap[i.usuario_cedula]?.nombre || String(i.usuario_cedula),
      email:               nombresMap[i.usuario_cedula]?.email  || null,
      estado_acreditacion: i.estado_acreditacion || 'preinscrito',
      created_at:          i.fecha_inscripcion,
    }));

  return Response.json({ ok: true, data: preinscritos });
}

export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const body = await request.json();
  const supabase = createServerClient();

  if (!ESTADOS_VALIDOS.includes(body.estado_acreditacion)) {
    return Response.json({ ok: false, error: 'Estado inválido' }, { status: 400 });
  }

  // Bulk: body.cedulas (array)
  if (body.cedulas && Array.isArray(body.cedulas) && body.cedulas.length > 0) {
    const { error } = await supabase
      .from('inscripciones')
      .update({ estado_acreditacion: body.estado_acreditacion })
      .eq('asamblea_id', sesionId)
      .in('usuario_cedula', body.cedulas);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  // Individual: body.cedula
  if (!body.cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });
  const { error } = await supabase
    .from('inscripciones')
    .update({ estado_acreditacion: body.estado_acreditacion })
    .eq('asamblea_id', sesionId)
    .eq('usuario_cedula', body.cedula);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
