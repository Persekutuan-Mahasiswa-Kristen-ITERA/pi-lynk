import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'PI-LYNK | Pemendek Tautan PMK ITERA',
    template: '%s | PI-LYNK',
  },
  description: 'PI-LYNK adalah layanan pemendek tautan resmi Persekutuan Mahasiswa Kristen ITERA. Buat shortlink dan QR code dengan mudah.',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'PI-LYNK | Pemendek Tautan PMK ITERA',
    description: 'Layanan pemendek tautan resmi Persekutuan Mahasiswa Kristen ITERA.',
    siteName: 'PI-LYNK',
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo-pmk.png',
    apple: '/logo-pmk.png',
  },
  other: {
    'theme-color': '#8B4513',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-cream text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
