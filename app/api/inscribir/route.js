import { createServerClient } from '../../lib/supabase-server';

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

  const { data, error } = await supabase.rpc('inscribir_usuario', {
    p_asamblea_id: asambleaId,
    p_cedula:      cedula,
  });

  if (error || !data?.ok) {
    return Response.json({ ok: false, error: data?.error || error?.message || 'Error al inscribirse' });
  }

  return Response.json({ ok: true });
}
