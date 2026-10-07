'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCodeCanvas from '@/components/qr-code';
import TurnstileWidget, { TurnstileWidgetRef } from '@/components/turnstile-widget';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const PUBLIC_CREATION_ENABLED = process.env.NEXT_PUBLIC_CREATION_ENABLED !== 'false';

interface LinkResult {
  slug: string;
  shortUrl: string;
  destinationUrl: string;
}

export default function HomePage() {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl,
          customSlug: customSlug ? customSlug.trim() : undefined,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat memproses tautan.');
        turnstileRef.current?.reset();
        setTurnstileToken('');
        return;
      }

      setResult(data);
      setDestinationUrl('');
      setCustomSlug('');
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = result.shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <div className="flex flex-col min-h-screen bg-cream text-gray-900">
      {/* Header Bar */}
      <header className="border-b border-brown-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-pmk.png"
              alt="Logo PMK ITERA"
              width={36}
              height={36}
              className="rounded-full"
              priority
            />
            <span className="font-serif font-bold text-xl text-brown-900">
              PI-LYNK
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
            <a
              href="https://pmkitera.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brown-700 hover:text-brown-900 transition-colors hidden sm:inline"
            >
              pmkitera.web.id ↗
            </a>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg border border-brown-300 text-brown-700 hover:bg-brown-50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-brown-900 via-brown-800 to-brown-900 text-white py-16 md:py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFFBF5_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="container mx-auto max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brown-700/60 border border-brown-600 text-brown-200 text-xs sm:text-sm font-medium mb-6">
              <span>✝ Persekutuan Mahasiswa Kristen ITERA</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4 tracking-tight leading-tight">
              Pemendek Tautan & Pembuat QR Code
            </h1>
            <p className="text-brown-100/90 text-base sm:text-lg max-w-xl mx-auto font-sans font-light">
              Buat shortlink resmi dan terpercaya untuk poster acara, media sosial, formulir pendaftaran, dan kegiatan pelayanan.
            </p>
          </div>
        </section>

        {/* Shortener Card */}
        <section className="container mx-auto px-4 -mt-10 md:-mt-12 mb-16 relative z-20 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl border border-brown-200/80 p-6 sm:p-8">
            {!PUBLIC_CREATION_ENABLED ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-brown-100 text-brown-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-lg text-brown-900 mb-2">
                  Pembuatan Link Sementara Ditutup
                </h3>
                <p className="text-brown-600 text-sm">
                  Layanan pembuatan tautan baru sedang dinonaktifkan sementara untuk pemeliharaan sistem. Tautan yang sudah ada tetap berfungsi normal.
                </p>
              </div>
            ) : result ? (
              /* Success State */
              <div className="text-center">
                <div className="w-14 h-14 bg-green-50 border border-green-200 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-brown-900 mb-1">
                  Shortlink Berhasil Dibuat!
                </h2>
                <p className="text-sm text-brown-600 mb-6">
                  Tautan Anda siap digunakan untuk publikasi dan poster.
                </p>

                {/* Result Box */}
                <div className="bg-brown-50 border border-brown-200 rounded-xl p-4 sm:p-5 mb-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs uppercase font-semibold text-brown-500 tracking-wider">
                        Shortlink
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-brown-900 truncate">
                        {result.shortUrl}
                      </p>
                      <p className="text-xs text-brown-600 truncate mt-1">
                        Tujuan: <span className="font-mono">{result.destinationUrl}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-brown-700 hover:bg-brown-800 transition-colors shadow-sm shrink-0"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Salin Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="mb-6">
                  <QRCodeCanvas url={result.shortUrl} size={180} />
                </div>

                <div className="pt-4 border-t border-brown-100 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setTurnstileToken('');
                      turnstileRef.current?.reset();
                    }}
                    className="text-sm font-medium text-brown-700 hover:text-brown-900 underline"
                  >
                    + Buat shortlink lainnya
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="destinationUrl"
                    className="block text-sm font-semibold text-brown-900 mb-1.5"
                  >
                    URL Tujuan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="url"
                    id="destinationUrl"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://docs.google.com/forms/d/..."
                    required
                    className="w-full px-4 py-3 rounded-lg border border-brown-300 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-600 focus:border-brown-600 transition-colors"
                  />
                  <p className="mt-1 text-xs text-brown-600">
                    Masukkan URL lengkap dengan awalan http:// atau https://
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="customSlug"
                    className="block text-sm font-semibold text-brown-900 mb-1.5"
                  >
                    Custom Slug <span className="text-brown-500 font-normal">(opsional)</span>
                  </label>
                  <div className="flex rounded-lg border border-brown-300 overflow-hidden focus-within:ring-2 focus-within:ring-brown-600 focus-within:border-brown-600 transition-colors">
                    <span className="inline-flex items-center px-3 sm:px-4 bg-brown-50 border-r border-brown-300 text-brown-600 text-xs sm:text-sm font-mono select-none">
                      {BASE_URL}/
                    </span>
                    <input
                      type="text"
                      id="customSlug"
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="paskah-2026"
                      maxLength={50}
                      className="flex-1 px-3 py-3 text-brown-900 placeholder:text-brown-300 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-brown-600">
                    Gunakan 3-50 karakter (a-z, 0-9, tanda hubung). Kosongkan jika ingin dibuatkan slug acak otomatis.
                  </p>
                </div>

                {/* Cloudflare Turnstile */}
                <div>
                  <TurnstileWidget
                    ref={turnstileRef}
                    onVerify={(token) => setTurnstileToken(token)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="w-full py-3.5 px-6 rounded-lg font-medium text-white bg-brown-700 hover:bg-brown-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses Tautan...
                    </>
                  ) : (
                    'Buat Shortlink Sekarang'
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Feature / About PMK ITERA Section */}
        <section className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brown-900 relative inline-block">
              Tentang PI-LYNK
              <span className="absolute -bottom-2 left-1/4 w-1/2 h-[3px] bg-brown-600 rounded-full" />
            </h2>
            <p className="mt-4 text-brown-700 max-w-2xl mx-auto text-sm sm:text-base">
              PI-LYNK adalah infrastruktur tautan dan QR code resmi dari Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-brown-200/60 shadow-sm text-center">
              <div className="w-10 h-10 bg-brown-100 text-brown-800 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                ⚡
              </div>
              <h3 className="font-serif font-bold text-brown-900 mb-2">Cepat & Ringan</h3>
              <p className="text-xs sm:text-sm text-brown-600">
                Pengalihan langsung temporary redirect tanpa perantara iklan atau pelacak invasif.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-brown-200/60 shadow-sm text-center">
              <div className="w-10 h-10 bg-brown-100 text-brown-800 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                📱
              </div>
              <h3 className="font-serif font-bold text-brown-900 mb-2">QR Code Instan</h3>
              <p className="text-xs sm:text-sm text-brown-600">
                QR code siap diunduh beresolusi tajam untuk poster cetak, banner, dan presentasi proyektor.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-brown-200/60 shadow-sm text-center">
              <div className="w-10 h-10 bg-brown-100 text-brown-800 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                🛡️
              </div>
              <h3 className="font-serif font-bold text-brown-900 mb-2">Aman & Terpercaya</h3>
              <p className="text-xs sm:text-sm text-brown-600">
                Dilindungi verifikasi anti-abuse, proteksi phising, dan moderasi aktif pengurus.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brown-900 text-brown-200 py-10 border-t border-brown-800 mt-auto">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-brown-800">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-pmk.png"
                alt="Logo PMK ITERA"
                width={40}
                height={40}
                className="brightness-200 rounded-full"
              />
              <div>
                <p className="font-serif font-bold text-white text-base">PI-LYNK</p>
                <p className="text-xs text-brown-400">
                  Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brown-300">
              <a
                href="https://pmkitera.web.id"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Website PMK ITERA
              </a>
              <Link href="/ketentuan" className="hover:text-white transition-colors">
                Ketentuan Layanan
              </Link>
              <Link href="/laporkan" className="hover:text-white transition-colors">
                Laporkan Tautan
              </Link>
            </div>
          </div>
          <div className="pt-6 text-center text-xs text-brown-500">
            © 2026 PMK ITERA. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
