'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LogoBM from '@/components/LogoBM';
import { AccountProvider } from '@/lib/context/AccountContext';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status
    // TODO: Replace with Firebase auth check
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);

    // Redirect to login if not authenticated and not already on login page
    if (!authStatus && pathname !== '/login') {
      router.push('/login');
    }

    // Redirect to dashboard if authenticated and on login page
    if (authStatus && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 animate-logo-loading-glow">
            <LogoBM size={200} />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-yellow animate-spin" />
            <p className="text-text-secondary font-aileron text-lg">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, wrap with AccountProvider
  if (isAuthenticated) {
    return (
      <AccountProvider>
        {children}
      </AccountProvider>
    );
  }

  // If on login page, show content without AccountProvider
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Otherwise, show loading (redirect in progress)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 animate-logo-loading-glow">
          <LogoBM size={200} />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-yellow animate-spin" />
          <p className="text-text-secondary font-aileron text-lg">Redirecting to login...</p>
        </div>
      </div>
    </div>
  );
}
