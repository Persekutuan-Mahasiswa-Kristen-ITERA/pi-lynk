ROLE
Anda adalah senior full-stack engineer yang bekerja di project production. Bekerja bertahap, bertanggung jawab, dan jangan menebak struktur yang belum Anda periksa.

CONTEXT
- PI-LYNK adalah sistem shortlink resmi Persekutuan Mahasiswa Kristen ITERA. Link-nya dipakai di poster, media sosial, formulir, dan QR code.
- Versi lama (https://pmkitera-lynk.vercel.app/, judul "PMK LYNK | URL Shortener & QR Generator") dihentikan karena domain lama tidak diperpanjang. Kita membangun ulang dari awal.
- Referensi visual dan branding: https://pmkitera.web.id/ (situs utama PMK ITERA).
- Domain produksi sementara: https://s.pmkitera.web.id (contoh hasil: https://s.pmkitera.web.id/nama-link). Hosting sementara di Vercel (plan gratis) dengan database Neon Postgres, sampai organisasi punya biaya untuk hosting yang lebih proper.
- Seluruh UI berbahasa Indonesia.

KEPUTUSAN YANG SUDAH FINAL (jangan diubah)
- Framework: Next.js (App Router) + TypeScript, deploy ke Vercel.
- Database: Neon Postgres.
- Pembuatan shortlink terbuka untuk SEMUA ORANG tanpa login. Admin tetap ada untuk moderasi dan link resmi.
- QR code dibuat di website itu sendiri (bukan layanan eksternal).
- Logo PMK ITERA sudah disiapkan sebagai asset di workspace. Cari lokasinya, jangan menggambar ulang atau mengarang logo.
- Sistem HARUS domain-agnostic: database hanya menyimpan slug. Base URL dibaca dari environment variable (mis. NEXT_PUBLIC_BASE_URL) dan didokumentasikan di .env.example. Tidak boleh ada hardcode domain.

LANGKAH 0 - INSPEKSI (WAJIB, SEBELUM MENGUBAH APA PUN)
1. Periksa workspace: apakah sudah ada repo/kode, package manager, konfigurasi, dan konvensi. Jika sudah ada, ikuti pattern yang ada. Jangan memperkenalkan dependency baru kecuali diperlukan, dan jelaskan alasannya.
2. Buka https://pmkitera.web.id/ dan https://pmkitera-lynk.vercel.app/ untuk memahami tema dan fitur versi lama. Laporkan temuan singkat.
3. Temukan asset logo PMK ITERA di workspace.
4. Jangan membuat asumsi tentang file, schema, atau API yang belum Anda lihat.

REQUIREMENTS

A. Redirect (fitur inti, prioritas tertinggi)
- GET /{slug} mengalihkan ke URL tujuan dengan temporary redirect (302/307). Jangan gunakan permanent redirect. Jangan ada cache agresif, karena link bisa dinonaktifkan atau dimoderasi dan harus langsung berlaku.
- Slug tidak ada: halaman 404 ramah. Link nonaktif/diblokir/kedaluwarsa: halaman 410 ramah yang menjelaskan statusnya. Semua halaman error berbranding PI-LYNK dan tidak membocorkan detail internal.
- Tambahkan header X-Robots-Tag: noindex pada respons redirect.
- Pencatatan klik tidak boleh memperlambat atau menggagalkan redirect (gunakan mekanisme non-blocking yang didukung versi Next.js yang dipakai). Jangan hitung klik dari bot link-preview (WhatsApp, Telegram, dsb.) dan request HEAD, agar statistik tidak menggelembung.
- Lookup slug harus satu query ber-index. Query ke Neon memakai pooled connection string dan driver serverless yang sesuai. Free tier Neon bisa mengalami cold start setelah idle, jadi tangani timeout/retry sewajarnya agar redirect tidak gagal.

B. Pembuatan link publik (halaman utama "/")
- Form: URL tujuan (wajib), custom slug (opsional), verifikasi captcha. Jika slug kosong, buat slug acak otomatis dengan penanganan collision.
- Setelah sukses: tampilkan shortlink lengkap (dari base URL env), tombol salin, dan QR code yang bisa diunduh.
- Pembuat publik TIDAK bisa mengedit atau menghapus link setelah dibuat. Hanya admin yang bisa. Jangan membuat sistem akun atau token manajemen untuk publik.
- Link yang dibuat lewat form publik ditandai berbeda dari link buatan admin (mis. flag is_official).

C. Validasi (server-side, wajib)
- URL tujuan: hanya http/https. Tolak javascript:, data:, file:, dsb. Tolak host berupa IP literal, localhost, dan private/internal range. Tolak URL dengan userinfo (user:pass@host). Tolak URL yang menunjuk ke host PI-LYNK sendiri (base URL dan deployment hostname Vercel) untuk mencegah loop. URL ke pmkitera.web.id (situs utama) BOLEH. Batasi panjang URL.
- Tolak domain pemendek link lain (bit.ly, tinyurl, dsb.) untuk mencegah redirect chain. Simpan daftar ini beserta daftar domain terblokir di satu file konfigurasi yang mudah diubah.
- Untuk link publik, tolak hostname punycode/IDN (anti homograph) di versi awal.
- Dilarang melakukan fetch server-side ke URL tujuan yang diinput pengguna (mencegah SSRF). Jangan menambah fitur pengambilan judul halaman.
- Sediakan satu fungsi terpusat untuk pemeriksaan keamanan URL, sehingga layanan seperti Safe Browsing bisa ditambahkan nanti. Jangan implementasikan layanan eksternal sekarang.
- Slug: a-z, 0-9, tanda hubung; 3-50 karakter; dinormalisasi lowercase; unik (tangani race condition lewat constraint database, bukan hanya pengecekan di aplikasi).
- Reserved slug (route sistem): admin, login, api, laporkan, ketentuan, _next, static, assets, favicon.ico, robots.txt, sitemap.xml, dan route aktual project.
- Protected keywords: slug yang mengandung kata di daftar konfigurasi (default: pmk, itera, resmi, official, admin) hanya boleh dibuat oleh admin. Ini mencegah peniruan link resmi.

D. Perlindungan abuse (WAJIB karena pembuatan terbuka)
1. Captcha: gunakan Cloudflare Turnstile, diverifikasi di server. Jika key belum diset, bypass hanya boleh di mode development, tidak pernah di production.
2. Rate limit pembuatan link per IP, dengan batas yang dapat dikonfigurasi lewat env (usulan awal: 10 per jam dan 30 per hari per IP). Jangan memakai penyimpanan in-memory (tidak bekerja di serverless). Simpan counter di Postgres dengan hash IP bersalt (salt dari env). Jangan simpan IP mentah. Hapus data rate limit yang lama. Jangan bergantung pada WAF Vercel, karena kuota plan gratis kecil.
3. Saklar darurat: env PUBLIC_CREATION_ENABLED. Jika false, form publik menampilkan pesan "pembuatan link sementara ditutup" dan API menolak request. Redirect tetap jalan.
4. Opsi halaman jeda: env PUBLIC_LINK_INTERSTITIAL (default false). Jika true, link NON-resmi menampilkan halaman jeda berisi domain tujuan dan tombol "Lanjutkan" sebelum redirect. Link resmi tetap redirect langsung.
5. Halaman /laporkan: form sederhana untuk melaporkan link (slug atau URL, alasan, kontak opsional), dilindungi captcha dan rate limit, tersimpan di database dan tampil di antrian admin.
6. Halaman /ketentuan: ketentuan penggunaan singkat dan jelas (dilarang phishing, penipuan, malware, konten ilegal/menyesatkan; admin berhak menonaktifkan link tanpa pemberitahuan).
7. Semua endpoint mutasi memeriksa Origin/CSRF dengan benar.

E. Admin dashboard (/admin)
- Auth sederhana dan aman. Rekomendasi: Auth.js dengan Google OAuth dan allowlist email admin dari env (ADMIN_EMAILS). Jelaskan pilihan Anda. Tidak ada kredensial hardcoded. Semua secret lewat env.
- Fitur: daftar semua link (filter resmi/publik, status, pernah dilaporkan; pencarian; pagination), buat link resmi (boleh slug terlindungi), edit, aktif/nonaktifkan (dengan alasan opsional), hapus dengan konfirmasi, salin link, unduh QR, antrian laporan abuse (tandai selesai), dan statistik klik.
- Semua endpoint admin memeriksa autentikasi dan otorisasi di server. Halaman admin noindex.
- Rate limit dasar pada login admin.

F. QR code
- Dibuat di sisi client dengan library QR yang ringan dan terpelihara. Isinya shortlink lengkap dari base URL env. Unduh PNG (SVG jika murah). Tersedia di halaman sukses pembuatan dan di dashboard admin.

G. Analytics minimal
- Jumlah klik dan waktu klik terakhir per link, tampil di admin. Tidak menyimpan data pribadi. Fitur analytics lain di luar scope.

H. Tema visual (ikuti situs utama)
- Jangan menebak: ekstrak design tokens aktual dari https://pmkitera.web.id/ (warna, font, spacing, radius, gaya tombol dan heading).
- Hipotesis awal untuk diverifikasi: theme-color #8B4513, latar krem, heading serif bergaya Playfair Display, body sans-serif bergaya DM Sans, tombol utama solid cokelat, tombol sekunder outline, aksen garis bawah pada judul section.
- Simpan token di satu tempat (CSS variables/konfigurasi tema). Gunakan logo dari asset yang disediakan.
- Responsif mobile-first, kontras memadai, bisa dioperasikan dengan keyboard.
- Landing page memuat form pembuatan, penjelasan singkat PI-LYNK, link ke situs utama, link ke /laporkan dan /ketentuan. Sertakan metadata dasar (title, description, Open Graph, favicon) dan robots.txt yang sesuai.

I. Data model (kebutuhan minimal, tentukan schema detail sesuai hasil inspeksi)
- Links: slug (unik, case-insensitive), URL tujuan, judul opsional, status (aktif/nonaktif/diblokir), alasan nonaktif, is_official, pembuat (email admin atau kosong untuk publik), jumlah klik, klik terakhir, expires_at opsional, timestamps.
- Reports dan rate-limit counters. Tambahkan tabel lain hanya jika benar-benar perlu.
- Gunakan ORM/query builder yang ringan dan cocok serverless dengan migrasi (rekomendasi: Drizzle; jelaskan jika memilih lain). Tidak ada perubahan schema manual di luar migrasi.
- Sediakan import link lama (CSV/JSON: slug, URL tujuan, judul) berupa script atau fitur admin kecil. Jangan over-engineer.

CONSTRAINTS
- Jangan menambah fitur di luar daftar ini (tanpa akun publik, tanpa bio-link page, tanpa analytics lanjutan, tanpa edit oleh pembuat publik).
- Jangan menambah dependency yang tidak perlu. Dependency baru yang memang diperlukan (Turnstile, library QR, auth, ORM) cukup dijelaskan singkat di laporan akhir.
- Jangan hardcode domain, secret, atau URL produksi.
- Utamakan solusi paling sederhana yang memenuhi standar production.

FASE PENGERJAAN (setelah tiap fase pastikan fase sebelumnya masih berjalan)
1. Fondasi: setup Next.js, Neon, migrasi, env, struktur dasar.
2. Inti: redirect, validasi URL/slug, API pembuatan link, pencatatan klik.
3. Anti-abuse: Turnstile, rate limit, slug terlindungi, saklar darurat, opsi interstitial.
4. UI publik: landing, form, halaman sukses dengan QR, /laporkan, /ketentuan, tema dan logo.
5. Admin: auth, daftar/CRUD/moderasi, antrian laporan, statistik.
6. Penutup: import link lama, README, validasi akhir.

EDGE CASES
- Slug duplikat dan race condition; beda kapitalisasi; bentrok route sistem; slug terlindungi dicoba oleh publik.
- URL tujuan tanpa skema, dengan spasi, terlalu panjang, menunjuk ke domain sendiri, atau berisi userinfo.
- Query string dan fragment URL tujuan harus utuh saat redirect.
- Link nonaktif/kedaluwarsa/diblokir; link yang dilaporkan lalu dinonaktifkan.
- Captcha gagal atau tidak tersedia; rate limit terlampaui (pesan jelas, status 429).
- Neon sedang cold start atau tidak terjangkau (error generik, tidak crash).
- Base URL belum diset; PUBLIC_CREATION_ENABLED=false.
- Non-admin memanggil endpoint admin langsung.
- Bot preview mengakses shortlink.

VALIDATION / TESTING
- Jalankan lint, type-check, dan build; semuanya harus bersih.
- Test otomatis untuk logika kritis: validasi URL (termasuk skema berbahaya, IP literal, userinfo, loop ke domain sendiri), validasi/normalisasi slug, reserved dan protected slug, logika redirect semua status, rate limit.
- Uji manual dan laporkan: buat link publik, akses, QR terscan benar, rate limit tercapai, saklar darurat, lapor link, admin menonaktifkan link dan efeknya langsung terasa, akses endpoint admin tanpa login.
- Cek tampilan di lebar mobile (~375px) dan desktop.

README (wajib)
- Cara menjalankan lokal, tabel environment variable, setup Neon (pooled connection), setup Turnstile, setup Google OAuth (termasuk redirect URI untuk domain produksi), cara deploy ke Vercel, cara menambahkan domain s.pmkitera.web.id (record DNS apa yang perlu ditambahkan sesuai instruksi Vercel), cara mengganti domain di masa depan, dan cara mematikan pembuatan publik dalam keadaan darurat.

EXPECTED FINAL REPORT
1. Temuan inspeksi (workspace, fitur versi lama, design tokens, lokasi logo).
2. Keputusan arsitektur dan dependency baru beserta alasan singkat.
3. Daftar file/modul yang dibuat atau diubah.
4. Hasil validasi (lint, type-check, build, test, uji manual).
5. Langkah setup yang harus saya lakukan.
6. Hal yang belum selesai, asumsi, dan pertanyaan terbuka.
