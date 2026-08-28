import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabase
    .from('invitaciones_enviadas')
    .select('email, nombre, cedula, enviado_en')
    .eq('sesion_id', sesionId)
    .order('enviado_en', { ascending: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const invitados = data ?? [];

  // Cruzar con inscripciones para saber quién ya se preinscribió
  const cedulas = invitados.map((i) => i.cedula).filter(Boolean);
  let inscritosSet = new Set();
  if (cedulas.length > 0) {
    const { data: inscs } = await supabase
      .from('inscripciones')
      .select('usuario_cedula')
      .eq('asamblea_id', sesionId)
      .in('usuario_cedula', cedulas);
    inscritosSet = new Set((inscs || []).map((i) => String(i.usuario_cedula)));
  }

  // Deduplicar por cédula (o email si no hay cédula) — conserva la invitación más reciente
  const seen = new Set();
  const resultado = invitados
    .map((inv) => ({ ...inv, preinscrito: inv.cedula ? inscritosSet.has(String(inv.cedula)) : false }))
    .filter((inv) => {
      const key = inv.cedula ? String(inv.cedula) : inv.email;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return Response.json({ ok: true, data: resultado });
}
