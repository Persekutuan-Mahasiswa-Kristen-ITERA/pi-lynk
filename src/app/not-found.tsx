import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Image
          src="/logo-pmk.png"
          alt="Logo PMK ITERA"
          width={80}
          height={80}
          className="mx-auto mb-6"
        />
        <h1 className="text-6xl font-bold text-brown-600 mb-4">404</h1>
        <h2 className="text-2xl font-serif font-semibold text-brown-900 mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-brown-700 mb-8">
          Link yang Anda cari tidak ditemukan. Pastikan URL yang dimasukkan sudah benar.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-brown-700 hover:bg-brown-800 text-white rounded-lg font-medium transition-colors"
          >
            Buat Shortlink Baru
          </Link>
          <div>
            <Link
              href="/laporkan"
              className="text-brown-600 hover:text-brown-800 text-sm underline"
            >
              Laporkan masalah
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
