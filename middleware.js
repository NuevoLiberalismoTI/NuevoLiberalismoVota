import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session');
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
