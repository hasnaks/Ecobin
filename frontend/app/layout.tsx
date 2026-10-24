import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoBin | Smart Waste Management',
  description: 'Segregate waste, earn EcoPoints and redeem rewards.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
