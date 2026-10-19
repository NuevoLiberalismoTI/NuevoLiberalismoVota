import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';
import { preinscribirInvitadosConUsuario } from '../../../../../lib/preinscripcion';

// Preinscribe a todos los invitados de la sesión que ya tienen usuario y aún no están inscritos
export async function POST(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session  = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const r = await preinscribirInvitadosConUsuario(supabase, sesionId);
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
