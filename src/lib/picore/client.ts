import { createBrowserClient } from "@supabase/ssr";
import { picoreSupabaseEnv } from "./config";

/** PI-CORE Supabase client for the browser (publishable key only). */
export function createPicoreBrowserClient() {
  const { url, key } = picoreSupabaseEnv();
  return createBrowserClient(url, key);
}
