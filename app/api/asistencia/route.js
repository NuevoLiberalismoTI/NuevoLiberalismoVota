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
