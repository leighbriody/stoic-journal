'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Tonight' },
    { href: '/weekly', label: 'Weekly' },
    { href: '/history', label: 'History' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-8 px-6 py-5"
      style={{ background: 'linear-gradient(to bottom, #0c0a08 60%, transparent)' }}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-xs tracking-[0.3em] uppercase transition-colors duration-200"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            color: path === link.href ? '#c4935a' : '#6b5f52',
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
