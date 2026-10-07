'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TurnstileWidget, { TurnstileWidgetRef } from '@/components/turnstile-widget';

export default function LaporkanPage() {
  const [slugOrUrl, setSlugOrUrl] = useState('');
  const [reason, setReason] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slugOrUrl,
          reason,
          contactInfo: contactInfo ? contactInfo.trim() : undefined,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat mengirim laporan.');
        turnstileRef.current?.reset();
        setTurnstileToken('');
        return;
      }

      setSuccess(true);
      setSlugOrUrl('');
      setReason('');
      setContactInfo('');
    } catch {
      setError('Gagal menghubungi server. Silakan coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-gray-900 flex flex-col">
      <header className="border-b border-brown-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-pmk.png"
              alt="Logo PMK ITERA"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="font-serif font-bold text-xl text-brown-900">
              PI-LYNK
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brown-700 hover:text-brown-900"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-2xl border border-brown-200 p-6 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brown-900">
              Laporkan Tautan Mencurigakan
            </h1>
            <p className="mt-2 text-sm text-brown-600">
              Bantu kami menjaga keamanan ekosistem PI-LYNK dengan melaporkan tautan yang melanggar ketentuan.
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif font-bold text-lg text-green-900 mb-1">
                Laporan Berhasil Diterima
              </h3>
              <p className="text-sm text-green-800 mb-6">
                Terima kasih atas laporan Anda. Administrator akan segera meninjau dan mengambil tindakan yang diperlukan.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-5 py-2.5 rounded-lg border border-brown-300 text-brown-800 text-sm font-medium hover:bg-white transition-colors"
                >
                  Kirim Laporan Lain
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-lg bg-brown-700 text-white text-sm font-medium hover:bg-brown-800 transition-colors"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="slugOrUrl"
                  className="block text-sm font-semibold text-brown-900 mb-1.5"
                >
                  Tautan atau Slug yang Dilaporkan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="slugOrUrl"
                  value={slugOrUrl}
                  onChange={(e) => setSlugOrUrl(e.target.value)}
                  placeholder="https://s.pmkitera.web.id/contoh-link atau contoh-link"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-brown-300 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-semibold text-brown-900 mb-1.5"
                >
                  Alasan Pelaporan <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan secara singkat jenis pelanggaran (misalnya: phishing perbankan, penipuan pulsa, malware, judi online, dll)..."
                  required
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg border border-brown-300 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-600 resize-none text-sm"
                />
                <p className="mt-1 text-xs text-brown-500 text-right">
                  {reason.length}/1000 karakter
                </p>
              </div>

              <div>
                <label
                  htmlFor="contactInfo"
                  className="block text-sm font-semibold text-brown-900 mb-1.5"
                >
                  Kontak Pelapor <span className="text-brown-500 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Email atau No. WhatsApp (jika pengurus butuh klarifikasi)"
                  maxLength={255}
                  className="w-full px-4 py-3 rounded-lg border border-brown-300 text-brown-900 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-600 text-sm"
                />
              </div>

              <div>
                <TurnstileWidget
                  ref={turnstileRef}
                  onVerify={(token) => setTurnstileToken(token)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full py-3.5 px-6 rounded-lg font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? 'Mengirim Laporan...' : 'Kirimkan Laporan'}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-brown-900 text-brown-400 py-6 text-center text-xs">
        <p>© 2026 PMK ITERA. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
