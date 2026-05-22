import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect authenticated users away from login page
  if (path === '/admin/login') {
    if (user) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return response
  }

  // Redirect /admin to /admin/dashboard
  if (path === '/admin') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Protect all other /admin/* routes
  if (path.startsWith('/admin/')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Enforce master-only routes
    if (
      path.startsWith('/admin/settings') ||
      path.startsWith('/admin/invite')
    ) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'master') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
