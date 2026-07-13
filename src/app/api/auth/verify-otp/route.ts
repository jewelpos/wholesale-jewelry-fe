import { apolloClientServer } from "@/lib/apolloClientServer";
import { setCookieResponse } from "@/lib/authStorage";
import { VERIFY_OTP_BY_EMAIL_MUTATION } from "@/lib/graphql/mutations/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Missing email or otp" }, { status: 400 });
    }
    const { data } = await apolloClientServer.mutate({
      mutation: VERIFY_OTP_BY_EMAIL_MUTATION,
      variables: { email, otp },
    });
    if (data?.verifyOTPByEmail?.success) {
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
