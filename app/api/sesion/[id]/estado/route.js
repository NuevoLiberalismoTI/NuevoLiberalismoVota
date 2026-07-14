import { createServerClient } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);

  const url = new URL(request.url);
  const cedula = url.searchParams.get('cedula');
  const token  = request.headers.get('x-device-token') || '';

  if (!cedula) return Response.json({ ok: false, error: 'Sin cédula' }, { status: 400 });

  const supabase = createServerClient();

  const { data: cfg } = await supabase
    .from('configuracion_sistema')
    .select('valor')
    .eq('clave', 'un_dispositivo_votante')
    .maybeSingle();

  if (cfg?.valor === 'true') {
    const { data: td } = await supabase
      .from('tokens_dispositivo')
      .select('token')
      .eq('cedula', cedula)
      .maybeSingle();

    if (!td || td.token !== token) {
      return Response.json({ ok: false, error: 'dispositivo_invalido' }, { status: 401 });
    }
  }

  const { data, error } = await supabase.rpc('get_estado_sesion_usuario', {
    p_asamblea_id: sesionId,
    p_cedula:      cedula,
  });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!data?.ok) return Response.json(data ?? { ok: false });

  // Enriquecer pregunta activa con timer
  if (data.pregunta_activa?.id) {
    const { data: pregData } = await supabase
      .from('asamblea_preguntas')
      .select('duracion_segundos, publicada_en')
      .eq('id', data.pregunta_activa.id)
      .maybeSingle();

    if (pregData?.duracion_segundos && pregData?.publicada_en) {
      const elapsed = Math.floor((Date.now() - new Date(pregData.publicada_en).getTime()) / 1000);
      data.pregunta_activa.segundos_restantes = Math.max(0, pregData.duracion_segundos - elapsed);
    }
  }

  // Detectar preguntas cerradas donde el votante no participó
  if (data.asistio) {
    const [{ data: cerradas }, { data: votosUsuario }] = await Promise.all([
      supabase
        .from('asamblea_preguntas')
        .select('id, texto')
        .eq('asamblea_id', sesionId)
        .eq('estado', 'cerrada'),
      supabase
        .from('votos')
        .select('pregunta_id')
        .eq('asamblea_id', sesionId)
        .eq('cedula', cedula),
    ]);

    const votadoIds = new Set((votosUsuario || []).map((v) => v.pregunta_id));
    data.preguntas_perdidas = (cerradas || [])
      .filter((p) => !votadoIds.has(p.id))
      .map((p) => p.texto);
  }

  return Response.json(data);
}
