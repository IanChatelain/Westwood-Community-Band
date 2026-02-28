import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session_token';

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const redirect = new URL('/', request.url);
    redirect.searchParams.set('login', '1');
    return NextResponse.redirect(redirect);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const redirect = new URL('/', request.url);
    redirect.searchParams.set('login', '1');
    return NextResponse.redirect(redirect);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
