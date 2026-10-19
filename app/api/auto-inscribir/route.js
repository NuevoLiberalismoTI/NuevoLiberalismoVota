import { createServerClient } from '../../lib/supabase-server';
import { preinscribirUsuarioEnInvitaciones } from '../../lib/preinscripcion';

// Preinscribe al usuario en todas las asambleas activas a las que fue invitado.
// Se llama al crear el usuario y al iniciar sesión.
export async function POST(request) {
  const { cedula } = await request.json();
  if (!cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });

  const supabase = createServerClient();

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('cedula')
    .eq('cedula', cedula)
    .maybeSingle();

  if (!usuario) return Response.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });

  const r = await preinscribirUsuarioEnInvitaciones(supabase, usuario.cedula);
  return Response.json({ ok: true, inscritos: r.inscritos });
}
