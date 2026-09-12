import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase-server';
import { cookies } from 'next/headers';

const normCedula = (c) => {
  if (!c) return null;
  const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? s.toLowerCase() : String(n);
};

export async function GET(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const { data: asm } = await supabase
    .from('asambleas')
    .select('id, nombre, estado, fecha, hora, lugar, modo_rapido')
    .eq('id', sesionId)
    .maybeSingle();

  if (!asm || !asm.modo_rapido) {
    return Response.json({ ok: false, error: 'Sesión no disponible' }, { status: 404 });
  }

  return Response.json({ ok: true, sesion: asm });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const { cedula } = await request.json();

  if (!cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });

  const supabase = createServerClient();

  const { data: asm } = await supabase
    .from('asambleas')
    .select('id, nombre, estado, modo_rapido')
    .eq('id', sesionId)
    .maybeSingle();

  if (!asm || !asm.modo_rapido) return Response.json({ ok: false, error: 'Sesión no disponible' }, { status: 404 });
  if (asm.estado === 'finalizada') return Response.json({ ok: false, error: 'Esta sesión ya finalizó' }, { status: 403 });

  // Verificar que la cédula esté en la lista de invitados
  const { data: invitaciones } = await supabase
    .from('invitaciones_enviadas')
    .select('cedula, nombre, email')
    .eq('sesion_id', sesionId);

  const cedulaNorm = normCedula(cedula);
  const invitacion = (invitaciones || []).find(
    (inv) => inv.cedula && normCedula(inv.cedula) === cedulaNorm
  );

  if (!invitacion) {
    return Response.json(
      { ok: false, error: 'Tu número de identificación no está en la lista de invitados.' },
      { status: 403 }
    );
  }

  // Verificar si el usuario ya existe
  const { data: usuarioExistente } = await supabase
    .from('usuarios')
    .select('cedula, nombre, email, rol, es_rapido')
    .eq('cedula', cedula)
    .maybeSingle();

  let usuario = usuarioExistente;

  if (!usuarioExistente) {
    const nombre = invitacion.nombre || `Usuario ${cedulaNorm}`;
    const email  = invitacion.email  || `${cedulaNorm}@rapido.nliberal.co`;

    // Intentar via RPC (requiere migración crear_usuario_rapido en Supabase)
    const { data: created, error: rpcError } = await supabase.rpc('crear_usuario_rapido', {
      p_cedula: cedula,
      p_nombre: nombre,
      p_email:  email,
    });

    if (rpcError || !created?.ok) {
      // Fallback: insert directo con placeholder en password_hash (no usable para login)
      const { randomUUID } = await import('crypto');
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([{ cedula, nombre, email, password_hash: `RAPIDO_${randomUUID()}`, es_rapido: true, rol: 'usuario' }]);

      if (insertError) {
        return Response.json({
          ok:    false,
          error: `Error al crear usuario: ${insertError.message ?? rpcError?.message ?? 'desconocido'}`,
        }, { status: 500 });
      }
    }

    usuario = { cedula, nombre, email, rol: 'usuario', es_rapido: true };
  }

  // Crear inscripción si no existe (acreditado_voto)
  const { data: inscExistente } = await supabase
    .from('inscripciones')
    .select('usuario_cedula, estado_acreditacion')
    .eq('asamblea_id', sesionId)
    .eq('usuario_cedula', cedula)
    .maybeSingle();

  if (!inscExistente) {
    await supabase.from('inscripciones').insert([{
      asamblea_id:         sesionId,
      usuario_cedula:      cedula,
      estado_acreditacion: 'acreditado_voto',
    }]);
  } else if (inscExistente.estado_acreditacion !== 'acreditado_voto') {
    await supabase.from('inscripciones')
      .update({ estado_acreditacion: 'acreditado_voto' })
      .eq('asamblea_id', sesionId)
      .eq('usuario_cedula', cedula);
  }

  // Registrar asistencia si no existe
  const { data: asistExistente } = await supabase
    .from('asistencia')
    .select('usuario_cedula')
    .eq('asamblea_id', sesionId)
    .eq('usuario_cedula', cedula)
    .maybeSingle();

  if (!asistExistente) {
    await supabase.from('asistencia').insert([{
      asamblea_id:    sesionId,
      usuario_cedula: cedula,
    }]);
  }

  // Establecer sesión (misma estructura que login normal)
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({
    cedula:  usuario.cedula,
    rol:     usuario.rol || 'votante',
    nombre:  usuario.nombre,
  }), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/',
    maxAge:   60 * 60 * 24,
  });

  return Response.json({
    ok: true,
    usuario: {
      cedula:          usuario.cedula,
      nombre:          usuario.nombre,
      rol:             usuario.rol || 'votante',
      tokenDispositivo: null,
    },
  });
}
