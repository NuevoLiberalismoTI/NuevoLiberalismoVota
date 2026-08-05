import { createServerClient } from '../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const [
    { data: asm },
    { count: asistentes },
    { data: pregs },
    { data: resultados },
    { data: inscData },
  ] = await Promise.all([
    supabase
      .from('asambleas')
      .select('id, nombre, estado, fecha, hora, lugar, codigo_asistencia, asistencias_cerradas')
      .eq('id', sesionId)
      .single(),
    supabase
      .from('asistencia')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', sesionId),
    // Sin join a candidatos para evitar errores de relación
    supabase
      .from('asamblea_preguntas')
      .select('id, texto, tipo, estado, duracion_segundos, publicada_en')
      .eq('asamblea_id', sesionId)
      .order('created_at'),
    supabase.rpc('get_resultados_sesion', { p_asamblea_id: sesionId }),
    supabase
      .from('inscripciones')
      .select('estado_acreditacion')
      .eq('asamblea_id', sesionId),
  ]);

  if (!asm || asm.estado === 'borrador') {
    return Response.json({ ok: false, error: 'Sesión no disponible' }, { status: 404 });
  }

  // Conteo de inscritos por estado
  const insc               = inscData || [];
  const acreditadosVoto    = insc.filter((i) => i.estado_acreditacion === 'acreditado_voto').length;
  const acreditadosIngreso = insc.filter((i) => i.estado_acreditacion === 'acreditado_ingreso').length;
  const totalInscritos     = insc.length;

  // Pregunta activa
  const preguntaActiva = (pregs || []).find((p) => p.estado === 'activa') ?? null;

  // Opciones para la pregunta activa: primero intentar del RPC, luego construir vacías
  let opciones = [];
  if (preguntaActiva) {
    const resActivo = (resultados?.preguntas ?? []).find((r) => r.id === preguntaActiva.id);
    if (resActivo?.opciones?.length) {
      opciones = resActivo.opciones;
    } else if (preguntaActiva.tipo === 'sino') {
      opciones = [{ respuesta: 'SI', total: 0 }, { respuesta: 'NO', total: 0 }];
    } else {
      // Candidatos por separado solo si es pregunta de candidatos y el RPC no los devolvió
      const { data: cands } = await supabase
        .from('candidatos')
        .select('id, nombre, orden')
        .eq('pregunta_id', preguntaActiva.id)
        .order('orden');
      opciones = (cands || []).map((c) => ({ respuesta: c.nombre, total: 0 }));
    }
  }

  // Segundos restantes
  let segundosRestantes = null;
  if (preguntaActiva?.duracion_segundos && preguntaActiva?.publicada_en) {
    const transcurridos = Math.floor((Date.now() - new Date(preguntaActiva.publicada_en).getTime()) / 1000);
    segundosRestantes = Math.max(0, preguntaActiva.duracion_segundos - transcurridos);
  }

  return Response.json({
    ok: true,
    sesion: {
      id:                    asm.id,
      nombre:                asm.nombre,
      estado:                asm.estado,
      fecha:                 asm.fecha,
      hora:                  asm.hora,
      lugar:                 asm.lugar,
      codigo_asistencia:     asm.codigo_asistencia,
      asistencias_cerradas:  asm.asistencias_cerradas ?? false,
    },
    quorum: {
      inscritos:           totalInscritos,
      acreditados_voto:    acreditadosVoto,
      acreditados_ingreso: acreditadosIngreso,
      asistentes:          asistentes ?? 0,
    },
    preguntaActiva: preguntaActiva
      ? {
          id:                  preguntaActiva.id,
          texto:               preguntaActiva.texto,
          tipo:                preguntaActiva.tipo,
          tiempo_limite:       preguntaActiva.duracion_segundos,
          segundos_restantes:  segundosRestantes,
          opciones,
        }
      : null,
  });
}
