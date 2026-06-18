import { requireAdmin } from '../../../lib/session';

export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cedula = searchParams.get('cedula')?.trim();
  if (!cedula) return Response.json({ ok: false, error: 'Cédula requerida' }, { status: 400 });

  const token = process.env.MILITANTES_API_TOKEN;
  if (!token) return Response.json({ ok: false, error: 'Token de API no configurado' }, { status: 500 });

  try {
    const res = await fetch(
      `https://mcetest.com/nl/wp-json/nl/v1/militantes/cedula/${encodeURIComponent(cedula)}?token=${token}`,
      { cache: 'no-store' }
    );

    if (res.status === 404) {
      return Response.json({ ok: false, error: 'No se encontró militante con esa cédula' });
    }
    if (!res.ok) {
      return Response.json({ ok: false, error: 'Error al consultar el sistema de militantes' });
    }

    const data = await res.json();
    return Response.json({ ok: true, militante: data });
  } catch {
    return Response.json({ ok: false, error: 'No se pudo conectar con el sistema de militantes' }, { status: 500 });
  }
}
