import { createServerClient } from '../../lib/supabase-server';

const normCedula = (c) => {
  if (!c) return null;
  const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? s.toLowerCase() : String(n);
};

export async function POST(request) {
  const { cedula } = await request.json();
  if (!cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });

  const supabase = createServerClient();

  // Verificar que el usuario existe
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('cedula')
    .eq('cedula', cedula)
    .maybeSingle();

  if (!usuario) return Response.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });

  // Buscar invitaciones cuya cédula normalizada coincida con la del usuario
  const { data: todasInvitaciones } = await supabase
    .from('invitaciones_enviadas')
    .select('sesion_id, cedula')
    .not('cedula', 'is', null);

  const cedulaNorm = normCedula(cedula);
  const sesionIds = [
    ...new Set(
      (todasInvitaciones || [])
        .filter((i) => normCedula(i.cedula) === cedulaNorm)
        .map((i) => i.sesion_id)
        .filter(Boolean)
    ),
  ];

  if (sesionIds.length === 0) return Response.json({ ok: true, inscritos: 0 });

  // Inscribir en cada sesión que aún esté activa y no esté ya inscrito
  const resultados = await Promise.allSettled(
    sesionIds.map(async (sesionId) => {
      // Evitar duplicados
      const { data: yaInscrito } = await supabase
        .from('inscripciones')
        .select('usuario_cedula')
        .eq('asamblea_id', sesionId)
        .eq('usuario_cedula', cedula)
        .maybeSingle();

      if (yaInscrito) return { sesionId, ok: true, skipped: true };

      // Solo inscribir en sesiones no finalizadas y sin inscripciones cerradas
      const { data: asm } = await supabase
        .from('asambleas')
        .select('estado, inscripciones_cerradas')
        .eq('id', sesionId)
        .maybeSingle();

      if (!asm || asm.estado === 'finalizada' || asm.inscripciones_cerradas) {
        return { sesionId, ok: false, reason: 'sesion_cerrada' };
      }

      const { data, error } = await supabase.rpc('inscribir_usuario', {
        p_asamblea_id: sesionId,
        p_cedula:      cedula,
      });

      if (error || !data?.ok) return { sesionId, ok: false, error: data?.error || error?.message };
      return { sesionId, ok: true };
    })
  );

  const inscritos = resultados.filter(
    (r) => r.status === 'fulfilled' && r.value?.ok && !r.value?.skipped
  ).length;

  return Response.json({ ok: true, inscritos });
}
