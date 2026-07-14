import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id: preguntaId } = await params;
  const url      = new URL(request.url);
  const sesionId = url.searchParams.get('sesionId');
  if (!sesionId) return Response.json({ ok: false, error: 'sesionId requerido' }, { status: 400 });

  const supabase = createServerClient();

  const [{ data: votantes }, { data: inscripciones }] = await Promise.all([
    supabase
      .from('votos')
      .select('cedula, respuesta')
      .eq('pregunta_id', preguntaId),
    supabase
      .from('inscripciones')
      .select('usuario_cedula')
      .eq('asamblea_id', sesionId)
      .in('estado_acreditacion', ['acreditado_voto', 'acreditado_ingreso']),
  ]);

  const todasCedulas = [
    ...new Set([
      ...(votantes || []).map((v) => String(v.cedula)),
      ...(inscripciones || []).map((i) => String(i.usuario_cedula)),
    ]),
  ];

  let nombresMap = {};
  if (todasCedulas.length > 0) {
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('cedula, nombre')
      .in('cedula', todasCedulas);
    (usuarios || []).forEach((u) => { nombresMap[String(u.cedula)] = u.nombre; });
  }

  const votantesCedulas = new Set((votantes || []).map((v) => String(v.cedula)));
  const asistentes = (inscripciones || []).map((i) => String(i.usuario_cedula));

  return Response.json({
    ok: true,
    votaron: (votantes || []).map((v) => ({
      cedula:    String(v.cedula),
      nombre:    nombresMap[String(v.cedula)] || String(v.cedula),
      respuesta: v.respuesta,
    })),
    no_votaron: asistentes
      .filter((c) => !votantesCedulas.has(c))
      .map((c) => ({ cedula: c, nombre: nombresMap[c] || c })),
    total_asistentes: asistentes.length,
  });
}
