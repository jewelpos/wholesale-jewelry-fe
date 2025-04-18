import { apolloClient } from "@/lib/apolloClient";
import { setCookieResponse } from "@/lib/authStorage";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { REFRESH_TOKEN_MUTATION } from "@/lib/graphql/mutations/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const config = getEnvironmentConfig();
  try {
    const token = request.cookies.get("refreshToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const { data } = await api.post(config.apiUrl, { refreshToken: token });
    const { accessToken, refreshToken } = data.refreshToken.data;
    const response = NextResponse.json(data.refreshToken, {
      status: 201,
    });
    if (data.refreshToken.success) {
      setCookieResponse(response, "accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      setCookieResponse(response, "refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}
