import { createServerClient } from '../../lib/supabase-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cedula = searchParams.get('cedula');
  const email  = searchParams.get('email');

  if (!cedula) return Response.json({ ok: false, error: 'cedula requerida' }, { status: 400 });

  const supabase = createServerClient();

  // Buscar sesiones donde el usuario fue invitado (por cédula o email)
  let invQuery = supabase.from('invitaciones_enviadas').select('sesion_id');
  if (email) {
    invQuery = invQuery.or(`cedula.eq.${cedula},email.eq.${email}`);
  } else {
    invQuery = invQuery.eq('cedula', cedula);
  }

  const { data: invData, error: invError } = await invQuery;
  if (invError) return Response.json({ ok: false, error: invError.message }, { status: 500 });

  const ids = [...new Set((invData || []).map((i) => i.sesion_id))];
  if (ids.length === 0) return Response.json({ ok: true, data: [], ids: [] });

  const { data, error } = await supabase
    .from('asambleas')
    .select('*, tipos_asamblea(nombre), colectivos(nombre)')
    .in('id', ids)
    .neq('estado', 'borrador');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const result = (data || []).map((s) => ({
    ...s,
    tipo_nombre:      s.tipos_asamblea?.nombre ?? '',
    colectivo_nombre: s.colectivos?.nombre ?? '',
    esta_inscrito:    false,
    ya_asistio:       false,
    total_inscritos:  s.total_inscritos ?? 0,
  }));

  return Response.json({ ok: true, data: result, ids });
}
