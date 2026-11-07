import { NextResponse, type NextRequest } from "next/server";

/**
 * Minimal gate for the team Hub: when HUB_PASSWORD is set, every page, server action and API
 * route requires HTTP Basic auth (user: HUB_USER or "team"). Unset = open in local dev only;
 * a deployed Hub without a password fails closed (503) instead of exposing team data.
 */
const isDeployed = process.env.NODE_ENV === "production" || !!process.env.VERCEL_ENV;

export function proxy(req: NextRequest) {
  const password = process.env.HUB_PASSWORD;
  if (!password) {
    if (!isDeployed) return NextResponse.next();
    return new NextResponse("Hub is locked: set HUB_PASSWORD in the deployment environment.", { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [user, ...rest] = Buffer.from(encoded, "base64").toString("utf8").split(":");
    if (user === (process.env.HUB_USER || "team") && rest.join(":") === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Viral Hub"' } });
}

/** /api/flags stays public: the arcade app polls it without team credentials. */
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/flags).*)"] };
