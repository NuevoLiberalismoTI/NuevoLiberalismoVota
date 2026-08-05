import { createServerClient } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const [
    { data: asm },
    { count: asistentes },
    { data: pregs },
    { data: resultados },
  ] = await Promise.all([
    supabase
      .from('asambleas')
      .select('id, nombre, estado, fecha, hora, lugar, codigo_asistencia')
      .eq('id', sesionId)
      .single(),
    supabase
      .from('asistencia')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', sesionId),
    supabase
      .from('asamblea_preguntas')
      .select('id, texto, tipo, estado, tiempo_limite, updated_at, candidatos(id, nombre, es_plancha, orden)')
      .eq('asamblea_id', sesionId)
      .order('created_at'),
    supabase.rpc('get_resultados_sesion', { p_asamblea_id: sesionId }),
  ]);

  if (!asm || asm.estado === 'borrador') {
    return Response.json({ ok: false, error: 'Sesión no disponible' }, { status: 404 });
  }

  const preguntaActiva = (pregs || []).find((p) => p.estado === 'activa') ?? null;
  const resActivo = preguntaActiva
    ? (resultados?.preguntas ?? []).find((r) => r.id === preguntaActiva.id) ?? null
    : null;

  let opciones = [];
  if (preguntaActiva) {
    if (resActivo?.opciones?.length) {
      opciones = resActivo.opciones;
    } else if (preguntaActiva.tipo === 'sino') {
      opciones = [{ respuesta: 'SI', total: 0 }, { respuesta: 'NO', total: 0 }];
    } else {
      opciones = (preguntaActiva.candidatos ?? [])
        .sort((a, b) => a.orden - b.orden)
        .map((c) => ({ respuesta: c.nombre, total: 0 }));
    }
  }

  let segundosRestantes = null;
  if (preguntaActiva?.tiempo_limite && preguntaActiva?.updated_at) {
    const inicioMs    = new Date(preguntaActiva.updated_at).getTime();
    const transcurridos = Math.floor((Date.now() - inicioMs) / 1000);
    segundosRestantes = Math.max(0, preguntaActiva.tiempo_limite - transcurridos);
  }

  return Response.json({
    ok: true,
    sesion: {
      id:                asm.id,
      nombre:            asm.nombre,
      estado:            asm.estado,
      fecha:             asm.fecha,
      hora:              asm.hora,
      lugar:             asm.lugar,
      codigo_asistencia: asm.codigo_asistencia,
    },
    asistentes: asistentes ?? 0,
    preguntaActiva: preguntaActiva
      ? {
          id:         preguntaActiva.id,
          texto:      preguntaActiva.texto,
          tipo:       preguntaActiva.tipo,
          tiempo_limite: preguntaActiva.tiempo_limite,
          segundos_restantes: segundosRestantes,
          opciones,
        }
      : null,
  });
}
