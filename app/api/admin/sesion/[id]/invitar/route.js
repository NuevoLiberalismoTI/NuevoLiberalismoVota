import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function POST(request, { params }) {
  const { id }   = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session  = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { militantes } = await request.json();

  if (!Array.isArray(militantes) || militantes.length === 0) {
    return Response.json({ ok: false, error: 'Sin destinatarios' }, { status: 400 });
  }

  const { data: asm } = await supabase
    .from('asambleas')
    .select('nombre, fecha, hora, lugar')
    .eq('id', sesionId)
    .single();

  if (!asm) return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });

  const edgeFnUrl    = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-invitacion`;
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

  if (json.ok && json.enviados > 0) {
    const exitosos = new Set((json.results ?? []).filter((r) => r.ok).map((r) => r.email));
    const filas    = militantes
      .filter(({ email }) => exitosos.has(email))
      .map(({ email, nombre, cedula }) => ({ sesion_id: sesionId, email, nombre, cedula: cedula || null }));
    if (filas.length > 0) {
      await supabase.from('invitaciones_enviadas').insert(filas);
    }
  }

  return Response.json(json, { status: res.ok ? 200 : 502 });
}
