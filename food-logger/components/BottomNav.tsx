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
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <ul className="max-w-md mx-auto grid grid-cols-4">
        {tabs.map(t => {
          const active = path === t.href;
          return (
            <li key={t.href}>
              <Link href={t.href} className={`flex items-center justify-center h-16 text-sm ${active ? 'text-emerald-600' : 'text-neutral-500'}`}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
