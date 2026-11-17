import { getAccessStatus } from '@/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PICORE_URL } from '@/lib/picore/config';
import { ACCESS_MESSAGES } from '@/lib/auth/access-messages';
import { GOOGLE_LOGIN_MESSAGES, googleLoginError } from '@/lib/auth/google-login-messages';
import { PasswordForm } from './password-form';

export const metadata = {
  title: 'Masuk Admin | PI-LYNK',
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
