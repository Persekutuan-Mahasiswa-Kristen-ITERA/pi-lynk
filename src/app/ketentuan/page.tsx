import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Ketentuan Layanan',
  description: 'Ketentuan dan etika penggunaan layanan pemendek tautan PI-LYNK PMK ITERA.',
};

export default function KetentuanPage() {
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

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-2xl border border-brown-200 p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-serif font-bold text-brown-900 mb-2">
            Ketentuan Layanan PI-LYNK
          </h1>
          <p className="text-sm text-brown-600 mb-8">
            Terakhir diperbarui: 7 Oktober 2026
          </p>

          <div className="space-y-6 text-brown-800 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="font-serif font-semibold text-lg text-brown-900 mb-2">
                1. Definisi & Tujuan Layanan
              </h2>
              <p>
                PI-LYNK adalah fasilitas pemendek tautan (URL shortener) resmi Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera (PMK ITERA). Layanan ini disediakan untuk mempermudah publikasi tautan kegiatan, formulir pendaftaran, materi persekutuan, dan kebutuhan sivitas akademika maupun umum.
              </p>
            </section>

            <section>
              <h2 className="font-serif font-semibold text-lg text-brown-900 mb-2">
                2. Larangan Penggunaan
              </h2>
              <p className="mb-2">
                Pengguna dilarang keras membuat atau menyebarkan shortlink yang mengarah pada:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-brown-700">
                <li>Situs phishing, penipuan (scam), atau rekayasa sosial pencurian kredensial akun.</li>
                <li>Distribusi malware, virus, trojan, spyware, atau ransomware berbahaya.</li>
                <li>Konten perjudian (judi online), pornografi, atau konten yang melanggar hukum di Indonesia.</li>
                <li>Penyebaran ujaran kebencian, fitnah, hoaks, atau materi yang menyesatkan.</li>
                <li>Rantai redirect (shortlink berantai) yang menyembunyikan tujuan akhir berbahaya.</li>
                <li>Peniruan identitas (impersonasi) pengurus atau organisasi resmi tanpa izin.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif font-semibold text-lg text-brown-900 mb-2">
                3. Hak Moderasi Administrator
              </h2>
              <p>
                Administrator PMK ITERA berhak sewaktu-waktu tanpa pemberitahuan sebelumnya untuk:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-brown-700">
                <li>Menonaktifkan atau memblokir tautan yang terindikasi melanggar ketentuan.</li>
                <li>Mengubah atau menghapus tautan yang dilaporkan oleh masyarakat.</li>
                <li>Membatasi atau memblokir akses alamat IP yang melakukan tindakan spam atau abuse.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif font-semibold text-lg text-brown-900 mb-2">
                4. Batasan Tanggung Jawab
              </h2>
              <p>
                PMK ITERA tidak bertanggung jawab atas isi konten di luar domain resmi yang dituju oleh tautan publik. Pengguna bertanggung jawab penuh atas tautan yang dibuat dan dibagikan.
              </p>
            </section>

            <section>
              <h2 className="font-serif font-semibold text-lg text-brown-900 mb-2">
                5. Pelaporan Pelanggaran
              </h2>
              <p>
                Jika Anda menemukan tautan PI-LYNK yang melanggar ketentuan di atas, silakan laporkan melalui formulir{' '}
                <Link href="/laporkan" className="text-brown-700 font-semibold underline hover:text-brown-900">
                  Pelaporan Tautan
                </Link>{' '}
                agar dapat segera ditindaklanjuti.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-brown-900 text-brown-400 py-6 text-center text-xs">
        <p>© 2026 PMK ITERA. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
