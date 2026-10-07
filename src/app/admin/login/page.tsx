import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Masuk Admin | PI-LYNK',
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { error } = await searchParams;

  // If already logged in, redirect to admin dashboard
  if (session?.user?.email) {
    redirect('/admin');
  }

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
        <p className="text-sm text-brown-600 mb-8">
          Masuk dengan Akun Google yang terdaftar dalam daftar pengurus / administrator.
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Akses Ditolak</p>
              <p className="text-xs mt-0.5">
                Email Anda tidak terdaftar sebagai administrator resmi. Hubungi pengurus PMK ITERA untuk verifikasi hak akses.
              </p>
            </div>
          </div>
        )}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/admin' });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-brown-300 bg-white hover:bg-brown-50 text-brown-800 font-medium text-sm transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Lanjutkan dengan Google
          </button>
        </form>

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
