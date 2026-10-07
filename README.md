# PI-LYNK | Pemendek Tautan Resmi PMK ITERA

PI-LYNK adalah sistem shortlink dan generator QR code resmi milik **Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera (PMK ITERA)**. Layanan ini dirancang khusus untuk mempermudah distribusi tautan kegiatan, formulir pendaftaran, poster cetak, dan publikasi media sosial.

---

## 📋 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
3. [Panduan Menjalankan di Lokal](#-panduan-menjalankan-di-lokal)
4. [Tabel Environment Variables](#-tabel-environment-variables)
5. [Konfigurasi Layanan Eksternal](#-konfigurasi-layanan-eksternal)
   - [Setup Neon Postgres](#1-setup-neon-postgres-pooled-connection)
   - [Setup Cloudflare Turnstile](#2-setup-cloudflare-turnstile)
   - [Setup Google OAuth (Auth.js)](#3-setup-google-oauth-authjs)
6. [Deployment ke Vercel](#-deployment-ke-vercel)
7. [Konfigurasi Custom Domain (s.pmkitera.web.id)](#-konfigurasi-custom-domain-spmkiterawebid)
8. [Cara Mengganti Domain di Masa Depan](#-cara-mengganti-domain-di-masa-depan)
9. [Operasional Darurat & Moderasi](#-operasional-darurat--moderasi)
10. [Migrasi & Impor Tautan Lama](#-migrasi--impor-tautan-lama)

---

## ✨ Fitur Utama

- **Pengalihan Cepat (Temporary Redirect 307)**:
  - Lookup berindeks satu query ke basis data Neon Postgres.
  - Non-blocking click analytics (tidak menghambat pengalihan tautan).
  - Filtering otomatis untuk bot preview crawler (WhatsApp, Telegram, Facebook, Twitter, dsb.) dan request HEAD agar analitik tidak menggelembung.
  - Header keamanan `X-Robots-Tag: noindex` pada respons pengalihan.
  - Halaman kustom ramah 404 (tidak ditemukan) dan 410 (link dinonaktifkan/kedaluwarsa/diblokir).
- **Pembuatan Tautan Publik**:
  - Tanpa login: Siapa saja dapat membuat shortlink.
  - Opsi custom slug atau slug acak otomatis anti-collision.
  - Generator QR code langsung di peramban (client-side) dengan tombol unduh PNG beresolusi tajam.
- **Validasi Ketat & Anti-Abuse (Server-Side)**:
  - Perlindungan SSRF: Tidak ada pemanggilan fetch sisi server ke URL tujuan.
  - Blokir skema berbahaya (`javascript:`, `data:`, `file:`), userinfo kredensial, IP literal, localhost, jaringan privat, dan domain IDN/punycode.
  - Blokir redirect chain dari domain pemendek lain (bit.ly, tinyurl, linktr.ee, s.id, dsb.).
  - Proteksi kata kunci resmi (`pmk`, `itera`, `resmi`, `official`, `admin`) agar tidak disalahgunakan pihak publik.
  - Cloudflare Turnstile captcha dengan server-side verification.
  - Rate limiting berbasis hashing IP bersalt di basis data (bebas kendala serverless).
- **Dashboard Admin (/admin)**:
  - Autentikasi aman Auth.js via Google OAuth dengan allowlist email administrator (`ADMIN_EMAILS`).
  - Pembuatan tautan resmi (dapat menggunakan slug khusus/terlindungi).
  - Manajemen penuh: Ubah target URL, status (aktif/nonaktif/diblokir), alasan moderasi, dan hapus permanen.
  - Antrian laporan tautan mencurigakan (`/laporkan`) dengan tombol resolusi.
  - Fitur impor batch tautan dari sistem lama (JSON/CSV).
- **Desain & Branding Konsisten**:
  - Mengikuti identitas visual situs utama [pmkitera.web.id](https://pmkitera.web.id): palet warna cokelat (SaddleBrown `#8B4513`), tipografi Playfair Display & DM Sans, aksen underline, dan logo resmi PMK ITERA.

---

## 🛠 Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS)
- **Database & Driver**: [Neon Postgres](https://neon.tech/) Serverless HTTP Driver (`@neondatabase/serverless`)
- **ORM & Migrasi**: [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Autentikasi**: [Auth.js](https://authjs.dev/) (NextAuth v5 beta) + Google OAuth Provider
- **Captcha**: [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- **QR Code**: [qrcode](https://www.npmjs.com/package/qrcode) (Client-side Canvas & PNG export)

---

## 💻 Panduan Menjalankan di Lokal

### 1. Kloning dan Instalasi Dependensi
```bash
git clone <url-repository>
cd pi-lynk
npm install
```

### 2. Salin Berkas Environment
```bash
cp .env.example .env.local
```
Sesuaikan nilai konfigurasi di `.env.local` (terutama `DATABASE_URL` dari Neon).

### 3. Generate & Terapkan Migrasi Database
```bash
# Menghasilkan berkas migrasi SQL
npm run db:generate

# Menerapkan skema tabel ke Neon Postgres
npm run db:push
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 5. Menjalankan Tes Otomatis & Linter
```bash
# Menjalankan unit test logika validasi & deteksi bot
npm run test

# Memeriksa kepatuhan kode (ESLint)
npm run lint

# Memeriksa tipe data (TypeScript)
npx tsc --noEmit
```

---

## 🔐 Tabel Environment Variables

| Variabel | Wajib? | Contoh Nilai | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | **Ya** | `https://s.pmkitera.web.id` | URL dasar shortlink tanpa garis miring penutup (`/`). |
| `DATABASE_URL` | **Ya** | `postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require` | Connection string Neon Postgres (Gunakan mode **Pooled / Transaction Pooler**). |
| `AUTH_SECRET` | **Ya** | `s3cr3t_str1ng_h4sh...` | Kunci rahasia sesi Auth.js (buat dengan `openssl rand -base64 32`). |
| `AUTH_GOOGLE_ID` | **Ya** | `xxx.apps.googleusercontent.com` | Client ID Google OAuth Console. |
| `AUTH_GOOGLE_SECRET` | **Ya** | `GOCSPX-xxx` | Client Secret Google OAuth Console. |
| `ADMIN_EMAILS` | **Ya** | `bph.pmk@gmail.com,admin@pmkitera.web.id` | Daftar email Google admin yang diizinkan mengakses `/admin`, dipisahkan tanda koma. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Opsional di dev | `0x4AAAAAA...` | Site key Cloudflare Turnstile publik. |
| `TURNSTILE_SECRET_KEY` | Opsional di dev | `0x4AAAAAA...` | Secret key Cloudflare Turnstile privat. |
| `RATE_LIMIT_SALT` | **Ya** | `random_salt_string_123` | Salt acak untuk melakukan hash sha256 pada IP pengunjung (menjaga privasi). |
| `RATE_LIMIT_PER_HOUR` | Opsional | `10` | Batas pembuatan link per IP per jam (default: 10). |
| `RATE_LIMIT_PER_DAY` | Opsional | `30` | Batas pembuatan link per IP per hari (default: 30). |
| `PUBLIC_CREATION_ENABLED` | Opsional | `true` | Saklar darurat: Set ke `false` jika ingin mengunci pembuatan shortlink publik. |
| `PUBLIC_LINK_INTERSTITIAL` | Opsional | `false` | Set ke `true` jika ingin menampilkan halaman peringatan sebelum diarahkan untuk link non-resmi. |

---

## ⚙ Konfigurasi Layanan Eksternal

### 1. Setup Neon Postgres (Pooled Connection)
1. Buat proyek baru di [Neon Console](https://console.neon.tech/).
2. Pada panel **Connection Details**, pilih dropdown **Pooled connection** (bukan Direct connection).
3. Salin connection string yang berakhiran `-pooler.region.neon.tech/dbname?sslmode=require`.
4. Masukkan ke `DATABASE_URL` di Vercel atau `.env.local`.

### 2. Setup Cloudflare Turnstile
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Turnstile**.
2. Klik **Add Widget**:
   - Widget name: `PI-LYNK`
   - Domains: Tambahkan `s.pmkitera.web.id` dan `localhost` (untuk pengujian lokal).
   - Widget Mode: **Managed** (disarankan).
3. Salin **Site Key** ke `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan **Secret Key** ke `TURNSTILE_SECRET_KEY`.
> *Catatan: Di mode development, jika kedua kunci ini tidak diisi, sistem otomatis mengaktifkan bypass verifikasi agar mempermudah pengujian.*

### 3. Setup Google OAuth (Auth.js)
1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Buat **OAuth 2.0 Client IDs** (Tipe: *Web application*).
3. Tambahkan **Authorized JavaScript origins**:
   - `http://localhost:3000` (lokal)
   - `https://s.pmkitera.web.id` (produksi)
4. Tambahkan **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (lokal)
   - `https://s.pmkitera.web.id/api/auth/callback/google` (produksi)
5. Masukkan Client ID dan Secret ke environment variables.
6. Daftarkan email akun Google pengurus yang berwenang di variabel `ADMIN_EMAILS`.

---

## 🚀 Deployment ke Vercel

1. Hubungkan repositori GitHub/GitLab Anda ke [Vercel](https://vercel.com).
2. Pada menu **Environment Variables** di Vercel, tambahkan seluruh variabel yang tercantum pada tabel di atas.
3. Klik **Deploy**. Vercel akan otomatis mendeteksi proyek Next.js.
4. Setelah build selesai, jalankan perintah migrasi skema ke Neon:
   ```bash
   npx drizzle-kit push
   ```

---

## 🌐 Konfigurasi Custom Domain (`s.pmkitera.web.id`)

Untuk menghubungkan domain `s.pmkitera.web.id` ke hosting Vercel:

1. Di Dashboard Proyek Vercel:
   - Masuk ke **Settings** > **Domains**.
   - Masukkan nama domain: `s.pmkitera.web.id` lalu klik **Add**.
2. Vercel akan menampilkan petunjuk DNS Record yang harus ditambahkan.
3. Buka DNS Management domain `pmkitera.web.id` (misalnya di Cloudflare, cPanel, atau registrar domain organisasi):
   - Tambahkan record berikut:
     | Type | Name | Target / Value | TTL | Proxy status |
     |---|---|---|---|---|
     | **CNAME** | `s` | `cname.vercel-dns.com` | Auto / 1 Hour | DNS Only (Gray Cloud jika di Cloudflare) |
4. Tunggu beberapa menit hingga sertifikat SSL terbit dan Vercel menampilkan status centang hijau **Valid Configuration**.

---

## 🔄 Cara Mengganti Domain di Masa Depan

Arsitektur PI-LYNK sepenuhnya **Domain-Agnostic** (basis data hanya menyimpan slug murni, tidak pernah menyimpan tautan domain penuh):

1. Ganti variabel `NEXT_PUBLIC_BASE_URL` di Vercel Environment Variables dengan domain baru (contoh: `https://lynk.pmkitera.org`).
2. Tambahkan domain baru tersebut di Google Cloud Console (**Authorized redirect URIs**).
3. Tambahkan domain baru tersebut di Cloudflare Turnstile (**Domains list**).
4. Lakukan **Redeploy** di Vercel. Seluruh shortlink dan QR code yang di-generate akan langsung menyesuaikan dengan domain baru tanpa perlu mengubah baris data apa pun di database!

---

## 🚨 Operasional Darurat & Moderasi

### Mematikan Pembuatan Shortlink Publik Secara Cepat:
Jika terjadi serangan spam atau penyalahgunaan massal dari pihak luar:
1. Buka Vercel Dashboard > **Settings** > **Environment Variables**.
2. Ubah `PUBLIC_CREATION_ENABLED` menjadi `false`.
3. Lakukan **Redeploy** (atau tunggu beberapa detik pada deployment baru).
4. Hasil:
   - Form publik di halaman utama akan menampilkan pemberitahuan bahwa pembuatan tautan ditutup sementara.
   - Endpoint API pembuatan publik akan menolak semua permintaan dengan status `503`.
   - **Seluruh tautan yang sudah ada tetap dapat diakses dan redirect normal tanpa terganggu.**

### Mengaktifkan Halaman Peringatan (Interstitial Page):
Untuk keamanan ekstra agar tautan non-resmi tidak langsung mengalihkan pengunjung:
- Ubah `PUBLIC_LINK_INTERSTITIAL` menjadi `true`. Tautan non-resmi akan menampilkan halaman konfirmasi "Anda akan diarahkan ke situs luar" sebelum pengguna mengklik tombol lanjutkan.

### Menangani Laporan Abuse:
1. Masuk ke dashboard `/admin`.
2. Klik tab **Laporan Abuse**.
3. Admin dapat meninjau alasan laporan, menonaktifkan/memblokir slug bersangkutan dengan satu klik, dan menandai laporan sebagai **Selesai**.

---

## 📦 Migrasi & Impor Tautan Lama

### Cara 1: Lewat Dashboard Admin (Direkomendasikan)
1. Masuk ke `/admin` > Tab **Impor Tautan Lama**.
2. Tempelkan array JSON daftar link lama, contoh:
   ```json
   [
     { "slug": "natal-2025", "destinationUrl": "https://pmkitera.web.id/event/natal", "title": "Perayaan Natal" },
     { "slug": "paskah", "destinationUrl": "https://forms.gle/sample", "title": "Formulir Paskah" }
   ]
   ```
3. Klik **Mulai Impor Tautan**. Sistem otomatis memvalidasi, mencegah tabrakan, dan mencatat link.

### Cara 2: Lewat Terminal CLI Script
Jalankan script dengan file JSON atau CSV:
```bash
# Impor dari berkas JSON
npx tsx scripts/import-links.ts ./data-lama.json

# Impor dari berkas CSV (dengan header: slug,destinationUrl,title)
npx tsx scripts/import-links.ts ./data-lama.csv
```

---

Dibuat dengan ❤️ dan dedikasi untuk pelayanan **Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera**.
