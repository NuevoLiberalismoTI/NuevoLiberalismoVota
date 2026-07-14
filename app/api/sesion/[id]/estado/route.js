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
  return Response.json(data ?? { ok: false });
}
