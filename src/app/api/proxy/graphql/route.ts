import { NextRequest, NextResponse } from "next/server";

const BACKEND_GRAPHQL_URL = `${process.env.BACKEND_PUBLIC_URL ?? process.env.BACKEND_ORIGIN ?? "https://api.jewelpos.com"}/graphql`;

export async function POST(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await request.text();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "authorization": `Bearer ${token}`,
  };

  const response = await fetch(BACKEND_GRAPHQL_URL, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
