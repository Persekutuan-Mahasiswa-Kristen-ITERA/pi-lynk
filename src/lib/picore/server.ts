import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { picoreSupabaseEnv } from "./config";

/** PI-CORE Supabase client bound to the caller's session cookies (Route Handlers, Server Components). */
export async function createPicoreServerClient() {
  const { url, key } = picoreSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  });
}
