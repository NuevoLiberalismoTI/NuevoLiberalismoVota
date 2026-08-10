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
      .select('id, texto, tipo, estado, duracion_segundos, publicada_en, tipo_mayoria')
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

  // Opciones para la pregunta activa
  let opciones = [];
  if (preguntaActiva) {
    const resActivo = (resultados?.preguntas ?? []).find((r) => r.id === preguntaActiva.id);

    if (preguntaActiva.tipo === 'sino') {
      const votosSI = resActivo?.opciones?.find((o) => o.respuesta === 'SI')?.total ?? 0;
      const votosNO = resActivo?.opciones?.find((o) => o.respuesta === 'NO')?.total ?? 0;
      opciones = [{ respuesta: 'SI', total: Number(votosSI) }, { respuesta: 'NO', total: Number(votosNO) }];
    } else {
      // Siempre traer TODOS los candidatos con sus integrantes de plancha
      const { data: cands } = await supabase
        .from('candidatos')
        .select('id, nombre, orden, es_plancha, miembros_plancha(id, nombre, cargo, orden)')
        .eq('pregunta_id', preguntaActiva.id)
        .order('orden');

      // Votos del RPC indexados por nombre de opción
      const votosPorNombre = {};
      (resActivo?.opciones ?? []).forEach((op) => {
        votosPorNombre[op.respuesta] = Number(op.total) || 0;
      });

      // Siempre mostrar todas las opciones; mezclar votos reales del RPC
      opciones = (cands || []).map((c) => ({
        respuesta:  c.nombre,
        total:      votosPorNombre[c.nombre] ?? 0,
        es_plancha: c.es_plancha ?? false,
        miembros:   (c.miembros_plancha || []).sort((a, b) => a.orden - b.orden),
      }));
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
          tipo_mayoria:        preguntaActiva.tipo_mayoria ?? 'simple',
          tiempo_limite:       preguntaActiva.duracion_segundos,
          segundos_restantes:  segundosRestantes,
          opciones,
        }
      : null,
  });
}
