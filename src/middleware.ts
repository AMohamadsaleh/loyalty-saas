import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/scan', '/activity', '/settings'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/scan/:path*', '/activity/:path*', '/settings/:path*'],
};
