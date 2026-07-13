import { NextRequest, NextResponse } from "next/server";

// Blocks RFC-1918, loopback, and link-local hostnames to prevent SSRF
function isBlockedHost(hostname: string): boolean {
  // Strip IPv6 brackets
  const host = hostname.replace(/^\[|\]$/g, "");

  // Block loopback and localhost
  if (host === "localhost" || host === "::1") return true;

  // Check if it looks like an IP address
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    // 127.x.x.x — loopback
    if (a === 127) return true;
    // 10.x.x.x — private
    if (a === 10) return true;
    // 172.16.x.x – 172.31.x.x — private
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.x.x — private
    if (a === 192 && b === 168) return true;
    // 169.254.x.x — link-local (AWS IMDS etc.)
    if (a === 169 && b === 254) return true;
  }
  return false;
}

// Proxies IP camera snapshot requests to avoid browser CORS restrictions.
// Usage: GET /api/camera-proxy?url=<encoded-camera-snapshot-url>
export async function GET(req: NextRequest) {
  // Require a valid session cookie
  const token = req.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Block private/internal IP ranges (SSRF protection)
  if (isBlockedHost(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Target host not allowed" }, { status: 400 });
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
