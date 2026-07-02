import { requireAdmin } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id }    = await params;
  const sesionId  = decodeURIComponent(id);
  const { militantes } = await request.json();

  if (!Array.isArray(militantes) || militantes.length === 0) {
    return Response.json({ ok: false, error: 'Sin destinatarios' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: asm } = await supabase
    .from('asambleas')
    .select('nombre, fecha, hora, lugar')
    .eq('id', sesionId)
    .single();

  if (!asm) return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });

  const edgeFnUrl   = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-invitacion`;
  const plataformaUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vota.nuevoliberalismo.org';

  const res = await fetch(edgeFnUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      sesion: {
        nombre: asm.nombre,
        fecha:  asm.fecha,
        hora:   asm.hora,
        lugar:  asm.lugar,
      },
      militantes,
      plataformaUrl,
    }),
  });

  const json = await res.json();

  if (json.ok) {
    await supabase
      .from('invitaciones_enviadas')
      .insert(militantes.map(({ email, nombre }) => ({ sesion_id: sesionId, email, nombre })));
  }

  return Response.json(json, { status: res.ok ? 200 : 502 });
}
