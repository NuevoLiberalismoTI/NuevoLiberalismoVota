import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from './app/lib/cookie-sesion';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.rol !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const response = NextResponse.next();
  // Renovar la cookie en cada visita: la sesión solo termina si el usuario cierra sesión
  if (sessionCookie) {
    response.cookies.set(SESSION_COOKIE, sessionCookie.value, SESSION_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  // Todas las páginas, excepto API, archivos estáticos e imágenes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
};
