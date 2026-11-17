import { NextResponse } from "next/server";
import {
  HANDOFF_COOKIE,
  HANDOFF_COOKIE_MAX_AGE,
  HANDOFF_COOKIE_PATH,
  newHandoff,
  picoreGoogleUrl,
} from "@/lib/auth/google-login";

/** GET /auth/google: start "Masuk dengan Google" through PI-CORE (see lib/auth/google-login.ts). */
export async function GET() {
  const handoff = newHandoff();
  const response = NextResponse.redirect(picoreGoogleUrl(handoff));
  response.cookies.set(HANDOFF_COOKIE, handoff, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // comes back from PI-CORE as a top-level GET navigation
    path: HANDOFF_COOKIE_PATH,
    maxAge: HANDOFF_COOKIE_MAX_AGE,
  });
  return response;
}
