import { NextRequest, NextResponse } from "next/server";

if (!process.env.BACKEND_ORIGIN) console.warn("[SECURITY] BACKEND_ORIGIN not set — falling back to hardcoded production URL.");
const BACKEND = process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com";

// Block known-sensitive backend path prefixes from being reachable via this proxy
const BLOCKED_PREFIXES = new Set(["admin", "internal", "debug", "health", "sys"]);

async function forward(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (BLOCKED_PREFIXES.has(pathSegments[0])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const path = pathSegments.join("/");
  const search = request.nextUrl.search;
  const target = `${BACKEND}/${path}${search}`;

  const contentType = request.headers.get("content-type");
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
  };
  if (contentType) headers["content-type"] = contentType;

  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();

  const upstream = await fetch(target, { method, headers, body });
  const upBody = await upstream.arrayBuffer();

  // Force application/json — never reflect upstream Content-Type (XSS risk if backend returns text/html)
  return new NextResponse(upBody, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
