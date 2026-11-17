/** Safe for the browser: used by the login page and /auth/google/finish. */
export type GoogleLoginError = "notRegistered" | "inactive" | "failed";

/** PI-CORE's error code (or ours) -> a fixed code for the login page. */
export function googleLoginError(raw: string | null | undefined): GoogleLoginError {
  return raw === "notRegistered" || raw === "inactive" ? raw : "failed";
}

export const GOOGLE_LOGIN_MESSAGES: Record<GoogleLoginError, string> = {
  notRegistered: "Akun Google ini belum punya akun PI-CORE. Minta admin PI-CORE membuatkan akun dengan email ini.",
  inactive: "Akun PI-CORE Anda tidak aktif. Hubungi admin PI-CORE.",
  failed: "Masuk dengan Google gagal. Silakan coba lagi.",
};
