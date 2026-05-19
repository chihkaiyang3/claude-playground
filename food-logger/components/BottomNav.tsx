'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/log', label: 'Log' },
  { href: '/advice', label: 'Advice' },
  { href: '/profile', label: 'Profile' }
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-neutral-900 border-t border-neutral-800">
      <ul className="max-w-md mx-auto grid grid-cols-4">
        {tabs.map(t => {
          const active = path === t.href;
          return (
            <li key={t.href}>
              <Link href={t.href} className={`flex items-center justify-center h-16 text-sm ${active ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
