import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com";

async function forward(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const upContentType = upstream.headers.get("content-type") ?? "application/json";
  const upBody = await upstream.arrayBuffer();

  return new NextResponse(upBody, {
    status: upstream.status,
    headers: { "content-type": upContentType },
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
