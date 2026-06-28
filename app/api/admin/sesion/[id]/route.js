import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const [
    { data: asm },
    { data: pregs },
    { data: pb },
    { count: inscritos },
    { count: asistentes },
    { data: resultados },
  ] = await Promise.all([
    supabase.from('asambleas').select('*, tipos_asamblea(codigo,nombre), colectivos(codigo,nombre)').eq('id', sesionId).single(),
    supabase.from('asamblea_preguntas').select('*, candidatos(id,nombre,orden,es_plancha,miembros_plancha(id,nombre,cargo,orden))').eq('asamblea_id', sesionId).order('created_at'),
    supabase.from('preguntas_base').select('*').eq('activa', true),
    supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('asamblea_id', sesionId),
    supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('asamblea_id', sesionId),
    supabase.rpc('get_resultados_sesion', { p_asamblea_id: sesionId }),
  ]);

  if (!asm) return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });

  // Fetch preinscritos con fallback si la columna estado_acreditacion aún no existe
  // select('*') garantiza que funciona sin importar qué columnas existan
  const { data: inscAll } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('asamblea_id', sesionId);

  const rawInsc = (inscAll || []).map((i) => ({
    cedula:              i.cedula,
    estado_acreditacion: i.estado_acreditacion || 'preinscrito',
    created_at:          i.created_at || null,
  }));

  // Enriquecer con nombres de usuario (falla silenciosamente si la tabla no existe)
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
      inscritos:   inscritos || 0,
      asistentes:  asistentes || 0,
      acreditados: preinscritos.filter((i) => i.estado_acreditacion === 'acreditado_voto' || i.estado_acreditacion === 'acreditado_ingreso').length,
      pendientes:  preinscritos.filter((i) => i.estado_acreditacion === 'preinscrito').length,
    },
    preinscritos,
    resultados: resultados?.preguntas || [],
  });
}

export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const { estado } = await request.json();

  const supabase = createServerClient();
  const { error } = await supabase.from('asambleas').update({ estado }).eq('id', sesionId);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
