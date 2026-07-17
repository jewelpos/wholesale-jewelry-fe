import { NextRequest, NextResponse } from "next/server";

if (!process.env.BACKEND_ORIGIN) console.warn("[SECURITY] BACKEND_ORIGIN not set — falling back to hardcoded production URL.");
const BACKEND_BASE = process.env.BACKEND_PUBLIC_URL ?? process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ created: [], failed: [{ itemcode: "auth", reason: "Unauthorized" }] }, { status: 401 });
  }

  const body = await request.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "authorization": `Bearer ${token}`,
  };

  try {
    const response = await fetch(`${BACKEND_BASE}/store/product/batch-add`, {
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
    return NextResponse.json({ created: [], failed: [{ itemcode: "batch", reason: "Service temporarily unavailable" }] }, { status: 502 });
  }
}
