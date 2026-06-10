import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublic) {
    // Redirect to appropriate dashboard
    const userCookie = request.cookies.get("user")?.value;
    try {
      const user = userCookie ? JSON.parse(userCookie) : null;
      if (user?.role === "CASHIER") {
        return NextResponse.redirect(new URL("/pos", request.url));
      }
    } catch {
      // ignore
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
