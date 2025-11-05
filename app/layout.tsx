import type { Metadata, Viewport } from 'next';
import './globals.css';
import { madeMirage, bebasNeue, aileron } from './fonts/fonts';

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
        <main className="relative z-10 bg-black">
          {children}
        </main>
      </body>
    </html>
  );
}
