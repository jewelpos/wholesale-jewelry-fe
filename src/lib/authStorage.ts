// utils/cookies.ts
import { NextResponse } from "next/server";

export const COOKIE_OPTIONS: any = {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "strict",
  // maxAge: 30 * 24 * 60 * 60,
};

export async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/getToken");
    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
}

// For setting cookies in API routes or Server Actions
export const setCookieResponse = (
  response: NextResponse,
  name: string,
  value: string,
  options?: Partial<any>
) => {
  response.cookies.set(name, value, {
    ...COOKIE_OPTIONS,
    ...options,
  });
  return response;
};

// For deleting cookies in API routes or Server Actions
export const deleteCookieResponse = (response: NextResponse, name: string) => {
  response.cookies.delete(name);
  return response;
};
