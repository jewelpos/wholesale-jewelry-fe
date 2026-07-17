import { apolloClientServer } from "@/lib/apolloClientServer";
import { setCookieResponse } from "@/lib/authStorage";
import { REFRESH_TOKEN_MUTATION } from "@/lib/graphql/mutations/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("refreshToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const { data } = await apolloClientServer.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
      variables: {
        refreshToken: token,
      },
    });
    if (data.refreshToken.success) {
      const { accessToken, refreshToken } = data.refreshToken.data;
      // Preserve keepSignedIn selection: ksi cookie is set at login and re-stamped here
      const keepSignedIn = request.cookies.get("ksi")?.value === "1";
      const refreshMaxAge = keepSignedIn ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      const response = NextResponse.json({ success: true }, { status: 200 });
      setCookieResponse(response, "accessToken", accessToken, {
        maxAge: 30 * 60,
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
      if (keepSignedIn) {
        setCookieResponse(response, "ksi", "1", {
          maxAge: 30 * 24 * 60 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return response;
    }
    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}
