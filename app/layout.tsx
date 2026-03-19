import type { Metadata } from 'next';
import { Cormorant, DM_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Evening Solitude',
  description: 'Your private stoic evening journal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <body className="min-h-screen relative">{children}</body>
    </html>
  );
}
