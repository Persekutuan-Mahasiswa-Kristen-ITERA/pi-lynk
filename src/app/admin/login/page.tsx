import { getAccessStatus } from '@/auth';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';
import { PICORE_URL } from '@/lib/picore/config';
import { ACCESS_MESSAGES } from '@/lib/auth/access-messages';
import { GOOGLE_LOGIN_MESSAGES, googleLoginError } from '@/lib/auth/google-login-messages';
import { PasswordForm } from './password-form';

export const metadata = {
  title: 'Masuk Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{ google?: string }>;
}

/** Log in with a PI-CORE account (PI-CORE D-16). Access (admin / pengurus) is set in PI-CORE > Integrasi. */
export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  await connection(); // per-request: reads the PI-CORE session
  const status = await getAccessStatus();
  const { google } = await searchParams;

  if (status.kind === 'ok') {
    redirect('/admin');
  }

  const message =
    status.kind === 'no_access'
      ? ACCESS_MESSAGES[status.reason]
      : google
        ? GOOGLE_LOGIN_MESSAGES[googleLoginError(google)]
        : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-brown-200 p-8 shadow-md text-center">
        <Link href="/" className="inline-block mb-6">
          <Image
            src="/logo-pmk.png"
            alt="Logo PMK ITERA"
            width={72}
            height={72}
            className="mx-auto rounded-full"
            priority
          />
        </Link>

        <h1 className="text-2xl font-serif font-bold text-brown-900 mb-2">
          Admin PI-LYNK
        </h1>
        <p className="text-sm text-brown-600 mb-8">Masuk dengan akun PI-CORE Anda.</p>

        {message && (
          <div role="alert" className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
            <p>{message}</p>
            {status.kind === 'no_access' && (
              <form action="/auth/logout" method="post" className="mt-2">
                <button type="submit" className="text-xs font-semibold underline">
                  Keluar dan masuk dengan akun lain
                </button>
              </form>
            )}
          </div>
        )}

        {status.kind === 'no_access' ? null : (
          <>
            <PasswordForm />
            <div className="my-5 flex items-center gap-3 text-xs text-brown-500" aria-hidden="true">
              <span className="h-px flex-1 bg-brown-100" />
              atau
              <span className="h-px flex-1 bg-brown-100" />
            </div>
            {/* A Route Handler that redirects to PI-CORE: needs a full page load, not <Link>. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/auth/google"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-brown-300 bg-white hover:bg-brown-50 text-brown-800 font-medium text-sm transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Masuk dengan Google
            </a>
          </>
        )}

        <p className="mt-6 text-xs leading-relaxed text-brown-600">
          Akun dan kata sandi dikelola di PI-CORE.{' '}
          <a href={PICORE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Lupa kata sandi atau belum punya akun?
          </a>
        </p>

        <div className="mt-8 pt-6 border-t border-brown-100 text-center">
          <Link
            href="/"
            className="text-xs text-brown-600 hover:text-brown-800 hover:underline"
          >
            ← Kembali ke Beranda PI-LYNK
          </Link>
        </div>
      </div>
    </div>
  );
}
