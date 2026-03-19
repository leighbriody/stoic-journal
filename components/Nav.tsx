'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5"
      style={{ background: 'linear-gradient(to bottom, #0c0a08 60%, transparent)' }}
    >
      <Link
        href="/"
        className="text-xs tracking-[0.3em] uppercase transition-colors duration-200"
        style={{
          fontFamily: 'var(--font-dm-mono)',
          color: path === '/' ? '#c4935a' : '#6b5f52',
        }}
      >
        Tonight
      </Link>

      <div
        className="text-xs tracking-[0.4em] uppercase"
        style={{ fontFamily: 'var(--font-cormorant)', color: '#2a2318', fontSize: '0.9rem', letterSpacing: '0.5em' }}
      >
        ✦
      </div>

      <Link
        href="/history"
        className="text-xs tracking-[0.3em] uppercase transition-colors duration-200"
        style={{
          fontFamily: 'var(--font-dm-mono)',
          color: path === '/history' ? '#c4935a' : '#6b5f52',
        }}
      >
        History
      </Link>
    </nav>
  );
}
