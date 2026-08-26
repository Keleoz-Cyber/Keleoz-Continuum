import { type NextRequest, NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/modules/auth/constants'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/studio/login') {
    return NextResponse.next()
  }

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL('/studio/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*'],
}
