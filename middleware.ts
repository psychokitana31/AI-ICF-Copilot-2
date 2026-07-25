import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images.
     * This allows the middleware to run on page routes and API routes
     * while skipping Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
