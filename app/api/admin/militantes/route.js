import { NextResponse } from 'next/server';
import { requireAdminOrCoordinador } from '../../../lib/session';

const API_BASE = 'https://www.nuevoliberalismo.org/wp-json/nl/v1';
const TOKEN    = '7TvcetUYWs0zuLMy5bX4Fx0cfYvrg2WCfbMpIOWVhCFwOQXB2WfMyWBB3kqSKIMo';

export async function GET(request) {
  const session = await requireAdminOrCoordinador();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q            = (searchParams.get('q')            || '').trim();
  const page         = searchParams.get('page')          || '1';
  const per_page     = searchParams.get('per_page')      || '50';
  const departamento = searchParams.get('departamento')  || '';
  const cedulaExacta = searchParams.get('cedula')        || '';

  try {
    // ── Búsqueda exacta por cédula ─────────────────────────────────────────
    if (cedulaExacta) {
      const url = `${API_BASE}/militantes/cedula/${encodeURIComponent(cedulaExacta)}?token=${TOKEN}`;
      const res  = await fetch(url, { cache: 'no-store' });
      if (res.status === 404) return NextResponse.json({ total: 0, data: [] });
      if (!res.ok) return NextResponse.json({ error: 'Error al obtener militante' }, { status: 502 });
      const data = await res.json();
      return NextResponse.json({ total: 1, data: [data] });
    }

    // ── Búsqueda por texto (nombre o cédula parcial) ───────────────────────
    if (q.length >= 2) {
      const esDigitos = /^\d+$/.test(q);

      // Cédula parcial: mínimo 3 dígitos
      if (esDigitos) {
        if (q.length < 3) return NextResponse.json({ total: 0, data: [] });
        const params = new URLSearchParams({ token: TOKEN, q, page, per_page });
        const res  = await fetch(`${API_BASE}/militantes/buscar/cedula?${params}`, { cache: 'no-store' });
        if (!res.ok) return NextResponse.json({ error: 'Error en búsqueda por cédula' }, { status: 502 });
        return NextResponse.json(await res.json());
      }

      // Nombre: mínimo 2 caracteres
      const params = new URLSearchParams({ token: TOKEN, q, page, per_page });
      const res  = await fetch(`${API_BASE}/militantes/buscar/nombre?${params}`, { cache: 'no-store' });
      if (!res.ok) return NextResponse.json({ error: 'Error en búsqueda por nombre' }, { status: 502 });
      return NextResponse.json(await res.json());
    }

    // ── Listado paginado (sin búsqueda) ────────────────────────────────────
    const params = new URLSearchParams({ token: TOKEN, page, per_page });
    if (departamento) params.set('departamento', departamento);
    const res  = await fetch(`${API_BASE}/militantes?${params}`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Error al obtener militantes' }, { status: 502 });
    return NextResponse.json(await res.json());

  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con la API' }, { status: 503 });
  }
}
