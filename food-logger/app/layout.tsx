import './globals.css';
import type { Metadata, Viewport } from 'next';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Food Logger',
  description: 'Photo-based calorie + macro tracking',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Food Logger' },
  icons: { icon: '/icon.png', apple: '/icon.png' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f8fafc' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-20">
        <main className="max-w-md mx-auto px-4 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
