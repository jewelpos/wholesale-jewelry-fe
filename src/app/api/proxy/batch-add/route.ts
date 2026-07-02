import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_ORIGIN ?? "http://api.jewelpos.com:3129";

export async function POST(request: NextRequest) {
  const body = await request.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ created: [], failed: [{ itemcode: "batch", reason: `Proxy error: ${msg}` }] }, { status: 502 });
  }
}
