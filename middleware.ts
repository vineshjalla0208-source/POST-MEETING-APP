import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Allow ALL API routes to pass through without any auth check
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check NextAuth session using getToken
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If user is authenticated and tries to access /auth/signin → redirect to /calendar
  if (token && pathname.startsWith('/auth/signin')) {
    const calendarUrl = new URL('/calendar', req.url)
    return NextResponse.redirect(calendarUrl)
  }

  // If user is NOT authenticated and tries to access protected route → redirect to /auth/signin
  // Protected routes: /calendar, /meetings, /settings, /automations, etc.
  if (!token && !pathname.startsWith('/auth')) {
    const signInUrl = new URL('/auth/signin', req.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
