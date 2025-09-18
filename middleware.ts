import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { extractTenantId } from "./lib/tenant"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes that don't need tenant context, and public pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next()
  }

  // Extract tenant ID from request
  const tenantId = extractTenantId(request)

  // For dashboard and app routes, require tenant context
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/app")) {
    if (!tenantId) {
      // Redirect to tenant selection or login
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Add tenant ID to headers for API routes to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-id", tenantId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For API routes that need tenant context
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const tenantId = extractTenantId(request)

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    // Add tenant ID to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-id", tenantId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
