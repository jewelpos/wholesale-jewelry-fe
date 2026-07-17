import { deleteCookieResponse } from "@/lib/authStorage";
import { NextResponse } from "next/server";

const LOGOUT_MUTATION = `mutation { logout { success } }`;

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const accessToken = parseCookie(cookieHeader, "accessToken");

    if (accessToken) {
      const backendUrl = process.env.BACKEND_ORIGIN;
      if (backendUrl) {
        await fetch(`${backendUrl}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query: LOGOUT_MUTATION }),
        }).catch(() => {});
      }
    }

    const response = NextResponse.json(
      { message: "Logged out successfully", ok: true },
      { status: 200 }
    );
    deleteCookieResponse(response, "accessToken");
    deleteCookieResponse(response, "refreshToken");
    deleteCookieResponse(response, "ksi");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to logout", ok: false },
      { status: 500 }
    );
  }
}
