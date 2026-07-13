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

    const { accessToken, refreshToken } = data.login.data;
    const response = NextResponse.json(data.login, { status: 201 });
    if (data.login.success) {
      const refreshMaxAge = keepSignedIn ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      setCookieResponse(response, "accessToken", accessToken, {
        maxAge: 15 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      setCookieResponse(response, "refreshToken", refreshToken, {
        maxAge: refreshMaxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed. Please check your credentials and try again." }, { status: 401 });
  }
}
