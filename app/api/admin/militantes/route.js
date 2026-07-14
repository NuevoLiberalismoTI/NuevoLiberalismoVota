import { NextResponse } from 'next/server';

const API_BASE = 'https://mcetest.com/nl/wp-json/nl/v1/militantes';
const TOKEN    = '7TvcetUYWs0zuLMy5bX4Fx0cfYvrg2WCfbMpIOWVhCFwOQXB2WfMyWBB3kqSKIMo';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page         = searchParams.get('page')         || '1';
  const per_page     = searchParams.get('per_page')     || '';
  const departamento = searchParams.get('departamento') || '';

  const params = new URLSearchParams({ token: TOKEN, page });
  if (per_page)     params.set('per_page',     per_page);
  if (departamento) params.set('departamento', departamento);

  try {
    const res = await fetch(`${API_BASE}?${params}`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Error al obtener militantes' }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con la API' }, { status: 503 });
  }
}
