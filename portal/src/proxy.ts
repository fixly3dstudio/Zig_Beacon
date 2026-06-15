import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protect every page. Excludes the login route, API routes (the sync endpoint
  // has its own secret), Next internals and public assets.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|zig-logo.png).*)"],
};
