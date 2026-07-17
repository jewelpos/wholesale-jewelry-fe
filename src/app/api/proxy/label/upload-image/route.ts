import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

if (!process.env.BACKEND_ORIGIN) console.warn("[SECURITY] BACKEND_ORIGIN not set — falling back to hardcoded production URL.");
const BACKEND_BASE = process.env.BACKEND_PUBLIC_URL ?? process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentType = request.headers.get("content-type") ?? "";

  // Forward raw body + original Content-Type (preserves multipart boundary)
  const headers: Record<string, string> = {};
  if (contentType) headers["content-type"] = contentType;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const body = await request.arrayBuffer();
    const response = await fetch(`${BACKEND_BASE}/store/label/upload-background-image`, {
      method: "POST",
      headers,
      body,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 502 });
  }
}
