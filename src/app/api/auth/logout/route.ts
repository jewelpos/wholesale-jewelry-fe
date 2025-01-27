import { deleteCookieResponse } from "@/lib/authStorage";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully", ok: true },
      { status: 200 }
    );
    deleteCookieResponse(response, "accessToken");
    deleteCookieResponse(response, "refreshToken");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to logout", ok: false },
      { status: 500 }
    );
  }
}
