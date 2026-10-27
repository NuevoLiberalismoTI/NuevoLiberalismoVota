import { createServerClient } from '../../lib/supabase-server';
import { normCedula } from '../../lib/preinscripcion';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cedula = searchParams.get('cedula');

  if (!cedula) return Response.json({ ok: false, error: 'cedula requerida' }, { status: 400 });

  const supabase = createServerClient();

  // Buscar sesiones donde el usuario fue invitado, solo por cédula (tal como está y normalizada).
  // No se usa el correo: varias personas comparten correo y verían invitaciones ajenas.
  const variantes = [...new Set([String(cedula).trim(), normCedula(cedula)].filter(Boolean))];
  const { data: invData, error: invError } = await supabase
    .from('invitaciones_enviadas')
    .select('sesion_id')
    .in('cedula', variantes);
  if (invError) return Response.json({ ok: false, error: invError.message }, { status: 500 });

  const ids = [...new Set((invData || []).map((i) => i.sesion_id))];
  if (ids.length === 0) return Response.json({ ok: true, data: [], ids: [] });

  const { data, error } = await supabase
    .from('asambleas')
    .select('*, tipos_asamblea(nombre), colectivos(nombre)')
    .in('id', ids)
    .neq('estado', 'borrador');

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Nunca enviar al navegador los códigos de asistencia (QR presencial y enlace virtual)
  const result = (data || []).map(({ codigo_asistencia, codigo_virtual, ...s }) => ({
    ...s,
    tipo_nombre:      s.tipos_asamblea?.nombre ?? '',
    colectivo_nombre: s.colectivos?.nombre ?? '',
    esta_inscrito:    false,
    ya_asistio:       false,
    total_inscritos:  s.total_inscritos ?? 0,
  }));

  return Response.json({ ok: true, data: result, ids });
}
