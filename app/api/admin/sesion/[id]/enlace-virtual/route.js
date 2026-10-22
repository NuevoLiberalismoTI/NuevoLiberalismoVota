import { randomBytes } from 'crypto';
import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

// Devuelve el código del enlace virtual de la asamblea; lo crea si no existe.
// Con { regenerar: true } crea uno nuevo (el enlace anterior deja de funcionar).
export async function POST(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();
  const session  = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { regenerar } = await request.json().catch(() => ({}));

  const { data: asm, error } = await supabase.from('asambleas').select('*').eq('id', sesionId).maybeSingle();
  if (error || !asm) return Response.json({ ok: false, error: error?.message || 'Sesión no encontrada' }, { status: 404 });
  if (!('codigo_virtual' in asm)) {
    return Response.json({ ok: false, error: 'Falta aplicar la migración del enlace virtual en la base de datos.' }, { status: 400 });
  }
  if (asm.codigo_virtual && !regenerar) return Response.json({ ok: true, codigo: asm.codigo_virtual });

  const codigo = randomBytes(9).toString('base64url'); // 12 caracteres, difícil de adivinar
  const { error: upErr } = await supabase.from('asambleas').update({ codigo_virtual: codigo }).eq('id', sesionId);
  if (upErr) return Response.json({ ok: false, error: upErr.message }, { status: 400 });

  return Response.json({ ok: true, codigo });
}
