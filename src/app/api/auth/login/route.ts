import { NextRequest, NextResponse } from "next/server";
import { setCookieResponse } from "@/lib/authStorage";
import { LOGIN_MUTATION } from "@/lib/graphql/mutations/auth";
import { apolloClient } from "@/lib/apolloClient";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        username,
        password,
      },
    });

    const { accessToken, refreshToken } = data.login.data;
    const response = NextResponse.json(data.login, {
      status: 201,
    });
    if (data.login.success) {
      setCookieResponse(response, "accessToken", accessToken, {
        // maxAge: 15 * 60, // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      setCookieResponse(response, "refreshToken", refreshToken, {
        // maxAge: 7 * 24 * 60 * 60, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return response;
  } catch (error) {
    return NextResponse.json(error, {});
  }
}
