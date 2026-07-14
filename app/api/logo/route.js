const LOGO_SRC = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

export async function GET() {
  try {
    const res = await fetch(LOGO_SRC, { next: { revalidate: 86400 } });
    if (!res.ok) return Response.json({ error: 'No se pudo obtener el logo' }, { status: 502 });
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return Response.json({ data: `data:image/png;base64,${base64}` });
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
