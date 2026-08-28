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

  // Normalizar cédula: quitar espacios y ceros iniciales para comparación robusta
  const normCedula = (c) => {
    if (!c) return null;
    const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
    const n = parseInt(s, 10);
    return isNaN(n) ? s.toLowerCase() : String(n);
  };

  // Traer TODAS las inscripciones de la sesión (sin filtrar por cédula para evitar mismatches de tipo)
  const { data: inscs } = await supabase
    .from('inscripciones')
    .select('usuario_cedula')
    .eq('asamblea_id', sesionId);
  const inscritosSet = new Set((inscs || []).map((i) => normCedula(i.usuario_cedula)).filter(Boolean));

  // Deduplicar por cédula (o email si no hay cédula) — conserva la invitación más reciente
  const seen = new Set();
  const resultado = invitados
    .map((inv) => ({ ...inv, preinscrito: inv.cedula ? inscritosSet.has(normCedula(inv.cedula)) : false }))
    .filter((inv) => {
      const key = inv.cedula ? normCedula(inv.cedula) : inv.email;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return Response.json({ ok: true, data: resultado });
}
