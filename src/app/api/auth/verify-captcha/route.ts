import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing CAPTCHA token" }, { status: 400 });
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("x-forwarded-for") ?? undefined,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: "CAPTCHA verification failed" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "CAPTCHA check error" }, { status: 500 });
  }
}
