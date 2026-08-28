import { createServerClient } from '../../lib/supabase-server';

const normCedula = (c) => {
  if (!c) return null;
  const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? s.toLowerCase() : String(n);
};

export async function POST(request) {
  const { asambleaId, cedula } = await request.json();
  if (!asambleaId || !cedula) {
    return Response.json({ ok: false, error: 'Parámetros incompletos' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verificar si las inscripciones están cerradas
  const { data: asm } = await supabase
    .from('asambleas')
    .select('inscripciones_cerradas')
    .eq('id', asambleaId)
    .single();

  if (asm?.inscripciones_cerradas) {
    return Response.json({ ok: false, error: 'Las inscripciones para esta asamblea están cerradas.' });
  }

  // Verificar que el usuario está en la lista de invitados de esta sesión
  const { data: invitaciones } = await supabase
    .from('invitaciones_enviadas')
    .select('cedula')
    .eq('sesion_id', asambleaId);

  const cedulaNorm = normCedula(cedula);
  const estaInvitado = (invitaciones || []).some(
    (inv) => inv.cedula && normCedula(inv.cedula) === cedulaNorm
  );

  if (!estaInvitado) {
    return Response.json({ ok: false, error: 'No tienes invitación para esta sesión.' }, { status: 403 });
  }

  const { data, error } = await supabase.rpc('inscribir_usuario', {
    p_asamblea_id: asambleaId,
    p_cedula:      cedula,
  });

  if (error || !data?.ok) {
    return Response.json({ ok: false, error: data?.error || error?.message || 'Error al inscribirse' });
  }

  return Response.json({ ok: true });
}
