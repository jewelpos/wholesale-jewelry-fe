import { apolloClientServer } from "@/lib/apolloClientServer";
import { setCookieResponse } from "@/lib/authStorage";
import { VERIFY_OTP_BY_EMAIL_MUTATION } from "@/lib/graphql/mutations/auth";
import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter — max 5 OTP attempts per email per 10 minutes.
// Single-server safe. For multi-instance (Vercel), replace with Upstash Redis.
const otpRateLimit = new Map<string, { count: number; windowStart: number }>();
const OTP_MAX_ATTEMPTS = 5;
const OTP_WINDOW_MS = 10 * 60 * 1000;

function checkOtpRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = otpRateLimit.get(email);
  if (!entry || now - entry.windowStart > OTP_WINDOW_MS) {
    otpRateLimit.set(email, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= OTP_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function clearOtpRateLimit(email: string) {
  otpRateLimit.delete(email);
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Missing email or otp" }, { status: 400 });
    }

    if (!checkOtpRateLimit(email)) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please wait 10 minutes before trying again." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    const { data } = await apolloClientServer.mutate({
      mutation: VERIFY_OTP_BY_EMAIL_MUTATION,
      variables: { email, otp },
    });
    if (data?.verifyOTPByEmail?.success) {
      clearOtpRateLimit(email);
      const tokenData = data.verifyOTPByEmail.data || {};
      const { accessToken, refreshToken } = tokenData;
      const response = NextResponse.json({ success: true }, { status: 200 });
      if (accessToken) {
        setCookieResponse(response, "accessToken", accessToken, {
          maxAge: 15 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      if (refreshToken) {
        setCookieResponse(response, "refreshToken", refreshToken, {
          maxAge: 7 * 24 * 60 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return response;
    }
    return NextResponse.json(
      { success: false, error: data?.verifyOTPByEmail?.error || "Invalid code" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
