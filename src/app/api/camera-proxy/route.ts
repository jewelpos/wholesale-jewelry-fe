import { NextRequest, NextResponse } from "next/server";

// Proxies IP camera snapshot requests to avoid browser CORS restrictions.
// Usage: GET /api/camera-proxy?url=<encoded-camera-snapshot-url>
export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https to prevent SSRF to internal non-HTTP protocols
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { Accept: "image/*" },
      // Short timeout — snapshot cameras should respond quickly
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Camera returned ${res.status}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("Content-Type") || "image/jpeg";
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return NextResponse.json({ error: "Camera did not respond in time" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to reach camera" }, { status: 502 });
  }
}
