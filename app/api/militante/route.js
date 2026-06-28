import { createServerClient } from '../../lib/supabase-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cedula = searchParams.get('cedula')?.trim();
  if (!cedula) return Response.json({ ok: false, error: 'Número de identificación requerido' }, { status: 400 });

  const token = process.env.MILITANTES_API_TOKEN;
  if (!token) return Response.json({ ok: false, error: 'Servicio no disponible' }, { status: 500 });

  // Consultar API externa de militantes
  let militante = null;
  try {
    const res = await fetch(
      `https://mcetest.com/nl/wp-json/nl/v1/militantes/cedula/${encodeURIComponent(cedula)}?token=${token}`,
      { cache: 'no-store' }
    );
    if (res.status === 404) {
      return Response.json({ ok: false, tipo: 'no_encontrado' });
    }
    if (!res.ok) {
      return Response.json({ ok: false, error: 'Error al consultar el sistema de militantes' }, { status: 502 });
    }
    militante = await res.json();
  } catch {
    return Response.json({ ok: false, error: 'No se pudo conectar con el sistema de militantes' }, { status: 502 });
  }

  // Verificar si ya tiene usuario creado
  const supabase = createServerClient();
  const { data: usuarioExiste } = await supabase
    .from('usuarios')
    .select('cedula')
    .eq('cedula', cedula)
    .maybeSingle();

  if (usuarioExiste) {
    return Response.json({ ok: false, tipo: 'ya_existe' });
  }

  return Response.json({
    ok: true,
    militante: {
      cedula:            militante.numero_documento,
      nombres:           [militante.primer_nombre, militante.segundo_nombre].filter(Boolean).join(' '),
      apellidos:         [militante.primer_apellido, militante.segundo_apellido].filter(Boolean).join(' '),
      email:             militante.email || '',
      estado_afiliacion: militante.estado_afiliacion,
    },
  });
}
