import type { Metadata, Viewport } from 'next';
import './globals.css';
import { madeMirage, bebasNeue, aileron } from './fonts/fonts';
import AuthProvider from '@/components/AuthProvider';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'BookMate',
  description: 'AI-powered receipt tracking and P&L automation',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BookMate',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`dark ${madeMirage.variable} ${bebasNeue.variable} ${aileron.variable}`}
    >
      <body className="min-h-screen bg-black text-fg font-aileron antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
