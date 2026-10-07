'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function InterstitialPage({
  destinationUrl,
}: {
  destinationUrl: string;
}) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  let displayDomain = '';
  try {
    displayDomain = new URL(destinationUrl).hostname;
  } catch {
    displayDomain = destinationUrl;
  }

  const handleContinue = () => {
    setIsRedirecting(true);
    window.location.href = destinationUrl;
  };

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
        <h1 className="text-2xl font-serif font-semibold text-brown-900 mb-4">
          Anda akan diarahkan ke situs luar
        </h1>
        <div className="bg-white border border-brown-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-brown-500 mb-1">Tujuan:</p>
          <p className="text-brown-800 font-medium break-all">{displayDomain}</p>
        </div>
        <p className="text-sm text-brown-600 mb-6">
          Link ini dibuat oleh pengguna publik dan bukan link resmi PMK ITERA.
          Lanjutkan hanya jika Anda mempercayai tujuannya.
        </p>
        <button
          onClick={handleContinue}
          disabled={isRedirecting}
          className="w-full sm:w-auto px-8 py-3 bg-brown-700 hover:bg-brown-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isRedirecting ? 'Mengalihkan...' : 'Lanjutkan'}
        </button>
        <div className="mt-4">
          <Link
            href="/"
            className="text-brown-600 hover:text-brown-800 text-sm underline"
          >
            Kembali ke PI-LYNK
          </Link>
        </div>
      </div>
    </div>
  );
}
