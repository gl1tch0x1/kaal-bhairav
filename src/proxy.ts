import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("osint_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = new URL("/", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    try {
      const secretEnv = process.env.JWT_SECRET;
      if (!secretEnv) {
        throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!");
      }
      const secret = new TextEncoder().encode(secretEnv);

      const { payload } = await jwtVerify(token, secret);
      // Enforce Role-Based Access Control (RBAC) on admin-only routes
      if (pathname.startsWith("/dashboard/settings") && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard/surveillance", request.url));
      }
    } catch {
      const url = new URL("/", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
