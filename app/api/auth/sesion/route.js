import { getSession } from '../../../lib/session';

// Indica si la cookie de sesión sigue vigente (el navegador no puede leerla: es httpOnly)
export async function GET() {
  const session = await getSession();
  return Response.json({ ok: !!session, cedula: session?.cedula ?? null });
}
