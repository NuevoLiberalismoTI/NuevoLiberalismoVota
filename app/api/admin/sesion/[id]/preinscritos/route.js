import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

const ESTADOS_VALIDOS = ['preinscrito', 'acreditado_voto', 'acreditado_ingreso', 'rechazado'];

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('inscripciones')
    .select('cedula, estado_acreditacion, created_at, usuarios(nombre, email)')
    .eq('asamblea_id', sesionId)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  const preinscritos = (data || []).map((i) => ({
    cedula:              i.cedula,
    nombre:              i.usuarios?.nombre || i.cedula,
    email:               i.usuarios?.email  || null,
    estado_acreditacion: i.estado_acreditacion || 'preinscrito',
    created_at:          i.created_at,
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
      .in('cedula', body.cedulas);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  // Individual: body.cedula
  if (!body.cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });
  const { error } = await supabase
    .from('inscripciones')
    .update({ estado_acreditacion: body.estado_acreditacion })
    .eq('asamblea_id', sesionId)
    .eq('cedula', body.cedula);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
