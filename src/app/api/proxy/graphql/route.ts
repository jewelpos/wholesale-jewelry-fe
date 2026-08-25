import { NextRequest, NextResponse } from "next/server";

const BACKEND_GRAPHQL_URL = `${process.env.BACKEND_PUBLIC_URL ?? process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com"}/graphql`;

export async function POST(request: NextRequest) {
  // Not every GraphQL operation requires a session — login, verifyEmail,
  // forgotPassword/resetPassword, and OTP resend all run before a token
  // exists. Attach the Bearer token when present and let the backend's own
  // per-resolver guards decide access, instead of gatekeeping every call
  // here and breaking every pre-login operation.
  const token = request.cookies.get("accessToken")?.value;

  const body = await request.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(BACKEND_GRAPHQL_URL, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
