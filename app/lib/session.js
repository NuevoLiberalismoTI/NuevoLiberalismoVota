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
