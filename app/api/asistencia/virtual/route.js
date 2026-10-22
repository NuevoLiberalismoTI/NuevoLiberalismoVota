import { getSession } from '../../../lib/session';
import { createServerClient } from '../../../lib/supabase-server';

// Asistencia por enlace virtual: la persona se identifica con su sesión iniciada (cookie),
// el enlace trae el código virtual de la asamblea y la asistencia queda marcada como 'virtual'.
export async function POST(request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, requiereLogin: true, error: 'Inicia sesión para registrar tu asistencia.' }, { status: 401 });

  const { sesionId, clave } = await request.json();
  if (!sesionId || !clave) return Response.json({ ok: false, error: 'El enlace no es válido.' }, { status: 400 });

  const supabase = createServerClient();
  const cedula   = session.cedula;

  const [{ data: asm }, { data: inscripcion }] = await Promise.all([
    supabase.from('asambleas').select('*').eq('id', sesionId).maybeSingle(),
    supabase.from('inscripciones').select('estado_acreditacion').eq('asamblea_id', sesionId).eq('usuario_cedula', cedula).maybeSingle(),
  ]);

  if (!asm || !asm.codigo_virtual || asm.codigo_virtual !== clave) {
    return Response.json({ ok: false, error: 'El enlace virtual no es válido o fue reemplazado. Solicita el enlace actualizado.' });
  }
  if (asm.estado === 'finalizada')   return Response.json({ ok: false, error: 'Esta asamblea ya finalizó.' });
  if (asm.asistencias_cerradas)      return Response.json({ ok: false, error: 'El registro de asistencia para esta asamblea está cerrado.' });
  if (!inscripcion)                  return Response.json({ ok: false, error: 'No estás inscrito en esta asamblea.' });
  if (inscripcion.estado_acreditacion === 'rechazado') {
    return Response.json({ ok: false, error: 'Tu acceso a esta asamblea ha sido rechazado. Contacta al administrador.' });
  }
  if (inscripcion.estado_acreditacion === 'preinscrito') {
    return Response.json({ ok: false, error: 'Aún no has sido acreditado para esta asamblea. Espera la aprobación del administrador.' });
  }

  // Si ya marcó asistencia (presencial o virtual), no se duplica
  const { data: previa } = await supabase.from('asistencia').select('*').eq('asamblea_id', sesionId).eq('usuario_cedula', cedula).maybeSingle();
  if (previa) return Response.json({ ok: true, yaRegistrada: true });

  // Mismo registro que el QR (se usa el código presencial que conoce el servidor)
  const { data, error } = await supabase.rpc('verificar_y_registrar_asistencia', {
    p_asamblea_id: sesionId,
    p_cedula:      cedula,
    p_codigo:      asm.codigo_asistencia,
  });
  if (error || !data?.ok) {
    return Response.json({ ok: false, error: data?.error || error?.message || 'Error al registrar asistencia' });
  }

  const { error: modErr } = await supabase
    .from('asistencia')
    .update({ modalidad: 'virtual' })
    .eq('asamblea_id', sesionId)
    .eq('usuario_cedula', cedula);
  if (modErr) console.error('[asistencia virtual] no se pudo marcar modalidad:', modErr.message);

  return Response.json({ ok: true });
}
