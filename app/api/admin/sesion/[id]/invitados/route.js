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

  // Normalizar cédula: quitar espacios y caracteres no alfanuméricos, eliminar ceros iniciales
  const normCedula = (c) => {
    if (!c) return null;
    const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
    const n = parseInt(s, 10);
    return isNaN(n) ? s.toLowerCase() : String(n);
  };

  // 1. Todas las inscripciones de la sesión → set de cédulas normalizadas
  const { data: inscs } = await supabase
    .from('inscripciones')
    .select('usuario_cedula')
    .eq('asamblea_id', sesionId);
  const inscritosSet = new Set((inscs || []).map((i) => normCedula(i.usuario_cedula)).filter(Boolean));

  // 2. Fallback por email: buscar en usuarios la cédula asociada al email del invitado
  //    para cubrir casos donde invitaciones_enviadas tiene cedula NULL o distinta
  const emails = invitados.map((i) => i.email).filter(Boolean);
  const emailInscritoMap = {};
  if (emails.length > 0) {
    const { data: usrs } = await supabase
      .from('usuarios')
      .select('cedula, email')
      .in('email', emails);
    for (const u of (usrs || [])) {
      if (u.email) {
        emailInscritoMap[u.email.toLowerCase()] = inscritosSet.has(normCedula(u.cedula));
      }
    }
  }

  const esInscrito = (inv) => {
    // Primero intentar por cédula normalizada
    if (inv.cedula && inscritosSet.has(normCedula(inv.cedula))) return true;
    // Fallback: buscar la cédula del usuario con ese email y verificar si está inscrita
    if (inv.email) return emailInscritoMap[inv.email.toLowerCase()] ?? false;
    return false;
  };

  // 3. Deduplicar por cédula (o email si no hay cédula) — conserva la invitación más reciente
  const seen = new Set();
  const resultado = invitados
    .map((inv) => ({ ...inv, preinscrito: esInscrito(inv) }))
    .filter((inv) => {
      const key = inv.cedula ? normCedula(inv.cedula) : inv.email?.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return Response.json({ ok: true, data: resultado });
}
