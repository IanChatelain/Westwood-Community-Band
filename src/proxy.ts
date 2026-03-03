import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session_token';

// Roles allowed through the /admin route gate.
// This is a fast pre-check; fine-grained permissions are enforced by server actions.
const ADMIN_ALLOWED_ROLES = new Set(['ADMIN', 'EDITOR']);

export async function proxy(request: NextRequest) {
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
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = typeof payload.role === 'string' ? payload.role : '';

    if (!ADMIN_ALLOWED_ROLES.has(role)) {
      const redirect = new URL('/', request.url);
      redirect.searchParams.set('login', '1');
      return NextResponse.redirect(redirect);
    }

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
