import { createServerClient } from '../../lib/supabase-server';

export async function POST(request) {
  const { sesionId, cedula, codigo, ts } = await request.json();

  if (!sesionId || !cedula || !codigo || ts === undefined) {
    return Response.json({ ok: false, error: 'Parámetros incompletos' }, { status: 400 });
  }

  // Validar ventana de tiempo: el token debe estar en la ventana actual o la anterior (margen de ~60s)
  const ventanaActual = Math.floor(Date.now() / 30000);
  if (Math.abs(ventanaActual - Number(ts)) > 1) {
    return Response.json({
      ok: false,
      error: 'El código QR ha expirado. Escanea el código actualizado en pantalla.',
      expirado: true,
    });
  }

  const supabase = createServerClient();

  // Verificar asistencias cerradas y acreditación del usuario en paralelo
  const [{ data: asm }, { data: inscripcion }] = await Promise.all([
    supabase.from('asambleas').select('asistencias_cerradas').eq('id', sesionId).single(),
    supabase.from('inscripciones').select('estado_acreditacion').eq('asamblea_id', sesionId).eq('cedula', cedula).maybeSingle(),
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
