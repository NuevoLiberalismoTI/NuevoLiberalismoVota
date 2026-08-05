import { requireAdmin, requireSessionAccess } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const [
    { data: asm },
    { data: pregs },
    { data: pb },
    { count: inscritos },
    { count: asistentes },
    { data: resultados },
    { data: asistenciaRows },
  ] = await Promise.all([
    supabase.from('asambleas').select('*, tipos_asamblea(codigo,nombre), colectivos(codigo,nombre)').eq('id', sesionId).single(),
    supabase.from('asamblea_preguntas').select('*, candidatos(id,nombre,orden,es_plancha,miembros_plancha(id,nombre,cargo,orden))').eq('asamblea_id', sesionId).order('created_at'),
    supabase.from('preguntas_base').select('*').eq('activa', true),
    supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('asamblea_id', sesionId),
    supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('asamblea_id', sesionId),
    supabase.rpc('get_resultados_sesion', { p_asamblea_id: sesionId }),
    supabase.from('asistencia').select('usuario_cedula, created_at').eq('asamblea_id', sesionId).order('created_at', { ascending: true }),
  ]);

  if (!asm) return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });

  const { data: inscAll } = await supabase
    .from('inscripciones')
    .select('usuario_cedula, estado_acreditacion, fecha_inscripcion')
    .eq('asamblea_id', sesionId)
    .order('fecha_inscripcion', { ascending: true });

  const rawInsc = (inscAll || [])
    .map((i) => ({
      cedula:              i.usuario_cedula != null ? String(i.usuario_cedula) : null,
      estado_acreditacion: i.estado_acreditacion || 'preinscrito',
      created_at:          i.fecha_inscripcion || null,
    }))
    .filter((i) => i.cedula);

  const cedulas = rawInsc.map((i) => i.cedula);
  let nombresMap = {};
  if (cedulas.length > 0) {
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('cedula, nombre, email')
      .in('cedula', cedulas);
    (usuarios || []).forEach((u) => { nombresMap[u.cedula] = u; });
  }

  const preinscritos = rawInsc.map((i) => ({
    cedula:              i.cedula,
    nombre:              nombresMap[i.cedula]?.nombre || i.cedula,
    email:               nombresMap[i.cedula]?.email  || null,
    estado_acreditacion: i.estado_acreditacion,
    created_at:          i.created_at,
  }));

  return Response.json({
    ok: true,
    sesion: asm,
    preguntas: (pregs || []).map((p) => ({
      ...p,
      candidatos: (p.candidatos || [])
        .sort((a, b) => a.orden - b.orden)
        .map((c) => ({ ...c, miembros: (c.miembros_plancha || []).sort((a, b) => a.orden - b.orden) })),
    })),
    preguntasBase: pb || [],
    stats: {
      inscritos:        inscritos || 0,
      asistentes:       asistentes || 0,
      acreditados_voto: preinscritos.filter((i) => i.estado_acreditacion === 'acreditado_voto').length,
      acreditados:      preinscritos.filter((i) => i.estado_acreditacion === 'acreditado_voto' || i.estado_acreditacion === 'acreditado_ingreso').length,
      pendientes:       preinscritos.filter((i) => i.estado_acreditacion === 'preinscrito').length,
    },
    preinscritos,
    asistenciaList: (asistenciaRows || []).map((a) => ({ cedula: String(a.usuario_cedula), asistio_en: a.created_at })),
    resultados: resultados?.preguntas || [],
  });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { estado } = await request.json();
  const { error } = await supabase.from('asambleas').update({ estado }).eq('id', sesionId);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
