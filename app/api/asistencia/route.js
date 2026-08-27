import { createServerClient } from '../../lib/supabase-server';

export async function POST(request) {
  const { sesionId, cedula, codigo } = await request.json();

  if (!sesionId || !cedula || !codigo) {
    return Response.json({ ok: false, error: 'Parámetros incompletos' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verificar asistencias cerradas y acreditación del usuario en paralelo
  const [{ data: asm }, { data: inscripcion }] = await Promise.all([
    supabase.from('asambleas').select('asistencias_cerradas').eq('id', sesionId).single(),
    supabase.from('inscripciones').select('estado_acreditacion').eq('asamblea_id', sesionId).eq('usuario_cedula', cedula).maybeSingle(),
  ]);

  if (asm?.asistencias_cerradas) {
    return Response.json({ ok: false, error: 'El registro de asistencia para esta asamblea está cerrado.' });
  }

  if (!inscripcion) {
    return Response.json({ ok: false, error: 'No estás inscrito en esta asamblea.' });
  }
  if (inscripcion.estado_acreditacion === 'rechazado') {
    return Response.json({ ok: false, error: 'Tu acceso a esta asamblea ha sido rechazado. Contacta al administrador.' });
  }
  if (inscripcion.estado_acreditacion === 'preinscrito') {
    return Response.json({ ok: false, error: 'Aún no has sido acreditado para esta asamblea. Espera la aprobación del administrador.' });
  }

  const { data, error } = await supabase.rpc('verificar_y_registrar_asistencia', {
    p_asamblea_id: sesionId,
    p_cedula:      cedula,
    p_codigo:      codigo,
  });

  if (error || !data?.ok) {
    return Response.json({ ok: false, error: data?.error || error?.message || 'Error al registrar asistencia' });
  }

  return Response.json({ ok: true });
}
