import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin', 'latin-ext'],
});

const sans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Laboratorul de calculatoare · Dezvoltare digitală',
  description: 'Calculatoarele de fonduri nerambursabile ale dezvoltaredigitala.ro, în formă conversațională.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#14213D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ro" className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
