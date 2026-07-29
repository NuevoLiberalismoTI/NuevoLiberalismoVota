import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') return null;
  return session;
}

export async function requireAdminOrCoordinador() {
  const session = await getSession();
  if (!session || (session.rol !== 'admin' && session.rol !== 'coordinador')) return null;
  return session;
}

// Passes for admin (full access) or coordinador with explicit access to this session.
// supabase must be a server client (service role) passed from the caller.
export async function requireSessionAccess(sesionId, supabase) {
  const session = await getSession();
  if (!session) return null;
  if (session.rol === 'admin') return session;
  if (session.rol === 'coordinador') {
    const { data } = await supabase
      .from('coordinador_accesos')
      .select('asamblea_id')
      .eq('coordinador_cedula', session.cedula)
      .eq('asamblea_id', sesionId)
      .maybeSingle();
    if (data) return session;
  }
  return null;
}
