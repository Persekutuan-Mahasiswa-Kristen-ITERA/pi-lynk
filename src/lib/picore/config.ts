/**
 * PI-LYNK signs admins in with their PI-CORE account (PI-CORE D-14/D-16). Accounts, passwords and
 * Google sign-in live in PI-CORE; PI-LYNK reads the caller's roles from PI-CORE's
 * `my_app_roles('lynk')` ("admin" or "pengurus"). PI-LYNK's own database is unchanged.
 *
 * Env (public, safe in the browser):
 *   NEXT_PUBLIC_PICORE_URL                       e.g. https://core.pmkitera.web.id
 *   NEXT_PUBLIC_PICORE_SUPABASE_URL              PI-CORE's Supabase API URL
 *   NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY  PI-CORE's publishable (anon) key
 */
export const PICORE_URL = (process.env.NEXT_PUBLIC_PICORE_URL || "https://core.pmkitera.web.id").replace(/\/+$/, "");
export const PICORE_CHANGE_PASSWORD_URL = `${PICORE_URL}/change-password`;

/** The app key PI-LYNK has in PI-CORE (apps.key, Google handoff list). */
export const LYNK_APP_KEY = "lynk";

export function picoreSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_PICORE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_PICORE_SUPABASE_URL dan NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY (lihat .env.example)."
    );
  }
  return { url, key };
}
