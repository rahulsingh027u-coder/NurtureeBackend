import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyPortalToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/logout"];
const PORTAL_PREFIXES = ["/api/doctor-portal/", "/api/patient-portal/"];

// P0-7: Map admin API route prefixes to the permission module they require.
const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/api/verification", permission: "Verification" },
  { prefix: "/api/doctors", permission: "Doctors" },
  { prefix: "/api/caregivers", permission: "Care Partners" },
  { prefix: "/api/patients", permission: "Patients" },
  { prefix: "/api/bookings", permission: "Bookings" },
  { prefix: "/api/prescriptions", permission: "Prescriptions" },
  { prefix: "/api/commission", permission: "Commission" },
  { prefix: "/api/subusers", permission: "SubUsers" },
  { prefix: "/api/notifications", permission: "Dashboard" },
  { prefix: "/api/upload", permission: "Verification" },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (PORTAL_PREFIXES.some((p) => pathname.startsWith(p))) {
    return handlePortal(request);
  }

  return handleAdmin(request);
}

async function handlePortal(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : request.cookies.get("nurturee_portal_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = await verifyPortalToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const headers = new Headers(request.headers);
  headers.set("x-portal-user-id", String(payload.id));
  headers.set("x-portal-role", String(payload.role));

  return NextResponse.next({ request: { headers } });
}

async function handleAdmin(request: NextRequest) {
  const token = request.cookies.get("nurturee_admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-id", String(payload.id));
  headers.set("x-user-email", String(payload.email));
  headers.set("x-user-role", String(payload.role));

  // P0-7: Stamp permissions so route handlers can read them if needed.
  const permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
  headers.set("x-user-permissions", JSON.stringify(permissions));

  // P0-7: Enforce per-module permissions for sub_users.
  const role = String(payload.role);
  if (role === "sub_user") {
    const { pathname } = request.nextUrl;
    for (const { prefix, permission } of ROUTE_PERMISSIONS) {
      if (pathname.startsWith(prefix)) {
        if (!permissions.includes(permission)) {
          return NextResponse.json(
            { error: `Forbidden: requires '${permission}' permission`, requiredPermission: permission },
            { status: 403 }
          );
        }
        break;
      }
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
