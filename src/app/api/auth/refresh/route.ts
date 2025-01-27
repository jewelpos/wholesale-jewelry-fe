import { apolloClient } from "@/lib/apolloClient";
import { setCookieResponse } from "@/lib/authStorage";
import { REFRESH_TOKEN_MUTATION } from "@/lib/graphql/mutations/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("refreshToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const { data } = await apolloClient.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
      variables: {
        refreshToken: token,
      },
    });
    const { accessToken, refreshToken } = data.refreshToken.data;
    const response = NextResponse.json(data.refreshToken, {
      status: 201,
    });
    if (data.refreshToken.success) {
      setCookieResponse(response, "accessToken", accessToken, {
        maxAge: 15 * 60, // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      setCookieResponse(response, "refreshToken", refreshToken, {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return response;
  } catch (error) {
    // return NextResponse.json(
    //   { error: "Token refresh failed" },
    //   { status: 401 }
    // );
  }
}
