// utils/cookies.ts
import { CookieOptions } from "@/types/cookies";
import { NextResponse } from "next/server";

export const COOKIE_OPTIONS: CookieOptions = {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "strict",
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

export async function getRefreshToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh");
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
  options?: Partial<CookieOptions>
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
