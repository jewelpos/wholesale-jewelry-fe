export interface CookieOptions {
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
}
