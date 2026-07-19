import { NextRequest, NextResponse } from "next/server";
import { setCookieResponse } from "@/lib/authStorage";
import { LOGIN_MUTATION } from "@/lib/graphql/mutations/auth";
import { apolloClientServer } from "@/lib/apolloClientServer";

export async function POST(request: NextRequest) {
  try {
    const { username, password, turnstileToken, keepSignedIn } = await request.json();

    // Verify Cloudflare Turnstile token before attempting login
    const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get("x-forwarded-for") ?? undefined,
      }),
    });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return NextResponse.json({ error: "CAPTCHA verification failed. Please refresh and try again." }, { status: 403 });
    }
    const { data } = await apolloClientServer.mutate({
      mutation: LOGIN_MUTATION,
      variables: { username, password },
    });

    const loginResult = data.login;
    if (loginResult.success) {
      // Strip tokens from response body — set as httpOnly cookies instead
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { accessToken, refreshToken, ...routingData } = (loginResult.data || {}) as Record<string, unknown>;
      const refreshMaxAge = keepSignedIn ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      const response = NextResponse.json({ success: true, data: routingData }, { status: 200 });
      if (accessToken) {
        setCookieResponse(response, "accessToken", accessToken as string, {
          maxAge: 60 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      if (refreshToken) {
        setCookieResponse(response, "refreshToken", refreshToken as string, {
          maxAge: refreshMaxAge,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        if (keepSignedIn) {
          // ksi cookie tracks the 30-day preference so the refresh route can preserve it
          setCookieResponse(response, "ksi", "1", {
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        }
      }
      return response;
    }

    // 2FA required or login failure — return original response shape minus any tokens
    let safeData: Record<string, unknown> | null = null;
    if (loginResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { accessToken: _at, refreshToken: _rt, ...rest } = loginResult.data as Record<string, unknown>;
      safeData = rest;
    }
    return NextResponse.json({ ...loginResult, data: safeData }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Login failed. Please check your credentials and try again." }, { status: 401 });
  }
}
